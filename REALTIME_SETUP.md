# Elias Realtime Voice - Setup Guide

This guide walks you through setting up the sub-300ms realtime voice system for Elias.

## Architecture Overview

The system has been transformed from a batch-oriented WebSocket system to a realtime WebRTC pipeline:

```
┌─────────────┐     WebRTC      ┌──────────────┐
│   Browser   │ <-------------> │ Edge Bridge  │
│  (React)    │   Audio Stream  │   (Node.js)  │
└─────────────┘                 └──────────────┘
                                       │
                    ┌──────────────────┼─────────────────┐
                    │                  │                 │
                ┌───▼────┐      ┌─────▼─────┐    ┌─────▼─────┐
                │Assembly│      │  GPT-4o   │    │ Cartesia  │
                │   AI   │      │   (LLM)   │    │   (TTS)   │
                └────────┘      └───────────┘    └───────────┘
                                       │
                                ┌──────▼────────┐
                                │  PostgreSQL   │
                                │  + pgvector   │
                                │  + Redis      │
                                └───────────────┘
```

## Prerequisites

### Services & Accounts

1. **AssemblyAI Account**
   - Sign up at https://www.assemblyai.com
   - Get API key from dashboard
   - Required for realtime speech-to-text

2. **Cartesia Account**
   - Sign up at https://cartesia.ai
   - Get API key
   - Create a cloned voice and save the voice ID
   - Required for streaming text-to-speech

3. **OpenAI Account**
   - Existing account with API access
   - Used for GPT-4o-mini and embeddings

4. **Supabase Project**
   - Already configured
   - Database migrations applied

5. **Redis Instance**
   - Local: `docker run -d -p 6379:6379 redis:alpine`
   - Or use a hosted service (Upstash, Redis Cloud)

### Local Requirements

- Node.js 18+
- Python 3.9+
- PostgreSQL with pgvector (via Supabase)
- Redis server

## Step 1: Database Setup

The database migrations have already been applied and include:

- `document_chunks` table with pgvector support
- `latency_telemetry` table for performance tracking
- `session_state` table for edge session management
- Vector search function `match_document_chunks`

Verify migrations:

```sql
SELECT * FROM document_chunks LIMIT 1;
SELECT * FROM latency_telemetry LIMIT 1;
```

## Step 2: Configure API Keys

### Main Application (.env)

Update `/tmp/cc-agent/59548556/project/.env`:

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...
ASSEMBLYAI_API_KEY=...
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...
REDIS_URL=redis://localhost:6379
```

### Edge Bridge (.env)

Create `/tmp/cc-agent/59548556/project/edge-bridge/.env`:

```bash
cp edge-bridge/.env.example edge-bridge/.env
```

Add the same credentials as above.

## Step 3: Install Dependencies

### Python Dependencies

```bash
pip install -r requirements.txt
```

The embedding service requires `openai` package.

### Node.js Dependencies

```bash
cd edge-bridge
npm install
cd ..
```

## Step 4: Create Cartesia Voice

1. Go to https://cartesia.ai/dashboard
2. Navigate to "Voices"
3. Click "Create Voice" or "Clone Voice"
4. Follow the voice creation wizard
5. Copy the Voice ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
6. Add to `.env` as `CARTESIA_VOICE_ID`

## Step 5: Start Redis

Local development:

```bash
docker run -d -p 6379:6379 --name elias-redis redis:alpine
```

Verify:

```bash
redis-cli ping
# Should return: PONG
```

## Step 6: Run the Edge Bridge

Start the Node.js edge bridge service:

```bash
cd edge-bridge
npm run dev
```

You should see:

```
🚀 Edge Bridge running on port 3001
Redis connected for RAG
```

## Step 7: Run the FastAPI Backend

In a separate terminal:

```bash
python main.py
```

This handles management APIs (uploads, settings, conversations).

## Step 8: Run the React Frontend

In a separate terminal:

```bash
npm run dev
```

Frontend will start on http://localhost:5173

## Step 9: Test the System

1. Open http://localhost:5173/chat
2. Click "Talk" button
3. Grant microphone permissions
4. Speak a question
5. Observe latency metrics in terminal

Expected flow:

- **Green status**: Listening to audio
- **Amber status**: Processing transcript and generating response
- **Blue status**: Speaking response
- **Audio playback**: Should start within 300ms

## Step 10: Upload and Process Reports

1. Navigate to http://localhost:5173
2. Use the "Upload Report" section
3. Upload a PDF, markdown, or text file
4. System will:
   - Extract text content
   - Chunk into 500-800 token segments
   - Generate embeddings
   - Store in `document_chunks` table

Monitor processing:

```sql
SELECT report_id, COUNT(*) as chunk_count
FROM document_chunks
GROUP BY report_id;
```

## Monitoring Latency

### Real-time Logs

Watch edge bridge terminal for latency warnings:

```
⚠️ High latency detected: 350ms for session abc-123
```

### Database Queries

Query latency statistics:

```sql
-- Recent turn latencies
SELECT * FROM latency_telemetry
ORDER BY created_at DESC
LIMIT 20;

