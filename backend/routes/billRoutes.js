import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { 
  createPurchaseBill,
  createSaleBill,
  createReturnBill,
  
  getBatchDetails,
  getPurchaseHistory,
  getNextInvoiceNumber,
  checkInvoiceValidity,
  getPartyInvoices,
  checkMedicineInInvoices
} from '../controllers/billController.js';
import inventoryRoutes from './inventoryRoutes.js';

const router = express.Router();

// Bill Management Routes
router.post('/purchase', isAuthenticated, createPurchaseBill);
router.post('/sale', isAuthenticated, createSaleBill);
router.post('/return', isAuthenticated, createReturnBill);

router.get('/batch-details', getBatchDetails);
router.get('/purchase-history/:gstNo', isAuthenticated, getPurchaseHistory);
router.post('/next-invoice-number', isAuthenticated, getNextInvoiceNumber);
router.post('/check-invoice', checkInvoiceValidity);

// Changed to use query parameter
router.get('/party-invoices/:partyName', isAuthenticated, getPartyInvoices);
router.get('/check-medicine/:partyName/:medicineName', checkMedicineInInvoices);

// Inventory Sub-routes
router.use('/inventory', inventoryRoutes);

export default router;