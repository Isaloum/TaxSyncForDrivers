# 📧 Mailgun Setup Guide - Complete Email Configuration

Step-by-step guide to configure Mailgun for `docs@taxsyncfordrivers.com` email automation.

## 📋 Overview

This guide will help you:
1. Create and configure a Mailgun account
2. Add and verify your domain
3. Configure DNS records
4. Set up email receiving routes
5. Configure webhook integration
6. Test the complete email flow

**Time Required:** 30-45 minutes  
**Cost:** Free (5,000 emails/month on free tier)

---

## Part 1: Mailgun Account Setup

### Step 1: Create Mailgun Account

1. Go to [https://signup.mailgun.com/new/signup](https://signup.mailgun.com/new/signup)
2. Fill in registration form:
   - **Email:** Your business email
   - **Name:** Your name
   - **Company:** TaxSyncForDrivers (or your company name)
   - **Password:** Strong password
3. Click "Sign Up"
4. Verify your email address (check inbox)

### Step 2: Choose Plan

1. After email verification, log in
2. Select plan:
   - **Foundation (Free)**: 5,000 emails/month - Perfect for getting started
   - **Growth**: If you need more volume
3. For demo/testing, Foundation plan is sufficient

### Step 3: Complete Account Setup

1. Add payment method (required even for free plan, won't be charged unless you exceed limits)
2. Verify phone number (SMS verification)
3. Complete account verification

---

## Part 2: Domain Configuration

### Step 1: Add Domain

1. Navigate to **Sending** → **Domains** in left sidebar
2. Click **"Add New Domain"** button
3. Enter domain information:
   - **Domain Name:** `taxsyncfordrivers.com`
   - **Region:** US or EU (choose closest to your users)
   - **DKIM Authority:** (leave default)
4. Click **"Add Domain"**

### Step 2: Copy DNS Records

Mailgun will provide DNS records to add. **Keep this page open** - you'll need these values.

You'll see several records like:

**TXT Record (SPF):**
```
Type: TXT
Hostname: taxsyncfordrivers.com (or @)
Value: v=spf1 include:mailgun.org ~all
```

**TXT Record (DKIM):**
```
Type: TXT
Hostname: pic._domainkey.taxsyncfordrivers.com
Value: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4... [long key]
```

**CNAME Record (Tracking):**
```
Type: CNAME
Hostname: email.taxsyncfordrivers.com
Value: mailgun.org
```

**MX Records (for receiving emails):**
```
Type: MX
Hostname: taxsyncfordrivers.com (or @)
Priority: 10
Value: mxa.mailgun.org

Type: MX
Hostname: taxsyncfordrivers.com (or @)
Priority: 10
Value: mxb.mailgun.org
```

---

## Part 3: DNS Configuration

### Where to Add DNS Records

You'll add these records at your **domain registrar** or **DNS provider**:

- **Namecheap**: Dashboard → Domain List → Manage → Advanced DNS
- **GoDaddy**: My Products → Domains → DNS → Manage Zones
- **Cloudflare**: Select domain → DNS → Records
- **Google Domains**: My domains → DNS
- **Other providers**: Look for "DNS Settings" or "DNS Management"

### Step-by-Step DNS Record Addition

#### Example: Namecheap

1. Log in to Namecheap
2. Navigate to **Domain List**
3. Click **Manage** next to `taxsyncfordrivers.com`
4. Go to **Advanced DNS** tab
5. Add each record:

**Add TXT Record (SPF):**
- Click "Add New Record"
- Type: TXT Record
- Host: @ (or leave blank)
- Value: `v=spf1 include:mailgun.org ~all`
- TTL: Automatic (or 300)
- Click ✓ Save

**Add TXT Record (DKIM):**
- Click "Add New Record"
- Type: TXT Record
- Host: `pic._domainkey` (copy exact name from Mailgun)
- Value: [Copy entire DKIM key from Mailgun]
- TTL: Automatic
- Click ✓ Save

**Add CNAME Record:**
- Click "Add New Record"
- Type: CNAME Record
- Host: `email`
- Value: `mailgun.org`
- TTL: Automatic
- Click ✓ Save

**Add MX Records:**
- Click "Add New Record"
- Type: MX Record
- Host: @ (or leave blank)
- Value: `mxa.mailgun.org`
- Priority: 10
- Click ✓ Save

- Click "Add New Record" again
- Type: MX Record
- Host: @ (or leave blank)
- Value: `mxb.mailgun.org`
- Priority: 10
- Click ✓ Save

#### Example: Cloudflare

1. Log in to Cloudflare
2. Select `taxsyncfordrivers.com` domain
3. Click **DNS** in sidebar
4. Click **Add record** for each:

**TXT Records:**
- Type: TXT
- Name: @ (for SPF) or `pic._domainkey` (for DKIM)
- Content: [Value from Mailgun]
- Proxy status: DNS only (grey cloud)
- TTL: Auto
- Save

**CNAME Record:**
- Type: CNAME
- Name: email
- Target: mailgun.org
- Proxy status: DNS only (grey cloud)
- TTL: Auto
- Save

**MX Records:**
- Type: MX
- Name: @
- Mail server: mxa.mailgun.org
- Priority: 10
- TTL: Auto
- Save

Repeat for mxb.mailgun.org

### DNS Propagation

⏱️ **Wait Time:** 5-60 minutes (usually ~10 minutes)

Check propagation status:
```bash
# Check MX records
dig MX taxsyncfordrivers.com

# Check TXT records (SPF)
dig TXT taxsyncfordrivers.com

# Check DKIM
dig TXT pic._domainkey.taxsyncfordrivers.com
```

Or use online tools:
- [DNS Checker](https://dnschecker.org)
- [MXToolbox](https://mxtoolbox.com)

---

## Part 4: Domain Verification

### Step 1: Verify DNS in Mailgun

1. Go back to Mailgun dashboard
2. Navigate to **Sending** → **Domains**
3. Click on `taxsyncfordrivers.com`
4. Click **"Verify DNS Settings"** button

### Step 2: Check Verification Status

You should see:
```
✅ SPF Record Found
✅ DKIM Record Found
✅ MX Records Found
✅ Tracking CNAME Found
```

If any show ❌ red:
- Wait a few more minutes for DNS propagation
- Double-check DNS records match exactly
- Try "Verify DNS Settings" again

### Step 3: Domain Status

Once verified, domain status should change to:
```
✅ Verified and Active
```

---

## Part 5: API Keys

### Step 1: Get Private API Key

1. Navigate to **Settings** → **API Keys** (in left sidebar)
2. Find **"Private API key"** section
3. Click **"Copy"** button
4. Save this as `MAILGUN_API_KEY` environment variable

**Example:**
```
MAILGUN_API_KEY=key-1234567890abcdef1234567890abcdef
```

⚠️ **IMPORTANT:** 
- Keep this secret!
- Never commit to Git
- Store in environment variables only

### Step 2: Get Webhook Signing Key

1. Still in **Settings** → **API Keys**
2. Scroll to **"HTTP webhook signing key"** section
3. Click **"Show"** to reveal the key
4. Click **"Copy"**
5. Save this as `MAILGUN_WEBHOOK_KEY` environment variable

**Example:**
```
MAILGUN_WEBHOOK_KEY=whsec_1234567890abcdef1234567890abcdef
```

---

## Part 6: Email Receiving Configuration

### Step 1: Create Receiving Route

1. Navigate to **Receiving** → **Routes**
2. Click **"Create Route"** button
3. Fill in route details:

**Expression Type:** Match Recipient

**Recipient:** `docs@taxsyncfordrivers.com`

**Actions:**
- ✅ Check "Forward"
- **Forward destination:** `https://your-deployment-url.com/webhook/mailgun`
  - Replace `your-deployment-url.com` with your actual deployment URL
  - Examples:
    - Vercel: `https://taxsync-email-automation.vercel.app/webhook/mailgun`
    - Railway: `https://taxsync-email-automation.up.railway.app/webhook/mailgun`
    - Render: `https://taxsync-email-automation.onrender.com/webhook/mailgun`

**Priority:** 10 (lower = higher priority)

**Description:** TaxSync Document Processing Webhook

4. Click **"Create Route"**

### Step 2: Verify Route

Your route should look like:
```
Priority: 10
Expression: match_recipient("docs@taxsyncfordrivers.com")
Actions: forward("https://your-deployment-url.com/webhook/mailgun")
Status: Active
```

### Step 3: Test Route (Optional)

Send a test email manually:
1. In Routes page, click on your route
2. Click "Test Route" (if available)
3. Or send actual email to `docs@taxsyncfordrivers.com`

---

## Part 7: Webhook Configuration

### Step 1: Configure Webhook Events (Optional)

For monitoring and logging:

1. Navigate to **Sending** → **Webhooks**
2. Select your domain: `taxsyncfordrivers.com`
3. Click **"Add webhook"**
4. Configure for important events:

**Webhook URL:** `https://your-deployment-url.com/webhook/mailgun`

**Events to enable:**
- ✅ Delivered
- ✅ Permanent Failure
- ✅ Temporary Failure
- ❌ Opened (optional)
- ❌ Clicked (optional)

5. Click **"Create Webhook"**

### Step 2: Verify Signature Key

The webhook signing key (from Part 5, Step 2) is used to verify all webhook requests.

Our server verifies it in `email-server.js`:
```javascript
function verifyMailgunSignature(timestamp, token, signature) {
  const encodedToken = crypto
    .createHmac('sha256', process.env.MAILGUN_WEBHOOK_KEY)
    .update(timestamp + token)
    .digest('hex');
  return encodedToken === signature;
}
```

---

## Part 8: Testing Email Flow

### Step 1: Verify Server is Running

```bash
# Test health endpoint
curl https://your-deployment-url.com/health

# Expected response:
{
  "status": "ok",
  "service": "TaxSync Email Integration",
  "timestamp": "2025-01-14T00:00:00.000Z"
}
```

### Step 2: Send Test Email

**Compose email:**
- **To:** `docs@taxsyncfordrivers.com`
- **Subject:** Test Email
- **Body:** Testing TaxSync email automation
- **Attachment:** Sample document (PDF/image of Uber summary or gas receipt)

**Send from:**
- Your personal email (Gmail, Outlook, etc.)

### Step 3: Monitor Processing

**Check Mailgun Logs:**
1. Go to **Sending** → **Logs** in Mailgun
2. Filter by recipient: `docs@taxsyncfordrivers.com`
3. Should see:
   - ✅ Accepted
   - ✅ Delivered
   - ✅ Webhook triggered

**Check Deployment Logs:**
```bash
# Vercel
vercel logs

# Railway
railway logs

# Render
# View in dashboard
```

**Expected log output:**
```
📧 Received email from your@email.com with 1 attachment(s)
✅ Document processed: [DOCUMENT_TYPE]
💰 Tax update applied for your@email.com
📤 Sent processing results to your@email.com
```

### Step 4: Verify Response Email

Check your inbox (email you sent from):
- You should receive automated response
- Email subject: "TaxSync: Your documents have been processed"
- Email body: Contains processing summary and tax impact
- Processing time: < 30 seconds

---

## Part 9: Monitoring & Maintenance

### Check Email Sending Limits

1. Navigate to **Account Settings** → **Limits**
2. Monitor usage:
   - Emails sent this month
   - Remaining in quota
   - Reset date

### Review Email Logs Regularly

1. **Sending** → **Logs**
2. Monitor for:
   - ✅ Successful deliveries
   - ❌ Bounces or failures
   - 🔒 Security issues

### Set Up Alerts (Optional)

1. **Account Settings** → **Notifications**
2. Configure alerts for:
   - Approaching quota limit (80%)
   - Failed deliveries
   - Webhook errors

---

## Troubleshooting

### Issue 1: Domain Not Verifying

**Symptoms:** DNS verification fails in Mailgun

**Solution:**
1. Double-check DNS records match exactly
2. Wait 15-30 minutes for propagation
3. Use online DNS checker tools
4. Check for typos in record values
5. Ensure no conflicting DNS records exist

### Issue 2: Emails Not Being Received

**Symptoms:** Emails sent to docs@taxsyncfordrivers.com don't trigger webhook

**Solution:**
1. Check route is active in Mailgun
2. Verify route expression matches: `match_recipient("docs@taxsyncfordrivers.com")`
3. Check webhook URL is correct and accessible
4. Review Mailgun logs for error messages
5. Test webhook endpoint directly with curl

### Issue 3: "Invalid Signature" Errors

**Symptoms:** Server returns 403 Unauthorized

**Solution:**
1. Verify `MAILGUN_WEBHOOK_KEY` environment variable is set
2. Check key matches the one in Mailgun dashboard
3. Ensure no extra spaces or quotes in the key
4. Redeploy application after updating environment variable

### Issue 4: Webhook Not Triggering

**Symptoms:** Email received but no processing happens

**Solution:**
1. Check deployment logs for errors
2. Verify webhook URL is publicly accessible (not localhost)
3. Test health endpoint: `curl https://your-url.com/health`
4. Check Mailgun route has "Forward" action enabled
5. Review Mailgun webhook logs for failed requests

### Issue 5: Response Emails Not Sending

**Symptoms:** Processing works but no confirmation email

**Solution:**
1. Verify `MAILGUN_API_KEY` is set correctly
2. Check domain is verified in Mailgun
3. Review server logs for email sending errors
4. Ensure FROM_EMAIL uses verified domain
5. Check Mailgun sending logs

---

## Security Best Practices

### API Key Security

- ✅ Store keys in environment variables only
- ✅ Never commit keys to Git
- ✅ Use different keys for development/production
- ✅ Rotate keys periodically (every 6 months)
- ✅ Restrict API key permissions if possible

### Webhook Security

- ✅ Always verify webhook signatures
- ✅ Use HTTPS endpoints only
- ✅ Implement rate limiting
- ✅ Log all webhook requests
- ✅ Monitor for suspicious activity

### Email Security

- ✅ Validate sender addresses
- ✅ Scan attachments for viruses (optional)
- ✅ Implement size limits (10MB default)
- ✅ Filter file types (PDF, images only)
- ✅ Don't store email content (process and delete)

---

## Quick Reference

### Essential Mailgun URLs

- **Dashboard:** https://app.mailgun.com
- **Domain Settings:** https://app.mailgun.com/app/sending/domains
- **Routes:** https://app.mailgun.com/app/receiving/routes
- **Logs:** https://app.mailgun.com/app/logs
- **API Keys:** https://app.mailgun.com/app/account/security/api_keys

### DNS Record Quick Check

```bash
# Check all records at once
dig MX taxsyncfordrivers.com
dig TXT taxsyncfordrivers.com
dig TXT pic._domainkey.taxsyncfordrivers.com
dig CNAME email.taxsyncfordrivers.com
```

### Environment Variables Summary

```bash
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=taxsyncfordrivers.com
MAILGUN_WEBHOOK_KEY=whsec-xxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@taxsyncfordrivers.com
```

---

## Next Steps

After completing this setup:

1. ✅ Deploy your application (see [DEPLOYMENT.md](./DEPLOYMENT.md))
2. ✅ Test complete email flow
3. ✅ Prepare demo materials (see [DEMO_GUIDE.md](./DEMO_GUIDE.md))
4. ✅ Set up monitoring and alerts
5. ✅ Document for your team

---

## Support

**Mailgun Support:**
- Documentation: https://documentation.mailgun.com
- Support: https://help.mailgun.com
- Community: https://mailgun.community

**TaxSync Support:**
- Email: support@taxsyncfordrivers.com
- GitHub Issues: https://github.com/Isaloum/TaxSyncForDrivers/issues

---

**Setup complete? Proceed to deployment: [DEPLOYMENT.md](./DEPLOYMENT.md)** 🚀
