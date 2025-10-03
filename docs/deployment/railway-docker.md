# Railway Docker Deployment Guide (Recommended for Monorepos)

## Why Docker?

Docker gives you **full control** over the build process and avoids Nixpacks auto-detection issues in monorepos.

✅ Predictable builds
✅ Works every time
✅ No configuration guessing
✅ Production-ready containers

---

## Prerequisites

- Docker installed locally (for testing)
- Railway account connected to GitHub
- All Dockerfiles created (✅ already done!)

---

## Step 1: Test Docker Builds Locally (5 minutes)

Test that all Dockerfiles work before deploying:

```bash
# Test Worker
cd worker
docker build -t smile-worker .
docker run -p 8000:8000 --env-file .env.local smile-worker

# Test API
cd ../api
docker build -t smile-api .
docker run -p 3001:3001 smile-api

# Test UI
cd ../ui
docker build -t smile-ui .
docker run -p 5173:5173 smile-ui
```

If all 3 build successfully, you're ready to deploy!

---

## Step 2: Deploy Worker Service

```bash
cd worker

# Deploy to Railway (Railway will detect Dockerfile automatically)
railway up

# Railway will:
# 1. Detect Dockerfile
# 2. Build Docker image
# 3. Deploy container
# 4. Assign public URL
```

---

## Step 3: Deploy API Service

```bash
cd ../api
railway up
```

---

## Step 4: Deploy UI Service

```bash
cd ../ui
railway up
```

---

## Step 5: Set Environment Variables

### Worker Service

```bash
cd worker
railway variables set LLM_PROVIDER=openrouter
railway variables set OPENROUTER_API_KEY=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
railway variables set OPENROUTER_MODEL="mistralai/mistral-small-3.2-24b-instruct:free"
railway variables set AWS_REGION=us-east-1
railway variables set AWS_ACCESS_KEY_ID=<YOUR_KEY>
railway variables set AWS_SECRET_ACCESS_KEY=<YOUR_SECRET>
railway variables set GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>
railway variables set GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>

# Redeploy with new variables
railway up
```

### API Service

```bash
cd ../api
railway variables set AWS_REGION=us-east-1
railway variables set AWS_ACCESS_KEY_ID=<YOUR_KEY>
railway variables set AWS_SECRET_ACCESS_KEY=<YOUR_SECRET>
railway up
```

### UI Service

Get URLs from other services first:

```bash
# Get worker URL
cd ../worker
railway domain
# Copy the URL (e.g., https://worker-production-xxxx.up.railway.app)

# Get API URL
cd ../api
railway domain
# Copy the URL

# Set UI environment variables
cd ../ui
railway variables set VITE_API_BASE_URL=https://api-production-xxxx.up.railway.app
railway variables set VITE_WORKER_BASE_URL=https://worker-production-xxxx.up.railway.app
railway up
```

---

## Step 6: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Add redirect URI:
   ```
   https://worker-production-xxxx.up.railway.app/auth/gmail/callback
   ```
3. Update worker environment:
   ```bash
   cd worker
   railway variables set GOOGLE_REDIRECT_URI=https://worker-production-xxxx.up.railway.app/auth/gmail/callback
   railway up
   ```

---

## Step 7: Create DynamoDB Tables

```bash
cd ../infra
AWS_REGION=us-east-1 node create-tables.js
```

---

## Step 8: Test Your Deployment

Visit your UI URL: `https://ui-production-xxxx.up.railway.app`

You should see the beautiful login page! 🎉

---

## Viewing Logs

```bash
# Worker logs
cd worker
railway logs --tail

# API logs
cd ../api
railway logs --tail

# UI logs
cd ../ui
railway logs --tail
```

---

## Troubleshooting

### Build Failed

```bash
# View build logs
railway logs

# Common issues:
# 1. Missing files in Docker context (check .dockerignore)
# 2. Wrong WORKDIR or COPY paths
# 3. Missing dependencies in package.json/requirements.txt
```

### Service Won't Start

```bash
# Check if PORT environment variable is set correctly
railway logs

# Railway automatically sets PORT - make sure your app uses it
# Worker: --port ${PORT:-8000}
# API: Uses PORT from env
# UI: -l ${PORT:-5173}
```

### Environment Variables Not Working

```bash
# List all variables
railway variables

# Variables only apply after redeploy
railway up
```

---

## Docker Best Practices We're Using

✅ **Multi-stage builds** (UI) - Smaller production images
✅ **.dockerignore** - Faster builds, smaller context
✅ **Slim base images** - python:3.11-slim, node:18-alpine
✅ **Non-root user** (optional, add if needed)
✅ **Health checks** (can add HEALTHCHECK in Dockerfile)

---

## Cost

Same as before:
- **Free Trial**: $5 credit (~2-4 weeks)
- **Hobby**: $5/month
- **Pro**: $20/month

---

## Why Docker is Better for This Project

| Aspect | Nixpacks | Docker |
|--------|----------|--------|
| **Monorepo Support** | ❌ Confusing | ✅ Perfect |
| **Build Predictability** | ⚠️ Auto-detection | ✅ 100% control |
| **Production Ready** | ⚠️ Maybe | ✅ Yes |
| **Debugging** | ❌ Hard | ✅ Easy (test locally) |
| **Portability** | ❌ Railway only | ✅ Works anywhere |

---

## Next Steps

After Railway trial:
1. Export Docker images
2. Deploy same images to Render/Fly.io/GCP
3. No code changes needed! 🎉

---

## Summary

**Total deployment time: 20-30 minutes**

Docker gives you:
- ✅ Reliable builds
- ✅ Easy debugging (test locally first)
- ✅ Portable (same images work on any cloud)
- ✅ Production-ready

**This is the recommended approach for monorepos on Railway!**
