const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist', 'radiologist', 'patient', 'accountant'],
        default: 'patient',
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'rejected', 'inactive'],
        default: function() {
            return this.role === 'patient' ? 'pending' : 'active';
        }
    },
    patientCardNumber: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
    },
    // Doctor-specific fields
    specialization: {
        type: String,
        sparse: true,
    },
    licenseNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    yearsOfExperience: {
        type: Number,
        sparse: true,
    },
}, { timestamps: true });

const stripSensitiveFields = (_, ret) => {
    delete ret.password;
    delete ret.patientCardNumber;
    delete ret.__v;
    return ret;
};

userSchema.set('toJSON', { transform: stripSensitiveFields });
userSchema.set('toObject', { transform: stripSensitiveFields });

module.exports = mongoose.model('User', userSchema);