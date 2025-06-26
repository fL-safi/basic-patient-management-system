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
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    price: { // This will be the selling price
      type: Number,
      required: true,
    },
    buyingCost: { // New field
      type: Number,
      required: true,
    },
    dateOfPurchase: { // New field
      type: Date,
      required: true,
    },
    billID: { // New field
      type: String,
      required: true,
    },
    reorderLevel: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Create a compound index for efficient querying
inventorySchema.index({ medicineName: 1, strength: 1, form: 1, batchNumber: 1 });

export const Inventory = mongoose.model("Inventory", inventorySchema);