import mongoose from 'mongoose';

const pickUpPartnerSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true
        },
        password: { 
            type: String, 
            required: true 
        },
        address: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        birthDate: {
            type: Date,
            required: true
        },
        companyName: {
            type: String,
            required: true
        },
        partnerId: {
            type: String,
            unique: true
        },
        businessLicense: {
            type: String
        },
        contactPerson: {
            type: String
        },
        serviceAreas: [{
            type: String
        }],
        vehicleFleet: [{
            vehicleId: String,
            type: String,
            capacity: Number,
            licensePlate: String
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        isLoggedIn: {
            type: Boolean,
            default: false
        },
        lastLoginTime: {
            type: Date
        },
        lastLogoutTime: {
            type: Date
        },
        role: { 
            type: String, 
            default: 'pickuppartner', 
            immutable: true 
        }
    },
    { 
        timestamps: true 
    }
);

export default mongoose.model('PickUpPartner', pickUpPartnerSchema);
