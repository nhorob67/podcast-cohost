import os
import asyncio
import base64
import json
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from dotenv import load_dotenv
import tempfile
from collections import deque

from services.conversation_service import ConversationService
from services.report_service import ReportService
from services.personality_service import PersonalityService
from services.reference_service import ReferenceService
from utils.context_builder import ContextBuilder
from utils.file_processor import FileProcessor
from api_routes import router as api_router
from auto_init import auto_initialize

load_dotenv()

auto_initialize()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

active_conversations = {}
conversation_history = {}
context_cache = {}

async def transcribe_audio(audio_data: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_audio:
        temp_audio.write(audio_data)
        temp_audio_path = temp_audio.name

    try:
        with open(temp_audio_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        return transcript
    finally:
        Path(temp_audio_path).unlink(missing_ok=True)

def get_cached_context(conversation_id: str, user_message: str) -> str:
    cache_key = f"{conversation_id}_{hash(user_message) % 10000}"

    if cache_key in context_cache:
        return context_cache[cache_key]

    max_context = ReferenceService.get_max_context_conversations()
    context = ContextBuilder.build_conversation_context(
        current_conversation_id=conversation_id,
        user_message=user_message,
        max_conversations=max_context
    )

    context_cache[cache_key] = context
    if len(context_cache) > 100:
        context_cache.pop(next(iter(context_cache)))

    return context

async def stream_assistant_response(connection_id: str, user_message: str, conversation_id: Optional[str] = None):
    personality_config = PersonalityService.get_active_personality()

    if not personality_config:
        with open("personality/default_elias.json", "r") as f:
            personality_config = json.load(f)

    system_message = personality_config.get("instructions", "You are Elias, a helpful AI assistant.")

    if connection_id not in conversation_history:
        conversation_history[connection_id] = deque(maxlen=20)

    context = ""
    if conversation_id:
        context = get_cached_context(conversation_id, user_message)

    full_message = user_message
    if context:
        full_message = f"{context}\n\nCurrent question: {user_message}"

    conversation_history[connection_id].append({"role": "user", "content": full_message})

    messages = [
        {"role": "system", "content": system_message}
    ] + list(conversation_history[connection_id])

    stream = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True,
        max_tokens=500,
        temperature=0.7
    )

    return stream

async def stream_tts_audio(text: str, websocket: WebSocket):
    response = await client.audio.speech.create(
        model="tts-1",
        voice="onyx",
        input=text,
        response_format="mp3"
    )

    chunk_size = 1024
    async for chunk in response.iter_bytes(chunk_size=chunk_size):
        if chunk:
            await websocket.send_bytes(chunk)

    await websocket.send_json({"type": "audio_end"})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    connection_id = id(websocket)
    session_id = f"session_{connection_id}_{int(datetime.now().timestamp())}"

    conversation = ConversationService.create_conversation(
        thread_id=session_id,
        title=f"Conversation {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )
    conversation_id = conversation["id"] if conversation else None
    active_conversations[connection_id] = conversation_id
    conversation_history[connection_id] = deque(maxlen=20)

    print(f"Client connected. Session ID: {session_id}, Conversation ID: {conversation_id}")

    await websocket.send_json({
        "type": "connected",
        "thread_id": session_id,
        "conversation_id": conversation_id
    })

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message:
                audio_data = message["bytes"]

                await websocket.send_json({
                    "type": "status",
                    "message": "Transcribing..."
                })

                try:
                    transcript = await transcribe_audio(audio_data)

                    if not transcript or transcript.strip() == "":
                        await websocket.send_json({
                            "type": "error",
                            "message": "No speech detected. Please try again."
                        })
                        continue

                    print(f"User: {transcript}")

                    conversation_id = active_conversations.get(connection_id)

                    await websocket.send_json({
                        "type": "transcript",
                        "text": transcript
                    })

                    await websocket.send_json({
                        "type": "status",
                        "message": "Elias is thinking..."
                    })

                    stream = await stream_assistant_response(connection_id, transcript, conversation_id)

                    response_text = ""
                    response_buffer = ""
                    sentence_delimiters = ['.', '!', '?', '\n']

                    async for chunk in stream:
                        if chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            response_text += content
                            response_buffer += content

                            if any(delim in response_buffer for delim in sentence_delimiters) and len(response_buffer) > 50:
                                await websocket.send_json({
                                    "type": "response_chunk",
                                    "text": response_buffer
                                })

                                asyncio.create_task(stream_tts_audio(response_buffer, websocket))
                                response_buffer = ""

                    if response_buffer:
                        await websocket.send_json({
                            "type": "response_chunk",
                            "text": response_buffer
                        })
                        asyncio.create_task(stream_tts_audio(response_buffer, websocket))

                    print(f"Elias: {response_text}")

                    conversation_history[connection_id].append({"role": "assistant", "content": response_text})

                    if conversation_id:
                        asyncio.create_task(
                            asyncio.to_thread(
                                ConversationService.add_message,
                                conversation_id=conversation_id,
                                role="user",
                                content=transcript
                            )
                        )
                        asyncio.create_task(
                            asyncio.to_thread(
                                ConversationService.add_message,
                                conversation_id=conversation_id,
                                role="assistant",
                                content=response_text
                            )
                        )

                    await websocket.send_json({
                        "type": "response",
                        "text": response_text
                    })

                    await websocket.send_json({
                        "type": "status",
                        "message": "Ready"
                    })

                except Exception as e:
                    print(f"Error processing audio: {e}")
                    import traceback
                    traceback.print_exc()
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Error: {str(e)}"
                    })

    except WebSocketDisconnect:
        print(f"Client disconnected. Session ID: {session_id}")
        if connection_id in active_conversations:
            del active_conversations[connection_id]
        if connection_id in conversation_history:
            del conversation_history[connection_id]
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        if connection_id in active_conversations:
            del active_conversations[connection_id]
        if connection_id in conversation_history:
            del conversation_history[connection_id]

dist_path = Path("dist")
if dist_path.exists():
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("ws"):
            return JSONResponse(content={"error": "Not found"}, status_code=404)

        file_path = dist_path / full_path
        if file_path.is_file():
            return FileResponse(file_path)

        return FileResponse(dist_path / "index.html")
else:
    @app.get("/")
    async def read_root():
        return JSONResponse(content={
            "message": "Elias API is running. Build the frontend with 'npm run build' to serve the web app."
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
