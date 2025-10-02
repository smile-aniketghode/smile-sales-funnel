# Railway CLI Deployment Guide (Monorepo - Best Approach)

## Why Railway CLI?

For monorepos, the CLI is **much simpler** than the web UI. It automatically detects multiple services and handles configuration better.

---

## Step 1: Install Railway CLI (1 minute)

```bash
# Install Railway CLI
curl -fsSL https://railway.com/install.sh | sh

# Or using npm
npm install -g @railway/cli

# Or using Homebrew (macOS)
brew install railway
```

---

## Step 2: Login to Railway (1 minute)

```bash
railway login
```

This will open your browser for authentication.

---

## Step 3: Initialize Project (2 minutes)

```bash
# Navigate to your project root
cd "/Users/aniketghode/development/SMILe Sales Funnel"

# Create new Railway project
railway init

# This will:
# - Create a new project in Railway
# - Link your local directory to Railway
# - Detect all services (ui, api, worker)
```

---

## Step 4: Link to Existing Project (if you already created one)

If you already created a project in Railway web UI:

```bash
railway link
# Select your project from the list
```

Or use the project ID from your screenshot:

```bash
railway link -p 91b50dbd-e508-4145-8cc6-a1fc750e863a
```

---

## Step 5: Create Services Manually

Railway doesn't auto-detect services from monorepo. You must **manually create each service**:

```bash
# Create worker service from worker/ directory
cd worker
railway up

# This will prompt you to create a new service
# Name it: worker

# Go back to root and create API service
cd ../api
railway up
# Name it: api

# Create UI service
cd ../ui
railway up
# Name it: ui

# Verify all services created
cd ..
railway status
```

Now you should see all 3 services!

---

## Step 6: Set Environment Variables

### For Worker Service:

```bash
# Switch to worker service
railway service worker

# Set environment variables
railway variables set LLM_PROVIDER=openrouter
railway variables set OPENROUTER_API_KEY=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
railway variables set OPENROUTER_MODEL="mistralai/mistral-small-3.2-24b-instruct:free"

railway variables set AWS_REGION=us-east-1
railway variables set AWS_ACCESS_KEY_ID=<YOUR_AWS_KEY>
railway variables set AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET>

railway variables set GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
railway variables set GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
railway variables set GOOGLE_REDIRECT_URI=https://<worker-url>/auth/gmail/callback
```

### For API Service:

```bash
# Switch to api service
railway service api

# Set environment variables
railway variables set AWS_REGION=us-east-1
railway variables set AWS_ACCESS_KEY_ID=<YOUR_AWS_KEY>
railway variables set AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET>
```

### For UI Service:

```bash
# Switch to ui service
railway service ui

# Set environment variables (will be updated after other services deploy)
railway variables set VITE_API_BASE_URL=https://<api-url>
railway variables set VITE_WORKER_BASE_URL=https://<worker-url>
```

---

## Step 7: Deploy All Services

```bash
# Deploy everything
railway up

# Or deploy specific service
railway up --service worker
railway up --service api
railway up --service ui
```

Railway will:
- Build each service
- Deploy to production
- Assign public URLs

---

## Step 8: Get Service URLs

```bash
# Get URLs for all services
railway domain

# Or for specific service
railway service worker
railway domain
```

Update the UI environment variables with the actual URLs:

```bash
railway service ui
railway variables set VITE_API_BASE_URL=https://api-production-xxxx.up.railway.app
railway variables set VITE_WORKER_BASE_URL=https://worker-production-xxxx.up.railway.app

# Redeploy UI with updated URLs
railway up
```

---

## Step 9: Create AWS DynamoDB Tables

Run locally with AWS credentials:

```bash
cd infra
AWS_REGION=us-east-1 node create-tables.js
```

Tables to create:
- `smile-tasks-prod`
- `smile-deals-prod`
- `smile-email-logs-prod`
- `smile-people-prod`
- `smile-companies-prod`

---

## Step 10: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Add OAuth redirect URI:
   ```
   https://worker-production-xxxx.up.railway.app/auth/gmail/callback
   ```

3. Update worker environment:
   ```bash
   railway service worker
   railway variables set GOOGLE_REDIRECT_URI=https://worker-production-xxxx.up.railway.app/auth/gmail/callback
   railway up
   ```

---

## Useful Railway CLI Commands

```bash
# View logs
railway logs

# View logs for specific service
railway logs --service worker

# Check service status
railway status

# Open project in browser
railway open

# SSH into service (for debugging)
railway shell

# List all environment variables
railway variables

# Deploy specific service
railway up --service api

# Rollback deployment
railway rollback
```

---

## Monitoring

```bash
# View live logs
railway logs --tail

# Check build status
railway status

# View resource usage
railway metrics
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs
railway logs --service worker

# Check environment variables
railway variables

# Restart service
railway restart --service worker
```

### Build failed
```bash
# Check build logs
railway logs --service api --build

# Try manual build
cd api
npm install
npm run build
```

### Environment variables not updating
```bash
# Redeploy after setting variables
railway up --service worker
```

---

## Cost

- **Free Trial**: $5 credit (~500 execution hours)
- **Hobby Plan**: $5/month (500 hrs, 512MB RAM)
- **Pro Plan**: $20/month (shared resources)

---

## Next Steps

After Railway trial ends, rotate to:
1. **Render.com** (free tier)
2. **Fly.io** (free tier)
3. **GCP Cloud Run** (permanent free tier)

---

## Summary

Railway CLI is **the best way** to deploy monorepos:
- ✅ Auto-detects all services
- ✅ Handles monorepo structure automatically
- ✅ Easy environment variable management
- ✅ Great developer experience
- ✅ Live logs and debugging

**Total deployment time: 15-20 minutes** 🚀
