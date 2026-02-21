#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# BannerForge — AWS S3 Static Deploy Script
# Region: us-east-1
# Usage: bash deploy-bannerforge.sh
# Requires: AWS CLI configured (run `aws configure` first if not done)
# ─────────────────────────────────────────────────────────────────────────────

set -e

REGION="us-east-1"
BUCKET_NAME="bannerforge-$(openssl rand -hex 4)"  # unique name e.g. bannerforge-a1b2c3d4
HTML_FILE="banner-generator.html"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        BannerForge — S3 Deploy           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Preflight checks ─────────────────────────────────────────────────────────
echo "▶ Checking AWS CLI..."
if ! command -v aws &> /dev/null; then
  echo "✘ AWS CLI not found. Install it from https://aws.amazon.com/cli/ then run 'aws configure'"
  exit 1
fi

echo "▶ Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
  echo "✘ AWS credentials not configured. Run: aws configure"
  exit 1
fi

echo "▶ Checking for $HTML_FILE..."
if [ ! -f "$HTML_FILE" ]; then
  echo "✘ $HTML_FILE not found in current directory."
  echo "  Make sure banner-generator.html is in the same folder as this script."
  exit 1
fi

echo ""
echo "✔ All checks passed"
echo ""

# ── Create S3 bucket ──────────────────────────────────────────────────────────
echo "▶ Creating S3 bucket: $BUCKET_NAME"
aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$REGION" \
  > /dev/null

echo "▶ Disabling block public access..."
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "▶ Enabling static website hosting..."
aws s3api put-bucket-website \
  --bucket "$BUCKET_NAME" \
  --website-configuration '{
    "IndexDocument": {"Suffix": "banner-generator.html"},
    "ErrorDocument": {"Key": "banner-generator.html"}
  }'

echo "▶ Applying public read bucket policy..."
aws s3api put-bucket-policy \
  --bucket "$BUCKET_NAME" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\"
    }]
  }"

# ── Upload files ─────────────────────────────────────────────────────────────
echo "▶ Uploading banner-generator.html..."
aws s3 cp "$HTML_FILE" "s3://$BUCKET_NAME/banner-generator.html" \
  --content-type "text/html" \
  --region "$REGION"

if [ -f "defaults.json" ]; then
  echo "▶ Uploading defaults.json..."
  aws s3 cp "defaults.json" "s3://$BUCKET_NAME/defaults.json" \
    --content-type "application/json" \
    --region "$REGION"
  echo "✔ defaults.json uploaded — app will load with preset content"
else
  echo "ℹ No defaults.json found — app will start blank (that's fine)"
  echo "  To add defaults later: create defaults.json and re-run this script"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
URL="http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com/banner-generator.html"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  ✔  BannerForge deployed successfully!                              ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  🌐  URL: $URL"
echo "║                                                                      ║"
echo "║  Bucket: $BUCKET_NAME                           ║"
echo "║  Region: $REGION                                          ║"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  To update the app later, just re-run this script                   ║"
echo "║  or run:                                                             ║"
echo "║    aws s3 cp banner-generator.html s3://$BUCKET_NAME/ --content-type text/html"
echo "╠══════════════════════════════════════════════════════════════════════╣"
echo "║  To tear it all down and stop any charges:                          ║"
echo "║    aws s3 rb s3://$BUCKET_NAME --force                 ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Save bucket name to a local file for easy reference later
echo "$BUCKET_NAME" > .bannerforge-bucket
echo "  (Bucket name saved to .bannerforge-bucket for reference)"
echo ""
