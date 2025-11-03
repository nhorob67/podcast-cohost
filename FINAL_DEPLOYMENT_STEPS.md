# 🚀 Final Deployment Steps - UPDATED

## ✅ What's Already Done

- ✅ Code pushed to GitHub: https://github.com/nhorob67/podcast-cohost
- ✅ All API keys configured
- ✅ Railway configuration files created
- ✅ Build verified successful
- ✅ **WebSocket URL updated to use environment variable**

---

## 📝 Important Update

The frontend has been updated to use an environment variable for the WebSocket URL. This makes deployment cleaner - no code changes needed after Railway deployment!

---

## 🎯 Deploy in 3 Simple Steps

### Step 1: Deploy Frontend to Vercel (5 minutes)

**Go to**: https://vercel.com/new

1. **Import**: Click "Import Project" → Select `nhorob67/podcast-cohost`

2. **Framework**: Select **Vite**

3. **Environment Variables**: Add these **3 variables**:

   ```
   Name: VITE_SUPABASE_URL
   Value: https://tnftqhxaadryeqfsrnuk.supabase.co

   Name: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZnRxaHhhYWRyeWVxZnNybnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjUyODEsImV4cCI6MjA3NzU0MTI4MX0.uPU8GCd9_WbJ2HO-X2Qz5BBCD5NQ6mD5t4G-QhTb-PM

   Name: VITE_EDGE_BRIDGE_URL
   Value: [Leave empty for now - will add after Railway deployment]
   ```

4. **Deploy**: Click "Deploy" and wait 2-3 minutes

5. **Save your URL**: Copy the Vercel URL (e.g., `https://podcast-cohost.vercel.app`)

---

### Step 2: Deploy Edge Bridge to Railway (10 minutes)

**Go to**: https://railway.app/new

1. **Import**: Click "Deploy from GitHub repo" → Select `nhorob67/podcast-cohost`

2. **Environment Variables**: Add these **7 variables**:

   ```
   OPENAI_API_KEY
   [Your OpenAI key from local .env file]

   SUPABASE_URL
   https://tnftqhxaadryeqfsrnuk.supabase.co

   SUPABASE_KEY
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZnRxaHhhYWRyeWVxZnNybnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjUyODEsImV4cCI6MjA3NzU0MTI4MX0.uPU8GCd9_WbJ2HO-X2Qz5BBCD5NQ6mD5t4G-QhTb-PM

   ASSEMBLYAI_API_KEY
   4baae61db1444464adbf4498271e13c4

   CARTESIA_API_KEY
   sk_car_MjmGgYNxW1cLvZLqT2MBoS

   CARTESIA_VOICE_ID
   f786b574-daa5-4673-aa0c-cbe3e8534c02

   PORT
   3001
   ```

3. **Configure Start Command**:
   - Go to Settings tab
   - Find "Start Command"
   - Set to: `cd edge-bridge && npm start`

4. **Generate Domain**:
   - Go to Settings > Networking
   - Click "Generate Domain"
   - Copy the domain (e.g., `podcast-cohost-prod.up.railway.app`)

5. **Test Health**:
   - Visit: `https://your-railway-domain.up.railway.app/health`
   - Should return: `{"status":"ok"}`

---

### Step 3: Connect Services (2 minutes)

**Go back to Vercel**:

1. Open your Vercel project dashboard
2. Go to Settings > Environment Variables
3. Find `VITE_EDGE_BRIDGE_URL`
4. Update its value to: `wss://your-railway-domain.up.railway.app/webrtc`
   - **Example**: `wss://podcast-cohost-prod.up.railway.app/webrtc`
   - **Important**: Use `wss://` (not `ws://`)
   - **Important**: Include `/webrtc` at the end

5. Go to Deployments tab
6. Click "..." menu on latest deployment
7. Click "Redeploy"
8. Wait 2-3 minutes

---

## ✅ Testing Your Deployment

Once Vercel finishes redeploying:

1. **Open your app**: `https://your-vercel-url.vercel.app`

