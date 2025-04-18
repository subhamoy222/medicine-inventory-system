// backend/controllers/billController.js

import Bill from '../models/Bill.js';
import SaleBill from '../models/SaleBillModel.js';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js'; // Adjust the path as needed
import CustomerPurchase from "../models/CustomerPurchase.js"; // Adjust the path if necessary
import ReturnBill from '../models/ReturnBill.js';  // Adjust the path if necessary
import { validateGSTNumber } from '../utils/validators.js';






// Sample inventory structure
let inventory = {}; // Use an object to store item counts, keyed by itemName

/**
 * Create a new Purchase Bill
 */
const createPurchaseBill = async (req, res) => {
    const {
        purchaseAmount, totalAmount, discountAmount, date,
        supplierInvoiceNumber, receiptNumber, partyName, items, email
    } = req.body;
    console.log(req.body)
    try {
        // Create the purchase bill with billType
        const purchaseBill = new Bill({
            billType: 'purchase',
            purchaseAmount,
            totalAmount,
            discountAmount,
            date,
            supplierInvoiceNumber,
            receiptNumber,
            partyName,
            items,
            email
        });
       
        // Save the purchase bill
        const savedPurchaseBill = await purchaseBill.save();
        console.log("purchase bill", savedPurchaseBill)

        // Update inventory for each item in the purchase bill
        for (const item of items) {
            // Normalize item name and batch for case-insensitive search
            const normalizedItemName = item.itemName.trim().toLowerCase();
            const normalizedBatch = item.batch.trim().toLowerCase();

            // Check if the item already exists in inventory with same batch
            let inventoryItem = await Inventory.findOne({
                email,
                $expr: {
                    $and: [
                        { $eq: [{ $toLower: "$itemName" }, normalizedItemName] },
                        { $eq: [{ $toLower: "$batch" }, normalizedBatch] }
                    ]
                }
            });

            if (inventoryItem) {
                // Update the existing inventory item
                inventoryItem.quantity += Number(item.quantity);
                inventoryItem.purchaseRate = Number(item.purchaseRate);
                inventoryItem.mrp = Number(item.mrp);
                inventoryItem.expiryDate = item.expiryDate;
                inventoryItem.gstPercentage = Number(item.gstPercentage);
                
                await inventoryItem.save();
                console.log(`Updated existing inventory item: ${item.itemName} (${item.batch})`);
            } else {
                // If the item doesn't exist in inventory, create a new one
                const newInventoryItem = new Inventory({
                    itemName: item.itemName.trim(), // Store original case
                    batch: item.batch.trim(), // Store original case
                    expiryDate: item.expiryDate,
                    pack: item.pack,
                    quantity: Number(item.quantity),
                    purchaseRate: Number(item.purchaseRate),
                    mrp: Number(item.mrp),
                    gstPercentage: Number(item.gstPercentage),
                    description: item.description || '',
                    email,
                });
                console.log("new", newInventoryItem)

                await newInventoryItem.save();
                console.log(`Created new inventory item: ${item.itemName} (${item.batch})`);
            }
        }

        res.status(201).json({ 
            message: 'Purchase bill created and inventory updated successfully', 
            purchaseBill: savedPurchaseBill 
        });
    } catch (error) {
        console.error('Error in createPurchaseBill:', error);
        res.status(500).json({ 
            message: 'Error creating purchase bill or updating inventory', 
            error: error.message 
        });
    }
};



