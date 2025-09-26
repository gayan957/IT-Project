import mongoose from 'mongoose';

const pickUpAgentSchema = new mongoose.Schema(
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
        agentId: {
            type: String,
            unique: true
        },
        partnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PickUpPartner',
            required: true
        },
        vehicleNumber: {
            type: String
        },
        assignedArea: {
            type: String
        },
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },
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
            default: 'pickupagent', 
            immutable: true 
        }
    },
    { 
        timestamps: true 
    }
);

export default mongoose.model('PickUpAgent', pickUpAgentSchema);
