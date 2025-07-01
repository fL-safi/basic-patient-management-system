import { Inventory } from "../models/inventory.model.js";

export const addToStock = async (req, res) => {
    try {
        const {
            medicineName,
            strength,
            form,
            batchNumber,
            quantity, // New stock to add
            expiryDate,
            price, // Selling price
            buyingCost,
            dateOfPurchase,
            billID,
            reorderLevel
        } = req.body;

        // Validate required fields
        if (!medicineName || !strength || !form || !batchNumber || !quantity || 
            !expiryDate || !price || !buyingCost || !dateOfPurchase || !billID || !reorderLevel) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Validate quantity is positive
        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });
        }

        // Validate form enum
        const validForms = ["tablet", "syrup", "ointment", "injection"];
        if (!validForms.includes(form)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form. Must be one of: tablet, syrup, ointment, injection"
            });
        }

        // Check if item with same details already exists
        const existingItem = await Inventory.findOne({
            medicineName,
            strength,
            form,
            batchNumber
        });

        if (existingItem) {
            // Update existing item - add to stock level
            existingItem.stockLevel += parseInt(quantity);
            
            // Update other fields (in case they've changed)
            existingItem.expiryDate = expiryDate;
            existingItem.price = price;
            existingItem.buyingCost = buyingCost;
            existingItem.dateOfPurchase = dateOfPurchase;
            existingItem.billID = billID;
            existingItem.reorderLevel = reorderLevel;

            await existingItem.save();

            return res.status(200).json({
                success: true,
                message: `Stock updated successfully. Added ${quantity} units. New stock level: ${existingItem.stockLevel}`,
                data: existingItem
            });
        } else {
            // Create new inventory item
            const newInventoryItem = new Inventory({
                medicineName,
                strength,
                form,
                batchNumber,
                stockLevel: parseInt(quantity), // Set initial stock level to quantity
                expiryDate,
                price,
                buyingCost,
                dateOfPurchase,
                billID,
                reorderLevel
            });

            await newInventoryItem.save();

            return res.status(201).json({
                success: true,
                message: `New inventory item created successfully with ${quantity} units`,
                data: newInventoryItem
            });
        }

    } catch (error) {
        console.error("Error in addToStock:", error);
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
            form = "",
            lowStock = false,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = req.query;

        // Build search query
        const searchQuery = {};

        // Text search across multiple fields
        if (search) {
            searchQuery.$or = [
                { medicineName: { $regex: search, $options: "i" } },
                { strength: { $regex: search, $options: "i" } },
                { batchNumber: { $regex: search, $options: "i" } }
            ];
        }

        // Filter by form
        if (form) {
            searchQuery.form = form;
        }

        // Filter for low stock items
        if (lowStock === "true") {
            searchQuery.$expr = { $lte: ["$stockLevel", "$reorderLevel"] };
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query with pagination
        const [inventoryItems, totalCount] = await Promise.all([
            Inventory.find(searchQuery)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Inventory.countDocuments(searchQuery)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        // Add status to each item
        const enrichedItems = inventoryItems.map(item => ({
            ...item,
            status: item.stockLevel <= item.reorderLevel ? "Low Stock" : "In Stock",
            isExpired: new Date(item.expiryDate) < new Date(),
            daysToExpiry: Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
        }));

        return res.status(200).json({
            success: true,
            data: {
                items: enrichedItems,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: parseInt(limit),
                    hasNextPage,
                    hasPrevPage
                },
                summary: {
                    totalItems: totalCount,
                    lowStockItems: enrichedItems.filter(item => item.status === "Low Stock").length,
                    expiredItems: enrichedItems.filter(item => item.isExpired).length
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
            form = "",
            sortBy = "medicineName",
            sortOrder = "asc"
        } = req.query;

        // Build aggregation pipeline
        const pipeline = [];

        // Match stage for initial filtering
        const matchStage = {};
        
        // Text search across medicine name
        if (search) {
            matchStage.medicineName = { $regex: search, $options: "i" };
        }

        // Filter by form
        if (form) {
            matchStage.form = form;
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        // Group by medicine name and form to aggregate batches
        pipeline.push({
            $group: {
                _id: {
                    medicineName: "$medicineName",
                    form: "$form"
                },
                totalStockLevel: { $sum: "$stockLevel" },
                batches: {
                    $push: {
                        batchNumber: "$batchNumber",
                        stockLevel: "$stockLevel",
                        billID: "$billID",
                        expiryDate: "$expiryDate",
                        price: "$price",
                        buyingCost: "$buyingCost"
                    }
                },
                // Get the most recent billID (you might want to adjust this logic)
                latestBillID: { $last: "$billID" },
                // Get minimum reorder level across all batches
                minReorderLevel: { $min: "$reorderLevel" },
                // Count total batches
                batchCount: { $sum: 1 }
            }
        });

        // Project to reshape the output
        pipeline.push({
            $project: {
                _id: 0,
                medicineName: "$_id.medicineName",
                form: "$_id.form",
                totalStockLevel: 1,
                batchCount: 1,
                batches: 1,
                billID: "$latestBillID",
                reorderLevel: "$minReorderLevel",
                status: {
                    $cond: {
                        if: { $lte: ["$totalStockLevel", "$minReorderLevel"] },
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

        // Execute aggregation to get total count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Inventory.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;

        // Add pagination to main pipeline
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Execute main aggregation
        const medicines = await Inventory.aggregate(pipeline);

        // Calculate pagination info
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        return res.status(200).json({
            success: true,
            data: {
                items: medicines,
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
                    totalBatches: medicines.reduce((sum, item) => sum + item.batchCount, 0)
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
                message: "Stock ID is required"
            });
        }

        // Find and delete the inventory item
        const deletedItem = await Inventory.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({
                success: false,
                message: "Stock item not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Stock batch deleted successfully`,
            data: {
                deletedItem: {
                    id: deletedItem._id,
                    medicineName: deletedItem.medicineName,
                    strength: deletedItem.strength,
                    form: deletedItem.form,
                    batchNumber: deletedItem.batchNumber,
                    stockLevel: deletedItem.stockLevel
                }
            }
        });

    } catch (error) {
        console.error("Error in deleteStockById:", error);
        
        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid stock ID format"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};