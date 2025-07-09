import mongoose from "mongoose";

// Schema for individual medicines within a batch
const batchMedicineSchema = new mongoose.Schema({
  medicineName: { 
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  price: { // Selling price per unit
    type: Number,
    required: true,
    min: 0,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  dateOfPurchase: {
    type: Date,
    required: true,
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  }
}, { _id: true });

// Main inventory schema for batch management
const inventorySchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      unique: true,
    },
    billID: {
      type: String,
      required: true,
    },
    medicines: [batchMedicineSchema], // Array of medicines in this batch
    overallPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }
  },
  { timestamps: true }
);

// Create indexes for efficient querying
inventorySchema.index({ batchNumber: 1 });
inventorySchema.index({ billID: 1 });
inventorySchema.index({ "medicines.medicineName": 1 });
inventorySchema.index({ createdAt: -1 });

export const Inventory = mongoose.model("Inventory", inventorySchema);