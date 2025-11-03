# Elias - Sub-300ms Realtime Voice AI

A production-ready, ultra-low-latency voice AI system featuring Elias, your witty business expert co-host. Built with WebRTC, streaming APIs, and vector search for natural, responsive conversations.

**🌐 Now deployable as a web app! [Quick Deploy Guide →](./DEPLOY_QUICK_START.md)**

## Key Features

### 🚀 Ultra-Low Latency
- **Sub-300ms response time** from speech to audio
- WebRTC-based continuous audio streaming
- Token-level text-to-speech synthesis
- Realtime speech recognition with server-side VAD

### 🎙️ Natural Conversation
- **Barge-in support** - interrupt Elias naturally
- Partial transcript display for immediate feedback
- Continuous bidirectional audio streams
- Natural turn-taking with endpoint detection

### 🧠 Intelligent Context
- **Vector RAG** with pgvector for semantic search
- Fast context retrieval (<20ms) with Redis caching
- Structured metadata extraction from reports
- Relevant, concise context injection

### 📊 Production Ready
- Comprehensive latency telemetry
- Session management with Redis backing
- Vendor flexibility via adapter pattern
- Security hardened architecture

### 🎭 Customizable Personality
- Load personalities from JSON
- Compiled system prompts with guardrails
- Configurable speaking style
- Domain expertise settings

## Architecture

```
┌─────────────┐     WebRTC      ┌──────────────┐     APIs     ┌─────────────┐
│   Browser   │ <-------------> │ Edge Bridge  │ <----------> │ AssemblyAI  │
│   (React)   │   Audio/Data    │   (Node.js)  │              │   GPT-4o    │
└─────────────┘                 └──────────────┘              │  Cartesia   │
                                       │                       └─────────────┘
                                       ▼
                                ┌──────────────┐
                                │  FastAPI     │
                                │  + Postgres  │
                                │  + pgvector  │
                                │  + Redis     │
                                └──────────────┘
```

## Technology Stack

### Frontend
- React 18 with TypeScript
- WebRTC for audio streaming
- Web Audio API for processing
- Tailwind CSS for styling

### Edge Bridge (New)
- Node.js 18+ for low-latency media handling
- WebSocket signaling
- Real-time audio processing
- Vendor API coordination

### Backend
- FastAPI for management APIs
- PostgreSQL with pgvector for vector search
- Redis for session caching
- Supabase for data persistence

### AI Services
- **AssemblyAI** - Realtime streaming STT with VAD
- **GPT-4o-mini** - Low-latency reasoning (temp 0.3)
- **Cartesia Sonic** - Streaming TTS with voice cloning
- **OpenAI Embeddings** - text-embedding-3-small

## Quick Start

### 🌐 Deploy as Web App (5 minutes)
**New!** Deploy to Vercel/Netlify and run as a web application:
- See [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) for instant deployment
- Backend runs on Supabase Edge Functions (already deployed)
- No local setup required - access from anywhere!

### 💻 Run Locally (15 minutes)
**For development**, see [QUICK_START.md](./QUICK_START.md)

### Prerequisites

- Node.js 18+, Python 3.9+, Docker
- API keys: OpenAI, AssemblyAI, Cartesia
- Redis (local or hosted)
- Supabase project

### Start All Services

```bash
# Terminal 1: Redis
docker run -d -p 6379:6379 redis:alpine

# Terminal 2: Edge Bridge
cd edge-bridge && npm run dev

# Terminal 3: Backend
python main.py

# Terminal 4: Frontend
npm run dev
```

### Access

- **Voice Chat**: http://localhost:5173/chat
- **Dashboard**: http://localhost:5173
- **API**: http://localhost:8000
- **Edge Bridge**: http://localhost:3001

## Configuration

### Required Environment Variables

Create `.env` in project root and `edge-bridge/.env`:

```bash
# AI Services
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=...
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...

# Infrastructure
REDIS_URL=redis://localhost:6379
EDGE_BRIDGE_PORT=3001
```

### Getting API Keys

1. **AssemblyAI**: Sign up at https://www.assemblyai.com
2. **Cartesia**: Sign up at https://cartesia.ai and create a voice
3. **OpenAI**: Use existing key
4. **Supabase**: Already configured

## Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get running in 15 minutes
- **[TRANSFORMATION_SUMMARY.md](./TRANSFORMATION_SUMMARY.md)** - What changed and why
- **[REALTIME_SETUP.md](./REALTIME_SETUP.md)** - Detailed setup and deployment
- **[edge-bridge/README.md](./edge-bridge/README.md)** - Edge bridge documentation

## Performance Metrics

### Latency Targets

