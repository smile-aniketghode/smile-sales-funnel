# Gmail OAuth Setup Guide

This guide walks you through setting up Gmail OAuth integration for the SMILe Sales Funnel.

## Prerequisites
- Google Cloud Platform account
- Access to Google Cloud Console

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on project dropdown (top left) → **New Project**
3. Enter project name: `smile-sales-funnel`
4. Click **Create**
5. Wait for project creation and select it

## Step 2: Enable Gmail API

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click on **Gmail API**
4. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (for testing) or **Internal** (if using Google Workspace)
3. Click **Create**

4. Fill in **OAuth consent screen** details:
   - **App name**: SMILe Sales Funnel
   - **User support email**: [your email]
   - **Developer contact**: [your email]
   - Click **Save and Continue**

5. **Scopes** screen:
   - Click **Add or Remove Scopes**
   - Search and add these scopes:
     - `https://www.googleapis.com/auth/gmail.readonly` (Read emails)
     - `https://www.googleapis.com/auth/gmail.labels` (Read labels)
     - `https://www.googleapis.com/auth/gmail.modify` (Modify labels)
   - Click **Update** → **Save and Continue**

6. **Test users** (if External):
   - Click **Add Users**
   - Add your Gmail address
   - Click **Save and Continue**

7. Click **Back to Dashboard**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: Web application
4. **Name**: SMILe Sales Funnel OAuth
5. Add **Authorized redirect URIs**:
   - For local development: `http://localhost:8000/auth/gmail/callback`
   - For production: `https://your-domain.com/auth/gmail/callback`
6. Click **Create**
7. **Download JSON** credentials file
8. Save as `gmail-credentials.json` in `/Users/aniketghode/development/SMILe Sales Funnel/worker/`

## Step 5: Update Environment Variables

Add to `worker/.env.local`:

```bash
# Gmail OAuth
GMAIL_CLIENT_ID=<your-client-id>
GMAIL_CLIENT_SECRET=<your-client-secret>
GMAIL_REDIRECT_URI=http://localhost:8000/auth/gmail/callback
GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.labels,https://www.googleapis.com/auth/gmail.modify
```

## Step 6: Test OAuth Flow

1. Start worker service: `cd worker && ./venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8000`
2. Visit: `http://localhost:8000/auth/gmail`
3. Authorize with your Gmail account
4. Should redirect to callback with success message

## Security Notes

- **NEVER commit** `gmail-credentials.json` to git (already in .gitignore)
- **NEVER commit** OAuth tokens to git
- For production, use environment variables for credentials
- Rotate credentials if exposed
- Use HTTPS in production

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you added your email as a test user
- Verify redirect URI matches exactly

### "invalid_grant" error
- Token expired - delete stored tokens and re-authenticate
- Check system clock is correct

### "insufficient_permissions"
- Verify all required scopes are added in OAuth consent screen
- Re-authenticate to get new scopes

## Next Steps

After setup:
1. Configure label selection in UI
2. Set polling frequency (recommended: 5-15 minutes)
3. Test with real emails
4. Monitor token refresh (expires after 1 hour)
