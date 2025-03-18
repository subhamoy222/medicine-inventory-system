// import express from 'express';
// import Inventory from '../models/inventory.js';
// import { addOrUpdateInventoryItem, getCustomerPurchases } from '../controllers/InventoryController.js';

// const router = express.Router();

// // Get all inventory items or filter by item name or batch
// router.get('/', async (req, res) => {
//     const { itemName, batch } = req.query;
  

//     try {
//         const query = {};
//         if (itemName) query.itemName = { $regex: itemName, $options: 'i' };
//         if (batch) query.batch = batch;

//         const inventoryItems = await Inventory.find(query);

//         if (!inventoryItems.length) {
//             return res.status(404).json({ message: 'No inventory items found' });
//         }

//         res.status(200).json(inventoryItems);
//     } catch (error) {
//         console.error('Error fetching inventory:', error.message);
//         res.status(500).json({ message: 'Error fetching inventory', error: error.message });
//     }
// });

// // Search inventory by itemName
// // Search inventory by product name and batch (optional)
// router.get('/search', async (req, res) => {
//     const { itemName, batch } = req.query;

//     try {
//         // Build query for dynamic filtering
//         const query = {};
//         if (itemName) {
//             query.itemName = { $regex: itemName, $options: 'i' }; // Case-insensitive match
//         }
//         if (batch) {
//             query.batch = batch; // Exact match for batch
//         }

//         // Find matching inventory items
//         const inventoryItems = await Inventory.find(query);

//         if (inventoryItems.length === 0) {
//             return res.status(404).json({ message: 'No matching inventory items found' });
//         }

//         res.status(200).json(inventoryItems);
//     } catch (error) {
//         console.error('Error searching inventory:', error);
//         res.status(500).json({ message: 'Error searching inventory', error: error.message });
//     }
// });

// router.get('/customers/:customerName', getCustomerPurchases); // Define the route


// // Create a new inventory item
// router.post('/', async (req, res) => {
//     try {
//         const newItem = new Inventory(req.body);
//         const savedItem = await newItem.save();
//         res.status(201).json(savedItem);
//     } catch (error) {
//         console.error('Error creating inventory item:', error.message);
//         res.status(500).json({ message: 'Error creating inventory item', error: error.message });
//     }
// });

// // Update an inventory item by ID
// router.put('/:id', async (req, res) => {
//     try {
//         const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         if (!updatedItem) {
//             return res.status(404).json({ message: 'Inventory item not found' });
//         }
//         res.status(200).json(updatedItem);
//     } catch (error) {
//         console.error('Error updating inventory item:', error.message);
//         res.status(500).json({ message: 'Error updating inventory item', error: error.message });
//     }
// });

// // Delete an inventory item by ID
// router.delete('/:id', async (req, res) => {
//     try {
//         const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
//         if (!deletedItem) {
//             return res.status(404).json({ message: 'Inventory item not found' });
//         }
//         res.status(200).json({ message: 'Inventory item deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting inventory item:', error.message);
//         res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
//     }
// });

// router.post('/inventory', addOrUpdateInventoryItem);

// // Route to get customer purchases by gstNo
// router.get('/customers/:gstNo', getCustomerPurchases);

// export default router;


// import express from 'express';
// import Inventory from '../models/Inventory.js';
// import { isAuthenticated } from '../middleware/authMiddleware.js';
// import { createPurchaseBill } from '../controllers/billController.js';
// import { addOrUpdateInventoryItem, getCustomerPurchases } from '../controllers/InventoryController.js';

// const router = express.Router();

// // Get all inventory items or filter by item name or batch
// router.get('/', async (req, res) => {
//     const { itemName, batch } = req.query;
  
//     try {
//         const query = {};
//         if (itemName) query.itemName = { $regex: itemName, $options: 'i' }; // Case-insensitive match
//         if (batch) query.batch = batch;

//         const inventoryItems = await Inventory.find(query);

//         if (!inventoryItems.length) {
//             return res.status(404).json({ message: 'No inventory items found' });
//         }

//         res.status(200).json(inventoryItems);
//     } catch (error) {
//         console.error('Error fetching inventory:', error.message);
//         res.status(500).json({ message: 'Error fetching inventory', error: error.message });
//     }
// });
// router.post('/create-purchase-bill', isAuthenticated, createPurchaseBill);

// // Search inventory by itemName and batch (optional)
// router.get('/search', async (req, res) => {
//     const { itemName, batch } = req.query;

//     try {
//         // Build query for dynamic filtering
//         const query = {};
//         if (itemName) {
//             query.itemName = { $regex: itemName, $options: 'i' }; // Case-insensitive match
//         }
//         if (batch) {
//             query.batch = batch; // Exact match for batch
//         }

//         // Find matching inventory items
//         const inventoryItems = await Inventory.find(query);

