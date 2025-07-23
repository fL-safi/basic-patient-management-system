import { Inventory } from "../models/inventory.model.js";
import mongoose from "mongoose";

export const addToStock = async (req, res) => {
    try {
        const {
            batchNumber,
            billID,
            medicines, // Array of medicine objects
            overallPrice,
            attachments = [],
            miscellaneousAmount = 0 // Add support for miscellaneous amount
        } = req.body;

        // Validate required fields
        if (!batchNumber || !billID || !medicines || !Array.isArray(medicines) || medicines.length === 0 || !overallPrice) {
            return res.status(400).json({
                success: false,
                message: "All fields are required. Medicines must be a non-empty array."
            });
        }

        // Validate miscellaneous amount
        if (miscellaneousAmount < 0) {
            return res.status(400).json({
                success: false,
                message: "Miscellaneous amount cannot be negative"
            });
        }

        // Validate each medicine in the array
        for (const medicine of medicines) {
            const { medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel } = medicine;
            
            if (!medicineName || !quantity || !price || !expiryDate || !dateOfPurchase || reorderLevel === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "All medicine fields are required: medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel"
                });
            }

            if (quantity <= 0 || price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity and price must be greater than 0"
                });
            }

            // Calculate total amount for each medicine
            medicine.totalAmount = quantity * price;
        }

        // Calculate total medicines price
        const totalMedicinesPrice = medicines.reduce((sum, medicine) => sum + medicine.totalAmount, 0);
        
        // Validate price matching with miscellaneous amount
        const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
        const priceDifference = Math.abs(totalWithMiscellaneous - overallPrice);
        
        if (priceDifference > 0.01) { // Allow small floating point tolerance
            return res.status(400).json({
                success: false,
                message: `Total medicines price (${totalMedicinesPrice}) plus miscellaneous amount (${miscellaneousAmount}) must equal overall price (${overallPrice})`
            });
        }

        // Check if batch already exists
        const existingBatch = await Inventory.findOne({ batchNumber });

        if (existingBatch) {
            return res.status(400).json({
                success: false,
                message: "Batch number already exists. Please use a different batch number."
            });
        }

        // Create new batch
        const newBatch = new Inventory({
            batchNumber,
            billID,
            medicines,
            overallPrice,
            miscellaneousAmount,
            attachments,
            createdBy: req.user.id // Assuming user info is available from auth middleware
        });

        await newBatch.save();

        return res.status(201).json({
            success: true,
            message: `New batch created successfully with ${medicines.length} medicines${miscellaneousAmount > 0 ? ' and miscellaneous amount' : ''}`,
            data: newBatch
        });

    } catch (error) {
        console.error("Error in addToStock:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Batch number already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const stockList = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 1000,
            search = "",
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        // Build search query
        const searchQuery = {};

        // Text search across batch number, bill ID, or medicine names
        if (search) {
            searchQuery.$or = [
                { batchNumber: { $regex: search, $options: "i" } },
                { billID: { $regex: search, $options: "i" } },
                { "medicines.medicineName": { $regex: search, $options: "i" } }
            ];
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query with pagination
        const [batches, totalCount] = await Promise.all([
            Inventory.find(searchQuery)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'name email')
                .lean(),
            Inventory.countDocuments(searchQuery)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        // Add status and additional info to each batch
        const enrichedBatches = batches.map(batch => {
            const totalMedicines = batch.medicines.length;
            const totalQuantity = batch.medicines.reduce((sum, med) => sum + med.quantity, 0);
            const totalMedicinesPrice = batch.medicines.reduce((sum, med) => sum + med.totalAmount, 0);
            const lowStockMedicines = batch.medicines.filter(med => med.quantity <= med.reorderLevel).length;
            const expiredMedicines = batch.medicines.filter(med => new Date(med.expiryDate) < new Date()).length;

            return {
                ...batch,
                summary: {
                    totalMedicines,
                    totalQuantity,
                    totalMedicinesPrice,
                    miscellaneousAmount: batch.miscellaneousAmount || 0,
                    lowStockMedicines,
                    expiredMedicines,
                    batchStatus: lowStockMedicines > 0 ? "Has Low Stock" : expiredMedicines > 0 ? "Has Expired Items" : "Good"
                }
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                batches: enrichedBatches,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalBatches: totalCount,
                    totalMedicines: enrichedBatches.reduce((sum, batch) => sum + batch.summary.totalMedicines, 0),
                    totalMiscellaneousAmount: enrichedBatches.reduce((sum, batch) => sum + batch.summary.miscellaneousAmount, 0),
                    batchesWithLowStock: enrichedBatches.filter(batch => batch.summary.lowStockMedicines > 0).length,
                    batchesWithExpiredItems: enrichedBatches.filter(batch => batch.summary.expiredMedicines > 0).length
                }
            }
        });

    } catch (error) {
        console.error("Error in stockList:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const allStocksList = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 1000,
            search = "",
            sortBy = "medicineName",
            sortOrder = "asc"
        } = req.query;

        // Build aggregation pipeline to flatten medicines across all batches
        const pipeline = [];

        // Unwind medicines array to treat each medicine as a separate document
        pipeline.push({ $unwind: "$medicines" });

        // Match stage for filtering
        const matchStage = {};
        if (search) {
            matchStage.$or = [
                { "medicines.medicineName": { $regex: search, $options: "i" } },
                { batchNumber: { $regex: search, $options: "i" } },
                { billID: { $regex: search, $options: "i" } }
            ];
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        // Group by medicine name to aggregate quantities across batches
        pipeline.push({
            $group: {
                _id: "$medicines.medicineName",
                totalQuantity: { $sum: "$medicines.quantity" },
                totalValue: { $sum: "$medicines.totalAmount" },
                batches: {
                    $push: {
                        batchNumber: "$batchNumber",
                        billID: "$billID",
                        quantity: "$medicines.quantity",
                        price: "$medicines.price",
                        expiryDate: "$medicines.expiryDate",
                        dateOfPurchase: "$medicines.dateOfPurchase",
                        reorderLevel: "$medicines.reorderLevel",
                        totalAmount: "$medicines.totalAmount"
                    }
                },
                avgPrice: { $avg: "$medicines.price" },
                minReorderLevel: { $min: "$medicines.reorderLevel" },
                batchCount: { $sum: 1 }
            }
        });

        // Project to reshape output
        pipeline.push({
            $project: {
                _id: 0,
                medicineName: "$_id",
                totalQuantity: 1,
                totalValue: 1,
                avgPrice: { $round: ["$avgPrice", 2] },
                batchCount: 1,
                batches: 1,
                reorderLevel: "$minReorderLevel",
                status: {
                    $cond: {
                        if: { $lte: ["$totalQuantity", "$minReorderLevel"] },
                        then: "Low Stock",
                        else: "In Stock"
                    }
                }
            }
        });

        // Sort stage
        const sortObj = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
        pipeline.push({ $sort: sortObj });

        // Get total count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Inventory.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Execute aggregation
        const medicines = await Inventory.aggregate(pipeline);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        return res.status(200).json({
            success: true,
            data: {
                medicines,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalMedicines: totalCount,
                    lowStockMedicines: medicines.filter(item => item.status === "Low Stock").length,
                    totalBatches: medicines.reduce((sum, item) => sum + item.batchCount, 0),
                    totalInventoryValue: medicines.reduce((sum, item) => sum + item.totalValue, 0)
                }
            }
        });

    } catch (error) {
        console.error("Error in allStocksList:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deleteStockById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
        }

        // Find and delete the batch
        const deletedBatch = await Inventory.findByIdAndDelete(id);

        if (!deletedBatch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Batch deleted successfully`,
            data: {
                deletedBatch: {
                    id: deletedBatch._id,
                    batchNumber: deletedBatch.batchNumber,
                    billID: deletedBatch.billID,
                    medicineCount: deletedBatch.medicines.length,
                    overallPrice: deletedBatch.overallPrice
                }
            }
        });

    } catch (error) {
        console.error("Error in deleteStockById:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const updateBatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
        }

        // Check if batch exists
        const existingBatch = await Inventory.findById(id);
        if (!existingBatch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        // If batchNumber is being updated, check for uniqueness
        if (updateData.batchNumber && updateData.batchNumber !== existingBatch.batchNumber) {
            const batchExists = await Inventory.findOne({ 
                batchNumber: updateData.batchNumber,
                _id: { $ne: id } // Exclude current batch
            });
            
            if (batchExists) {
                return res.status(400).json({
                    success: false,
                    message: "Batch number already exists. Please use a different batch number."
                });
            }
        }

        // Validate medicines array if provided
        if (updateData.medicines) {
            if (!Array.isArray(updateData.medicines)) {
                return res.status(400).json({
                    success: false,
                    message: "Medicines must be an array"
                });
            }

            // Validate each medicine in the array
            for (const medicine of updateData.medicines) {
                const { medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel } = medicine;
                
                if (!medicineName || !quantity || !price || !expiryDate || !dateOfPurchase || reorderLevel === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: "All medicine fields are required: medicineName, quantity, price, expiryDate, dateOfPurchase, reorderLevel"
                    });
                }

                if (quantity <= 0 || price <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Quantity and price must be greater than 0"
                    });
                }

                // Calculate total amount for each medicine
                medicine.totalAmount = quantity * price;
            }
        }

        // Validate miscellaneous amount if provided
        if (updateData.miscellaneousAmount !== undefined && updateData.miscellaneousAmount < 0) {
            return res.status(400).json({
                success: false,
                message: "Miscellaneous amount cannot be negative"
            });
        }

        // Validate other numeric fields if provided
        if (updateData.overallPrice !== undefined && updateData.overallPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Overall price must be greater than or equal to 0"
            });
        }

        // If both medicines and miscellaneous amount are being updated, validate total
        if (updateData.medicines && updateData.overallPrice !== undefined) {
            const totalMedicinesPrice = updateData.medicines.reduce((sum, medicine) => sum + medicine.totalAmount, 0);
            const miscellaneousAmount = updateData.miscellaneousAmount || 0;
            const totalWithMiscellaneous = totalMedicinesPrice + miscellaneousAmount;
            const priceDifference = Math.abs(totalWithMiscellaneous - updateData.overallPrice);
            
            if (priceDifference > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: `Total medicines price (${totalMedicinesPrice}) plus miscellaneous amount (${miscellaneousAmount}) must equal overall price (${updateData.overallPrice})`
                });
            }
        }

        // Update the batch with partial data
        const updatedBatch = await Inventory.findByIdAndUpdate(
            id,
            updateData,
            { 
                new: true, // Return updated document
                runValidators: true // Run schema validators
            }
        ).populate('createdBy', 'name email');

        return res.status(200).json({
            success: true,
            message: "Batch updated successfully",
            data: updatedBatch
        });

    } catch (error) {
        console.error("Error in updateBatchById:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Batch number already exists"
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get batch by ID
export const getBatchById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if ID is provided
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Batch ID is required"
            });
        }

        // Find the batch by ID
        const batch = await Inventory.findById(id).populate('createdBy', 'name email');
        
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Batch retrieved successfully",
            data: batch
        });

    } catch (error) {
        console.error("Error in getBatchById:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid batch ID format"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};