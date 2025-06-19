import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    cnic: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          // CNIC format: 12345-1234567-1 (13 digits with dashes)
          return /^\d{5}-\d{7}-\d{1}$/.test(v);
        },
        message: "CNIC must be in format: 12345-1234567-1",
      },
    },
    role: {
      type: String,
      enum: [
        "admin",
        "doctor",
        "receptionist",
        "pharmacist_dispenser",
        "pharmacist_inventory",
      ],
      required: true,
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,

    // Profile-specific fields
    phoneNumber: {
      type: String,
      required: function () {
        return this.role !== "admin"; // Only required for non-admins
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      required: function () {
        return this.role !== "admin"; // Only required for non-admins
      },
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },
    address: {
      type: String,
      required: function () {
        return this.role !== "admin"; // Only required for non-admins
      },
    },

    // Medical related fields (for Doctors/Pharmacists/Receptionists)
    speciality: {
      type: String,
      required: function () {
        return this.role === "doctor"; // Only for doctors
      },
    },
    registrationNumber: {
      type: String,
      unique: true,
      required: function () {
        return this.role === "doctor"; // Only for doctors
      },
    },
    doctorSchedule: {
      type: [String], // e.g., ["Monday", "Tuesday", ...]
      required: function () {
        return this.role === "doctor"; // Only for doctors
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
