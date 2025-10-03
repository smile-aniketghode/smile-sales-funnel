# Railway.app Deployment Guide (1 Hour Setup)

## Prerequisites
- GitHub account with this repo pushed
- Railway.app account (sign up with GitHub)
- Google Cloud Console project for OAuth

---

## Step 1: Railway Setup (15 minutes)

### IMPORTANT: Monorepo Setup

Railway needs each service deployed separately. You'll create **3 separate services** from the same repo.

### Service 1: Worker (Python FastAPI)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select: `smile-aniketghode/smile-sales-funnel`
4. **IMPORTANT**: Click "Configure" before deploying
5. Set **Root Directory**: `worker`
6. Set **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
7. Click "Deploy"

### Service 2: API (NestJS)

1. In the same Railway project, click "New Service"
2. Select "GitHub Repo" → `smile-aniketghode/smile-sales-funnel`
3. **IMPORTANT**: Click "Configure"
4. Set **Root Directory**: `api`
5. Set **Build Command**: `npm install && npm run build`
6. Set **Start Command**: `npm run start:prod`
7. Click "Deploy"

### Service 3: UI (React + Vite)

1. Click "New Service" again
2. Select "GitHub Repo" → `smile-aniketghode/smile-sales-funnel`
3. **IMPORTANT**: Click "Configure"
4. Set **Root Directory**: `ui`
5. Set **Build Command**: `npm install && npm run build`
6. Set **Start Command**: `npx serve -s dist -l $PORT`
7. Add **Install Command**: `npm install -g serve`
8. Click "Deploy"

---

## Step 2: Configure Environment Variables

### **Worker Service** (`/worker`)

```bash
# LLM Configuration
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=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
OPENROUTER_MODEL=mistralai/mistral-small-3.2-24b-instruct:free

# AWS DynamoDB
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<YOUR_AWS_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET>
DYNAMODB_ENDPOINT=  # Leave empty for AWS DynamoDB

# Google OAuth
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
GOOGLE_REDIRECT_URI=https://worker-production-xxxx.up.railway.app/auth/gmail/callback

# CORS
CORS_ORIGINS=https://ui-production-xxxx.up.railway.app,https://api-production-xxxx.up.railway.app
```

### **API Service** (`/api`)

```bash
# DynamoDB
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<YOUR_AWS_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET>
DYNAMODB_ENDPOINT=  # Leave empty for AWS DynamoDB

# Port (Railway auto-assigns)
PORT=3001
```

### **UI Service** (`/ui`)

```bash
# API URLs (update after services deploy)
VITE_API_BASE_URL=https://api-production-xxxx.up.railway.app
VITE_WORKER_BASE_URL=https://worker-production-xxxx.up.railway.app
```

---

## Step 3: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: APIs & Services > Credentials
3. Click your OAuth 2.0 Client ID
4. Add Authorized redirect URI:
   ```
   https://worker-production-xxxx.up.railway.app/auth/gmail/callback
   ```
5. Add Authorized JavaScript origins:
   ```
   https://ui-production-xxxx.up.railway.app
   https://worker-production-xxxx.up.railway.app
   ```

---

## Step 4: Configure Build Commands

### **UI Service**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve -s dist -l $PORT"
  }
}
```

### **API Service**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm run start:prod"
  }
}
```

### **Worker Service**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn src.main:app --host 0.0.0.0 --port $PORT"
  }
}
```

---

## Step 5: Deploy!

1. Click "Deploy" on all 3 services
2. Railway will:
   - Build containers
   - Deploy to production
   - Assign public URLs
3. Wait 5-10 minutes for first deployment

---

## Step 6: Update CORS and URLs

After deployment, update:

1. **Worker `.env` CORS**:
   ```
   CORS_ORIGINS=https://ui-production-xxxx.up.railway.app
   ```

2. **UI `.env` API URLs**:
   ```
   VITE_API_BASE_URL=https://api-production-xxxx.up.railway.app
   VITE_WORKER_BASE_URL=https://worker-production-xxxx.up.railway.app
   ```

3. Redeploy services with updated env vars

---

## Step 7: Create DynamoDB Tables on AWS

Run the table creation script with AWS credentials:

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

## Step 8: Test the Deployment

1. Visit: `https://ui-production-xxxx.up.railway.app`
2. You should see the Login page
3. Enter email and connect Gmail
4. Check Railway logs for any errors

---

## Monitoring & Logs

Railway provides:
- Real-time logs for each service
- Metrics (CPU, RAM, network)
- Automatic HTTPS
- Custom domains (optional)

---

## Cost

- **Free Trial**: $5 credit (~500 execution hours)
- **Duration**: 2-4 weeks of free usage
- **After Trial**: ~$10-20/month

---

## Troubleshooting

### Service won't start
- Check Railway logs for errors
- Verify all environment variables are set
- Check build command in railway.json

### CORS errors
- Update CORS_ORIGINS in worker service
- Redeploy worker after changes

### OAuth callback fails
- Verify GOOGLE_REDIRECT_URI matches Railway URL
- Check Google Cloud Console authorized URIs

---

## Next Steps

After Railway trial ends, migrate to:
1. **Render.com** (free tier, 2 months)
2. **Fly.io** (free tier, 2 months)
3. **GCP Cloud Run** (permanent free tier)