-- Aggregate stats
SELECT * FROM latency_stats
ORDER BY hour DESC
LIMIT 24;
```

### Performance Targets

- **STT Endpoint**: < 50ms (AssemblyAI server VAD)
- **LLM First Token**: < 150ms (GPT-4o-mini at temp 0.3)
- **TTS First Frame**: < 100ms (Cartesia streaming start)
- **Total**: < 300ms for short turns

## Troubleshooting

### "WebSocket connection failed"

- Ensure edge bridge is running on port 3001
- Check CORS settings
- Verify WebSocket URL in frontend code

### "No audio playback"

- Check browser console for audio decoding errors
- Verify Cartesia API key and voice ID
- Ensure 24kHz sample rate compatibility

### "High latency"

- Check network connection to APIs
- Verify Redis is responding quickly
- Review LLM token limits (lower if needed)
- Consider deploying edge bridge closer to users

### "Empty context / no RAG results"

- Verify reports have been uploaded and chunked
- Check `document_chunks` table has embeddings
- Test vector search function:

```sql
SELECT match_document_chunks(
  (SELECT embedding FROM document_chunks LIMIT 1),
  5,
  0.5
);
```

## Production Deployment

### Edge Bridge

Deploy to a server close to your users (Chicago/Minneapolis for US traffic):

```bash
# Use PM2
pm2 start edge-bridge/src/server.js --name elias-edge

# Or systemd
sudo cp edge-bridge.service /etc/systemd/system/
sudo systemctl enable elias-edge
sudo systemctl start elias-edge
```

### Security Checklist

- [ ] All API keys in environment variables only
- [ ] No keys exposed to browser
- [ ] Rate limiting on `/webrtc` endpoint
- [ ] CORS restricted to your domain
- [ ] Session duration caps enforced
- [ ] RLS policies updated from public to authenticated
- [ ] API keys rotated if previously exposed

### Monitoring

Set up alerts for:

- Latency > 220ms threshold
- WebSocket connection errors
- Redis connection failures
- API rate limits

## Advanced Configuration

### Adjusting Latency/Quality Tradeoffs

Edit `edge-bridge/src/adapters/llm-adapter.js`:

```javascript
temperature: 0.3,  // Lower = faster, less creative
max_tokens: 200,   // Lower = faster, more concise
```

Edit `edge-bridge/src/server.js`:

```javascript
const tokenThreshold = 15;  // Lower = faster start, more API calls
```

### Barge-in Sensitivity

Edit `edge-bridge/src/utils/audio-processor.js`:

```javascript
static detectSpeech(pcmBuffer, threshold = 500) {
  // Lower threshold = more sensitive
}
```

### Context Window

Edit `edge-bridge/src/services/session-manager.js`:

```javascript
session.conversationHistory.push({ role, content });
if (session.conversationHistory.length > 20) {  // Adjust size
  session.conversationHistory.shift();
}
```

## Next Steps

- Deploy edge bridge to production
- Set up monitoring dashboard
- Configure alerting thresholds
- Test with real users
- Optimize based on latency metrics
- Add more voices/personalities

## Support

For issues with:

- **AssemblyAI**: https://www.assemblyai.com/docs
- **Cartesia**: https://docs.cartesia.ai
- **OpenAI**: https://platform.openai.com/docs

## License

MIT
