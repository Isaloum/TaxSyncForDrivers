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
- **Trust Policy:** AWS
