# 🚀 Deployment Checklist - TaxSync Email Automation

Use this checklist to ensure a successful deployment of the email automation system.

## Pre-Deployment Checklist

### Code & Tests
- [ ] All tests passing locally (`npm test`)
  - Expected: 229 tests passing
  - Coverage: > 82%
- [ ] Linter passing (`npm run lint`)
  - No critical errors (warnings acceptable)
- [ ] Email server starts locally (`npm run server:dev`)
  - Server starts on port 3000
  - Health endpoint returns 200
- [ ] Dependencies installed (`npm install`)
  - No security vulnerabilities
  - All packages up to date

### Documentation Review
- [ ] Read [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ ] Read [MAILGUN_SETUP.md](./MAILGUN_SETUP.md)
- [ ] Read [DEMO_GUIDE.md](./DEMO_GUIDE.md)
- [ ] Read [EMAIL_INTEGRATION_GUIDE.md](./EMAIL_INTEGRATION_GUIDE.md)

### Account Setup
- [ ] Mailgun account created
  - Free tier: 5,000 emails/month
  - Email verified
  - Payment method added
- [ ] Deployment platform account
  - Vercel (recommended) OR
  - Railway OR
  - Render OR
  - Docker hosting provider
- [ ] Domain access
  - Access to DNS settings for taxsyncfordrivers.com
  - Ability to add MX, TXT, CNAME records

---

## Deployment Steps

### Step 1: Mailgun Configuration

- [ ] **Domain Added**
  - Domain: taxsyncfordrivers.com
  - Region selected (US or EU)
  - Status: Waiting for verification

- [ ] **DNS Records Added**
  - [ ] MX records (2):
    - mxa.mailgun.org (Priority: 10)
    - mxb.mailgun.org (Priority: 10)
  - [ ] TXT record (SPF):
    - v=spf1 include:mailgun.org ~all
  - [ ] TXT record (DKIM):
    - [Long key from Mailgun]
  - [ ] CNAME record (Tracking):
    - email → mailgun.org

- [ ] **DNS Verification**
  - Waited 10-30 minutes for propagation
  - Verified in Mailgun dashboard
  - All checks ✅ green

- [ ] **API Keys Collected**
  - [ ] Private API Key copied
    - Saved securely (password manager)
    - Format: key-xxxxx...
  - [ ] Webhook Signing Key copied
    - Saved securely
    - Format: whsec_xxxxx...

### Step 2: Application Deployment

Choose ONE deployment method:

#### Option A: Vercel (Recommended)

- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Logged in (`vercel login`)
- [ ] Project deployed (`vercel`)
  - Project name: taxsync-email-automation
  - Directory: ./
- [ ] Environment variables added:
  - [ ] MAILGUN_API_KEY
  - [ ] MAILGUN_DOMAIN (taxsyncfordrivers.com)
  - [ ] MAILGUN_WEBHOOK_KEY
  - [ ] NODE_ENV (production)
- [ ] Production deployment (`vercel --prod`)
- [ ] Deployment URL saved
  - Format: https://taxsync-email-automation.vercel.app

#### Option B: Railway

- [ ] Railway CLI installed
- [ ] Logged in (`railway login`)
- [ ] Project initialized (`railway init`)
- [ ] Environment variables set (via CLI or dashboard)
- [ ] Deployed (`railway up`)
- [ ] Domain created (`railway domain`)
- [ ] Deployment URL saved

#### Option C: Render

- [ ] Repository connected in Render dashboard
- [ ] Web Service created
- [ ] Environment variables added
- [ ] Auto-deploy enabled
- [ ] Health check configured (/health)
- [ ] Deployment URL saved

#### Option D: Docker

- [ ] Docker image built
- [ ] Image tested locally
- [ ] Image pushed to registry (ECR/GCR/DockerHub)
- [ ] Deployed to cloud platform
- [ ] Environment variables configured
- [ ] Deployment URL saved

### Step 3: Mailgun Webhook Configuration

