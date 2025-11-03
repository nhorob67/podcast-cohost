# Step 3: Connect Services - Exact Commands

After you deploy to Railway and get your domain, follow these exact steps:

---

## 1. Get Your Railway Domain

From Railway Dashboard:
- Go to your project
- Click on your service
- Go to Settings > Networking
- Copy the domain (e.g., `podcast-cohost-production.up.railway.app`)

---

## 2. Update Frontend Code

### Option A: Edit Locally (Recommended)

If you're working in the project directory:

```bash
# Navigate to project directory
cd /tmp/cc-agent/59548556/project

# Edit the file (use your preferred editor)
# Replace YOUR_RAILWAY_DOMAIN with your actual Railway domain
nano src/pages/VoiceChatWebRTC.tsx

# Or use vi
vi src/pages/VoiceChatWebRTC.tsx

# Or use any text editor you prefer
```

**Find this line** (around line 20):
```typescript
const EDGE_BRIDGE_URL = 'ws://localhost:3001/webrtc';
```

**Replace with** (use YOUR actual Railway domain):
```typescript
const EDGE_BRIDGE_URL = 'wss://your-actual-railway-domain.up.railway.app/webrtc';
```

**Example** (if your Railway domain is `podcast-cohost-prod.up.railway.app`):
```typescript
const EDGE_BRIDGE_URL = 'wss://podcast-cohost-prod.up.railway.app/webrtc';
```

Save the file.

---

### Option B: Edit on GitHub

1. Go to: https://github.com/nhorob67/podcast-cohost
2. Navigate to: `src/pages/VoiceChatWebRTC.tsx`
3. Click the pencil icon (Edit this file)
4. Find line ~20 and update the URL
5. Commit changes directly to main branch

---

## 3. Commit and Push Changes

If you edited locally, run these commands:

```bash
# Make sure you're in the project directory
cd /tmp/cc-agent/59548556/project

# Add the changed file
git add src/pages/VoiceChatWebRTC.tsx

# Commit with a descriptive message
git commit -m "Connect frontend to Railway WebSocket endpoint"

# Push to GitHub
git push origin main
```

---

## 4. Wait for Vercel to Redeploy

- Vercel automatically detects the push
- Build takes 2-3 minutes
- Check Vercel dashboard for deployment status
- Once complete, your app is fully connected!

---

## 5. Test Your Deployment

```bash
# Test Railway health endpoint (replace with YOUR domain)
curl https://your-railway-domain.up.railway.app/health

# Should return: {"status":"ok"}
```

Then open your browser:
- Go to: `https://your-vercel-app.vercel.app/chat`
- Click "Connect"
- Test voice chat!

---

## Complete Command Summary

Here's everything in one block (update the Railway domain):

```bash
# 1. Navigate to project
cd /tmp/cc-agent/59548556/project

# 2. Edit the file (replace YOUR_DOMAIN with actual Railway domain)
# Manual step: Edit src/pages/VoiceChatWebRTC.tsx
# Change: 'ws://localhost:3001/webrtc'
# To: 'wss://YOUR_DOMAIN.up.railway.app/webrtc'

# 3. Commit and push
git add src/pages/VoiceChatWebRTC.tsx
git commit -m "Connect to Railway WebSocket"
git push origin main

# 4. Test Railway health
curl https://YOUR_DOMAIN.up.railway.app/health

# 5. Open in browser
# Visit: https://your-vercel-app.vercel.app/chat
```

---

## Example with Real Values

If your Railway domain is: `podcast-cohost-prod.up.railway.app`

```bash
# Edit src/pages/VoiceChatWebRTC.tsx
# Change line 20 to:
const EDGE_BRIDGE_URL = 'wss://podcast-cohost-prod.up.railway.app/webrtc';

# Commit and push
git add src/pages/VoiceChatWebRTC.tsx
git commit -m "Connect to Railway WebSocket"
git push origin main

# Test
curl https://podcast-cohost-prod.up.railway.app/health
```

---

## Troubleshooting

**If push fails:**
```bash
# Make sure you're on the main branch
git branch

# If not, switch to main
git checkout main

# Try pulling first
git pull origin main

# Then push again
git push origin main
```

**If you don't have the token anymore:**
```bash
# The repository is already set up, so normal push should work
git push origin main

# If it asks for credentials, you may need to set up SSH or a new token
```

**If you want to check the current URL:**
```bash
# View the current file
cat src/pages/VoiceChatWebRTC.tsx | grep EDGE_BRIDGE_URL
```

---

## Quick Check Before Pushing

```bash
# Make sure the file looks correct
cat src/pages/VoiceChatWebRTC.tsx | head -25

# Look for the EDGE_BRIDGE_URL line
# Should show: const EDGE_BRIDGE_URL = 'wss://your-domain...'
```

---

**That's it! Once you push, Vercel will redeploy and your app will be fully connected.** 🚀
