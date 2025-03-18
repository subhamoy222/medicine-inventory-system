

// import CustomerPurchase from '../models/CustomerPurchase.js';
// import Inventory from '../models/Inventory.js';  // Correct import path
// import ReturnBill from '../models/ReturnBill.js';




// let inventory = {}; // Initialize inventory globally

// // Add or update an item in the inventory
// export const addOrUpdateInventoryItem = async (req, res) => {
//     const { itemName, batch, quantity, amount, customerName,email } = req.body;
//     console.log(req.body)

//     if (!itemName || !batch || typeof quantity !== 'number' || quantity < 0 || typeof amount !== 'number' || amount < 0) {
//         return res.status(400).json({ message: 'Invalid item data' });
//     }

//     // Initialize item in inventory if it doesn't exist
//     if (!inventory[itemName]) {
//         inventory[itemName] = {};
//     }

//     // Initialize batch if it doesn't exist
//     if (!inventory[itemName][batch]) {
//         inventory[itemName][batch] = {
//             quantity: 0,
//             amount: 0,
//             customers: {}, // Track customer purchases in this batch
//         };
//     }

//     // Update batch details
//     inventory[itemName][batch].quantity += quantity;
//     inventory[itemName][batch].amount = amount; // Update amount (overwrites previous value if present)

//     // Update customer purchase details if provided
//     if (customerName) {
//         if (!inventory[itemName][batch].customers[customerName]) {
//             inventory[itemName][batch].customers[customerName] = 0;
//         }
//         inventory[itemName][batch].customers[customerName] += quantity;
//     }

//     res.status(200).json({ message: 'Inventory updated successfully', inventory });
// };

// // Get all inventory items
// export const getInventory = async (req, res) => {
//     res.status(200).json(inventory);
// };

// // Reset the inventory (optional, for testing purposes)
// export const resetInventory = async (req, res) => {
//     inventory = {};
//     res.status(200).json({ message: 'Inventory reset successfully' });
// };


// export const getCustomerPurchases = async (req, res) => {
//     const { customerName } = req.params; // Get customerName from the URL parameter
        
//     try {
//         // Query the Inventory collection to find items where the customer's name exists in the 'customers' map
//         // const inventoryItems = await CustomerPurchase.find({
//         //     [`customerName.${customerName}`]: { $exists: true } // Check if the customer has purchased this item
//         // });
//         const inventoryItems = await CustomerPurchase.find({
//             customerName: { $regex: customerName, $options: "i" } // Case-insensitive search
//           });
          

//         console.log(inventoryItems)

//         // Map through the items and retrieve the customer's purchases
//         // const purchases = inventoryItems.map(item => ({
//         //     itemName: item.itemName,   // Product name
//         //     batch: item.batch,         // Product batch
//         //     quantity: item.customers.get(customerName), // Quantity purchased by this customer
//         // }));
//   // Safely retrieve customer purchases
// const purchases = inventoryItems
// .filter(item => item.customers && item.customers.has(customerName)) // Check if 'customers' exists and contains the customer
// .map(item => ({
//   itemName: item.itemName || 'Unknown',  // Product name fallback
//   batch: item.batch || 'N/A',            // Batch fallback
//   quantity: item.customers.get(customerName) || 0, // Purchased quantity or 0 if not found
//   purchaseDate: item.purchaseDate || 'N/A',        // Purchase date fallback
//   price: item.price || 0,               // Price fallback
// }));



//         // Return the list of purchased items
//         res.status(200).json({ customerName, purchases,inventoryItems });
//     } catch (error) {
//         // If an error occurs, send a 500 error
//         res.status(500).json({ message: 'Error retrieving customer purchases', error: error.message });
//     }
// };

import CustomerPurchase from '../models/CustomerPurchase.js';
import Inventory from '../models/Inventory.js'; // Correct import path
import ReturnBill from '../models/ReturnBillSchema.js';

let inventory = {}; // Global inventory object

// Add or update an item in the inventory
export const addOrUpdateInventoryItem = async (req, res) => {
    const { itemName, batch, quantity, amount, customerName, email } = req.body;

    if (!email || !itemName || !batch || typeof quantity !== 'number' || quantity < 0 || typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ message: 'Invalid item data or missing email' });
    }

    // Initialize inventory for the specific email if it doesn't exist
    if (!inventory[email]) {
        inventory[email] = {};
    }

    // Initialize item in email-specific inventory if it doesn't exist
    if (!inventory[email][itemName]) {
        inventory[email][itemName] = {};
    }

    // Initialize batch if it doesn't exist
    if (!inventory[email][itemName][batch]) {
        inventory[email][itemName][batch] = {
            quantity: 0,
            amount: 0,
            customers: {}, // Track customer purchases in this batch
        };
    }

    // Update batch details
    inventory[email][itemName][batch].quantity += quantity;
    inventory[email][itemName][batch].amount = amount; // Update amount (overwrites previous value if present)

    // Update customer purchase details if provided
    if (customerName) {
        if (!inventory[email][itemName][batch].customers[customerName]) {
            inventory[email][itemName][batch].customers[customerName] = 0;
        }
        inventory[email][itemName][batch].customers[customerName] += quantity;
    }

    res.status(200).json({ message: 'Inventory updated successfully', inventory: inventory[email] });
};

