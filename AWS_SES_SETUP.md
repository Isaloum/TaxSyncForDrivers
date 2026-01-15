# 📧 AWS SES Setup Guide - Complete Email Configuration

Step-by-step guide to configure AWS SES for `notifications@isaloumapps.com` email automation.

## 📋 Overview

This guide will help you:
1. Create and configure an AWS account
2. Set up Amazon SES (Simple Email Service)
3. Verify your domain and email addresses
4. Configure DNS records for email authentication
5. Create IAM credentials for sending emails
6. Test the complete email flow

**Time Required:** 45-60 minutes  
**Cost:** Free tier includes 62,000 emails/month when sending from EC2, or $0.10 per 1,000 emails

---

## Part 1: AWS Account Setup

### Step 1: Create AWS Account

1. Go to [https://aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Fill in registration form:
   - **Email address:** Your business email
   - **AWS account name:** TaxSyncForDrivers (or your company name)
   - **Password:** Strong password
4. Complete the verification process
5. Add payment method (required, but free tier covers most usage)

### Step 2: Access SES Console

1. Sign in to AWS Management Console
2. Search for "SES" in the services search bar
3. Click on "Amazon Simple Email Service"
4. **Important:** Select your preferred region (e.g., **us-east-2** Ohio)

---

## Part 2: Domain and Email Verification

### Step 1: Verify Domain

1. Navigate to **Configuration** → **Verified identities**
2. Click **"Create identity"** button
3. Select **"Domain"**
4. Enter domain information:
   - **Domain:** `isaloumapps.com`
   - **Assign a default configuration set:** (leave unchecked for now)
   - **Use a custom MAIL FROM domain:** (optional, leave unchecked)
   - **Advanced DKIM settings:**
     - Check **"Enabled"**
     - **Identity type:** Easy DKIM
     - **DKIM signing key length:** 2048-bit
5. Click **"Create identity"**

### Step 2: Configure DNS Records

AWS SES will provide DNS records that you need to add to your domain:

**DKIM Records (3 CNAME records):**
```
Name: [random]._domainkey.isaloumapps.com
Type: CNAME
Value: [random].dkim.amazonses.com
```

**SPF Record (TXT record):**
```
Name: isaloumapps.com
Type: TXT
Value: v=spf1 include:amazonses.com ~all
```

**DMARC Record (TXT record - optional but recommended):**
```
Name: _dmarc.isaloumapps.com
Type: TXT
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@isaloumapps.com
```

1. Log in to your domain registrar (e.g., Namecheap, GoDaddy, CloudFlare)
2. Navigate to DNS settings
3. Add all the DNS records provided by AWS
4. Save changes
5. Wait 10-60 minutes for DNS propagation

### Step 3: Verify Email Address

1. In SES Console, navigate to **Configuration** → **Verified identities**
2. Click **"Create identity"**
3. Select **"Email address"**
4. Enter: `notifications@isaloumapps.com`
5. Click **"Create identity"**
6. Check your inbox for verification email
7. Click the verification link in the email

---

## Part 3: IAM Credentials Setup

### Step 1: Create IAM User

1. Navigate to **IAM Console** (search for "IAM" in services)
2. Click **"Users"** in the left sidebar
3. Click **"Create user"**
4. Enter user details:
   - **User name:** `taxsync-ses-sender`
   - **Access type:** Programmatic access
5. Click **"Next"**

### Step 2: Attach SES Permissions

1. Select **"Attach policies directly"**
2. Search for and select **"AmazonSESFullAccess"**
   - Or create a custom policy with minimal permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       }
     ]
   }
   ```
3. Click **"Next"**
4. Review and click **"Create user"**

### Step 3: Create Access Keys

1. Click on the newly created user
2. Go to **"Security credentials"** tab
3. Scroll down to **"Access keys"**
4. Click **"Create access key"**
5. Select use case: **"Application running outside AWS"**
6. Click **"Next"** and **"Create access key"**
7. **IMPORTANT:** Save these credentials securely:
   - **Access Key ID:** (e.g., AKIAIOSFODNN7EXAMPLE)
   - **Secret Access Key:** (e.g., wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY)
8. You won't be able to view the secret key again!

---

## Part 4: Move Out of Sandbox Mode

By default, AWS SES starts in **sandbox mode**, which means:
- ❌ Can only send to verified email addresses
- ❌ Limited to 200 emails per 24 hours
- ❌ Limited to 1 email per second

To send to any email address, request production access:

### Step 1: Request Production Access

1. In SES Console, go to **Account dashboard**
2. Click **"Request production access"** button
3. Fill out the request form:
   - **Mail type:** Transactional
   - **Website URL:** https://isaloum.github.io/TaxSyncForDrivers/
   - **Use case description:**
     ```
     TaxSync email automation system for processing tax documents.
     Users forward tax documents (T4, receipts, etc.) to our email address.
     We process documents using AI and send back automated tax calculations.
     All emails are transactional responses to user-initiated requests.
     Expected volume: 100-500 emails per month initially.
     ```
   - **How you handle bounces/complaints:**
     ```
     We use AWS SES bounce and complaint notifications.
     We maintain a suppression list and immediately stop sending to 
     addresses that bounce or complain.
     ```
   - **Acknowledge compliance:** Check the box
4. Click **"Submit request"**
5. Wait for AWS review (usually 24-48 hours)

---

## Part 5: Configuration and Testing

### Step 1: Configure Environment Variables

Add these to your `.env` file:

```env
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
SES_FROM_DOMAIN=isaloumapps.com
TAXSYNC_FROM_EMAIL=notifications@isaloumapps.com
```

### Step 2: Test Email Sending

Create a test script:

```javascript
// test-ses.js
import { sendFromTaxSync } from './aws-ses-service.js';

