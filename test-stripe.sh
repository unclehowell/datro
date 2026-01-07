#!/bin/bash
# Test your Stripe key and see what data it returns

# Replace YOUR_KEY_HERE with your actual rk_live_... key
STRIPE_KEY=""

echo "Testing Stripe API..."
echo "===================="

# Fetch charges since Aug 9, 2024
RESPONSE=$(curl -s "https://api.stripe.com/v1/charges?limit=10&created[gte]=1723161600" \
  -u ${STRIPE_KEY}:)

echo "Number of charges found:"
echo "$RESPONSE" | jq '.data | length'

echo ""
echo "Charge details:"
echo "$RESPONSE" | jq '.data[] | {amount, currency, paid, status, description, created: .created | todate}'

echo ""
echo "Total GBP charges:"
TOTAL=$(echo "$RESPONSE" | jq '[.data[] | select(.paid == true and .status == "succeeded" and .currency == "gbp")] | map(.amount) | add // 0')
echo "Pence: $TOTAL"
echo "GBP: £$(echo "scale=2; $TOTAL / 100" | bc)"

