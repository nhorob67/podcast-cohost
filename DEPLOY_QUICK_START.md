# Quick Start: Deploy to Web in 5 Minutes

This guide will get your Elias Voice AI application live on the web in under 5 minutes.

## Prerequisites

- GitHub account
- Vercel or Netlify account (free tier works!)
- Your Supabase credentials (already configured)

## Step 1: Push to GitHub (2 minutes)

```bash
git init
git add .
git commit -m "Deploy Elias Voice AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/elias-voice-ai.git
git push -u origin main
```

## Step 2: Deploy to Vercel (2 minutes)

### Option A: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your GitHub repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`: `https://tnftqhxaadryeqfsrnuk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (your anon key from .env file)
5. Click "Deploy"
6. Wait 30 seconds...
7. ✅ **Your app is live!**

### Option B: Using Vercel CLI

```bash
npm i -g vercel
vercel

Follow the prompts to deploy
```

## Step 3: Access Your App (1 minute)

Your app will be live at a URL like:
```
https://elias-voice-ai-xxxxx.vercel.app
```

Features that work immediately:
- ✅ Dashboard with conversation history
- ✅ Report uploads and management
- ✅ Personality configuration
- ✅ Settings management
- ✅ All data stored in Supabase

## What's Deployed?

### Frontend
- React application hosted on Vercel/Netlify
- Globally distributed via CDN
- Automatic HTTPS
- Instant page loads

### Backend
- Supabase Edge Functions (already deployed):
  - `/functions/v1/conversations` - Chat history
  - `/functions/v1/reports` - Document uploads
  - `/functions/v1/personality` - AI settings
  - `/functions/v1/settings` - System config
  - `/functions/v1/health` - Health check

### Database
- PostgreSQL with pgvector
- Row Level Security enabled
- Automatic backups

## Testing Your Deployment

1. Visit your live URL
2. You should see the dashboard
3. Try uploading a report
4. Check conversation history
5. Modify personality settings

All features work exactly like running locally!

## Updating Your Deployment

Made changes? Just push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push
```

Vercel/Netlify automatically redeploys! 🎉

## Adding a Custom Domain

### In Vercel:
1. Project Settings → Domains
2. Add your domain
3. Configure DNS records

### In Netlify:
1. Domain Settings → Add custom domain
2. Follow DNS instructions

## Cost

**Free Tier Includes:**
- Vercel: Unlimited personal projects
- Supabase: 500MB database, 1GB storage
- **Total: $0/month** ✨

## Need Voice Chat?

For real-time WebRTC voice functionality, you'll also need to deploy the edge bridge:

```bash
cd edge-bridge
# Deploy to Railway, Render, or similar
# See DEPLOYMENT.md for details
```

But the main application works perfectly without it!

## Troubleshooting

**Build failing?**
- Check `npm run build` runs locally first

**Can't access app?**
- Verify environment variables are set
- Check browser console for errors

**API errors?**
- Verify Supabase credentials
- Check Edge Functions are deployed

## Next Steps

1. ✅ Share your live URL
2. ✅ Add a custom domain
3. ✅ Enable monitoring
4. ✅ Configure analytics

---

**That's it! Your AI voice assistant is now accessible from anywhere in the world.** 🌍

For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md)
