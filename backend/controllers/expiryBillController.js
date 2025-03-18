import ExpiryBill from '../models/ExpiryBill.js'; // Adjust the path if necessary
import Inventory from '../models/Inventory.js'; // Adjust the path as needed
import moment from 'moment'; // Make sure to install moment with `npm install moment`
import { sendExpiryNotificationEmail } from '../utils/emailService.js'; // Adjust the import according to your project structure

// Check for expiring items
export const checkExpiringItems = async (req, res) => {
    const { date, monthsBefore, monthsAfter, email } = req.query; // Capture email along with date and months

    const targetDate = new Date(date); // Create a new date object from the query string

    // Validate that targetDate is a valid date
    if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date format. Please use 'YYYY-MM-DD'." });
    }

    // Create new Date objects for start and end date
    const startDate = new Date(targetDate);
    const endDate = new Date(targetDate);

    // Subtract months for the start date
    if (monthsBefore) {
        startDate.setMonth(startDate.getMonth() - parseInt(monthsBefore));
    }
    // Add months for the end date
    if (monthsAfter) {
        endDate.setMonth(endDate.getMonth() + parseInt(monthsAfter));
    }

    try {
        const expiringItems = await Inventory.find({
            expiryDate: {
                $gte: startDate, // Greater than or equal to startDate
                $lte: endDate    // Less than or equal to endDate
            }
        });

        // If there are expiring items, send an email notification
        if (expiringItems.length > 0) {
            await sendExpiryNotificationEmail(email, expiringItems);
        } else {
            console.log('No expiring items found.');
        }

        res.status(200).json({
            success: true,
            data: expiringItems
        });
    } catch (error) {
        console.error('Error checking expiring items:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create a new expiry bill
export const createExpiryBill = async (req, res) => {
    try {
        const { itemName, batch, expiryDate, quantity, purchaseRate, mrp, gstPercentage, description } = req.body;

        const newExpiryBill = await ExpiryBill.create({
            itemName,
            batch,
            expiryDate,
            quantity,
            purchaseRate,
            mrp,
            gstPercentage,
            description
        });

        res.status(201).json({
            success: true,
            data: newExpiryBill
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// List all expiry bills
export const listExpiryBills = async (req, res) => {
    try {
        const expiryBills = await ExpiryBill.find();

        res.status(200).json({
            success: true,
            data: expiryBills
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get a specific expiry bill by ID
export const getExpiryBill = async (req, res) => {
    try {
        const expiryBill = await ExpiryBill.findById(req.params.id);

        if (!expiryBill) {
            return res.status(404).json({ success: false, message: "Expiry bill not found" });
        }

        res.status(200).json({
            success: true,
            data: expiryBill
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete a specific expiry bill by ID
export const deleteExpiryBill = async (req, res) => {
    try {
        const expiryBill = await ExpiryBill.findByIdAndDelete(req.params.id);

        if (!expiryBill) {
            return res.status(404).json({ success: false, message: "Expiry bill not found" });
        }

        res.status(200).json({
            success: true,
            message: "Expiry bill deleted successfully"
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
