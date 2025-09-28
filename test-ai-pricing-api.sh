#!/bin/bash

echo "Testing the new AI Forecasting pricing data endpoint..."

# Test the new combined pricing data endpoint
echo "1. Testing GET /api/admin/pricing-data"
curl -X GET "http://localhost:5000/api/admin/pricing-data" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-admin-token" \
  -s | jq '.'

echo -e "\n\nAPI test completed!"