# Demo Email Templates

Use these pre-tested emails for reliable demos. Send from a different Gmail account to your connected inbox.

---

## Email 1: High-Value Deal with Tasks

**Subject:** Enterprise SaaS Integration Inquiry - 200 User Licenses

**From:** demo.prospect@example.com (use your personal email for demo)

**Body:**
```
Hi Team,

We're interested in your enterprise SaaS solution for our 200+ person organization.

Can you please:
1. Schedule a product demo for next Tuesday at 2 PM
2. Send pricing for 200 user licenses
3. Share case studies from similar-sized companies
4. Provide onboarding timeline estimate

Our budget is approximately ₹50 lakhs annually. We need to make a decision by end of this quarter.

Looking forward to your response.

Best regards,
Rajesh Kumar
CTO, TechCorp India
rajesh.kumar@techcorp.com
```

**Expected Result:**
- 1 Deal: "Enterprise SaaS Integration - 200 users"
- 4 Tasks: Schedule demo, Send pricing, Share case studies, Provide timeline
- 1 Contact: Rajesh Kumar

---

## Email 2: Simple Task Request

**Subject:** Quick question about API integration

**From:** developer@startup.com

**Body:**
```
Hi,

I'm integrating your API into our application. Can you please send me:
1. Updated API documentation
2. Example code snippets for authentication
3. Rate limit details

Thanks!
Priya
```

**Expected Result:**
- 0 Deals (no business opportunity mentioned)
- 3 Tasks: Send API docs, Send auth examples, Send rate limit info
- 1 Contact: Priya

---

## Email 3: Deal with Follow-up

**Subject:** Partnership opportunity for logistics services

**Body:**
```
Dear Team,

We are a Mumbai-based logistics company looking to expand our partnership network.

We handle 500+ deliveries daily across Maharashtra and need reliable technology partners for:
- Real-time tracking systems
- Route optimization software
- Customer notification platform

Estimated budget: ₹25-30 lakhs for the full suite.

Could we schedule a call next week to discuss this further?

Regards,
Amit Sharma
Operations Head, SwiftLogistics
amit@swiftlogistics.in
+91 98765 43210
```

**Expected Result:**
- 1 Deal: "Logistics technology partnership - ₹25-30L"
- 1 Task: Schedule call for next week
- 1 Contact: Amit Sharma (with phone number)

---

## Demo Checklist

Before starting demo:

1. ✅ Verify Pipeline shows 0 deals
2. ✅ Verify Contacts shows 0 contacts
3. ✅ Check Gmail is connected in Settings
4. ✅ Send Email #1 from different account
5. ✅ Wait 30 seconds, click "Sync Now" in Settings
6. ✅ Verify deal and tasks appear
7. ✅ Verify contact appears
8. ✅ Show idempotency: Sync again → No duplicates

---

## Known Issues & Workarounds

### Issue: Rate Limiting
- **Symptom:** Processing fails with 429 error
- **Workaround:** Wait 1 minute between emails, or add paid API key

### Issue: Sync Takes Time
- **Symptom:** Email sent but not appearing
- **Workaround:** Wait 30-60 seconds, use manual "Sync Now" button

### Issue: Low Confidence
- **Symptom:** Deal shows as "Draft" instead of auto-accepted
- **Explanation:** This is by design - low confidence items require review

---

## Emergency Backup Demo Data

If live email sync fails, you can manually insert via API:

```bash
curl -X POST https://worker-production-xxxx.up.railway.app/ingestEmail \
  -H "Content-Type: application/json" \
  -d '{
    "email_content": "Email body here...",
    "user_id": "your.email@example.com"
  }'
```
