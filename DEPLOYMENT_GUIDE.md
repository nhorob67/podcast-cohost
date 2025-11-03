# Complete Deployment Guide

## ✅ Completed Steps

- [x] All API keys configured
- [x] Git repository initialized
- [x] Code pushed to GitHub: **https://github.com/nhorob67/podcast-cohost**
- [x] Railway configuration files created
- [x] Vercel account set up
- [x] Railway account set up

---

## 🚀 Next Steps: Deploy to Production

### Step 1: Deploy Frontend to Vercel (5 minutes)

You already have Vercel set up. Now deploy the frontend:

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/new

2. **Import Git Repository**:
   - Click "Import Project"
   - Select "Import Git Repository"
   - Choose: `nhorob67/podcast-cohost`
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

4. **Add Environment Variables**:
   Click "Environment Variables" and add these **2 variables**:

   ```
   VITE_SUPABASE_URL
   https://tnftqhxaadryeqfsrnuk.supabase.co

   VITE_SUPABASE_ANON_KEY
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuZnRxaHhhYWRyeWVxZnNybnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NjUyODEsImV4cCI6MjA3NzU0MTI4MX0.uPU8GCd9_WbJ2HO-X2Qz5BBCD5NQ6mD5t4G-QhTb-PM
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Copy your deployment URL (e.g., `https://podcast-cohost.vercel.app`)

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy
vercel --prod

# When prompted, answer:
# Set up and deploy? Y
# Which scope? (your account)
# Link to existing project? N
# Project name? podcast-cohost
# Directory? ./
# Override settings? N

# Add environment variables when prompted:
# VITE_SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

### Step 2: Deploy Edge Bridge to Railway (10 minutes)

#### Option A: Via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**: https://railway.app/new

2. **Deploy from GitHub Repo**:
   - Click "Deploy from GitHub repo"
   - Select: `nhorob67/podcast-cohost`
   - Click "Deploy Now"

3. **Configure Service**:
   - Railway will auto-detect Node.js
   - Wait for initial deployment to complete

4. **Add Environment Variables**:

   In Railway Dashboard, go to your project > Variables tab, and add these **7 variables**:

   ```
   OPENAI_API_KEY
   (use your OpenAI key)

   SUPABASE_URL
   https://tnftqhxaadryeqfsrnuk.supabase.co

   SUPABASE_KEY
   (use your Supabase anon key)

   ASSEMBLYAI_API_KEY
   (use your AssemblyAI key)

   CARTESIA_API_KEY
   (use your Cartesia key)

   CARTESIA_VOICE_ID
   (use your Cartesia voice ID)

   PORT
   3001
   ```

   **IMPORTANT**: Do NOT include the actual keys in this public repository. Copy them from your local `.env` file.

5. **Configure Build & Start Commands**:

   In Railway Dashboard, go to Settings:
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: Leave empty (Railway auto-detects)
   - **Start Command**: `cd edge-bridge && npm start`

6. **Generate Public Domain**:
   - Go to Settings > Networking
   - Click "Generate Domain"
   - Copy the domain (e.g., `your-app.up.railway.app`)

7. **Verify Deployment**:
   - Check the URL: `https://your-app.up.railway.app/health`
   - Should return: `{"status":"ok"}`

#### Option B: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project (in project root)
cd /path/to/podcast-cohost
railway init

# Set environment variables
railway variables set OPENAI_API_KEY="your-key"
railway variables set SUPABASE_URL="https://tnftqhxaadryeqfsrnuk.supabase.co"
railway variables set SUPABASE_KEY="your-key"
railway variables set ASSEMBLYAI_API_KEY="your-key"
railway variables set CARTESIA_API_KEY="your-key"
railway variables set CARTESIA_VOICE_ID="your-voice-id"
railway variables set PORT="3001"

# Deploy
railway up

# Get your domain
railway domain
```

---

### Step 3: Connect Frontend to Edge Bridge (5 minutes)

After Railway deployment, you need to update the frontend with the Railway WebSocket URL.

1. **Get Railway Domain**:
   - From Railway Dashboard > Settings > Networking
   - Copy the domain (e.g., `podcast-cohost.up.railway.app`)

2. **Update Frontend Code**:

   Edit `src/pages/VoiceChatWebRTC.tsx`:

   Find this line (around line 20):
   ```typescript
   const EDGE_BRIDGE_URL = 'ws://localhost:3001/webrtc';
   ```

   Replace with your Railway domain (use `wss://` for secure WebSocket):
   ```typescript
   const EDGE_BRIDGE_URL = 'wss://your-app.up.railway.app/webrtc';
   ```

