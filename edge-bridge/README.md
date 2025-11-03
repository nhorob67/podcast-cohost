# Elias Edge Bridge

High-performance WebRTC media bridge for sub-300ms realtime voice AI.

## Overview

The Edge Bridge is a Node.js service that handles the realtime audio pipeline for Elias. It coordinates:

- **WebRTC Audio Streaming**: Bidirectional audio over peer connections
- **Speech-to-Text**: AssemblyAI realtime streaming with server-side VAD
- **LLM Reasoning**: GPT-4o-mini with optimized parameters for low latency
- **Text-to-Speech**: Cartesia Sonic streaming with token-level synthesis
- **Vector RAG**: Fast context retrieval with pgvector and Redis caching

## Architecture

```
Browser (WebRTC) <-> Edge Bridge <-> {AssemblyAI, GPT-4o, Cartesia, PostgreSQL, Redis}
```

The bridge terminates WebRTC connections, converts audio to PCM, fans out to vendor APIs, and streams synthesized audio back.

## Setup

### Prerequisites

- Node.js 18+
- Redis (local or hosted)
- PostgreSQL with pgvector extension
- API keys for AssemblyAI, OpenAI, and Cartesia

### Installation

```bash
cd edge-bridge
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `OPENAI_API_KEY` - OpenAI API key for LLM and embeddings
- `ASSEMBLYAI_API_KEY` - AssemblyAI API key for realtime STT
- `CARTESIA_API_KEY` - Cartesia API key for streaming TTS
- `CARTESIA_VOICE_ID` - Cartesia voice ID (create via Cartesia dashboard)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anon key
- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379`)
- `EDGE_BRIDGE_PORT` - Port for the bridge service (default: `3001`)

### Running

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### WebSocket: `/webrtc`

Main signaling and media endpoint. Handles:

- WebRTC signaling (offer/answer/ICE)
- Binary audio streaming (PCM 24kHz mono)
- Status updates and transcripts

### HTTP: `/health`

Health check endpoint.

```bash
curl http://localhost:3001/health
```

## Audio Pipeline

### Upstream (Browser -> Edge)

1. Browser captures mic via `getUserMedia`
2. ScriptProcessorNode converts to PCM Int16
3. WebSocket sends 20ms PCM frames
4. Edge bridge forwards to AssemblyAI realtime socket
5. AssemblyAI returns partial/final transcripts with VAD endpoints

### Downstream (Edge -> Browser)

1. LLM streams tokens via GPT-4o-mini
2. After 15 tokens, start Cartesia synthesis
3. Cartesia streams PCM audio frames
4. Edge bridge sends binary chunks over WebSocket
5. Browser decodes and plays audio

## Latency Metrics

The bridge tracks three critical latencies per turn:

- **STT Endpoint**: Time from speech end to transcript ready
- **LLM First Token**: Time from transcript to first LLM token
- **TTS First Frame**: Time from synthesis start to first audio frame

Target: Under 300ms total for short turns.

Metrics are stored in the `latency_telemetry` table for analysis.

## Barge-In Detection

The bridge monitors incoming audio during TTS playback. If speech is detected (energy threshold), it immediately cancels the Cartesia stream and sends an `audio_interrupted` event.

## Session Management

Sessions are tracked in memory and backed by Redis. Each session stores:

- Conversation history (last 20 turns)
- Retrieved chunk IDs (LRU cache)
- Active personality configuration
- Latency metrics

Sessions expire after 2 hours of inactivity.

## Adapter Pattern

The bridge uses pluggable adapters for each vendor:

- `stt-adapter.js` - AssemblyAI streaming STT
- `llm-adapter.js` - GPT-4o-mini streaming completions
- `tts-adapter.js` - Cartesia Sonic streaming synthesis
- `rag-adapter.js` - pgvector + Redis context retrieval

This allows swapping vendors without changing core logic.

## Deployment

### Local Development

Run Redis locally:

```bash
docker run -d -p 6379:6379 redis:alpine
```

Start the bridge:

```bash
npm run dev
```

### Production

Deploy to a server close to your users (Chicago/Minneapolis recommended for US traffic).

Key considerations:

- Use a process manager (PM2, systemd)
- Configure TURN servers for NAT traversal
- Set up monitoring for latency metrics
- Rate limit the `/webrtc` endpoint
- Ensure Redis and PostgreSQL are accessible

Example PM2 config:

```bash
pm2 start src/server.js --name elias-edge-bridge
```

## Troubleshooting

### High Latency

Check `latency_telemetry` table:

```sql
SELECT * FROM latency_stats ORDER BY hour DESC LIMIT 24;
```

Look for bottlenecks in STT, LLM, or TTS stages.

### Connection Issues

- Verify CORS settings if browser and bridge are on different origins
- Check WebSocket connection logs
- Ensure Redis is running and accessible
- Verify all API keys are valid

### Audio Quality

- Ensure 24kHz sample rate throughout pipeline
- Check for buffer underruns in browser playback
- Monitor network bandwidth
- Adjust chunk sizes if needed

## License

MIT
