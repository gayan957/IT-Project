import mongoose from 'mongoose';

const recyclerSchema = new mongoose.Schema(
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
        facilityName: {
            type: String,
            required: true
        },
        recyclerId: {
            type: String,
            unique: true
        },
        facilityLicense: {
            type: String
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
            default: 'recycler', 
            immutable: true 
        }
    },
    { 
        timestamps: true 
    }
);

export default mongoose.model('Recycler', recyclerSchema);
