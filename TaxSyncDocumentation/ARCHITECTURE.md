# TaxSyncForDrivers - System Architecture Documentation

## System Overview
**Project Name:** Tax Document Processing System for Drivers  
**AWS Region:** us-east-1  
**Architecture:** Event-driven serverless document processing pipeline  
**Primary Use Case:** Processing email attachments (particularly tax documents) using AWS Textract

## Core Components

### 1. IAM Role Configuration
**Role Name:** `LambdaTextractS3Role`
- **ARN:** `arn:aws:iam::441393059130:role/LambdaTextractS3Role`
- **Purpose:** Enables Lambda functions to access AWS services for document processing
- **Trust Policy:** AWS Lambda service (lambda.amazonaws.com)
- **Session Duration:** 1 hour maximum

**Attached Policies:**
1. **LambdaTextractS3Policy** (Managed)
   - S3: GetObject, PutObject, ListBucket on `tax-sync-ihab-v3`
   - Textract: StartDocumentTextDetection, GetDocumentTextDetection
   - CloudWatch Logs: Create log groups/streams, put log events

2. **LambdaEnhancedPolicy** (Managed)
   - SNS: Publish to `email-processing-notifications` topic
   - DynamoDB: PutItem, GetItem, UpdateItem, Query, Scan on `ProcessedDocuments` table

3. **ProcessEmailAttachmentPolicy** (Inline)
   - CloudWatch Logs: Full permissions for us-east-1
   - S3: GetObject, PutObject, DeleteObject on `tax-sync-ihab-v3`
   - Textract: DetectDocumentText

### 2. Lambda Function
**Function Name:** `processEmailAttachment`
- **Runtime:** Python 3.11
- **Memory:** 512 MB
- **Timeout:** 300 seconds (5 minutes)
- **Handler:** `enhanced_lambda_function.lambda_handler`
- **Role:** LambdaTextractS3Role
- **Trigger:** S3 object creation events from `tax-sync-ihab-v3` bucket

### 3. S3 Bucket Storage
**Bucket Name:** `tax-sync-ihab-v3`
- **Purpose:** Email storage and document processing workspace
- **Encryption:** AES256 (Amazon S3-managed keys)
- **Versioning:** Disabled
- **Public Access:** Completely blocked
- **Object Ownership:** BucketOwnerEnforced

**Bucket Policy:**
- Allows Amazon SES to put objects (s3:PutObject permission)

**Lifecycle Rules:**
- **DeleteOldTestFiles:** Deletes objects with "test-" prefix after 30 days
- **TransitionToIA:** Moves "extracted-pdfs/" objects to Standard-IA after 90 days

**Current Contents (18 objects):**
- Email files (.eml format)
- PDF attachments in "extracted-pdfs/" directory
- Extracted text files
- SES setup notification file

### 4. DynamoDB Table
**Table Name:** `ProcessedDocuments`
- **Primary Key Schema:**
  - Partition Key: `DocumentId` (String)
  - Sort Key: `ProcessedDate` (String)
- **Billing Mode:** Pay-per-request
- **Current Status:** Active with 6 items (1,788 bytes)
- **Throughput:** 12,000 read units/sec, 4,000 write units/sec
- **Deletion Protection:** Disabled

### 5. SNS Topic
**Topic Name:** `email-processing-notifications`
- **ARN:** `arn:aws:sns:us-east-1:441393059130:email-processing-notifications`
- **Subscriptions:** 1 confirmed, 1 pending, 1 deleted
- **Delivery Policy:** 3 retries with 20-second delays
- **Access Policy:** Standard (account owner full control)

### 6. CloudWatch Logs
**Log Group:** `/aws/lambda/processEmailAttachment`
- **Class:** Standard
- **Stored Data:** 24,716 bytes
- **Metric Filters:** None configured
- **Retention:** Default (never expire)

## System Workflow

1. **Email Reception:** Amazon SES receives emails and stores them in S3 bucket
2. **Event Trigger:** S3 object creation triggers Lambda function
3. **Document Processing:** Lambda function processes email attachments using Textract
4. **Data Storage:** Processing results stored in DynamoDB table
5. **Notification:** SNS sends notifications about processing status
6. **Logging:** All activities logged to CloudWatch

## Key Features Implemented

- **Automated Email Processing:** SES integration for email reception
- **Document Text Extraction:** AWS Textract for OCR capabilities
- **Metadata Tracking:** DynamoDB for processing history
- **Cost Optimization:** Lifecycle policies for storage management
- **Security:** Proper IAM roles and blocked public access
- **Monitoring:** CloudWatch logging for troubleshooting
- **Notifications:** SNS for processing alerts

## File Organization
- **Raw emails:** Root level of S3 bucket
- **Processed PDFs:** `extracted-pdfs/` directory
- **Test files:** Prefixed with "test-" (auto-deleted after 30 days)

## Architecture Diagram

[Email] → [SES] → [S3 Bucket] → [Lambda] → [Textract] ↓ ↓ [CloudWatch] [DynamoDB] ↓ [SNS]

This system provides a complete serverless solution for processing tax documents and email attachments with proper security, monitoring, and cost optimization measures in place.

## Last Updated
January 31, 2026

