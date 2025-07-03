import express from "express"; 
import { verifyToken } from "../middleware/verifyToken.js"; 
import { authorizeRoles } from "../middleware/roleAuth.js"; 
import { addToStock, stockList, allStocksList, deleteStockById } from "../controllers/inventory.controller.js";

const router = express.Router(); 

// Apply authentication to all routes
router.use(verifyToken); 

// Routes that only pharmacist_inventory can access
router.post("/add-to-stock", authorizeRoles("pharmacist_inventory"), addToStock); 
router.get("/stock", authorizeRoles("pharmacist_inventory"), stockList); 
router.delete("/stock/:id", authorizeRoles("pharmacist_inventory"), deleteStockById);

// Route that both admin and pharmacist_inventory can access
router.get("/all-stocks", authorizeRoles("admin", "pharmacist_inventory"), allStocksList);

export default router;