import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import {
  createPurchaseBill,
  createSaleBill,
  createReturnBill,
  getBills,
  getBatchDetails,
  getPurchaseHistory,
  getNextInvoiceNumber,
  getMedicineSalesDetails
} from '../controllers/billController.js';
import inventoryRoutes from './inventoryRoutes.js';

const router = express.Router();

// Bill Management Routes
router.post('/purchase', isAuthenticated, createPurchaseBill);
router.post('/sale', isAuthenticated, createSaleBill);
router.post('/return', isAuthenticated, createReturnBill);
router.get('/', isAuthenticated, getBills);
router.get('/batch-details', isAuthenticated, getBatchDetails);
router.get('/purchase-history/:gstNo', isAuthenticated, getPurchaseHistory);
router.get('/next-invoice', isAuthenticated, getNextInvoiceNumber);

// Get detailed sales information for a specific medicine
router.get('/medicine-sales', isAuthenticated, getMedicineSalesDetails);

// Inventory Sub-routes
router.use('/inventory', inventoryRoutes);

export default router;