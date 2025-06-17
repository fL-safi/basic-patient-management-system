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
				validator: function(v) {
					// CNIC format: 12345-1234567-1 (13 digits with dashes)
					return /^\d{5}-\d{7}-\d{1}$/.test(v);
				},
				message: 'CNIC must be in format: 12345-1234567-1'
			}
		},
		role: {
			type: String,
			enum: ["doctor", "pharmacist", "admin", "operator"],
			default: "doctor",
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
	},
	{ timestamps: true }
);

export const User = mongoose.model("User", userSchema);