3. **Commit and Push**:
   ```bash
   git add src/pages/VoiceChatWebRTC.tsx
   git commit -m "Update WebSocket URL for Railway deployment"
   git push origin main
   ```

4. **Vercel Auto-Deploys**:
   - Vercel automatically detects the push
   - Rebuilds and redeploys (takes 2-3 minutes)
   - Your app is now fully connected!

---

### Step 4: Test Your Deployment (5 minutes)

1. **Open Your App**:
   - Go to your Vercel URL: `https://your-app.vercel.app`

2. **Navigate to Voice Chat**:
   - Click on "Voice Chat" in navigation
   - Or go directly to: `https://your-app.vercel.app/chat`

3. **Test Voice Chat**:
   - Click "Connect" button
   - Allow microphone access when prompted
   - Say: "Hello, can you hear me?"
   - Verify:
     - ✅ Your speech is transcribed
     - ✅ AI responds with text
     - ✅ Audio plays back
     - ✅ Response time is fast (<1 second)

4. **Check Health Endpoints**:
   - Railway: `https://your-app.up.railway.app/health`
   - Should return: `{"status":"ok"}`

---

## 🎉 You're Live!

Your near-live podcast co-host is now running in production!

### Your Deployed URLs:

- **Frontend**: `https://your-app.vercel.app`
- **Voice Chat**: `https://your-app.vercel.app/chat`
- **Edge Bridge**: `https://your-app.up.railway.app`
- **GitHub Repo**: https://github.com/nhorob67/podcast-cohost

---

## 📊 Monitoring & Maintenance

### Vercel Monitoring:
- Go to: https://vercel.com/dashboard
- Check deployment logs
- View analytics and performance

### Railway Monitoring:
- Go to: https://railway.app/dashboard
- Check service logs
- Monitor CPU/Memory usage
- View request metrics

### Common Issues:

**Issue**: WebSocket connection fails
- **Solution**: Verify Railway domain is correct in `VoiceChatWebRTC.tsx`
- Check Railway logs for errors
- Ensure all 7 environment variables are set in Railway

**Issue**: No audio playback
- **Solution**: Check browser console for errors
- Verify Cartesia API key is correct in Railway
- Test Cartesia API directly

**Issue**: Speech not transcribed
- **Solution**: Verify AssemblyAI API key in Railway
- Check microphone permissions in browser
- Review Railway logs for STT errors

**Issue**: Build fails on Vercel
- **Solution**: Check build logs in Vercel dashboard
- Verify environment variables are set
- Ensure `npm run build` works locally

---

## 💰 Cost Monitoring

### Free Tier Limits:
- **Vercel**: Unlimited for personal projects
- **Railway**: $5 free credit (~1-2 weeks of usage)
- **AssemblyAI**: 3 hours free transcription
- **Cartesia**: Free trial credits

### After Free Tier:
- **Vercel**: Still free for personal projects
- **Railway**: ~$5-10/month
- **API Usage**: ~$10-20/month (varies by usage)
- **Total**: ~$15-30/month

### Tips to Reduce Costs:
1. Use Railway's sleep feature for non-critical times
2. Monitor API usage in respective dashboards
3. Set up billing alerts
4. Consider upgrading to AssemblyAI paid tier for better rates

---

## 🔐 Security Checklist

- [x] API keys not committed to GitHub (in `.gitignore`)
- [x] Environment variables set in Railway/Vercel (not in code)
- [x] HTTPS enabled on all endpoints (automatic)
- [x] WebSocket uses WSS (secure)
- [x] Supabase RLS policies enabled
- [x] No secrets exposed in frontend code

---

## 🚀 Future Enhancements

Consider these improvements:
1. Add user authentication (Supabase Auth)
2. Implement conversation history
3. Add voice customization UI
4. Create admin dashboard
5. Set up custom domain
6. Add analytics tracking
7. Implement rate limiting
8. Add error monitoring (e.g., Sentry)

---

## 📚 Additional Resources

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Repo**: https://github.com/nhorob67/podcast-cohost

---

## 🆘 Need Help?

If you encounter issues:
1. Check the logs in Vercel/Railway dashboards
2. Review the troubleshooting section above
3. Verify all environment variables are set correctly
4. Test each component individually (frontend, edge bridge, APIs)

---

**Congratulations! Your podcast co-host is live! 🎙️✨**
