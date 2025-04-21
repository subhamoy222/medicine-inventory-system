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
  getMedicineSalesDetails,
  getSaleBillDetails,
  getMedicinesByParty
} from '../controllers/billController.js';
import inventoryRoutes from './inventoryRoutes.js';
import { getPurchaseBillHistory } from '../controllers/billController.js';

const router = express.Router();

// Bill Management Routes
router.post('/purchase', isAuthenticated, createPurchaseBill);
router.post('/sale', isAuthenticated, createSaleBill);
router.post('/return', isAuthenticated, createReturnBill);
router.get('/', isAuthenticated, getBills);
router.get('/batch-details', getBatchDetails);
router.get('/purchase-history/:gstNo', isAuthenticated, getPurchaseHistory);
router.post('/next-invoice-number', isAuthenticated, getNextInvoiceNumber);
router.get('/medicine-sales', isAuthenticated, getMedicineSalesDetails);
router.get('/purchase-history', isAuthenticated, getPurchaseBillHistory);

// Return bill routes
router.get('/sale-bill/:billId', isAuthenticated, getSaleBillDetails);
router.get('/medicines-by-party', isAuthenticated, getMedicinesByParty);
router.post('/return-bill', isAuthenticated, createReturnBill);

// Inventory Sub-routes
router.use('/inventory', inventoryRoutes);

export default router;