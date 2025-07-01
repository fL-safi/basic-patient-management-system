import express from "express"; 
import { verifyToken } from "../middleware/verifyToken.js"; 
import { authorizeRoles } from "../middleware/roleAuth.js"; 
import { addToStock, stockList, allStocksList, deleteStockById  } from "../controllers/inventory.controller.js"; // Add this import

const router = express.Router(); 

// Apply authentication and pharmacist_inventory role authorization to all routes 
router.use(verifyToken); 
router.use(authorizeRoles("pharmacist_inventory")); 

// Inventory CRUD routes 
router.post("/add-to-stock", addToStock); 
router.get("/stock", stockList); 
router.get("/all-stocks", allStocksList);
router.delete("/stock/:id", deleteStockById);


export default router;