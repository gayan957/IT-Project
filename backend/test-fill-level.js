import mongoose from 'mongoose';
import Bin from './src/models/Bin.js';
import dotenv from 'dotenv';

dotenv.config();

async function testFillLevel() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trash2cash');
        console.log('Connected to MongoDB');

        // Get all bins to see their current fill levels
        const allBins = await Bin.find({}).select('fillLevel isActive wasteType address label');
        console.log('\n=== ALL BINS ===');
        console.log(`Total bins: ${allBins.length}`);
        allBins.forEach(bin => {
            console.log(`ID: ${bin._id}, Fill: ${bin.fillLevel}%, Active: ${bin.isActive}, Type: ${bin.wasteType}, Address: ${bin.address || bin.label || 'No address'}`);
        });

        // Test the old query (fillLevel > 75)
        const oldQuery = await Bin.find({ 
            fillLevel: { $gt: 75 },
            isActive: true 
        });
        console.log(`\n=== OLD QUERY (fillLevel > 75) ===`);
        console.log(`Bins found: ${oldQuery.length}`);

        // Test the new query (fillLevel >= 75)
        const newQuery = await Bin.find({ 
            fillLevel: { $gte: 75 },
            isActive: true 
        });
        console.log(`\n=== NEW QUERY (fillLevel >= 75) ===`);
        console.log(`Bins found: ${newQuery.length}`);
        newQuery.forEach(bin => {
            console.log(`ID: ${bin._id}, Fill: ${bin.fillLevel}%, Active: ${bin.isActive}`);
        });

        // Create a test bin with exactly 75% to demonstrate the fix
        console.log('\n=== CREATING TEST BIN WITH 75% FILL ===');
        // Find a user to be the owner (just use the first one)
        const User = (await import('./src/models/User.js')).default;
        const firstUser = await User.findOne({});
        
        if (firstUser) {
            // Create test bin with exactly 75% fill level
            const testBin = new Bin({
                owner: firstUser._id,
                location: {
                    type: 'Point',
                    coordinates: [79.8612, 6.9271]
                },
                fillLevel: 75,
                wasteType: 'mixed',
                label: 'Test Bin 75%',
                address: 'Test Location - 75% Fill',
                isActive: true
            });

            await testBin.save();
            console.log('Created test bin with exactly 75% fill level');

            // Test queries again after creating the 75% bin
            const oldQueryAfter = await Bin.find({ 
                fillLevel: { $gt: 75 },
                isActive: true 
            });
            console.log(`\n=== OLD QUERY AFTER (fillLevel > 75) ===`);
            console.log(`Bins found: ${oldQueryAfter.length}`);

            const newQueryAfter = await Bin.find({ 
                fillLevel: { $gte: 75 },
                isActive: true 
            });
            console.log(`\n=== NEW QUERY AFTER (fillLevel >= 75) ===`);
            console.log(`Bins found: ${newQueryAfter.length}`);
            newQueryAfter.forEach(bin => {
                console.log(`ID: ${bin._id}, Fill: ${bin.fillLevel}%, Address: ${bin.address || bin.label}`);
            });

            console.log(`\n=== SUMMARY ===`);
            console.log(`Old query (> 75): ${oldQueryAfter.length} bins`);
            console.log(`New query (>= 75): ${newQueryAfter.length} bins`);
            console.log(`The new query now includes bins with exactly 75% fill level!`);

            // Clean up: remove the test bin
            await Bin.findByIdAndDelete(testBin._id);
            console.log('Test bin removed');
        } else {
            console.log('No users found to create test bin');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testFillLevel();