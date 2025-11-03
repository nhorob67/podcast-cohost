import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { AssemblyAIAdapter } from './adapters/stt-adapter.js';
import { GPT4Adapter } from './adapters/llm-adapter.js';
import { CartesiaAdapter } from './adapters/tts-adapter.js';
import { VectorRAGAdapter } from './adapters/rag-adapter.js';
import { SessionManager } from './services/session-manager.js';
import { AudioProcessor } from './utils/audio-processor.js';

dotenv.config();

const app = express();
const PORT = process.env.EDGE_BRIDGE_PORT || 3001;

app.use(cors());
app.use(express.json());

const sessionManager = new SessionManager(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ragAdapter = new VectorRAGAdapter(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  process.env.OPENAI_API_KEY
);

await ragAdapter.connect();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'edge-bridge' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Edge Bridge running on port ${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/webrtc' });

wss.on('connection', async (ws) => {
  console.log('WebSocket connection established');

  let session = null;
  let sttAdapter = null;
  let llmAdapter = null;
  let ttsAdapter = null;
  let currentTranscript = '';
  let isProcessing = false;
  let isSpeaking = false;
  let metrics = {};

  const personality = await sessionManager.getActivePersonality();
  session = await sessionManager.createSession(personality?.id);

  const systemPrompt = sessionManager.compileSystemPrompt(personality);

  sttAdapter = new AssemblyAIAdapter(process.env.ASSEMBLYAI_API_KEY);
  llmAdapter = new GPT4Adapter(process.env.OPENAI_API_KEY);
  ttsAdapter = new CartesiaAdapter(
    process.env.CARTESIA_API_KEY,
    process.env.CARTESIA_VOICE_ID
  );

  ws.send(
    JSON.stringify({
      type: 'connected',
      sessionId: session.sessionId,
      message: 'Edge bridge ready',
    })
  );

  try {
    await sttAdapter.connect(
      (partialText) => {
        ws.send(JSON.stringify({ type: 'transcript_partial', text: partialText }));
      },
      async (finalText) => {
        if (isProcessing) return;

        isProcessing = true;
        currentTranscript = finalText;
        metrics.sttEndTime = Date.now();

        ws.send(JSON.stringify({ type: 'transcript_final', text: finalText }));
        ws.send(JSON.stringify({ type: 'status', message: 'thinking' }));

        sessionManager.addMessageToHistory(session.sessionId, 'user', finalText);

        const contextItems = await ragAdapter.fetchRelevantContext(
          finalText,
          session.sessionId,
          3
        );
        const contextPrompt = ragAdapter.formatContextForPrompt(contextItems);

        const messages = [
          { role: 'system', content: systemPrompt },
          ...session.conversationHistory.slice(-10).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: 'user',
            content: contextPrompt ? `${contextPrompt}\n\n${finalText}` : finalText,
          },
        ];

        metrics.llmStartTime = Date.now();
        let fullResponse = '';
        let tokenBuffer = '';
        let tokenCount = 0;
        let firstAudioSent = false;

        await llmAdapter.streamCompletion(
          messages,
          async (token, isFirst) => {
            if (isFirst) {
              metrics.llmFirstTokenTime = Date.now();
              metrics.llmFirstTokenMs = metrics.llmFirstTokenTime - metrics.llmStartTime;
            }

            fullResponse += token;
            tokenBuffer += token;
            tokenCount++;

            ws.send(JSON.stringify({ type: 'response_token', text: token }));

            if (tokenCount >= 15 && !firstAudioSent) {
              firstAudioSent = true;
              isSpeaking = true;
              metrics.ttsStartTime = Date.now();

              ws.send(JSON.stringify({ type: 'status', message: 'speaking' }));

              await ttsAdapter.streamSynthesis(
                tokenBuffer,
                (audioChunk) => {
                  if (!metrics.ttsFirstFrameTime) {
                    metrics.ttsFirstFrameTime = Date.now();
                    metrics.ttsFirstFrameMs = metrics.ttsFirstFrameTime - metrics.ttsStartTime;
                  }

                  ws.send(audioChunk, { binary: true });
                },
                () => {},
                (error) => {
                  console.error('TTS error:', error);
                }
              );

              tokenBuffer = '';
              tokenCount = 0;
            }
          },
          async (response) => {
            if (tokenBuffer.length > 0) {
              await ttsAdapter.streamSynthesis(
                tokenBuffer,
                (audioChunk) => {
                  ws.send(audioChunk, { binary: true });
                },
                () => {
                  ws.send(JSON.stringify({ type: 'audio_end' }));
                },
                (error) => {
                  console.error('TTS error:', error);
                }
              );
            } else {
              ws.send(JSON.stringify({ type: 'audio_end' }));
            }

            sessionManager.addMessageToHistory(session.sessionId, 'assistant', response);

            await sessionManager.recordLatency(session.sessionId, null, {
              sttEndpointMs: metrics.llmStartTime - metrics.sttEndTime,
              llmFirstTokenMs: metrics.llmFirstTokenMs,
              ttsFirstFrameMs: metrics.ttsFirstFrameMs,
            });

            ws.send(JSON.stringify({ type: 'status', message: 'ready' }));
            isProcessing = false;
            isSpeaking = false;
            metrics = {};
          },
          (error) => {
            console.error('LLM error:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'LLM error occurred' }));
            isProcessing = false;
          }
        );
      },
      (endpoint) => {
        console.log('Speech endpoint detected');
      },
      (error) => {
        console.error('STT error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'STT error occurred' }));
      }
    );
  } catch (error) {
    console.error('Error setting up STT:', error);
  }

  ws.on('message', async (data) => {
    if (Buffer.isBuffer(data)) {
      if (isSpeaking && !isProcessing) {
        const hasSpeech = AudioProcessor.detectSpeech(data);
        if (hasSpeech) {
          console.log('Barge-in detected, stopping TTS');
          isSpeaking = false;
          ws.send(JSON.stringify({ type: 'audio_interrupted' }));
        }
      }

      if (sttAdapter && !isProcessing) {
        const chunks = AudioProcessor.chunkAudio(data, 20, 24000);
        chunks.forEach((chunk) => {
          sttAdapter.sendAudio(chunk);
        });
      }
    } else {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'start_recording') {
          metrics.sttStartTime = Date.now();
          ws.send(JSON.stringify({ type: 'status', message: 'listening' }));
        } else if (message.type === 'stop_recording') {
          metrics.sttEndTime = Date.now();
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  });

  ws.on('close', async () => {
    console.log('WebSocket connection closed');

    if (sttAdapter) {
      await sttAdapter.disconnect();
    }

    if (session) {
      ragAdapter.clearSessionCache(session.sessionId);
      await sessionManager.destroySession(session.sessionId);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await ragAdapter.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
