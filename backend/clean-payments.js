import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './src/config/db.js';
import Payment from './src/models/Payment.js';

console.log('🧹 Cleaning payment collection and recreating indexes...');

async function cleanAndSetupPayments() {
  try {
    const dbConnected = await connectDB(process.env.MONGO_URI);
    
    if (!dbConnected) {
      console.error('❌ Could not connect to database');
      process.exit(1);
    }

    // Drop the entire payments collection to clear any problematic data
    await Payment.collection.drop().catch(() => {
      console.log('ℹ️ Payments collection does not exist yet');
    });
    
    console.log('✅ Payments collection cleared');
    
    // Recreate indexes by saving a dummy document and removing it
    const dummyPayment = new Payment({
      orderId: 'DUMMY_TEMP_' + Date.now(),
      merchantId: 'dummy',
      amount: 1,
      currency: 'LKR',
      status: 'SUCCESS',
      statusCode: '2',
      verified: true
    });
    
    await dummyPayment.save();
    await Payment.findByIdAndDelete(dummyPayment._id);
    
    console.log('✅ Indexes recreated successfully');
    console.log('✅ Ready for payment data');

  } catch (error) {
    console.error('❌ Error cleaning payments:', error);
  } finally {
    process.exit(0);
  }
}

cleanAndSetupPayments();