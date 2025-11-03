# Your Deployment Information

## 🔗 Important Links

- **GitHub Repository**: https://github.com/nhorob67/podcast-cohost
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard

---

## 🔑 Your API Keys

Copy these when setting up environment variables in Vercel and Railway.

### For Vercel (Frontend) - 2 Variables

```
VITE_SUPABASE_URL
https://tnftqhxaadryeqfsrnuk.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZnRxaHhhYWRyeWVxZnNybnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjUyODEsImV4cCI6MjA3NzU0MTI4MX0.uPU8GCd9_WbJ2HO-X2Qz5BBCD5NQ6mD5t4G-QhTb-PM
```

### For Railway (Edge Bridge) - 7 Variables

```
OPENAI_API_KEY
(Find in your local .env file - starts with sk-proj-)

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

---

## 📋 Deployment Steps

### Step 1: Deploy to Vercel (5 min)

1. Go to: https://vercel.com/new
2. Import: `nhorob67/podcast-cohost`
3. Framework: **Vite**
4. Add 2 environment variables (see above)
5. Click Deploy
6. **Save your Vercel URL** (e.g., https://podcast-cohost.vercel.app)

### Step 2: Deploy to Railway (10 min)

1. Go to: https://railway.app/new
2. Deploy from GitHub: `nhorob67/podcast-cohost`
3. Add 7 environment variables (see above)
4. Settings > Start Command: `cd edge-bridge && npm start`
5. Generate Domain
6. **Save your Railway URL** (e.g., https://your-app.up.railway.app)

### Step 3: Connect Services (5 min)

1. Edit: `src/pages/VoiceChatWebRTC.tsx`
2. Find line ~20: `const EDGE_BRIDGE_URL = 'ws://localhost:3001/webrtc';`
3. Replace with: `const EDGE_BRIDGE_URL = 'wss://YOUR-RAILWAY-URL.up.railway.app/webrtc';`
4. Commit and push:
   ```bash
   git add src/pages/VoiceChatWebRTC.tsx
   git commit -m "Connect to Railway"
   git push origin main
   ```

### Step 4: Test (2 min)

1. Go to: `https://your-vercel-url.vercel.app/chat`
2. Click "Connect"
3. Say: "Hello, can you hear me?"
4. Verify voice chat works!

---

## 🎯 Quick Commands

```bash
# View local environment variables
cat .env

# View edge bridge environment variables
cat edge-bridge/.env

# Test local build
npm run build

# Push changes to GitHub
git add .
git commit -m "Your message"
git push origin main
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads: `https://your-vercel-url.vercel.app`
- [ ] Railway health check: `https://your-railway-url.up.railway.app/health`
- [ ] Voice chat page: `https://your-vercel-url.vercel.app/chat`
- [ ] Microphone permission granted
- [ ] Speech transcription works
- [ ] AI responds with audio
- [ ] Response time is fast (<1 second)

---

## 🆘 Need Help?

See **DEPLOYMENT_GUIDE.md** for detailed instructions and troubleshooting.

Quick reference: **QUICK_DEPLOY.md**

---

⚠️ **IMPORTANT**: This file contains your API keys. Keep it secure and do NOT commit it to GitHub!
