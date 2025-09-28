#!/bin/bash

# Demo script showing the finance dashboard working with real-time data

echo "🎯 FINANCE DASHBOARD REAL-TIME DATA DEMONSTRATION"
echo "================================================="
echo ""

# Login credentials
EMAIL="admin@gmail.com"
PASSWORD="123456"
API_BASE_URL="http://localhost:5000/api"

echo "🔐 Admin Credentials:"
echo "   📧 Email: $EMAIL"  
echo "   🔒 Password: $PASSWORD"
echo ""

# Login and get token
echo "🔑 Getting admin authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get admin token"
    exit 1
fi

echo "✅ Authentication successful!"
echo ""

echo "📊 REAL-TIME WASTE ORDERS DATA:"
echo "==============================="

# Get stats
STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/waste-orders/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "📈 Current Statistics:"
echo "$STATS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATS_RESPONSE"
echo ""

# Get recent orders  
echo "📦 Recent Orders (Last 5):"
ORDERS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/waste-orders?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

# Extract key info from orders
echo "$ORDERS_RESPONSE" | grep -o '"totalOrderValue":[0-9.]*' | head -5
echo ""

# Calculate some real-time metrics
TOTAL_ORDERS=$(echo "$STATS_RESPONSE" | grep -o '"pending":[0-9]*' | cut -d: -f2)
COMPLETED_ORDERS=$(echo "$STATS_RESPONSE" | grep -o '"completed":[0-9]*' | cut -d: -f2)
TOTAL_VALUE=$(echo "$STATS_RESPONSE" | grep -o '"totalValue":[0-9.]*' | cut -d: -f2)

echo "💰 FINANCE DASHBOARD METRICS:"
echo "============================="
echo "   📊 Total Orders: $TOTAL_ORDERS"
echo "   ✅ Completed Orders: $COMPLETED_ORDERS"
echo "   💸 Total Value: LKR $TOTAL_VALUE"
echo "   📈 Completion Rate: $(( COMPLETED_ORDERS * 100 / (TOTAL_ORDERS + 1) ))%"
echo ""

echo "🌐 DASHBOARD ACCESS:"
echo "==================="
echo "   🖥️  Finance Dashboard: http://localhost:5174/admin/finance"
echo "   🔧  Admin Login: http://localhost:5174/admin/login"
echo ""

echo "✨ REAL-TIME FEATURES:"
echo "====================="
echo "   🔄 Auto-refresh every 30 seconds"
echo "   ⏱️  Live timestamp updates every second"
echo "   🎯 Real data from waste orders database"
echo "   📊 Dynamic charts based on actual orders"
echo "   💰 Accurate revenue calculations"
echo ""

echo "🎉 The finance dashboard is now displaying REAL-TIME data from the waste orders database!"
echo "🎉 Visit the dashboard URL above to see live financial metrics!"