import express from 'express';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { 
  createPurchaseBill,
  createSaleBill,
  createReturnBill,
  getBills,
  getBatchDetails,
  getPurchaseHistory
} from '../controllers/billController.js';
import inventoryRoutes from './inventoryRoutes.js';

const router = express.Router();

// Bill Management Routes
router.post('/purchase', isAuthenticated, createPurchaseBill);
router.post('/sale', isAuthenticated, createSaleBill);
router.post('/return', isAuthenticated, createReturnBill);
router.get('/', isAuthenticated, getBills);
router.get('/batch-details', getBatchDetails);
router.get('/purchase-history/:gstNo', isAuthenticated, getPurchaseHistory);

// Inventory Sub-routes
router.use('/inventory', inventoryRoutes);

export default router;