#!/bin/bash

# Script to create a test admin user for finance dashboard testing

API_BASE_URL="http://localhost:5000/api"

echo "🔧 Creating test admin user..."

# Create test admin
ADMIN_DATA='{
  "name": "Test Admin",
  "email": "admin@test.com",
  "password": "password123"
}'

echo "📝 Registering admin with data: $ADMIN_DATA"

REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/admin/register" \
  -H "Content-Type: application/json" \
  -d "$ADMIN_DATA")

echo "📋 Registration response: $REGISTER_RESPONSE"

# Test login with the new admin
echo ""
echo "🔐 Testing login with new admin..."

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password123"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ ! -z "$TOKEN" ]; then
    echo "✅ Admin created and login successful!"
    echo "🔑 Token: ${TOKEN:0:30}..."
    
    # Now test the finance endpoints
    echo ""
    echo "📊 Testing waste orders stats..."
    STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/waste-orders/stats" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Stats: $STATS_RESPONSE"
    
    echo ""
    echo "📦 Testing waste orders list..."
    ORDERS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/waste-orders?limit=5" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Orders (first 300 chars): ${ORDERS_RESPONSE:0:300}..."
    
    echo ""
    echo "🌐 Visit http://localhost:5174/admin/login"
    echo "📧 Email: admin@test.com"
    echo "🔒 Password: password123"
else
    echo "❌ Failed to create or login admin"
fi