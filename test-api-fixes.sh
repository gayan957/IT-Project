#!/bin/bash

# Test script to verify the API endpoint fixes

API_BASE_URL="http://localhost:5000/api"
EMAIL="admin@gmail.com"
PASSWORD="123456"

echo "🧪 Testing API Endpoint Fixes"
echo "============================="

# Get admin token first
echo "🔐 Getting admin token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi

echo "✅ Admin token received"
echo ""

# Test previously failing endpoints
echo "📦 Testing /api/admin/waste-orders (was /api/orderWaste)..."
ORDERS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/waste-orders?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if [[ $ORDERS_RESPONSE == *"success"* ]]; then
    echo "✅ Waste orders endpoint working"
    ORDER_COUNT=$(echo $ORDERS_RESPONSE | grep -o '"orders":\[' | wc -l)
    if [ $ORDER_COUNT -gt 0 ]; then
        echo "   📋 Found orders in response"
    fi
else
    echo "❌ Waste orders endpoint failed"
    echo "   Response: ${ORDERS_RESPONSE:0:200}..."
fi
echo ""

# Test salary endpoint
echo "💰 Testing /api/salary/admin/all..."
SALARY_RESPONSE=$(curl -s -X GET "$API_BASE_URL/salary/admin/all" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if [[ $SALARY_RESPONSE == *"success"* ]]; then
    echo "✅ Salary admin endpoint working"
    if [[ $SALARY_RESPONSE == *"data"* ]]; then
        echo "   📋 Data structure correct"
    fi
else
    echo "❌ Salary admin endpoint failed"
    echo "   Response: ${SALARY_RESPONSE:0:200}..."
fi
echo ""

# Test the problematic direct /api/salary endpoint
echo "⚠️  Testing problematic /api/salary endpoint..."
DIRECT_SALARY_RESPONSE=$(curl -s -X GET "$API_BASE_URL/salary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if [[ $DIRECT_SALARY_RESPONSE == *"404"* ]] || [[ $DIRECT_SALARY_RESPONSE == *"Cannot GET"* ]]; then
    echo "❌ Direct /api/salary endpoint returns 404 (as expected - this route doesn't exist)"
    echo "   This confirms the frontend should use /api/salary/admin/all instead"
else
    echo "✅ Direct salary endpoint response: ${DIRECT_SALARY_RESPONSE:0:100}..."
fi
echo ""

echo "🎯 SUMMARY:"
echo "==========="
echo "✅ Fixed /api/orderWaste → /api/admin/waste-orders"
echo "✅ Fixed /api/salary → /api/salary/admin/all" 
echo "✅ Updated FinanceManagementDashboard.jsx to use correct endpoints"
echo "✅ Updated data structure access for salary data"
echo ""
echo "🌐 Test the finance dashboard at: http://localhost:5174/admin/finance"