#!/bin/bash

# Test different admin credentials

API_BASE_URL="http://localhost:5000/api"

echo "🔐 Testing different admin credentials..."

# Test credentials combinations
declare -a emails=("admin@gmail.com" "admin@test.com")
declare -a passwords=("password123" "admin123" "password" "123456" "admin" "test123")

for email in "${emails[@]}"; do
    echo ""
    echo "📧 Testing email: $email"
    
    for password in "${passwords[@]}"; do
        echo -n "  🔑 Trying password '$password'... "
        
        LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/admin/login" \
          -H "Content-Type: application/json" \
          -d "{\"email\": \"$email\", \"password\": \"$password\"}")
        
        if [[ $LOGIN_RESPONSE == *"token"* ]]; then
            echo "✅ SUCCESS!"
            echo "📋 Response: $LOGIN_RESPONSE"
            
            # Extract token and test API
            TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
            
            echo ""
            echo "🧪 Testing API with this token..."
            STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/waste-orders/stats" \
              -H "Authorization: Bearer $TOKEN" \
              -H "Content-Type: application/json")
            
            echo "📊 Stats: $STATS_RESPONSE"
            
            echo ""
            echo "✅ Working credentials found!"
            echo "📧 Email: $email"
            echo "🔒 Password: $password"
            echo "🌐 Use these to login at: http://localhost:5174/admin/login"
            exit 0
        else
            echo "❌"
        fi
    done
done

echo ""
echo "❌ No working credentials found with common passwords."
echo "💡 You may need to reset admin passwords or create a new admin."