| Component | Target | Typical |
|-----------|--------|---------|
| STT Endpoint | <50ms | 30-40ms |
| LLM First Token | <150ms | 100-130ms |
| TTS First Frame | <100ms | 60-80ms |
| **Total** | **<300ms** | **190-250ms** |

### Monitoring

View real-time metrics in the database:

```sql
SELECT * FROM latency_stats ORDER BY hour DESC LIMIT 24;
```

Check for high latency warnings in edge bridge logs.

## Features

### Voice Chat
- Press "Talk" to start recording
- Speak naturally
- Release to process
- Interrupt Elias anytime (barge-in)
- See partial transcripts in real-time

### Report Upload
1. Navigate to dashboard
2. Upload PDF, Markdown, TXT, or DOCX
3. System chunks and embeds automatically
4. Ask questions about reports in voice chat
5. Get relevant context in <20ms

### Personality Management
- Create custom personalities via UI
- Define speaking style and expertise
- Activate different personalities
- System compiles to optimized prompts

### Conversation History
- All conversations auto-saved
- View past interactions
- Archive or delete as needed
- Context referenced naturally

## Development

### Project Structure

```
├── src/                      # React frontend
│   ├── pages/
│   │   └── VoiceChatWebRTC.tsx  # Main voice interface
│   ├── components/           # UI components
│   └── lib/                  # Supabase client
├── edge-bridge/              # Node.js media bridge
│   ├── src/
│   │   ├── adapters/         # Vendor integrations
│   │   ├── services/         # Business logic
│   │   └── server.js         # Main server
│   └── package.json
├── services/                 # Python services
│   ├── embedding_service.py  # Document chunking
│   └── *_service.py          # Other services
├── api_routes.py             # FastAPI routes
├── main.py                   # FastAPI app
└── supabase/migrations/      # Database schema
```

### Running Tests

```bash
# Frontend
npm run lint
npm run typecheck

# Backend
python -m pytest  # (if tests exist)
```

### Building

```bash
# Frontend
npm run build

# Creates dist/ folder served by FastAPI
```

## Deployment

### Edge Bridge

Deploy to a server close to your users (Chicago/Minneapolis for US):

```bash
cd edge-bridge
npm install --production
pm2 start src/server.js --name elias-edge
```

### FastAPI Backend

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Production Checklist

- [ ] All API keys in environment variables
- [ ] Redis accessible from edge bridge
- [ ] PostgreSQL with pgvector enabled
- [ ] CORS configured for your domain
- [ ] RLS policies updated for production
- [ ] TURN servers configured for WebRTC
- [ ] Monitoring and alerting set up
- [ ] Rate limiting on signaling endpoint

See [REALTIME_SETUP.md](./REALTIME_SETUP.md) for detailed deployment guide.

## Troubleshooting

### Connection Issues

```bash
# Check edge bridge health
curl http://localhost:3001/health

# Check Redis
redis-cli ping

# View logs
docker logs elias-redis
```

### High Latency

Query telemetry:

```sql
SELECT AVG(total_latency_ms) FROM latency_telemetry
WHERE created_at > now() - interval '1 hour';
```

### Audio Problems

- Check Cartesia voice ID is correct
- Verify API key has not expired
- Ensure browser allows audio autoplay
- Check browser console for errors

See [REALTIME_SETUP.md](./REALTIME_SETUP.md) for more troubleshooting.

## What Changed from Previous Version

This system has been **completely transformed** from a high-latency WebSocket system to a production-ready, sub-300ms realtime platform:

- **Audio**: WebSocket blob uploads → WebRTC continuous streams
- **STT**: Whisper batch API → AssemblyAI realtime streaming
- **TTS**: OpenAI sentence-level → Cartesia token-level streaming
- **Context**: Keyword search → pgvector semantic search
- **Architecture**: Monolithic → Edge bridge + FastAPI
- **Latency**: 2-5 seconds → sub-300ms

See [TRANSFORMATION_SUMMARY.md](./TRANSFORMATION_SUMMARY.md) for complete details.

## Contributing

This is a production-ready system. Key areas for contribution:

- Additional vendor adapters (Deepgram, ElevenLabs, Claude)
- Enhanced barge-in detection algorithms
- Multi-region edge bridge deployment
- Advanced context ranking algorithms
- Performance optimizations

## License

MIT

## Support

- **Setup Issues**: See [QUICK_START.md](./QUICK_START.md)
- **Architecture Questions**: See [TRANSFORMATION_SUMMARY.md](./TRANSFORMATION_SUMMARY.md)
- **Deployment Help**: See [REALTIME_SETUP.md](./REALTIME_SETUP.md)
- **Edge Bridge**: See [edge-bridge/README.md](./edge-bridge/README.md)

---

Built with ❤️ for natural, responsive voice AI conversations.
