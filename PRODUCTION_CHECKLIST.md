# Production Deployment Checklist

## Prerequisites

Before deploying, ensure you have:

- [ ] AssemblyAI API key from https://www.assemblyai.com
- [ ] Cartesia API key and Voice ID from https://cartesia.ai
- [ ] OpenAI API key (already have)
- [ ] Supabase project configured (already configured)

## Step 1: Get API Keys

### AssemblyAI
1. Sign up at https://www.assemblyai.com/dashboard/signup
2. Navigate to dashboard
3. Copy API key
4. Save for Step 3

### Cartesia
1. Sign up at https://cartesia.ai
2. Get API key from dashboard
3. Navigate to "Voices" section
4. Create or clone a voice
5. Copy Voice ID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
6. Save both key and Voice ID for Step 3

## Step 2: Choose Hosting Platform

### Option A: Railway (Recommended)
- Best for: Quick deployment with managed services
- Cost: ~$5-10/month
- Setup time: 10 minutes

### Option B: Render
- Best for: Mature platform with great monitoring
- Cost: ~$7-15/month
- Setup time: 15 minutes

### Option C: Vercel/Netlify + Railway Edge Bridge
- Best for: Separate frontend and backend hosting
- Cost: Frontend free, Edge bridge ~$5-10/month
- Setup time: 20 minutes

## Step 3: Configure Environment Variables

### Frontend (Vercel/Netlify)
```bash
VITE_SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Edge Bridge (Railway/Render/VPS)
```bash
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=your_assemblyai_key
CARTESIA_API_KEY=your_cartesia_key
CARTESIA_VOICE_ID=your_voice_id
SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
SUPABASE_KEY=your_supabase_anon_key
EDGE_BRIDGE_PORT=3001
```

**Note**: Redis is NOT required! ✅

## Step 4: Deploy Frontend

### To Vercel:
```bash
git init
git add .
git commit -m "Production deployment"
git push origin main
```

Then in Vercel dashboard:
1. Import GitHub repository
2. Add environment variables (Step 3)
3. Click "Deploy"

### To Netlify:
```bash
# Same git commands as above
```

Then in Netlify dashboard:
1. "Add new site" → "Import an existing project"
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables (Step 3)
5. Click "Deploy site"

## Step 5: Deploy Edge Bridge

### To Railway:

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   railway login
   cd edge-bridge
   railway init
   railway up
   ```

3. **Add environment variables** in Railway dashboard

4. **Get deployment URL**:
   ```bash
   railway domain
   ```

### To Render:

1. Go to https://render.com
2. "New" → "Web Service"
3. Connect GitHub repository
4. Settings:
   - Root Directory: `edge-bridge`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables from Step 3
6. Click "Create Web Service"

## Step 6: Update Frontend Configuration

Once edge bridge is deployed, update the WebRTC connection URL in your frontend:

**File**: `src/pages/VoiceChatWebRTC.tsx`

Find and update:
```typescript
const EDGE_BRIDGE_URL = 'wss://your-edge-bridge-url.railway.app/webrtc';
```

Replace with your actual edge bridge WebSocket URL.

## Step 7: Test Production Deployment

1. **Visit your deployed URL**
2. **Navigate to voice chat page**
3. **Click "Talk" button**
4. **Say "Hello, can you hear me?"**
5. **Verify**:
   - ✅ Transcription appears
   - ✅ Audio response plays
   - ✅ Latency under 300ms
   - ✅ No console errors

## Step 8: Monitor Performance

### Check Latency Metrics

Connect to your Supabase database and run:

```sql
SELECT
  AVG(total_latency_ms) as avg_latency,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY total_latency_ms) as p95_latency,
  COUNT(*) as request_count
FROM latency_telemetry
WHERE created_at > now() - interval '1 hour';
```

**Target Metrics**:
- Average: < 300ms
- P95: < 320ms
- Request count: > 0

### Monitor Edge Bridge Logs

**Railway**:
```bash
railway logs
```

**Render**:
View logs in dashboard under "Logs" tab

**Look for**:
- ✅ "Edge Bridge running on port 3001"
- ✅ "RAG adapter initialized (in-memory caching)"
- ✅ "AssemblyAI connection opened"
- ⚠️ No error messages

## Step 9: Security Hardening

### Restrict Database Access

Update Supabase RLS policies for production:

```sql
-- Replace permissive development policies with production policies
-- Example: Restrict to authenticated users only

DROP POLICY IF EXISTS "Allow all operations on document_chunks" ON document_chunks;

CREATE POLICY "Authenticated users can view document_chunks"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (true);
```

### Enable CORS for Your Domain

Update edge bridge CORS settings:

**File**: `edge-bridge/src/server.js`

```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.vercel.app'],
  credentials: true
}));
```

### Rotate API Keys

After successful deployment:
- [ ] Store all API keys in secure vault (1Password, etc.)
- [ ] Remove API keys from local `.env` files
- [ ] Add `.env` to `.gitignore` (if not already)

## Step 10: Set Up Monitoring

### Uptime Monitoring

Set up with UptimeRobot or similar:
- Monitor frontend URL
- Monitor edge bridge `/health` endpoint
- Alert on downtime

### Error Tracking

Optional but recommended:
- Add Sentry for frontend error tracking
- Monitor edge bridge logs for errors
- Set up alerts for high latency

## Cost Breakdown

### Development/Testing (Free):
- Frontend: Vercel/Netlify free tier
- Edge Bridge: Railway free trial ($5 credit)
- Supabase: Free tier (500MB DB, 2GB bandwidth)
- AssemblyAI: Free tier (3 hours/month)
- Cartesia: Free trial credits
- **Total**: $0/month

### Production (Paid):
- Frontend: Vercel Pro $20/month or Netlify Pro $19/month
- Edge Bridge: Railway $7-15/month or Render $7/month
- Supabase Pro: $25/month (8GB DB, 100GB bandwidth)
- AssemblyAI: $0.00025/second (~$15/month for 1,000 minutes)
- Cartesia: Pay-as-you-go pricing
- **Total**: ~$75-100/month for production scale

## Troubleshooting

### Frontend won't deploy
- Check build logs for errors
- Verify environment variables are set
- Ensure `npm run build` works locally

### Edge bridge won't start
- Check all 6 environment variables are set
- Verify API keys are valid
- Check logs for specific error messages

### No audio playback
- Verify Cartesia API key and Voice ID
- Check browser console for errors
- Test edge bridge `/health` endpoint

### High latency
- Check database query performance
- Monitor edge bridge logs for warnings
- Verify hosting region is close to users

## Success Criteria

Your deployment is successful when:

✅ Frontend loads without errors
✅ Edge bridge health check returns `{"status":"healthy"}`
✅ Voice chat transcribes speech accurately
✅ Audio responses play within 300ms
✅ No errors in browser console
✅ No errors in edge bridge logs
✅ Database latency metrics show < 300ms average

## Next Steps After Deployment

1. **Test thoroughly** with multiple users
2. **Monitor metrics** for first 24 hours
3. **Optimize** based on real usage patterns
4. **Document** any custom configurations
5. **Set up backups** for Supabase database
6. **Configure custom domain** (optional)
7. **Add analytics** to track usage (optional)

---

**Congratulations! Your near-live podcast co-host is now in production!** 🎉