//         if (inventoryItems.length === 0) {
//             return res.status(404).json({ message: 'No matching inventory items found' });
//         }

//         res.status(200).json(inventoryItems);
//     } catch (error) {
//         console.error('Error searching inventory:', error);
//         res.status(500).json({ message: 'Error searching inventory', error: error.message });
//     }
// });

// // Get inventory items for a specific customer using email
// router.get('/customers/:email', getCustomerPurchases); // Use email for filtering customer purchases

// // Create a new inventory item
// router.post('/', async (req, res) => {
//     try {
//         const newItem = new Inventory(req.body);
//         const savedItem = await newItem.save();
//         res.status(201).json(savedItem);
//     } catch (error) {
//         console.error('Error creating inventory item:', error.message);
//         res.status(500).json({ message: 'Error creating inventory item', error: error.message });
//     }
// });

// // Update an inventory item by ID
// router.put('/:id', async (req, res) => {
//     try {
//         const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
//         if (!updatedItem) {
//             return res.status(404).json({ message: 'Inventory item not found' });
//         }
//         res.status(200).json(updatedItem);
//     } catch (error) {
//         console.error('Error updating inventory item:', error.message);
//         res.status(500).json({ message: 'Error updating inventory item', error: error.message });
//     }
// });

// // Delete an inventory item by ID
// router.delete('/:id', async (req, res) => {
//     try {
//         const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
//         if (!deletedItem) {
//             return res.status(404).json({ message: 'Inventory item not found' });
//         }
//         res.status(200).json({ message: 'Inventory item deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting inventory item:', error.message);
//         res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
//     }
// });

// // Route for adding or updating an inventory item using email
// router.post('/inventory', addOrUpdateInventoryItem);

// // Route to get customer purchases by email (email instead of gstNo)
// router.get('/customers/:email', getCustomerPurchases);

// export default router;

import express from 'express';
import Inventory from '../models/Inventory.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { createPurchaseBill } from '../controllers/billController.js';
import { addOrUpdateInventoryItem, getCustomerPurchases } from '../controllers/InventoryController.js';

const router = express.Router();

// Get all inventory items or filter by item name or batch
router.get('/', async (req, res) => {
  const { itemName, batch, email } = req.query;

  try {
    // Ensure email is provided in the query
    if (!email) {
      return res.status(400).json({ message: 'Email is required to fetch inventory' });
    }

    // Build the query
    const query = { email }; // Filter inventory by email
    if (itemName) query.itemName = { $regex: itemName, $options: 'i' }; // Case-insensitive match for itemName
    if (batch) query.batch = batch; // Exact match for batch

    // Fetch inventory items based on the query
    const inventoryItems = await Inventory.find(query);

    // Handle cases where no items are found
    if (!inventoryItems.length) {
      return res.status(404).json({ message: 'No inventory items found for the given criteria' });
    }

    // Return the fetched inventory items
    res.status(200).json(inventoryItems);
  } catch (error) {
    console.error('Error fetching inventory:', error.message);
    res.status(500).json({ message: 'Error fetching inventory', error: error.message });
  }
});

// Create a new purchase bill (requires authentication)
router.post('/create-purchase-bill', isAuthenticated, createPurchaseBill);

// Search inventory by itemName and batch (optional)
router.get('/search', async (req, res) => {
  const { itemName, batch } = req.query;

  try {
    const query = {};
    if (itemName) query.itemName = { $regex: itemName, $options: 'i' }; // Case-insensitive match
    if (batch) query.batch = batch;

    const inventoryItems = await Inventory.find(query);

    if (!inventoryItems.length) {
      return res.status(404).json({ message: 'No matching inventory items found' });
    }

    res.status(200).json(inventoryItems);
  } catch (error) {
    console.error('Error searching inventory:', error.message);
    res.status(500).json({ message: 'Error searching inventory', error: error.message });
  }
});

// Get inventory items for a specific customer using email
// Get inventory items for a specific customer by email
// Add authentication middleware if required
router.get('/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const inventoryItems = await Inventory.find({ email });
    
    // Return empty array instead of 404 error
    res.status(200).json(inventoryItems);

  } catch (error) {
    console.error('Error fetching inventory:', error.message);
    res.status(500).json({ 
      message: 'Error fetching inventory',
      error: error.message 
    });
  }
});


// Create a new inventory item
router.post('/', async (req, res) => {
  try {
    const newItem = new Inventory(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating inventory item:', error.message);
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
});

// Update an inventory item by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory item:', error.message);
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
});

// Delete an inventory item by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error.message);
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
});

// Route for adding or updating an inventory item using email
router.post('/inventory', async (req, res) => {
  try {
    const updatedItem = await addOrUpdateInventoryItem(req.body); // Assuming this function handles both add & update
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error adding/updating inventory item:', error.message);
    res.status(500).json({ message: 'Error adding/updating inventory item', error: error.message });
  }
});

export default router;



