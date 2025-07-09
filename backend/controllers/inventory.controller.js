import { Inventory } from "../models/inventory.model.js";
import mongoose from "mongoose";

export const addToStock = async (req, res) => {
    try {
        const {
            batchNumber,
            billID,
            medicines, // Array of medicine objects
            overallPrice
        } = req.body;

        // Validate required fields
        if (!batchNumber || !billID || !medicines || !Array.isArray(medicines) || medicines.length === 0 || !overallPrice) {
            return res.status(400).json({
                success: false,
                message: "All fields are required. Medicines must be a non-empty array."
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
            createdBy: req.user.id // Assuming user info is available from auth middleware
        });

        await newBatch.save();

        return res.status(201).json({
            success: true,
            message: `New batch created successfully with ${medicines.length} medicines`,
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
            limit = 10,
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
            const lowStockMedicines = batch.medicines.filter(med => med.quantity <= med.reorderLevel).length;
            const expiredMedicines = batch.medicines.filter(med => new Date(med.expiryDate) < new Date()).length;

            return {
                ...batch,
                summary: {
                    totalMedicines,
                    totalQuantity,
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
            limit = 10,
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

// Additional function to delete individual medicine from a batch
export const deleteMedicineFromBatch = async (req, res) => {
    try {
        const { batchId, medicineId } = req.params;

        if (!batchId || !medicineId) {
            return res.status(400).json({
                success: false,
                message: "Batch ID and Medicine ID are required"
            });
        }

        const batch = await Inventory.findById(batchId);
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found"
            });
        }

        const medicineIndex = batch.medicines.findIndex(med => med._id.toString() === medicineId);
        if (medicineIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Medicine not found in this batch"
            });
        }

        // Remove the medicine from the batch
        const removedMedicine = batch.medicines.splice(medicineIndex, 1)[0];
        
        // Update overall price
        batch.overallPrice -= removedMedicine.totalAmount;
        
        // If no medicines left, delete the entire batch
        if (batch.medicines.length === 0) {
            await Inventory.findByIdAndDelete(batchId);
            return res.status(200).json({
                success: true,
                message: "Medicine removed and batch deleted as it was empty",
                data: { removedMedicine }
            });
        }

        await batch.save();

        return res.status(200).json({
            success: true,
            message: "Medicine removed from batch successfully",
            data: { removedMedicine, updatedBatch: batch }
        });

    } catch (error) {
        console.error("Error in deleteMedicineFromBatch:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};