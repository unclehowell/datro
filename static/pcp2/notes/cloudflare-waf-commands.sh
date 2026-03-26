# Cloudflare WAF Rules - curl commands to fix POST blocking

## Step 1: Get your Zone ID
# Replace YOUR_ZONE_NAME with your actual domain (e.g., financecheque.uk)
curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=financecheque.uk" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

## Step 2: Get current WAF custom rules
# Replace ZONE_ID with your actual zone ID from Step 1
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

## Step 3: Get the ruleset ID for http_request_firewall_custom
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/rulesets?phase=http_request_firewall_custom" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

## Step 4: Create a new WAF rule to SKIP blocking for POST /api/* and /enquiry/*
# This rule will skip all WAF processing for API form submissions
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "skip",
    "action_parameters": {
      "products": ["bic", "rateLimit", "ua", "antiBot", "waf"]
    },
    "description": "Allow POST requests to /api/* and /enquiry/* paths",
    "filter": {
      "expression": "(http.request.uri.path contains \"/api\" or http.request.uri.path contains \"/enquiry\" or http.request.uri.path contains \"/submit\") and http.request.method eq \"POST\"",
      "enabled": true
    }
  }'

## Alternative: More specific rule matching the form submission paths
# Based on the R2R API documentation, the form submits to /api/submit-claim
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "skip",
    "action_parameters": {
      "products": ["waf"]
    },
    "description": "Allow R2R API form submissions",
    "filter": {
      "expression": "http.request.uri.path matches \"^/(api/submit-claim|enquiry|contact|submit)\" and http.request.method eq \"POST\"",
      "enabled": true
    }
  }'

## Step 5: List all rules to verify
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

## Step 6: Delete a rule if needed (replace RULE_ID)
curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/ZONE_ID/firewall/rules/RULE_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
