import express from 'express';
import Inventory from '../models/Inventory.js';
import ExpiryBill from '../models/ExpiryBill.js';



const router = express.Router();


// Route to manually check for expired items
router.get('/check-expiry', async (req, res) => {
    try {
        const today = new Date();
        const expiredItems = await Inventory.find({ expiryDate: { $lt: today } });

        for (const item of expiredItems) {
            const expiryBill = new ExpiryBill({
                itemName: item.itemName,
                batch: item.batch,
                expiryDate: item.expiryDate,
                quantity: item.quantity,
                purchaseRate: item.purchaseRate,
                mrp: item.mrp,
                gstPercentage: item.gstPercentage,
                description: item.description
            });

            await expiryBill.save();
            await Inventory.findByIdAndDelete(item._id); // Remove from inventory if necessary
        }

        res.json({ message: 'Expired items processed', count: expiredItems.length });
    } catch (error) {
        console.error('Error processing expired items:', error);
        res.status(500).json({ message: 'Error processing expired items', error });
    }
});

export default router;
