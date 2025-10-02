#!/usr/bin/env python3
"""
Send test emails to contact@cognitoapps.in to test Gmail integration
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import sys

# Email configuration
SENDER_EMAIL = "aniketghode@gmail.com"  # Your Gmail
RECIPIENT_EMAIL = "contact@cognitoapps.in"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# Test email templates
TEST_EMAILS = {
    "task": {
        "subject": "Follow up on demo with Acme Corp",
        "body": """Hi team,

Please schedule a demo call with Acme Corp for next week.
Also need to prepare the pricing deck and send them the proposal by Friday.

Thanks!
"""
    },
    "deal": {
        "subject": "New Lead - XYZ Company interested in enterprise plan",
        "body": """Hi,

XYZ Company (xyz.com) reached out about our enterprise plan.
Deal value: ₹25 lakhs
Decision maker: Rahul Sharma (rahul@xyz.com)
Timeline: Needs to close by end of Q4

Let's get them a quote ASAP.
"""
    },
    "mixed": {
        "subject": "Client meeting summary - ABC Solutions",
        "body": """Hi team,

Had a great meeting with ABC Solutions today!

ACTION ITEMS:
1. Send them updated pricing for 50-user plan
2. Schedule technical demo for next Tuesday
3. Prepare case study document

DEAL DETAILS:
- Company: ABC Solutions (abcsolutions.in)
- Contact: Priya Mehta (priya@abcsolutions.in)
- Value: ₹35 lakhs
- Timeline: Decision by November 15

Looking good for closing this one!
"""
    },
    "high_value": {
        "subject": "🔥 Hot Lead - Enterprise Deal ₹1.2 Cr",
        "body": """URGENT - High priority lead!

TechCorp Industries wants to implement our solution across 500 users.

Deal Details:
- Company: TechCorp Industries (techcorp.co.in)
- Decision Maker: Amit Kumar, CTO (amit.kumar@techcorp.co.in)
- Deal Size: ₹1.2 Crore (annual contract)
- Timeline: Needs decision by October 20
- Competition: Evaluating 2 other vendors

Next Steps:
1. Send enterprise proposal by Thursday
2. Arrange executive meeting with CEO
3. Prepare custom demo with their use cases
4. Get references from similar enterprise clients

This is our biggest deal of Q4 - all hands on deck!
"""
    }
}


def send_email(email_type: str, smtp_password: str):
    """Send a test email"""
    if email_type not in TEST_EMAILS:
        print(f"❌ Unknown email type: {email_type}")
        print(f"Available types: {', '.join(TEST_EMAILS.keys())}")
        return False

    template = TEST_EMAILS[email_type]

    # Create message
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = RECIPIENT_EMAIL
    msg['Subject'] = template['subject']
    msg.attach(MIMEText(template['body'], 'plain'))

    try:
        # Connect to Gmail SMTP
        print(f"📧 Sending {email_type} email...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, smtp_password)

        # Send email
        server.send_message(msg)
        server.quit()

        print(f"✅ {email_type.upper()} email sent successfully!")
        print(f"   Subject: {template['subject']}")
        print(f"   To: {RECIPIENT_EMAIL}")
        return True

    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False


def main():
    print("=" * 60)
    print("SMILe Sales Funnel - Test Email Sender")
    print("=" * 60)
    print()

    if len(sys.argv) < 2:
        print("Usage: python3 send-test-email.py <email_type> [gmail_app_password]")
        print()
        print("Available email types:")
        for email_type, template in TEST_EMAILS.items():
            print(f"  • {email_type:12s} - {template['subject']}")
        print()
        print("Examples:")
        print("  python3 send-test-email.py task")
        print("  python3 send-test-email.py deal")
        print("  python3 send-test-email.py mixed")
        print("  python3 send-test-email.py high_value")
        print()
        print("Note: You need a Gmail App Password (not your regular password)")
        print("Get it from: https://myaccount.google.com/apppasswords")
        return

    email_type = sys.argv[1]

    # Get SMTP password
    if len(sys.argv) >= 3:
        smtp_password = sys.argv[2]
    else:
        smtp_password = input(f"Enter Gmail App Password for {SENDER_EMAIL}: ")

    success = send_email(email_type, smtp_password)

    if success:
        print()
        print("🎯 Now wait 15 minutes (or click 'Sync Now' in Settings) to see results!")
        print("   Dashboard: http://localhost:5173/")
        print("   Settings: http://localhost:5173/settings")


if __name__ == "__main__":
    main()
