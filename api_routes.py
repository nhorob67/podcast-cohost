from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
from datetime import datetime
from openai import OpenAI
import os
from dotenv import load_dotenv

from services.conversation_service import ConversationService
from services.report_service import ReportService
from services.personality_service import PersonalityService
from services.reference_service import ReferenceService
from services.embedding_service import EmbeddingService
from utils.file_processor import FileProcessor
import asyncio

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/api")

@router.get("/conversations")
async def get_conversations(limit: int = 20, include_archived: bool = False):
    conversations = ConversationService.get_recent_conversations(limit, include_archived)
    return JSONResponse(content={"conversations": conversations})

@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    conversation = ConversationService.get_conversation_by_thread_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = ConversationService.get_conversation_messages(conversation["id"])
    return JSONResponse(content={"conversation": conversation, "messages": messages})

@router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(conversation_id: str):
    result = ConversationService.archive_conversation(conversation_id)
    return JSONResponse(content={"success": True, "conversation": result})

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    success = ConversationService.delete_conversation(conversation_id)
    return JSONResponse(content={"success": success})

@router.put("/conversations/{conversation_id}/title")
async def update_conversation_title(conversation_id: str, title: str = Form(...)):
    result = ConversationService.update_conversation_title(conversation_id, title)
    return JSONResponse(content={"success": True, "conversation": result})

@router.post("/conversations/import")
async def import_conversation(data: dict):
    try:
        thread_id = data.get("thread_id", f"imported_{datetime.now().timestamp()}")
        title = data.get("title", "Imported Conversation")
        messages = data.get("messages", [])
        started_at = data.get("started_at")

        conversation = ConversationService.import_conversation(
            thread_id=thread_id,
            title=title,
            messages=messages,
            started_at=started_at
        )

        return JSONResponse(content={"success": True, "conversation": conversation})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reports")
async def get_reports(limit: int = 50):
    reports = ReportService.get_all_reports(limit)
    return JSONResponse(content={"reports": reports})

@router.get("/reports/{report_id}")
async def get_report(report_id: str):
    report = ReportService.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    files = ReportService.get_report_files(report_id)
    return JSONResponse(content={"report": report, "files": files})

@router.post("/reports/upload")
async def upload_report(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None)
):
    try:
        file_data = await file.read()
        file_path = FileProcessor.save_uploaded_file(file_data, file.filename)

        processed = FileProcessor.process_file(file_path)

        if not processed["success"]:
            raise HTTPException(status_code=400, detail=processed.get("error", "Failed to process file"))

        tags_list = [t.strip() for t in tags.split(",")] if tags else []

        report = ReportService.create_report(
            title=title,
            file_type=processed["file_type"],
            file_size_bytes=processed["file_size_bytes"],
            description=description,
            tags=tags_list,
            openai_file_id=None
        )

        ReportService.create_report_file(
            report_id=report["id"],
            file_path=file_path,
            content_text=processed["content_text"]
        )

        ReportService.update_report_status(report["id"], "processing")

        asyncio.create_task(
            asyncio.to_thread(
                EmbeddingService.process_and_store_chunks,
                report["id"],
                processed["content_text"],
                title
            )
        )

        ReportService.update_report_status(report["id"], "completed")

        return JSONResponse(content={"success": True, "report": report})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    success = ReportService.delete_report(report_id)
    return JSONResponse(content={"success": success})

@router.get("/personality")
async def get_personality():
    active = PersonalityService.get_active_personality()
    all_personalities = PersonalityService.get_all_personalities()
    return JSONResponse(content={"active": active, "all": all_personalities})

@router.post("/personality")
async def create_personality(data: dict):
    try:
        personality = PersonalityService.create_personality(
            name=data.get("name"),
            instructions=data.get("instructions"),
            speaking_style=data.get("speaking_style"),
            knowledge_domains=data.get("knowledge_domains"),
            is_active=data.get("is_active", False)
        )
        return JSONResponse(content={"success": True, "personality": personality})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/personality/{personality_id}")
async def update_personality(personality_id: str, data: dict):
    try:
        personality = PersonalityService.update_personality(personality_id, data)
        return JSONResponse(content={"success": True, "personality": personality})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/personality/{personality_id}/activate")
async def activate_personality(personality_id: str):
    personality = PersonalityService.activate_personality(personality_id)
    return JSONResponse(content={"success": True, "personality": personality})

@router.get("/settings")
async def get_settings():
    reference_freq = ReferenceService.get_reference_frequency_setting()
    max_context = ReferenceService.get_max_context_conversations()
    reference_stats = ReferenceService.get_reference_stats()

    return JSONResponse(content={
        "reference_frequency": reference_freq,
        "max_context_conversations": max_context,
        "reference_stats": reference_stats
    })

@router.put("/settings/reference-frequency")
async def update_reference_frequency(data: dict):
    level = data.get("level")
    weight = data.get("weight")

    result = ReferenceService.update_reference_frequency(level, weight)
    return JSONResponse(content={"success": True, "settings": result})

@router.put("/settings/max-context")
async def update_max_context(data: dict):
    count = data.get("count")
    result = ReferenceService.update_max_context_conversations(count)
    return JSONResponse(content={"success": True, "settings": result})
