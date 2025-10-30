# Manual E2E Test Guide

## Prerequisites
- Gmail account connected in Settings: aniket.ghode@shreemaruti.com
- Worker polling enabled and running
- API and UI deployed

## Test Scenario 1: High-Value Deal with Tasks

### Step 1: Send Test Email

**From:** Any external email (e.g., your personal Gmail)
**To:** aniket.ghode@shreemaruti.com
**Subject:** Enterprise SaaS Integration - 200 User Licenses

**Body:**
```
Hi Team,

We're very interested in your enterprise SaaS solution for our 200+ person organization.

Can you please:
1. Schedule a product demo for next Tuesday at 2 PM
2. Send detailed pricing quote for 200 user licenses
3. Share case studies from similar-sized companies in India

Our approved budget is ₹50 lakhs annually and we need to finalize by end of this quarter.

Looking forward to your response.

Best regards,
Rajesh Kumar
CTO, TechCorp India
rajesh.kumar@techcorpindia.com
+91 98765 43210
```

### Step 2: Wait for Processing
- Wait 60 seconds for worker to poll
- OR click "Sync Now" in Settings page

### Step 3: Verify Extraction

Run verification script:
```bash
python3 tests/quick_api_test.py
```

**Expected Results:**
- ✅ 1 new deal: "Enterprise SaaS Integration" with value ₹50,00,000 (₹50L)
- ✅ 3 new tasks:
  - Schedule product demo for Tuesday 2 PM
  - Send pricing quote for 200 licenses
  - Share case studies from similar companies
- ✅ 1 new contact: Rajesh Kumar (rajesh.kumar@techcorpindia.com)

### Step 4: Test Deal Stage Progression

The script will automatically test:
- lead → contacted → demo → proposal

Verify in UI:
- Open Pipeline page
- Deal should show stage: "proposal"

### Step 5: Test Task Status Updates

The script will automatically test:
- accepted → in_progress → completed

Verify in UI:
- Open Tasks page
- First task should show status: "completed"

---

## Test Scenario 2: Multiple Customers

### Repeat with Different Senders

**Email #2:**
- From: Different email address
- Subject: CRM Solution for Growing Team
- Budget: ₹15 lakhs
- Expected: 1 deal, 2 tasks, 1 contact

**Email #3:**
- From: Another different email
- Subject: API Integration Questions
- No budget mentioned
- Expected: 0 deals, 2 tasks, 1 contact

### Verify Multi-Customer Separation

Run:
```bash
python3 tests/quick_api_test.py
```

**Expected:**
- ✅ 3 separate contacts (different emails)
- ✅ All data belongs to aniket.ghode@shreemaruti.com
- ✅ No duplicate deals or tasks

---

## Test Scenario 3: Idempotency

### Send Same Email Twice

1. Forward one of the previous test emails to yourself again
2. Wait for worker to process (60s)
3. Check API/UI

**Expected:**
- ✅ NO duplicate deals
- ✅ NO duplicate tasks
- ✅ Worker logs show: "Email already processed, skipping"

---

## Cleanup Test Data

After testing, clean up:

```bash
cd /Users/aniketghode/development/SMILe\ Sales\ Funnel
python3 -c "
import sys
sys.path.insert(0, 'worker/src')
from services.dynamodb_cleanup import DynamoDBCleanup

cleanup = DynamoDBCleanup(
    region='ap-south-1',
    table_prefix='smile-sales-funnel-prod'
)

result = cleanup.cleanup_all_user_data('aniket.ghode@shreemaruti.com')
print(f'Deleted: {result[\"total_deleted\"]} items')
print(f'Success: {result[\"success\"]}')
"
```

---

## Troubleshooting

### Worker Not Processing
```bash
railway logs --service worker --tail 50
```

Look for:
- "📧 Polling aniket.ghode@shreemaruti.com"
- "Found X new emails"
- "Starting openrouter LLM extraction"

### Rate Limit Errors
Look for: "Rate limit hit (attempt X/4). Retrying in Y.Xs..."

**This is EXPECTED** - the retry logic will automatically handle it.

### No Deals Extracted
- Check confidence scores in worker logs
- Low confidence → draft (won't auto-create)
- Make sure email clearly mentions budget/value

### API Errors
```bash
railway logs --service api --tail 50
```

---

## Success Criteria

✅ Worker polls and processes emails
✅ Retry logic handles rate limits
✅ Tasks extracted correctly (with titles, priorities)
✅ Deals extracted correctly (with values in INR)
✅ Contacts extracted (name + email)
✅ Deal stage progression works (lead → contacted → demo → proposal)
✅ Task status updates work (accepted → in_progress → completed)
✅ Idempotency prevents duplicates
✅ Multi-customer data properly separated
✅ Cleanup removes all test data

---

## Next Steps After E2E Passes

1. Demo to stakeholders with real inbox
2. Monitor worker logs during demo
3. Have backup test emails ready
4. Document any issues for Phase 2
