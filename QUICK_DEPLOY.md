# Quick Deploy Reference

## ✅ Current Status

- **GitHub Repo**: https://github.com/nhorob67/podcast-cohost
- **Code**: Pushed successfully
- **Vercel**: Account created
- **Railway**: Account created

---

## 🎯 Deploy in 3 Steps

### 1. Deploy Frontend to Vercel

**Dashboard**: https://vercel.com/new

1. Import: `nhorob67/podcast-cohost`
2. Framework: **Vite**
3. Add environment variables:
   - `VITE_SUPABASE_URL` = `https://tnftqhxaadryeqfsrnuk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (your Supabase anon key)
4. Click Deploy

**Result**: Get frontend URL (e.g., `https://podcast-cohost.vercel.app`)

---

### 2. Deploy Edge Bridge to Railway

**Dashboard**: https://railway.app/new

1. Deploy from: `nhorob67/podcast-cohost`
2. Add 7 environment variables:
   - `OPENAI_API_KEY` (your key)
   - `SUPABASE_URL` = `https://tnftqhxaadryeqfsrnuk.supabase.co`
   - `SUPABASE_KEY` (your Supabase anon key)
   - `ASSEMBLYAI_API_KEY` (your key)
   - `CARTESIA_API_KEY` (your key)
   - `CARTESIA_VOICE_ID` (your voice ID)
   - `PORT` = `3001`
3. Settings > Start Command: `cd edge-bridge && npm start`
4. Generate Domain

**Result**: Get Railway URL (e.g., `https://your-app.up.railway.app`)

---

### 3. Connect Services

1. Edit `src/pages/VoiceChatWebRTC.tsx`
2. Update line ~20:
   ```typescript
   const EDGE_BRIDGE_URL = 'wss://your-railway-app.up.railway.app/webrtc';
   ```
3. Commit and push:
   ```bash
   git add src/pages/VoiceChatWebRTC.tsx
   git commit -m "Connect to Railway WebSocket"
   git push origin main
   ```

**Result**: Vercel auto-redeploys with new config

---

## ✨ You're Live!

Test at: `https://your-app.vercel.app/chat`

---

## 🔑 Environment Variables Cheat Sheet

### Vercel (2 variables):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### Railway (7 variables):
```
OPENAI_API_KEY
SUPABASE_URL
SUPABASE_KEY
ASSEMBLYAI_API_KEY
CARTESIA_API_KEY
CARTESIA_VOICE_ID
PORT
```

**Note**: Get actual values from your local `.env` file at:
`/tmp/cc-agent/59548556/project/.env`

---

## 🆘 Quick Troubleshooting

**WebSocket fails**: Check Railway domain in `VoiceChatWebRTC.tsx`
**No audio**: Verify Cartesia key in Railway
**No transcription**: Verify AssemblyAI key in Railway
**Build fails**: Check environment variables in Vercel

---

**Full Guide**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
