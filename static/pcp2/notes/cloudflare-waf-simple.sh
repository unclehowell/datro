# Cloudflare WAF Rules - Simple curl commands (Ruleset API)
# Run these commands to allow POST requests to API paths

# ================================================================================
# SETUP: Set these variables first
# ================================================================================
export CF_API_TOKEN="YOUR_API_TOKEN_HERE"
export CF_ZONE_ID="YOUR_ZONE_ID_HERE"

# ================================================================================
# STEP 1: Get current WAF Ruleset (check existing rules)
# ================================================================================
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/rulesets?phase=http_request_firewall_custom" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json"

# ================================================================================
# STEP 2: Add rule to skip WAF for POST /api/* paths
# ================================================================================
# This uses the ruleset API to add a rule that skips WAF for API form submissions
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/rulesets" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "allow-api-submissions",
    "phase": "http_request_firewall_custom",
    "rules": [
      {
        "action": "skip",
        "action_parameters": {
          "waf": true
        },
        "expression": "(http.request.uri.path contains \"/api/submit\" or http.request.uri.path contains \"/enquiry\" or http.request.uri.path contains \"/contact\") and http.request.method eq \"POST\"",
        "description": "Skip WAF for R2R form submissions"
      }
    ]
  }'

# ================================================================================
# Alternative: Simpler approach - just block known bad patterns instead
# ================================================================================
# If the above doesn't work, try listing existing rules first

# Get firewall rules (older API):
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json"

# Add new skip rule (older API):
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "skip",
    "action_parameters": {
      "products": ["waf"]
    },
    "description": "Allow R2R API form POST submissions",
    "filter": {
      "expression": "http.request.uri.path contains \"/api\" and http.request.method eq \"POST\"",
      "enabled": true
    }
  }'

# ================================================================================
# STEP 3: Test - should now work without DNS prohibited IP error
# ================================================================================
curl -s -X POST "https://car.financecheque.uk/api/submit-claim" \
  -H "Content-Type: application/json" \
  -d '{"title":"Mr","first_name":"Test"}'
