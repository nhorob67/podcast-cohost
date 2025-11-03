# Deployment Guide - Elias Voice AI Web Application

This guide explains how to deploy Elias as a fully hosted web application accessible from anywhere.

## Architecture Overview

The deployed application consists of:

1. **Frontend (React/Vite)** - Static site hosted on Vercel/Netlify
2. **Backend (Supabase Edge Functions)** - Serverless functions for API endpoints
3. **Database (Supabase)** - PostgreSQL with pgvector for data persistence
4. **Edge Bridge (Node.js)** - WebRTC media handling service (requires separate hosting)

## Quick Deploy (Recommended)

### Option 1: Deploy Frontend to Vercel

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Add environment variables:
     - `VITE_SUPABASE_URL` = Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - Click "Deploy"

3. **Access your app**:
   - Your app will be live at `https://your-app.vercel.app`

### Option 2: Deploy Frontend to Netlify

1. **Push your code to GitHub** (same as above)

2. **Deploy to Netlify**:
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL` = Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - Click "Deploy site"

3. **Access your app**:
   - Your app will be live at `https://your-app.netlify.app`

## Backend (Supabase Edge Functions)

The backend is already deployed! The following Edge Functions have been created:

- **conversations** - Manage conversation history
- **reports** - Handle report uploads and retrieval
- **personality** - Manage AI personality settings
- **settings** - System configuration

These are accessible at:
```
https://tnftqhxaadryeqfsrnuk.supabase.co/functions/v1/<function-name>
```

## Database Setup

Your Supabase database is already configured with:

- ✅ Conversations table
- ✅ Messages table
- ✅ Reports table
- ✅ Personalities table
- ✅ pgvector extension for embeddings
- ✅ Row Level Security policies

No additional database setup required!

## Edge Bridge Deployment (Optional for WebRTC)

If you need real-time voice functionality, deploy the edge bridge:

### Deploy to Railway.app

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and initialize**:
   ```bash
   railway login
   cd edge-bridge
   railway init
   ```

3. **Add environment variables**:
   ```bash
   railway variables set OPENAI_API_KEY=<your-key>
   railway variables set ASSEMBLYAI_API_KEY=<your-key>
   railway variables set CARTESIA_API_KEY=<your-key>
   railway variables set CARTESIA_VOICE_ID=<your-voice-id>
   railway variables set REDIS_URL=<redis-url>
   railway variables set SUPABASE_URL=<supabase-url>
   railway variables set SUPABASE_KEY=<supabase-anon-key>
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Get your deployment URL**:
   ```bash
   railway domain
   ```

### Deploy to Render.com

1. Go to https://render.com
2. Create new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Root Directory: `edge-bridge`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables (same as above)
6. Click "Create Web Service"

## Environment Variables

### Frontend (.env.production)
```bash
VITE_SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Edge Bridge
```bash
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=...
CARTESIA_API_KEY=...
CARTESIA_VOICE_ID=...
REDIS_URL=redis://...
SUPABASE_URL=https://tnftqhxaadryeqfsrnuk.supabase.co
SUPABASE_KEY=your_anon_key_here
EDGE_BRIDGE_PORT=3001
```

## Custom Domain Setup

### For Vercel:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### For Netlify:
1. Go to "Domain settings"
2. Click "Add custom domain"
3. Follow DNS configuration instructions

## SSL/HTTPS

Both Vercel and Netlify provide automatic SSL certificates. Your app will be served over HTTPS by default.

## Testing Your Deployment

1. **Visit your deployed URL**
2. **Check the dashboard loads**
3. **Test conversation history**
4. **Upload a test report**
5. **Verify personality settings**

## Monitoring and Logs

### Vercel:
- View deployment logs in the Vercel dashboard
- Real-time function logs available

### Netlify:
- Check deploy logs in Netlify dashboard
- Function logs under "Functions" tab

### Supabase:
- View Edge Function logs in Supabase dashboard
- Monitor database performance

## Troubleshooting

### Frontend won't load
- Check environment variables are set correctly
- Verify build completed successfully
- Check browser console for errors

### API calls failing
- Verify Supabase Edge Functions are deployed
- Check CORS headers are correct
- Verify API keys in function environment

### Database errors
- Check Row Level Security policies
- Verify database migrations ran successfully
- Check connection strings

## Cost Estimate

### Free Tier (Sufficient for Development):
- **Vercel/Netlify**: Free for personal projects
- **Supabase**: Free tier includes:
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth
  - Edge Functions included
- **Total**: $0/month

### Production Scale:
- **Vercel Pro**: $20/month (unlimited bandwidth)
- **Supabase Pro**: $25/month (8GB database, 100GB bandwidth)
- **Railway/Render**: $5-20/month (for edge bridge if needed)
- **Total**: ~$50-65/month

## Performance

Expected performance with this architecture:

- **Page Load**: <2 seconds globally
- **API Response**: <300ms average
- **Database Queries**: <50ms average
- **Edge Functions**: <100ms cold start, <10ms warm

## Security Considerations

✅ All API calls use authentication headers
✅ Row Level Security enabled on all tables
✅ CORS properly configured
✅ Environment variables secured
✅ HTTPS enforced
✅ API keys never exposed to client

## Next Steps

After deployment:

1. **Set up monitoring**: Configure uptime monitoring with UptimeRobot or Pingdom
2. **Configure backups**: Enable automated database backups in Supabase
3. **Add analytics**: Integrate Google Analytics or Plausible
4. **Custom domain**: Point your domain to the deployment
5. **Error tracking**: Add Sentry or similar for error monitoring

## Support

For deployment issues:
- Check deployment logs first
- Verify all environment variables
- Test API endpoints directly
- Review browser console for client errors

## Updating Your Deployment

### For code changes:
```bash
git add .
git commit -m "Update feature X"
git push origin main
```

Vercel/Netlify will automatically redeploy!

### For Edge Functions:
Use the Supabase CLI or dashboard to update functions.

---

**Your app is now production-ready and accessible worldwide!** 🚀
