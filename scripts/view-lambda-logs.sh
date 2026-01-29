#!/bin/bash
# view-lambda-logs.sh - View Lambda function logs

REGION=${AWS_REGION:-us-east-2}
FUNCTION_NAME="taxsync-email-automation-dev-emailProcessor"

echo "Viewing logs for Lambda function: $FUNCTION_NAME"
echo "Region: $REGION"
echo ""
echo "Press Ctrl+C to stop"
echo ""

if command -v serverless &> /dev/null; then
    serverless logs -f emailProcessor --tail
else
    echo "Serverless Framework not found."
    echo "Install with: npm install -g serverless"
    echo ""
    echo "Or use AWS CLI:"
    echo "aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
fi