2. **Navigate to Voice Chat**: Click "Voice Chat" or go to `/chat`

3. **Test connection**:
   - Click "Connect" button
   - Status should change to "Ready"
   - Allow microphone access if prompted

4. **Test conversation**:
   - Say: "Hello, can you hear me?"
   - Verify:
     - ✅ Text appears showing transcription
     - ✅ AI responds with a message
     - ✅ You hear audio playback
     - ✅ Response is fast (<1 second)

---

## 🎯 Quick Reference

### Vercel Environment Variables (3 total):
```
VITE_SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_EDGE_BRIDGE_URL=wss://your-railway-domain.up.railway.app/webrtc
```

### Railway Environment Variables (7 total):
```
OPENAI_API_KEY=[your key]
SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
SUPABASE_KEY=eyJhbGci...
ASSEMBLYAI_API_KEY=4baae61db1444464adbf4498271e13c4
CARTESIA_API_KEY=sk_car_MjmGgYNxW1cLvZLqT2MBoS
CARTESIA_VOICE_ID=f786b574-daa5-4673-aa0c-cbe3e8534c02
PORT=3001
```

### Railway Start Command:
```
cd edge-bridge && npm start
```

---

## 🔍 Verification Checklist

- [ ] Vercel deployment successful
- [ ] Railway deployment successful
- [ ] Railway health check returns `{"status":"ok"}`
- [ ] Frontend loads at Vercel URL
- [ ] Voice chat page accessible at `/chat`
- [ ] "Connect" button changes status to "Ready"
- [ ] Microphone permission granted
- [ ] Speech transcription works
- [ ] AI responds with text and audio
- [ ] Response time is fast

---

## 🆘 Troubleshooting

**Problem**: WebSocket won't connect
- **Check**: `VITE_EDGE_BRIDGE_URL` is set in Vercel
- **Verify**: URL starts with `wss://` (not `ws://`)
- **Verify**: URL ends with `/webrtc`
- **Test**: Railway health endpoint works

**Problem**: No transcription
- **Check**: `ASSEMBLYAI_API_KEY` is set in Railway
- **Verify**: Microphone permission granted in browser
- **Review**: Railway logs for STT errors

**Problem**: No audio playback
- **Check**: `CARTESIA_API_KEY` and `CARTESIA_VOICE_ID` are set in Railway
- **Verify**: Browser console has no errors
- **Test**: Audio output device is working

**Problem**: Railway health check fails
- **Check**: All 7 environment variables are set
- **Verify**: Start command is correct
- **Review**: Railway deployment logs

---

## 🎉 Success!

Once all steps are complete, you'll have:

✅ **Production-ready podcast co-host**
✅ **Sub-300ms latency**
✅ **Natural voice synthesis**
✅ **Real-time transcription**
✅ **Scalable infrastructure**
✅ **Automatic deployments**

---

## 📊 Monitoring

### Vercel Dashboard:
- Deployments: https://vercel.com/dashboard
- View build logs, analytics, and performance

### Railway Dashboard:
- Services: https://railway.app/dashboard
- Monitor CPU, memory, logs, and metrics

---

## 💡 Pro Tips

1. **Test locally first**: Run `cd edge-bridge && npm start` locally to verify
2. **Check Railway logs**: If issues occur, Railway logs are very helpful
3. **Use WSS in production**: Always use `wss://` (secure WebSocket) in Vercel
4. **Monitor costs**: Check Railway and API usage regularly
5. **Set up alerts**: Configure billing alerts in Railway and API dashboards

---

## 🔗 Your Resources

- **GitHub**: https://github.com/nhorob67/podcast-cohost
- **Local .env**: `/tmp/cc-agent/59548556/project/.env` (for API keys)
- **Vercel**: https://vercel.com/dashboard
- **Railway**: https://railway.app/dashboard

---

**Your near-live podcast co-host is ready to deploy! 🎙️✨**

**Total deployment time**: ~15-20 minutes