- [ ] **Receiving Route Created**
  - Expression Type: Match Recipient
  - Recipient: docs@taxsyncfordrivers.com
  - Action: Forward to webhook
  - Webhook URL: https://[your-deployment-url]/webhook/mailgun
  - Priority: 10
  - Status: Active

- [ ] **Route Verified**
  - Route appears in Routes list
  - URL is correct and publicly accessible

### Step 4: Testing & Validation

- [ ] **Health Check Test**
  ```bash
  curl https://[your-deployment-url]/health
  ```
  - Returns 200 OK
  - Contains {"status": "ok"}

- [ ] **Deployment Test Script**
  ```bash
  ./test-deployment.sh https://[your-deployment-url]
  ```
  - All tests passing
  - No critical errors

- [ ] **Manual Email Test**
  - Send test email to docs@taxsyncfordrivers.com
  - Email received by Mailgun (check logs)
  - Webhook triggered (check deployment logs)
  - Processing completed successfully
  - Confirmation email received (< 30 seconds)

- [ ] **Sample Document Tests**
  - [ ] Uber/Lyft summary processed correctly
  - [ ] Gas receipt processed correctly
  - [ ] T4/RL-1 slip processed correctly
  - [ ] Error handling works (invalid document)

### Step 5: Monitoring Setup

- [ ] **Uptime Monitoring**
  - UptimeRobot or similar configured
  - Monitoring /health endpoint
  - Alert email configured
  - Check interval: 5 minutes

- [ ] **Log Monitoring**
  - Access to deployment logs verified
  - Log aggregation configured (optional)
  - Error alerts configured (optional)

- [ ] **Mailgun Monitoring**
  - Email sending logs accessible
  - Webhook logs accessible
  - Usage quota monitored

---

## Post-Deployment Checklist

### Documentation

- [ ] **Deployment URL Documented**
  - Added to team documentation
  - Shared with stakeholders
  - Added to Mailgun webhook configuration

- [ ] **Environment Variables Backed Up**
  - Saved securely (password manager)
  - Team access configured (if applicable)
  - Recovery process documented

- [ ] **Demo Materials Prepared**
  - Sample documents ready
  - Demo script reviewed
  - Backup plan prepared (screen recording)

### Security Review

- [ ] **HTTPS Enabled**
  - All endpoints use HTTPS
  - SSL certificate valid

- [ ] **Webhook Signature Verification**
  - MAILGUN_WEBHOOK_KEY set
  - Verification enabled in code
  - Tested with invalid signature

- [ ] **Environment Variables Secured**
  - Not committed to Git
  - Set via deployment platform
  - Access restricted

- [ ] **Rate Limiting** (optional but recommended)
  - Considered for production use
  - Implementation plan documented

### Performance Validation

- [ ] **Response Time**
  - Health endpoint: < 2 seconds
  - Email processing: < 30 seconds
  - Cold start acceptable (serverless)

- [ ] **Success Rate**
  - Test emails: 100% success
  - Error handling: Graceful failures
  - Email notifications: Working

### Stakeholder Communication

- [ ] **Technical Team Notified**
  - Deployment URL shared
  - Access credentials provided
  - Monitoring links shared

- [ ] **Business Team Notified**
  - Email address operational: docs@taxsyncfordrivers.com
  - Demo guide shared
  - Support contact provided

- [ ] **Documentation Shared**
  - [DEPLOYMENT.md](./DEPLOYMENT.md)
  - [MAILGUN_SETUP.md](./MAILGUN_SETUP.md)
  - [DEMO_GUIDE.md](./DEMO_GUIDE.md)
  - [EMAIL_INTEGRATION_GUIDE.md](./EMAIL_INTEGRATION_GUIDE.md)

---

## Demo Preparation Checklist

### Before Client Demo

- [ ] **Test Complete Flow** (24 hours before)
  - Send test email
  - Verify processing
  - Confirm response email
  - Check timing (< 30 seconds)

- [ ] **Prepare Materials**
  - Sample Uber summary
  - Sample gas receipt
  - Sample T4 slip
  - Demo script printed/open

