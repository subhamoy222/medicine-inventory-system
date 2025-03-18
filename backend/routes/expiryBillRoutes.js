import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import {
    createExpiryBill,
    listExpiryBills,
    getExpiryBill,
    deleteExpiryBill,
    checkExpiringItems // Ensure this is imported
} from "../controllers/expiryBillController.js"; // Adjust the import as needed

const router = express.Router();

// Define routes
router.post("/", isAuthenticated, createExpiryBill); // Create new expiry bill
router.get("/", isAuthenticated, listExpiryBills); // List all expiry bills
router.get("/check-expiry", isAuthenticated, checkExpiringItems); // Check for expiring items
router.get("/:id", isAuthenticated, getExpiryBill); // Get a specific expiry bill by ID
router.delete("/:id", isAuthenticated, deleteExpiryBill); // Delete a specific expiry bill by ID

export default router;
