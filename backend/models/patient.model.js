import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        contactNumber: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        cnic: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function(v) {
                    // CNIC format: 12345-1234567-1 (13 digits with dashes)
                    return /^\d{5}-\d{7}-\d{1}$/.test(v);
                },
                message: 'CNIC must be in format: 12345-1234567-1'
            }
        },
        medicalHistory: {
            type: String,
            required: false,
        },
        prescriptions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Prescription',
        }],
        appointments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
        }]
    },
    { timestamps: true }
);

export const Patient = mongoose.model("Patient", patientSchema);
