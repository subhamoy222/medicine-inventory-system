import express from "express";
import { getBatchDetails, createReturnBill } from "../controllers/billController.js";

const router = express.Router();

// Route to fetch batch details for a customer and medicine
router.get("/customer-purchases", getBatchDetails);

// Route to create a return bill
router.post("/return", createReturnBill);

export default router;


// import express from "express";
// import { createReturnBill, getBatchDetails } from "../controllers/billController.js"; // Adjust imports to ES Module

// const router = express.Router();

// // Get batch details for a specific customer and medicine
// router.get("/batch-details", getBatchDetails);

// // Create a return bill
// router.post("/create-return-bill", createReturnBill);

// export default router;  // Default export

