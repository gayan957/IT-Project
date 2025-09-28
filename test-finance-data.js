// Test script to create sample waste orders for finance dashboard demonstration
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Test admin credentials (you may need to adjust these)
const ADMIN_CREDENTIALS = {
    email: 'admin@ecowaste.com',
    password: 'admin123'
};

// Function to login as admin and get token
async function loginAsAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        
        const data = await response.json();
        
        if (data.token) {
            console.log('✅ Admin login successful');
            return data.token;
        } else {
            console.error('❌ Admin login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return null;
    }
}

// Function to get waste orders stats
async function getWasteOrderStats(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/waste-orders/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('📊 Waste Order Stats:', data);
        return data;
    } catch (error) {
        console.error('❌ Error fetching stats:', error.message);
        return null;
    }
}

// Function to get all waste orders
async function getAllWasteOrders(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/waste-orders?limit=10`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`📦 Found ${data.orders?.length || 0} waste orders`);
            console.log('📋 Orders summary:');
            data.orders?.forEach((order, index) => {
                console.log(`   ${index + 1}. Order ${order._id?.slice(-6)} - Status: ${order.orderStatus} - Value: LKR ${order.totalOrderValue}`);
            });
            return data.orders;
        } else {
            console.log('❌ Error fetching orders:', data.message);
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching orders:', error.message);
        return [];
    }
}

// Main test function
async function testFinanceDashboardData() {
    console.log('🧪 Testing Finance Dashboard Data...\n');
    
    // Login as admin
    const token = await loginAsAdmin();
    if (!token) {
        console.log('❌ Cannot proceed without admin token');
        return;
    }
    
    // Get current stats
    console.log('\n📊 Current Waste Order Statistics:');
    await getWasteOrderStats(token);
    
    // Get current orders
    console.log('\n📦 Current Waste Orders:');
    const orders = await getAllWasteOrders(token);
    
    if (orders.length === 0) {
        console.log('\n💡 No waste orders found. The finance dashboard will show zero values.');
        console.log('💡 To see real data, create some waste orders through the recycler dashboard.');
    } else {
        console.log('\n✅ Finance dashboard should now show real-time data from these orders!');
        
        // Calculate some basic stats for verification
        const totalRevenue = orders
            .filter(order => order.orderStatus === 'completed')
            .reduce((sum, order) => sum + (order.totalOrderValue || 0), 0);
        
        console.log(`💰 Total Revenue from completed orders: LKR ${totalRevenue.toFixed(2)}`);
        
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
            return acc;
        }, {});
        
        console.log('📈 Status breakdown:', statusCounts);
    }
    
    console.log('\n🌐 Visit http://localhost:5174/admin/finance to see the updated dashboard!');
}

// Run the test
testFinanceDashboardData().catch(console.error);