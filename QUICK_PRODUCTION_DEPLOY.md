# Quick Production Deployment (5 Minutes)

## TL;DR

Your app is **Redis-free** and ready to deploy. Just 3 services needed:

1. **Frontend**: Static React app (Vercel/Netlify)
2. **Edge Bridge**: Node.js WebSocket server (Railway/Render)
3. **Database**: Supabase (already configured)

No Redis required! ✅

## Required API Keys

Get these first:

- [ ] AssemblyAI: https://www.assemblyai.com/dashboard/signup
- [ ] Cartesia: https://cartesia.ai (get API key + Voice ID)
- [ ] OpenAI: Already have ✓
- [ ] Supabase: Already configured ✓

## Deploy in 3 Commands

### 1. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from project root)
vercel --prod

# When prompted, set environment variables:
# VITE_SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Deploy Edge Bridge to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd edge-bridge
railway init
railway up

# Add environment variables in Railway dashboard:
# OPENAI_API_KEY=sk-...
# ASSEMBLYAI_API_KEY=...
# CARTESIA_API_KEY=...
# CARTESIA_VOICE_ID=...
# SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
# SUPABASE_KEY=your_anon_key
# EDGE_BRIDGE_PORT=3001
```

### 3. Update Frontend Connection

Get your Railway WebSocket URL:
```bash
railway domain
# Example output: your-app.up.railway.app
```

Update `src/pages/VoiceChatWebRTC.tsx`:
```typescript
const EDGE_BRIDGE_URL = 'wss://your-app.up.railway.app/webrtc';
```

Redeploy frontend:
```bash
vercel --prod
```

## Test Production

1. Visit your Vercel URL
2. Navigate to `/chat`
3. Click "Talk"
4. Say "Hello"
5. ✅ Should respond in < 300ms

## Environment Variables Cheatsheet

### Frontend (2 variables)
```env
VITE_SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

### Edge Bridge (6 variables)
```env
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=<assemblyai_key>
CARTESIA_API_KEY=<cartesia_key>
CARTESIA_VOICE_ID=<voice_id>
SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
SUPABASE_KEY=<your_anon_key>
EDGE_BRIDGE_PORT=3001
```

**Note**: No `REDIS_URL` needed! ✅

## Troubleshooting

### Frontend shows blank page
```bash
# Check build
npm run build

# Check environment variables in Vercel dashboard
vercel env ls
```

### Edge bridge won't start
```bash
# Check logs
railway logs

# Verify all 6 environment variables are set
railway variables
```

### No audio playback
- Check Cartesia API key is valid
- Verify Voice ID format (UUID with dashes)
- Test edge bridge health: `curl https://your-app.up.railway.app/health`

## Cost (First Month)

- Vercel: Free
- Railway: $5 free credit (enough for ~1 month)
- Supabase: Free tier
- AssemblyAI: 3 hours free
- Cartesia: Free trial credits

**Total: $0** (with free tiers)

## Alternative: Netlify + Render

Prefer Netlify and Render? Use these instead:

**Frontend (Netlify)**:
```bash
# Connect GitHub repo
# Build: npm run build
# Publish: dist
# Add same 2 environment variables
```

**Edge Bridge (Render)**:
```bash
# Create Web Service
# Root Directory: edge-bridge
# Build: npm install
# Start: npm start
# Add same 6 environment variables
```

## What's Different From Other Guides?

This deployment is **Redis-free**:
- ❌ No Redis to configure
- ❌ No Redis URL needed
- ❌ No Redis hosting costs
- ✅ In-memory caching (same performance)
- ✅ Simpler deployment
- ✅ Lower costs

See `NO_REDIS_DEPLOYMENT.md` for technical details.

## Full Documentation

For detailed instructions:
- Production checklist: `PRODUCTION_CHECKLIST.md`
- Redis removal details: `REDIS_REMOVAL_SUMMARY.md`
- No-Redis deployment: `NO_REDIS_DEPLOYMENT.md`

## Need Help?

Common issues and solutions:

1. **"ASSEMBLYAI_API_KEY not found"**
   - Add to Railway environment variables
   - Restart service

2. **"Cannot connect to edge bridge"**
   - Check Railway URL is correct
   - Verify WebSocket URL starts with `wss://`
   - Check CORS settings

3. **"High latency detected"**
   - Normal for first request (cold start)
   - Should be < 300ms after warmup
   - Check database query performance

## Success Indicators

You know it's working when:

✅ Frontend loads without errors
✅ Health check returns `{"status":"healthy"}`
✅ Voice transcribes accurately
✅ Audio plays within 300ms
✅ No console errors

## Next Steps

1. Test with multiple users
2. Monitor latency metrics
3. Set up custom domain (optional)
4. Enable monitoring (UptimeRobot)
5. Configure backups (Supabase)

---

**That's it! Your near-live podcast co-host is now in production.** 🎉

Questions? Check the full production checklist.
