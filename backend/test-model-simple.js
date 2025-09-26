console.log('Testing AgentBin model...');

import('./src/models/AgentBin.js').then(({ default: AgentBin }) => {
    console.log('✅ AgentBin model loaded successfully');
    console.log('📋 Model schema:', Object.keys(AgentBin.schema.paths));
    
    // Test creating an instance (without saving)
    const testInstance = new AgentBin({
        agentId: '507f1f77bcf86cd799439011',
        binId: '507f1f77bcf86cd799439012', 
        partnerId: '507f1f77bcf86cd799439013',
        wasteType: 'plastic',
        wasteWeight: 2.5,
        pricePerKg: 25,
        totalPrice: 62.5,
        fillLevelBefore: 85,
        binLocation: {
            latitude: 6.9271,
            longitude: 79.8612,
            address: 'Test Location'
        }
    });
    
    console.log('✅ Test instance created');
    console.log('🔍 Validation errors:', testInstance.validateSync());
    process.exit(0);
}).catch(error => {
    console.error('❌ Error loading AgentBin model:', error);
    process.exit(1);
});