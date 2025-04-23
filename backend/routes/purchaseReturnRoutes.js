import express from 'express';
import {
    getReturnableQuantities,
    createPurchaseReturnBill,
    getPurchaseReturnBills
} from '../controllers/purchaseReturnController.js';
import path from 'path';

const router = express.Router();

// Get returnable quantities for a supplier
router.get('/returnable-quantities', getReturnableQuantities);

// Create a purchase return bill
router.post('/create', createPurchaseReturnBill);

// Get all purchase return bills
router.get('/bills', getPurchaseReturnBills);

// Download PDF
router.get('/download/pdf/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join('uploads', 'pdfs', filename);
    res.download(filePath, filename, (err) => {
        if (err) {
            res.status(404).json({ message: 'PDF file not found' });
        }
    });
});

export default router; 