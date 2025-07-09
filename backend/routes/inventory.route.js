import express from "express"; 
import { verifyToken } from "../middleware/verifyToken.js"; 
import { authorizeRoles } from "../middleware/roleAuth.js"; 
import { 
    addToStock, 
    stockList, 
    allStocksList, 
    deleteStockById, 
    deleteMedicineFromBatch 
} from "../controllers/inventory.controller.js";

const router = express.Router(); 

// Apply authentication to all routes
router.use(verifyToken); 

// Route that both admin and pharmacist_inventory can access
router.post("/add-batch", authorizeRoles("admin", "pharmacist_inventory"), addToStock); 
router.get("/batches", authorizeRoles("admin", "pharmacist_inventory"), stockList); 
router.get("/all-medicines", authorizeRoles("admin", "pharmacist_inventory"), allStocksList);


// Routes that only admin can access
router.delete("/batch/:id", authorizeRoles("admin"), deleteStockById);
router.delete("/batch/:batchId/medicine/:medicineId", authorizeRoles("admin"), deleteMedicineFromBatch);


export default router;