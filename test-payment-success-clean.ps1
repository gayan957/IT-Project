# Test Payment Success Flow - PowerShell Version
Write-Host "Testing Payment Success Flow..." -ForegroundColor Yellow

# Test URLs
$FRONTEND_URL = "http://localhost:5173"
$BACKEND_URL = "http://localhost:3000"

Write-Host "Testing Payment Success Page Access..." -ForegroundColor Yellow

# Test 1: Check if frontend is running
Write-Host "Test 1: Frontend server availability"
try {
    $response = Invoke-WebRequest -Uri $FRONTEND_URL -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "Frontend server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "Frontend server not accessible" -ForegroundColor Red
    Write-Host "Make sure to run: npm run dev in the frontend directory" -ForegroundColor Yellow
}

# Test 2: Check if backend is running
Write-Host "Test 2: Backend server availability"
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "Backend server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "Backend server not accessible" -ForegroundColor Red
    Write-Host "Make sure to run: npm start in the backend directory" -ForegroundColor Yellow
}

# Test 3: Create test collection data
Write-Host "Test 3: Creating test collection data"
$testData = @{
    scheduleId = "test-schedule-$(Get-Date -Format 'yyyyMMddHHmmss')"
    wasteType = "mixed"
    actualWeight = 5.5
    pricePerKg = 25.0
    totalPrice = 137.5
    scheduleLocation = @{
        latitude = 6.9271
        longitude = 79.8612
        address = "Test Payment Location"
    }
    notes = "Test collection for payment integration testing"
} | ConvertTo-Json -Depth 3

$testData | Out-File -FilePath "test-collection-data.json" -Encoding UTF8
Write-Host "Test collection data created: test-collection-data.json" -ForegroundColor Green

# Test URLs for manual testing
$TEST_URL_SUCCESS = "$FRONTEND_URL/payment-success?order_id=12345&payment_id=test_payment&status_code=2"
$TEST_URL_FAILED = "$FRONTEND_URL/payment-success?order_id=12345&payment_id=test_payment&status_code=-1"

Write-Host ""
Write-Host "Manual Testing Instructions:" -ForegroundColor Yellow
Write-Host "1. Open browser developer tools (F12)"
Write-Host "2. Go to Application/Storage -> Session Storage for localhost:5173"
Write-Host "3. Add key 'pendingCollectionData' with the JSON data from test-collection-data.json"
Write-Host "4. Test successful payment: $TEST_URL_SUCCESS" -ForegroundColor Green
Write-Host "5. Test failed payment: $TEST_URL_FAILED" -ForegroundColor Red
Write-Host ""

Write-Host "Expected Results:" -ForegroundColor Yellow
Write-Host "- Payment success page should load without errors"
Write-Host "- Collection data should be processed and saved"  
Write-Host "- Success message should be displayed"
Write-Host "- Navigation options should be available"
Write-Host "- Map refresh flag should be set in session storage"
Write-Host ""

Write-Host "Quick Setup Commands:" -ForegroundColor Cyan
Write-Host "Frontend: cd frontend; npm run dev"
Write-Host "Backend:  cd backend; npm start"
Write-Host ""

Write-Host "Payment success flow test setup complete!" -ForegroundColor Green