const createSaleBill = async (req, res) => {
  try {
    const { saleInvoiceNumber, date, receiptNumber, partyName, items, email } = req.body;
    
    // Validate required fields
    if (!saleInvoiceNumber || !date || !receiptNumber || !partyName || !items || !items.length || !email) {
      return res.status(400).json({ message: "All fields, including items, are required." });
    }

    // Normalize party name
    const normalizedPartyName = partyName.trim();

    // Validate GST numbers in items
    const gstNumbers = items.map(item => item.gstNo);
    const uniqueGstNos = [...new Set(gstNumbers)];
    if (uniqueGstNos.length !== 1) {
      return res.status(400).json({ 
        message: "All items in a bill must belong to the same GST number" 
      });
    }
    const gstNo = uniqueGstNos[0];

    let totalAmount = 0;
    let discountAmount = 0;

    // Process items and validate inventory
    for (const item of items) {
      const { itemName, batch, quantity, mrp, discount } = item;

      // Validate item fields
      if (!itemName || !batch || !gstNo) {
        return res.status(400).json({ 
          message: `Invalid input in item: ${JSON.stringify(item)}` 
        });
      }

      // Convert to numbers
      const parsedQuantity = Number(quantity);
      const parsedMrp = Number(mrp);
      const parsedDiscount = Number(discount);

      // Validate numeric values
      if (isNaN(parsedQuantity) || isNaN(parsedMrp) || isNaN(parsedDiscount)) {
        return res.status(400).json({ 
          message: `Invalid numeric values in item: ${JSON.stringify(item)}` 
        });
      }

      if (parsedQuantity <= 0 || parsedMrp < 0 || parsedDiscount < 0) {
        return res.status(400).json({
          message: `Invalid values: Quantity must be >0, MRP & discount >=0`
        });
      }

      // Calculate item values
      const itemAmount = parsedQuantity * parsedMrp;
      const itemDiscount = (itemAmount * parsedDiscount) / 100;

      totalAmount += itemAmount;
      discountAmount += itemDiscount;

      // Inventory check
      const inventoryItem = await Inventory.findOne({
        email,
        itemName: { $regex: new RegExp(`^${itemName}$`, 'i') },
        batch: { $regex: new RegExp(`^${batch}$`, 'i') },
      });

      if (!inventoryItem) {
        return res.status(400).json({
          message: `Item ${itemName} (${batch}) not found in inventory`
        });
      }

      if (inventoryItem.quantity < parsedQuantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${itemName} (Available: ${inventoryItem.quantity})`
        });
      }

      // Update inventory
      inventoryItem.quantity -= parsedQuantity;
      await inventoryItem.save();
    }

    // Calculate final amounts
    const netAmount = totalAmount - discountAmount;

    // Create sale bill with normalized party name
    const newBill = new SaleBill({
      saleInvoiceNumber,
      date,
      receiptNumber,
      partyName: normalizedPartyName,
      items: items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        mrp: Number(item.mrp),
        discount: Number(item.discount),
        amount: Number(item.quantity) * Number(item.mrp),
      })),
      totalAmount,
      discountAmount,
      netAmount,
      email,
      gstNo
    });

    const savedBill = await newBill.save();

    // Update customer purchase history by GST number
    let customerPurchase = await CustomerPurchase.findOne({ gstNo });

    if (!customerPurchase) {
      customerPurchase = new CustomerPurchase({
        gstNo,
        partyName,
        purchaseHistory: []
      });
    }

    // Add purchase record
    customerPurchase.purchaseHistory.push({
      date: new Date(),
      invoiceNumber: saleInvoiceNumber,
      items: items.map(item => ({
        itemName: item.itemName,
        batch: item.batch,
        quantity: Number(item.quantity),
        rate: Number(item.mrp),
        discount: Number(item.discount),
        amount: Number(item.quantity) * Number(item.mrp)
      })),
      totalAmount: netAmount
    });

    await customerPurchase.save();

    return res.status(201).json({
      message: 'Sale bill created successfully',
      bill: savedBill,
      inventoryUpdated: true,
      customerRecordUpdated: true
    });

  } catch (error) {
    console.error('Error creating sale bill:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// controllers/billController.js
const getPurchaseHistory = async (req, res) => {
  try {
    const { gstNo } = req.params;
    const { itemName, batch } = req.query;

    // Validate GST number format
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNo)) {
      return res.status(400).json({ message: "Invalid GST format" });
    }

    // Aggregation Pipeline
    const result = await CustomerPurchase.aggregate([
      { $match: { gstNo } },
      { $unwind: "$purchaseHistory" },
      { $unwind: "$purchaseHistory.items" },
      { $match: { 
        "purchaseHistory.items.itemName": itemName,
        "purchaseHistory.items.batch": batch 
      }},
      { $group: {
        _id: null,
        totalPurchased: { $sum: "$purchaseHistory.items.quantity" },
        purchases: {
          $push: {
            date: "$purchaseHistory.date",
            invoiceNumber: "$purchaseHistory.invoiceNumber",
            quantity: "$purchaseHistory.items.quantity",
            rate: "$purchaseHistory.items.rate",
            discount: "$purchaseHistory.items.discount",
            expiryDate: "$purchaseHistory.items.expiryDate"
          }
        }
      }}
    ]);

    // Handle no results
    if (!result.length || result[0].purchases.length === 0) {
      return res.status(404).json({ message: "No purchases found" });
    }

    // Response structure
    res.status(200).json({
      data: {
        gstNo,
        itemName,
        batch,
        totalPurchased: result[0].totalPurchased,
        purchases: result[0].purchases
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// export const createReturnBill = async (req, res) => {
//   try {
//     const { customerGST, items, returnInvoiceNumber } = req.body;
//     const email = req.user.email;

//     // Validate required fields
//     if (!customerGST || !items?.length || !returnInvoiceNumber) {
//       return res.status(400).json({ 
//         success: false,
//         message: "Customer GST, items, and invoice number are required" 
//       });
//     }

//     // Validate GST format
//     const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/;
//     if (!gstRegex.test(customerGST)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid GST Number format"
//       });
//     }

//     const validatedItems = [];
//     let totalAmount = 0;

//     // Validate each item
//     for (const item of items) {
//       const { batch, itemName, quantity, returnReason } = item;
      
//       // Find original purchase
//       const purchase = await CustomerPurchase.aggregate([
//         { $match: { gstNo: customerGST } },
//         { $unwind: "$purchaseHistory" },
//         { $unwind: "$purchaseHistory.items" },
//         { $match: { 
//           "purchaseHistory.items.batch": batch,
//           "purchaseHistory.items.itemName": itemName 
//         }},
//         { $group: {
//           _id: null,
//           totalPurchased: { $sum: "$purchaseHistory.items.quantity" },
//           totalSold: { $sum: "$purchaseHistory.items.soldQuantity" },
//           mrp: { $first: "$purchaseHistory.items.mrp" },
//           expiryDate: { $first: "$purchaseHistory.items.expiryDate" }
//         }}
//       ]);

//       if (!purchase.length) {
//         return res.status(400).json({
//           success: false,
//           message: `${itemName} (${batch}) not purchased by this customer`
//         });
//       }

//       const { totalPurchased, totalSold, mrp, expiryDate } = purchase[0];
//       const availableForReturn = totalPurchased - totalSold;

//       // Check expiry
//       if (new Date(expiryDate) < new Date()) {
//         return res.status(400).json({
//           success: false,
//           message: `${itemName} (${batch}) has expired`
//         });
//       }

//       // Validate quantity
//       if (quantity > availableForReturn) {
//         return res.status(400).json({
//           success: false,
//           message: `Max return quantity for ${itemName} is ${availableForReturn}`
//         });
//       }

//       validatedItems.push({
//         itemName,
//         batch,
//         quantity,
//         mrp,
//         expiryDate,
//         returnReason,
//         originalInvoice: purchase.invoiceNumber
//       });

//       totalAmount += quantity * mrp;
//     }

//     // Create return bill
//     const returnBill = new ReturnBill({
//       returnInvoiceNumber,
//       customerGST,
//       items: validatedItems,
//       totalAmount,
//       email
//     });

//     await returnBill.save();

//     // Update inventory
//     await Promise.all(validatedItems.map(async (item) => {
//       await Inventory.findOneAndUpdate(
//         { email, batch: item.batch },
//         { $inc: { quantity: item.quantity } }
//       );
//     }));

//     res.status(201).json({
//       success: true,
//       message: "Return bill created successfully",
//       data: returnBill
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
//};
// Fetch batch details for a specific customer and medicine
// export const getBatchDetails = async (req, res) => {
//   const { customerName, itemName } = req.query;

//   if (!customerName || !itemName) {
//     return res.status(400).json({
//       success: false,
//       message: "Customer name and medicine name are required.",
//     });
//   }

//   try {
//     const purchases = await CustomerPurchase.find({
//       customerName,
//       "items.itemName": itemName,
//     });

//     if (purchases.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No purchases found for this customer and medicine.",
//       });
//     }

//     const batchDetails = purchases.flatMap((purchase) =>
//       purchase.items
//         .filter((item) => item.itemName === itemName)
//         .map((item) => ({
//           batch: item.batch,
//           quantity: item.quantity,
//           mrp: item.mrp,
//           discount: item.discount || 0,
//           amount: item.amount,
//         }))
//     );

//     return res.status(200).json({ success: true, data: batchDetails });
//   } catch (error) {
//     console.error("Error fetching batch details:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching batch details.",
//     });
//   }
// };

// export const getBatchDetails = async (req, res) => {
//   const { customerName, itemName } = req.query;

//   if (!customerName || !itemName) {
//     return res.status(400).json({
//       success: false,
//       message: "Customer name and medicine name are required.",
//     });
//   }

//   try {
//     const purchases = await CustomerPurchase.find({
//       customerName,
//       "items.itemName": itemName,
//     });

//     if (purchases.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No purchases found for this customer and medicine.",
//       });
//     }

//     const batchDetails = purchases.flatMap((purchase) =>
//       purchase.items
//         .filter((item) => item.itemName === itemName)
//         .map((item) => ({
//           batch: item.batch,
//           quantity: item.quantity,
//           mrp: item.mrp,
//           discount: item.discount || 0,
//           amount: item.amount,
//         }))
//     );

//     return res.status(200).json({ success: true, data: batchDetails });
//   } catch (error) {
//     console.error("Error fetching batch details:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching batch details.",
//     });
//   }
// };


const getBatchDetails = async (req, res) => {
  const { customerName, itemName } = req.query;

  // Validate required query parameters
  if (!customerName || !itemName) {
    return res.status(400).json({
      success: false,
      message: "Customer name and medicine name are required.",
    });
  }

  try {
    // Fetch purchases matching customer name and item name
    const purchases = await CustomerPurchase.find({
      customerName,
      "items.itemName": { $regex: new RegExp('^' + itemName + '$', 'i') }, // Case-insensitive match
    });

    // If no matching purchases are found
    if (!purchases || purchases.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No purchases found for this customer and medicine.",
      });
    }

    // Extract batch details for the specified item
    const batchDetails = purchases.flatMap((purchase) =>
      purchase.items
        .filter((item) => item.itemName.toLowerCase() === itemName.toLowerCase()) // Case-insensitive comparison
        .map((item) => ({
          batch: item.batch,
          quantity: item.quantity || 0,
          mrp: item.mrp || 0,
          discount: item.discount || 0,
          amount: item.amount || 0,
        }))
    );

    // Return extracted batch details
    return res.status(200).json({ success: true, data: batchDetails });
  } catch (error) {
    console.error("Error fetching batch details:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching batch details.",
      error: error.message,
    });
  }
};



// Create a return bill
// export const createReturnBill = async (req, res) => {
//   const { customerName, items, returnInvoiceNumber } = req.body;

//   if (!customerName || !items || items.length === 0) {
//     return res.status(400).json({
//       success: false,
//       message: "Customer name and return items are required.",
//     });
//   }

//   try {
//     const returnBill = new ReturnBill({
//       customerName,
//       returnInvoiceNumber,
//       date: new Date(),
//       items,
//     });

//     await returnBill.save();

//     return res.status(201).json({
//       success: true,
//       message: "Return bill created successfully.",
//       data: returnBill,
//     });
//   } catch (error) {
//     console.error("Error creating return bill:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error creating return bill.",
//     });
//   }
// };


/**
 * Get all Bills (Purchase, Sale, Return)
 */
const getBills = async (req, res) => {
    const id = req.body.id; 
    try {
        const bill = await Bill.findById(id).populate('originalBillNumber');
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        res.status(200).json(bill);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bill', error: error.message });
    }
};

// export const getCustomerPurchases = async (req, res) => {
//   try {
//       const { customerName } = req.params;

//       if (!customerName) {
//           return res.status(400).json({ message: "Customer name is required." });
//       }

//       const customerPurchases = await CustomerPurchase.findOne({ customerName });

//       if (!customerPurchases) {
//           return res.status(404).json({ message: `No purchases found for customer: ${customerName}` });
//       }

//       return res.status(200).json({ customerPurchases });
//   } catch (error) {
//       return res.status(500).json({
//           message: "Error fetching customer purchases.",
//           error: error.message,
//       });
//   }
// };

const getCustomerPurchases = async (req, res) => {
  const { customerName } = req.params;

  if (!customerName) {
    return res.status(400).json({ message: "Customer name is required." });
  }

  try {
    const customerPurchases = await CustomerPurchase.findOne({
      customerName: new RegExp(`^${customerName}$`, 'i'),
    }).populate('items'); // Populate if `items` references another schema

    if (!customerPurchases) {
      return res.status(404).json({ message: `No purchases found for ${customerName}` });
    }

    return res.status(200).json({ success: true, data: customerPurchases });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching customer purchases.",
      error: error.message,
    });
  }
};


const getInventory = async (req, res) => {
  const { email } = req.query;  // Get email from query parameters

  if (!email) {
      return res.status(400).json({ message: 'Email is required' });
  }

  try {
      // Fetch inventory items associated with the user's email
      const emailInventory = await Inventory.find({ email: email });

      // Check if any inventory items were found
      if (!emailInventory || emailInventory.length === 0) {
          return res.status(404).json({ message: 'No inventory items found for this email' });
      }

      res.status(200).json({ inventory: emailInventory });
  } catch (error) {
      // If an error occurs, send a 500 error
      res.status(500).json({ message: 'Error retrieving inventory items', error: error.message });
  }
};

// Get the next invoice number
const getNextInvoiceNumber = async (req, res) => {
  try {
    const { email } = req.body;
    const userEmail = req.user?.email || email;
    
    console.log("Received request for next invoice number with email:", userEmail);
    
    if (!userEmail) {
      console.log("Email is missing in request");
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Find the last invoice for this user
    const lastInvoice = await SaleBill.findOne({ email: userEmail })
      .sort({ saleInvoiceNumber: -1 })
      .select('saleInvoiceNumber');

    console.log("Last invoice found:", lastInvoice);
    
    let nextNumber = 5; // Default starting number
    
    if (lastInvoice && lastInvoice.saleInvoiceNumber) {
      // Extract the number from the last invoice (e.g., "INV007" -> 7)
      const lastNumber = parseInt(lastInvoice.saleInvoiceNumber.replace('INV', ''));
      nextNumber = lastNumber + 1;
      console.log("Calculated next number:", nextNumber);
    }

    const invoiceNumber = `INV${String(nextNumber).padStart(3, '0')}`;
    console.log("Generated invoice number:", invoiceNumber);
    
    res.status(200).json({ invoiceNumber });
  } catch (error) {
    console.error('Error in getNextInvoiceNumber:', error);
    res.status(500).json({ 
      message: 'Error getting next invoice number',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Check if invoice number is valid for return
const checkInvoiceValidity = async (req, res) => {
  try {
    const { invoiceNumber, email } = req.body;
    
    // Find the sale bill with the given invoice number and email
    const saleBill = await SaleBill.findOne({
      saleInvoiceNumber: invoiceNumber,
      email
    });

    if (!saleBill) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Invoice number not found or not associated with your account' 
      });
    }

    // Check if the bill is older than 30 days (optional)
    const billDate = new Date(saleBill.date);
    const today = new Date();
    const daysDiff = Math.floor((today - billDate) / (1000 * 60 * 60 * 24));

    if (daysDiff > 30) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Returns are only allowed within 30 days of purchase' 
      });
    }

    // Return the bill details if valid
    res.status(200).json({
      valid: true,
      bill: saleBill
    });
  } catch (error) {
    console.error('Error checking invoice validity:', error);
    res.status(500).json({ message: 'Error checking invoice validity' });
  }
};

// Create return bill
const createReturnBill = async (req, res) => {
  try {
    const { 
      invoiceNumber,
      email,
      items,
      partyName,
      gstNumber,
      date = new Date()
    } = req.body;

    // First verify the invoice is valid
    const saleBill = await SaleBill.findOne({
      saleInvoiceNumber: invoiceNumber,
      email
    });

    if (!saleBill) {
      return res.status(404).json({ 
        message: 'Original sale bill not found' 
      });
    }

    // Verify each medicine exists in the original invoice
    for (const returnItem of items) {
      const originalItem = saleBill.items.find(item => 
        item.itemName.toLowerCase() === returnItem.itemName.toLowerCase() &&
        item.batch === returnItem.batch
      );

      if (!originalItem) {
        return res.status(400).json({
          message: `Item ${returnItem.itemName} with batch ${returnItem.batch} not found in original invoice`
        });
      }

      if (returnItem.quantity > originalItem.quantity) {
        return res.status(400).json({
          message: `Return quantity for ${returnItem.itemName} cannot exceed original quantity (${originalItem.quantity})`
        });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.mrp), 0);

    // Create the return bill
    const returnBill = new ReturnBill({
      returnInvoiceNumber: `RET-${invoiceNumber}`,
      originalInvoiceNumber: invoiceNumber,
      email,
      items,
      partyName,
      gstNumber,
      date,
      totalAmount
    });

    // Update inventory quantities
    for (const item of items) {
      const inventory = await Inventory.findOne({
        email,
        itemName: item.itemName,
        batch: item.batch
      });

      if (inventory) {
        inventory.quantity += item.quantity;
        await inventory.save();
      }
    }

    await returnBill.save();

    res.status(201).json({
      success: true,
      message: 'Return bill created successfully',
      returnBill
    });
  } catch (error) {
    console.error('Error creating return bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating return bill'
    });
  }
};

// Get all invoices for a specific party
const getPartyInvoices = async (req, res) => {
  try {
    const { partyName } = req.params;
    
    // Check if user is authenticated
    if (!req.user || !req.user.email) {
      console.error('No user email found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const email = req.user.email;
    console.log('Searching for party:', partyName);
    console.log('Authenticated user email:', email);

    if (!partyName) {
      return res.status(400).json({
        success: false,
        message: 'Party name is required'
      });
    }

    // Decode and normalize the party name
    const decodedPartyName = decodeURIComponent(partyName).trim();
    console.log('Decoded party name:', decodedPartyName);

    // First, let's see all invoices for this user to debug
    const allInvoices = await SaleBill.find({ email }).select('partyName');
    console.log('All invoices for user:', allInvoices.map(inv => inv.partyName));

    // Use case-insensitive search with regex
    const invoices = await SaleBill.find({
      email,
      $expr: {
        $eq: [
          { $toLower: "$partyName" },
          decodedPartyName.toLowerCase()
        ]
      }
    }).sort({ date: -1 });

    console.log('Found invoices:', invoices.length);
    if (invoices.length > 0) {
      console.log('Sample invoice:', {
        partyName: invoices[0].partyName,
        invoiceNumber: invoices[0].saleInvoiceNumber,
        date: invoices[0].date
      });
    }

    if (!invoices.length) {
      return res.status(404).json({
        success: false,
        message: 'No invoices found for this party'
      });
    }

    res.status(200).json({
      success: true,
      invoices
    });
  } catch (error) {
    console.error('Error in getPartyInvoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching party invoices',
      error: error.message
    });
  }
};

// Check if a medicine exists in party's invoices
const checkMedicineInInvoices = async (req, res) => {
  try {
    const { partyName, medicineName } = req.params;
    const email = req.user.email;

    // Find all sale bills for the given party name
    const invoices = await SaleBill.find({
      email,
      partyName: { $regex: new RegExp(partyName, 'i') },
      'items.itemName': { $regex: new RegExp(medicineName, 'i') }
    });

    if (!invoices.length) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in any invoice for this party'
      });
    }

    // Extract relevant information about the medicine
    const medicineDetails = invoices.map(invoice => ({
      invoiceNumber: invoice.saleInvoiceNumber,
      date: invoice.date,
      items: invoice.items.filter(item => 
        item.itemName.toLowerCase().includes(medicineName.toLowerCase())
      )
    }));

    res.status(200).json({
      success: true,
      medicineDetails
    });
  } catch (error) {
    console.error('Error checking medicine in invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking medicine in invoices'
    });
  }
};

export {
  createPurchaseBill,
  createSaleBill,
  getPurchaseHistory,
  getCustomerPurchases,
  getInventory,
  getNextInvoiceNumber,
  checkInvoiceValidity,
  createReturnBill,
  getBatchDetails,
  getPartyInvoices,
  checkMedicineInInvoices
};