// Get inventory items associated with an email
export const getInventory = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const emailInventory = inventory[email];

    if (!emailInventory) {
        return res.status(404).json({ message: 'No inventory found for this email' });
    }

    res.status(200).json(emailInventory);
};

// Reset the inventory (for testing purposes)
export const resetInventory = async (req, res) => {
    inventory = {};
    res.status(200).json({ message: 'Inventory reset successfully' });
};

// Get customer purchases associated with an email
export const getCustomerPurchases = async (req, res) => {
    const { customerName } = req.params; // Get customerName from the URL parameter
    const { email } = req.query; // Get email from query parameters

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Query CustomerPurchase collection for the given customerName and email
        const inventoryItems = await CustomerPurchase.find({
            customerName: { $regex: customerName, $options: "i" }, // Case-insensitive search
            email: email, // Filter by email
        });

        // Check if any inventory items were found
        if (!inventoryItems || inventoryItems.length === 0) {
            return res.status(404).json({ message: 'No purchases found for this customer and email' });
        }

        // Safely retrieve customer purchases
        const purchases = inventoryItems.map(item => ({
            itemName: item.itemName || 'Unknown',  // Product name fallback
            batch: item.batch || 'N/A',            // Batch fallback
            quantity: item.quantity || 0,          // Purchased quantity fallback
            purchaseDate: item.purchaseDate || 'N/A', // Purchase date fallback
            price: item.price || 0,                // Price fallback
        }));

        // Return the list of purchased items
        res.status(200).json({ customerName, purchases, inventoryItems });
    } catch (error) {
        // If an error occurs, send a 500 error
        res.status(500).json({ message: 'Error retrieving customer purchases', error: error.message });
    }
};


// import Inventory from '../models/Inventory.js';
// import CustomerPurchase from '../models/CustomerPurchase.js';

// Add or update an item in the inventory, using email as part of the customer identification
// export const addOrUpdateInventoryItem = async (req, res) => {
//     let { itemName, batch, gstNo, quantity, amount, purchaseRate, mrp, gstPercentage, description, email } = req.body;

//     // Validate the input data and parse to correct types
//     if (!itemName || !batch || !gstNo || !email || typeof quantity !== 'number' || quantity < 0 || typeof amount !== 'number' || amount < 0) {
//         return res.status(400).json({ message: 'Invalid item data' });
//     }

//     // Convert quantity, amount, purchaseRate, mrp, gstPercentage to appropriate number types
//     quantity = parseInt(quantity);
//     amount = parseFloat(amount);
//     purchaseRate = parseFloat(purchaseRate);
//     mrp = parseFloat(mrp);
//     gstPercentage = parseFloat(gstPercentage);

//     try {
//         // Check if the item already exists in the database
//         let inventoryItem = await Inventory.findOne({ gstNo, batch });

//         if (!inventoryItem) {
//             // Create a new inventory item if it doesn't exist
//             inventoryItem = new Inventory({
//                 itemName,
//                 batch,
//                 gstNo,
//                 quantity,
//                 amount,
//                 purchaseRate,
//                 mrp,
//                 gstPercentage,
//                 description,
//                 customers: {} // Map email to customer purchases
//             });
//         }

//         // Update the inventory item
//         inventoryItem.quantity += quantity; // Update quantity
//         inventoryItem.amount = amount; // Update amount
//         inventoryItem.purchaseRate = purchaseRate; // Update purchase rate
//         inventoryItem.mrp = mrp; // Update MRP
//         inventoryItem.gstPercentage = gstPercentage; // Update GST percentage

//         // Update customer purchase details by email
//         if (email) {
//             if (!inventoryItem.customers[email]) {
//                 inventoryItem.customers[email] = 0;
//             }
//             inventoryItem.customers[email] += quantity;
//         }

//         // Save the updated item
//         await inventoryItem.save();

//         res.status(200).json({ message: 'Inventory updated successfully', inventoryItem });
//     } catch (error) {
//         res.status(500).json({ message: 'Error updating inventory', error: error.message });
//     }
// };

// Get customer purchases by email
// export const getCustomerPurchases = async (req, res) => {
//     const { email } = req.params; // Get email from the URL parameter

//     try {
//         // Query the CustomerPurchase collection to find items where the customer's email exists
//         const inventoryItems = await CustomerPurchase.find({
//             "customers.email": { $regex: email, $options: "i" } // Case-insensitive search for email
//         });

//         // Map through the items and retrieve the customer's purchases
//         const purchases = inventoryItems
//             .filter(item => item.customers && item.customers.some(c => c.email === email)) // Ensure customer exists in the item
//             .map(item => ({
//                 itemName: item.itemName || 'Unknown',  // Fallback for item name
//                 batch: item.batch || 'N/A',            // Fallback for batch
//                 quantity: item.customers
//                     .find(c => c.email === email)?.quantity || 0, // Get quantity purchased by the customer
//                 purchaseDate: item.purchaseDate || 'N/A', // Fallback for purchase date
//                 price: item.price || 0, // Fallback for price
//             }));

//         // Return the list of purchased items
//         res.status(200).json({ email, purchases, inventoryItems });
//     } catch (error) {
//         // If an error occurs, send a 500 error
//         res.status(500).json({ message: 'Error retrieving customer purchases', error: error.message });
//     }
// };

