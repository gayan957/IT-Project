#!/bin/bash

# Test script to check waste orders API endpoints for finance dashboard

API_BASE_URL="http://localhost:5000/api"

echo "🧪 Testing Finance Dashboard Data..."
echo ""

# Test admin login
echo "🔐 Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecowaste.com", "password": "admin123"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response (assuming JSON format)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get admin token. Response: $LOGIN_RESPONSE"
    
    # Try with different credentials
    echo "🔐 Trying alternative admin credentials..."
    LOGIN_RESPONSE2=$(curl -s -X POST "$API_BASE_URL/auth/admin/login" \
      -H "Content-Type: application/json" \
      -d '{"email": "admin@example.com", "password": "password"}')
    
    echo "Alternative login response: $LOGIN_RESPONSE2"
    TOKEN=$(echo $LOGIN_RESPONSE2 | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
    
    if [ -z "$TOKEN" ]; then
        echo "❌ Could not authenticate as admin. Please check admin credentials."
        exit 1
    fi
fi

echo "✅ Admin authentication successful"
echo "Token (first 20 chars): ${TOKEN:0:20}..."
echo ""

# Test waste orders stats endpoint
echo "📊 Testing waste orders stats endpoint..."
STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/waste-orders/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Stats response: $STATS_RESPONSE"
echo ""

# Test waste orders list endpoint
echo "📦 Testing waste orders list endpoint..."
ORDERS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/waste-orders?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Orders response (first 500 chars): ${ORDERS_RESPONSE:0:500}..."
echo ""

# Count orders if response contains success field
if [[ $ORDERS_RESPONSE == *"\"success\":true"* ]]; then
    ORDER_COUNT=$(echo $ORDERS_RESPONSE | grep -o '"orders":\[' | wc -l)
    echo "✅ Successfully retrieved waste orders data"
else
    echo "⚠️  Issue retrieving waste orders: $ORDERS_RESPONSE"
fi

echo ""
echo "🌐 Finance dashboard at: http://localhost:5174/admin/finance"
echo "🔄 The dashboard should now display real-time data from these API endpoints!"