# Quick Start - Elias Realtime Voice

Get up and running in 15 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.9+ installed
- [ ] Docker (for Redis) or Redis installed
- [ ] OpenAI API key (existing)
- [ ] Supabase project configured (existing)
- [ ] AssemblyAI account created
- [ ] Cartesia account created

## Step 1: Get New API Keys (5 min)

### AssemblyAI

1. Go to https://www.assemblyai.com/dashboard/signup
2. Sign up for free account
3. Copy API key from dashboard
4. Save for Step 3

### Cartesia

1. Go to https://cartesia.ai
2. Sign up and get API key
3. Navigate to "Voices" in dashboard
4. Create or clone a voice
5. Copy Voice ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
6. Save both key and voice ID for Step 3

## Step 2: Start Redis (1 min)

```bash
docker run -d -p 6379:6379 --name elias-redis redis:alpine
```

Verify it's running:
```bash
docker ps | grep redis
```

## Step 3: Configure Environment (2 min)

Update `.env` in project root:

```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...
ASSEMBLYAI_API_KEY=YOUR_NEW_KEY_HERE
CARTESIA_API_KEY=YOUR_NEW_KEY_HERE
CARTESIA_VOICE_ID=YOUR_VOICE_ID_HERE
REDIS_URL=redis://localhost:6379
```

Copy to edge bridge:

```bash
cp .env edge-bridge/.env
```

## Step 4: Install Dependencies (3 min)

### Python packages:

```bash
pip install -r requirements.txt
```

### Node packages:

```bash
# Main frontend
npm install

# Edge bridge
cd edge-bridge
npm install
cd ..
```

## Step 5: Run All Services (2 min)

Open 3 terminals:

**Terminal 1 - Edge Bridge:**
```bash
cd edge-bridge
npm run dev
```

Wait for: `🚀 Edge Bridge running on port 3001`

**Terminal 2 - FastAPI Backend:**
```bash
python main.py
```

Wait for: `Uvicorn running on http://0.0.0.0:8000`

**Terminal 3 - React Frontend:**
```bash
npm run dev
```

Wait for: `Local: http://localhost:5173/`

## Step 6: Test Voice Chat (2 min)

1. Open browser: http://localhost:5173/chat
2. Click "Talk" button
3. Allow microphone access
4. Say: "Hello, can you hear me?"
5. Watch for:
   - Green "Listening..." status
   - Your speech transcribed
   - Amber "Thinking..." status
   - Blue "Speaking..." status
   - Audio response within ~250ms

## Troubleshooting

### Edge Bridge Won't Start

**Error:** `Redis connection failed`
```bash
# Check Redis is running
docker ps | grep redis

# Restart if needed
docker restart elias-redis
```

**Error:** `AssemblyAI authentication failed`
- Verify API key is correct in `.env`
- Check key has not expired
- Ensure no extra spaces in key

### No Audio Playback

**Check browser console** for errors:
```
F12 → Console tab
```

Common issues:
- Cartesia API key invalid
- Voice ID incorrect
- Browser blocked audio autoplay (click anywhere on page)

### High Latency

Check edge bridge terminal for warnings:
```
⚠️ High latency detected: 350ms
```

Possible causes:
- Slow internet connection
- Redis not responding (check logs)
- High API load (try again in a moment)

### Connection Failed

**Error:** `WebSocket connection failed`

Verify edge bridge is running:
```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy"}
```

## Next Steps

### Upload a Test Report

1. Go to http://localhost:5173
2. Find "Upload Report" section
3. Upload a PDF or markdown file
4. Wait for processing (watch FastAPI terminal)
5. Try asking questions about the report in voice chat

### Check Latency Metrics

Query the database:

```sql
SELECT
  AVG(total_latency_ms) as avg_latency,
  MIN(total_latency_ms) as best_latency,
  MAX(total_latency_ms) as worst_latency
FROM latency_telemetry
WHERE created_at > now() - interval '1 hour';
```

Target: Average under 300ms

### Customize the Voice

1. Go to Cartesia dashboard
2. Experiment with different voices
3. Update `CARTESIA_VOICE_ID` in `.env`
4. Restart edge bridge
5. Test new voice

## Common Commands

```bash
# Check Redis
redis-cli ping

# View edge bridge logs
cd edge-bridge && npm run dev

# Restart FastAPI
# Ctrl+C then: python main.py

# Rebuild frontend
npm run build

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM document_chunks"
```

## Full Documentation

For detailed information:

- **Setup Guide**: See `REALTIME_SETUP.md`
- **Architecture**: See `TRANSFORMATION_SUMMARY.md`
- **Edge Bridge**: See `edge-bridge/README.md`

## Production Deployment

Once everything works locally:

1. Deploy edge bridge to cloud (Chicago/Minneapolis)
2. Update WebRTC URL in frontend
3. Configure TURN servers
4. Set up monitoring
5. Update RLS policies to restrict access
6. Rotate API keys

See `REALTIME_SETUP.md` for production deployment guide.

## Getting Help

Check logs in order:

1. Browser console (F12)
2. Edge bridge terminal
3. FastAPI terminal
4. Redis logs: `docker logs elias-redis`

## Success Indicators

You know it's working when:

✅ All three services start without errors
✅ Voice chat page shows "Ready" status
✅ Audio responses start within 300ms
✅ Transcripts appear accurately
✅ Voice sounds natural and clear
✅ Latency metrics show <300ms average

## Need More Help?

- **AssemblyAI Issues**: https://www.assemblyai.com/docs
- **Cartesia Issues**: https://docs.cartesia.ai
- **General Setup**: Review `REALTIME_SETUP.md`

You're all set! Enjoy your sub-300ms realtime voice AI.
