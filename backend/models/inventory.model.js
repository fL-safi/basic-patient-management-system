import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
    },
    strength: {
      type: String,
      required: true,
    },
    form: {
      type: String,
      enum: ["tablet", "syrup", "ointment", "injection"],
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
    },
    stockLevel: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    reorderLevel: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Inventory = mongoose.model("Inventory", inventorySchema);
