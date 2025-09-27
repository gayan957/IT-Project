import mongoose from 'mongoose';
import Salary from './src/models/Salary.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkSalaryRecords() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log('📋 Checking salary records...');
    const salaries = await Salary.find().limit(5);
    
    console.log(`Found ${salaries.length} salary records:`);
    
    salaries.forEach((salary, index) => {
      console.log(`\n${index + 1}. Salary ID: ${salary._id}`);
      console.log(`   Employee: ${salary.employee?.name || 'N/A'}`);
      console.log(`   Agent ID: ${salary.employee?.agentId || 'N/A'}`);
      console.log(`   Email: ${salary.employee?.email || 'N/A'}`);
      console.log(`   Month: ${salary.attendance?.month || 'N/A'}`);
      console.log(`   Net Salary: Rs. ${salary.totals?.netSalary || 0}`);
      console.log(`   Created: ${salary.createdAt}`);
    });
    
    if (salaries.length > 0) {
      console.log(`\n✅ Use this salary ID for testing: ${salaries[0]._id}`);
    } else {
      console.log('\n❌ No salary records found. Create some salary records first.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkSalaryRecords();