#!/bin/bash

# Test Payment Success Flow
echo "🧪 Testing Payment Success Flow..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URLs
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"

echo -e "${YELLOW}🔍 Testing Payment Success Page Access...${NC}"

# Test 1: Direct access to payment success page (should handle gracefully)
echo "📍 Test 1: Direct access to payment success page"
curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/payment-success" > /tmp/test_result
RESULT=$(cat /tmp/test_result)

if [ "$RESULT" = "200" ]; then
    echo -e "${GREEN}✅ Payment success page accessible${NC}"
else
    echo -e "${RED}❌ Payment success page not accessible (HTTP $RESULT)${NC}"
fi

# Test 2: Test with mock payment parameters
echo "📍 Test 2: Testing with payment parameters"
TEST_URL="$FRONTEND_URL/payment-success?order_id=12345&payment_id=test_payment&status_code=2"
echo "🔗 Test URL: $TEST_URL"
echo -e "${YELLOW}Manual test: Open the above URL in your browser${NC}"

# Test 3: Check if backend collection endpoint is available
echo "📍 Test 3: Backend collection endpoint availability"
TOKEN=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"agent@test.com","password":"password123"}' | \
    grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
    
    # Test collection endpoint
    curl -s -X GET "$BACKEND_URL/api/agent-schedules/history" \
        -H "Authorization: Bearer $TOKEN" \
        -w "%{http_code}" > /tmp/backend_test
    
    BACKEND_RESULT=$(tail -c 3 /tmp/backend_test)
    if [ "$BACKEND_RESULT" = "200" ]; then
        echo -e "${GREEN}✅ Backend collection endpoint working${NC}"
    else
        echo -e "${RED}❌ Backend collection endpoint error (HTTP $BACKEND_RESULT)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Could not authenticate (test user may not exist)${NC}"
fi

# Test 4: Session storage test data
echo "📍 Test 4: Setting up test data in session storage"
cat > /tmp/test_collection_data.json << EOF
{
  "scheduleId": "test-schedule-$(date +%s)",
  "wasteType": "mixed",
  "actualWeight": 5.5,
  "pricePerKg": 25.0,
  "totalPrice": 137.5,
  "scheduleLocation": {
    "latitude": 6.9271,
    "longitude": 79.8612,
    "address": "Test Payment Location"
  },
  "notes": "Test collection for payment integration testing"
}
EOF

echo -e "${GREEN}✅ Test collection data prepared${NC}"
echo "📄 Test data location: /tmp/test_collection_data.json"

# Instructions for manual testing
echo ""
echo -e "${YELLOW}🧪 Manual Testing Instructions:${NC}"
echo "1. Open browser developer tools (F12)"
echo "2. Go to Application/Storage -> Session Storage"
echo "3. Set key 'pendingCollectionData' with value from /tmp/test_collection_data.json"
echo "4. Navigate to: $FRONTEND_URL/payment-success"
echo "5. Or test with parameters: $TEST_URL"
echo ""
echo -e "${GREEN}✅ Payment success flow test setup complete!${NC}"

# Clean up
rm -f /tmp/test_result /tmp/backend_test

echo ""
echo -e "${YELLOW}📋 Expected Results:${NC}"
echo "• Payment success page should load without errors"
echo "• Collection data should be processed and saved"
echo "• Success message should be displayed"
echo "• Navigation options should be available"
echo "• Map refresh flag should be set in session storage"