- [ ] **Technical Setup**
  - Email client open (Gmail/Outlook)
  - Tax calculator open (isaloum.github.io/TaxSyncForDrivers/)
  - Demo guide open
  - Stable internet connection verified

- [ ] **Backup Plan**
  - Screen recording of successful demo
  - Screenshots of results
  - Fallback presentation ready

### During Demo

- [ ] Follow [DEMO_GUIDE.md](./DEMO_GUIDE.md)
- [ ] Track timing and success
- [ ] Note any issues or questions
- [ ] Gather feedback

### After Demo

- [ ] Send follow-up email with resources
- [ ] Address any issues discovered
- [ ] Update documentation based on feedback
- [ ] Schedule next demo or onboarding

---

## Maintenance Checklist (Weekly)

- [ ] **Monitor Uptime**
  - Check uptime monitoring dashboard
  - Review any downtime incidents
  - Address recurring issues

- [ ] **Review Logs**
  - Check for errors or warnings
  - Monitor processing success rate
  - Investigate failures

- [ ] **Check Email Quota**
  - Monitor Mailgun usage
  - Ensure within limits
  - Plan upgrade if needed

- [ ] **Test Core Functionality**
  - Send weekly test email
  - Verify processing works
  - Check response time

---

## Troubleshooting Reference

### Issue: Health Check Fails

**Symptoms:** curl to /health returns non-200 status

**Actions:**
1. Check deployment status in platform dashboard
2. Review deployment logs for errors
3. Verify environment variables are set
4. Redeploy if necessary

### Issue: Emails Not Received

**Symptoms:** Emails sent to docs@taxsyncfordrivers.com don't trigger webhook

**Actions:**
1. Check Mailgun receiving logs
2. Verify DNS MX records
3. Check Mailgun route configuration
4. Verify webhook URL is correct and accessible

### Issue: Webhook Returns 403

**Symptoms:** Mailgun shows webhook failed with 403 error

**Actions:**
1. Verify MAILGUN_WEBHOOK_KEY is set correctly
2. Check webhook signing key in Mailgun matches
3. Review email-server.js signature verification code
4. Test with Mailgun webhook test tool

### Issue: No Confirmation Email

**Symptoms:** Processing works but no email sent back

**Actions:**
1. Check Mailgun sending logs
2. Verify MAILGUN_API_KEY is set
3. Review deployment logs for email sending errors
4. Check FROM_EMAIL uses verified domain

---

## Success Criteria

### Deployment Complete When:

✅ **All tests passing:**
- Health check: 200 OK
- Webhook endpoints: Accessible
- SSL/HTTPS: Enabled
- Response time: < 30 seconds

✅ **Email flow working:**
- Emails sent to docs@taxsyncfordrivers.com received
- Documents processed successfully
- Tax calculations updated
- Confirmation emails sent
- Processing time < 30 seconds

✅ **Monitoring configured:**
- Uptime monitoring active
- Logs accessible
- Alerts configured

✅ **Demo ready:**
- Sample documents prepared
- Test flow verified
- Demo script reviewed
- Backup plan ready

✅ **Documentation complete:**
- Team has access to guides
- Environment variables backed up
- Support contacts documented

---

## Next Steps After Deployment

1. **Schedule Client Demo**
   - Review [DEMO_GUIDE.md](./DEMO_GUIDE.md)
   - Prepare sample documents
   - Practice demo flow

2. **Gather Feedback**
   - Test with real users
   - Collect improvement suggestions
   - Iterate on features

3. **Scale as Needed**
   - Monitor usage and limits
   - Upgrade plans if necessary
   - Optimize performance

4. **Maintain & Update**
   - Weekly health checks
   - Monthly security reviews
   - Quarterly feature updates

---

**Ready to deploy? Start with Step 1 and check off each item as you complete it!** 🚀

For detailed instructions, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [MAILGUN_SETUP.md](./MAILGUN_SETUP.md) - Email configuration
- [DEMO_GUIDE.md](./DEMO_GUIDE.md) - Client demonstration guide