const testEmail = async () => {
  try {
    const result = await sendFromTaxSync({
      to: 'your-test-email@example.com',
      subject: 'Test Email from TaxSync',
      html: '<h1>Hello!</h1><p>This is a test email from AWS SES.</p>',
      text: 'Hello! This is a test email from AWS SES.',
    });
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};

testEmail();
```

Run the test:
```bash
node test-ses.js
```

### Step 3: Monitor Email Activity

1. In SES Console, go to **Reputation metrics**
2. Monitor:
   - Bounce rate (should be < 5%)
   - Complaint rate (should be < 0.1%)
   - Sending volume

---

## Part 6: Email Receiving (Optional)

If you need to receive emails at `notifications@isaloumapps.com`:

### Step 1: Create Receipt Rule Set

1. Navigate to **Email receiving** → **Rule sets**
2. Click **"Create rule set"**
3. Give it a name: `taxsync-receipt-rules`
4. Set as active rule set

### Step 2: Create Receipt Rule

1. Click **"Create rule"**
2. Add recipients: `notifications@isaloumapps.com`
3. Add actions:
   - **Option A - SNS Topic:** For webhook notifications
   - **Option B - S3 Bucket:** To store incoming emails
   - **Option C - Lambda:** To process emails directly
4. For webhook integration, use SNS → HTTP/HTTPS subscription
5. Save the rule

### Step 3: Configure MX Records

Add MX record to your DNS:
```
Type: MX
Name: isaloumapps.com
Priority: 10
Value: inbound-smtp.us-east-2.amazonaws.com
```

---

## Troubleshooting

### Issue: DNS Records Not Verified

**Solution:**
- Wait up to 72 hours for DNS propagation
- Use `dig` or `nslookup` to verify records:
  ```bash
  dig TXT isaloumapps.com
  dig CNAME [dkim-key]._domainkey.isaloumapps.com
  ```

### Issue: Emails Going to Spam

**Solutions:**
- Ensure DKIM is enabled and verified
- Add SPF and DMARC records
- Maintain good sender reputation
- Avoid spam-like content
- Warm up your sending (start slow, increase gradually)

### Issue: "Email address not verified"

**Solution:**
- In sandbox mode, verify recipient emails too
- Or request production access

### Issue: Rate limiting errors

**Solution:**
- Default limit is 1 email/second in sandbox
- Request production access for higher limits
- Or contact AWS support to increase sending quota

---

## Best Practices

✅ **Always use DKIM signing** for email authentication  
✅ **Monitor bounce and complaint rates** regularly  
✅ **Set up SNS notifications** for bounces and complaints  
✅ **Use a suppression list** to avoid sending to bad addresses  
✅ **Start with low volume** and gradually increase  
✅ **Never share your AWS credentials** in code or repositories  
✅ **Use IAM roles** instead of access keys when possible  
✅ **Enable CloudWatch logging** for debugging  

---

## Additional Resources

- [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/)
- [AWS SES API Reference](https://docs.aws.amazon.com/ses/latest/APIReference/)
- [Email Authentication Best Practices](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication.html)
- [AWS SES Pricing](https://aws.amazon.com/ses/pricing/)

---

## Support

For AWS SES support:
- [AWS Support Center](https://console.aws.amazon.com/support/)
- [AWS SES Forums](https://forums.aws.amazon.com/forum.jspa?forumID=90)
- [AWS Documentation](https://docs.aws.amazon.com/ses/)
