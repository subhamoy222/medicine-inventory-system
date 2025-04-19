// backend/controllers/billController.js

import Bill from '../models/Bill.js';
import SaleBill from '../models/SaleBillModel.js';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js'; // Adjust the path as needed
import CustomerPurchase from "../models/CustomerPurchase.js"; // Adjust the path if necessary
import ReturnBill from '../models/ReturnBillSchema.js';  // Adjust the path if necessary
import { validateGSTNumber } from '../utils/validators.js';






// Sample inventory structure
let inventory = {}; // Use an object to store item counts, keyed by itemName

/**
 * Create a new Purchase Bill
 */
export const createPurchaseBill = async (req, res) => {
    const {
        purchaseAmount, totalAmount, discountAmount, date,
        supplierInvoiceNumber, receiptNumber, partyName, items,email
    } = req.body;
    console.log(req.body)
    try {
        // Create the purchase bill with billType
        const purchaseBill = new Bill({
            billType: 'purchase',  // Set the bill type to 'purchase'
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
        console.log("purchae bill",savedPurchaseBill)

        // Update inventory for each item in the purchase bill
        for (const item of items) {
            // Check if the item already exists in inventory
            let inventoryItem = await Inventory.findOne({ itemName: item.itemName, batch: item.batch,email });

            if (inventoryItem) {
                // Update the existing inventory item
                inventoryItem.quantity += item.quantity;  // Add the new quantity to the existing quantity
                inventoryItem.purchaseRate = item.purchaseRate;  // Update other fields if necessary
                inventoryItem.mrp = item.mrp;
                inventoryItem.expiryDate = item.expiryDate;
                inventoryItem.gstPercentage = item.gstPercentage;
                //inventoryItem.email=email
                
                await inventoryItem.save();
            } else {
                // If the item doesn't exist in inventory, create a new one
                const newInventoryItem = new Inventory({
                    itemName: item.itemName,
                    batch: item.batch,
                    expiryDate: item.expiryDate,
                    pack: item.pack,
                    quantity: item.quantity,
                    purchaseRate: item.purchaseRate,
                    mrp: item.mrp,
                    gstPercentage: item.gstPercentage,
                    description: item.description || '',
                    email,
                });
                console.log("new",newInventoryItem)

                await newInventoryItem.save();
            }
        }

        res.status(201).json({ message: 'Purchase bill created and inventory updated successfully', purchaseBill: savedPurchaseBill });
    } catch (error) {
        res.status(500).json({ message: 'Error creating purchase bill or updating inventory', error: error.message });
    }
};



export const createSaleBill = async (req, res) => {
  try {
    const { saleInvoiceNumber, date, receiptNumber, partyName, items, email } = req.body;
    
    // Validate required fields
    if (!saleInvoiceNumber || !date || !receiptNumber || !partyName || !items || !items.length || !email) {
      return res.status(400).json({ message: "All fields, including items, are required." });
    }

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

    // Create sale bill
    const newBill = new SaleBill({
      saleInvoiceNumber,
      date,
      receiptNumber,
      partyName,
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
      gstNo // Store GST number with the bill
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
export const getPurchaseHistory = async (req, res) => {
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

export const createReturnBill = async (req, res) => {
    try {
        const { 
            returnInvoiceNumber,
            originalInvoiceNumber,
            partyName,
            gstNumber,
            items
        } = req.body;
        
        const email = req.user.email;

        // Validate required fields
        if (!returnInvoiceNumber || !originalInvoiceNumber || !partyName || !items?.length) {
            return res.status(400).json({ 
                success: false,
                message: "Return invoice number, original invoice number, party name, and items are required" 
            });
        }

        // Find original sale bill
        const originalBill = await SaleBill.findOne({ 
            saleInvoiceNumber: originalInvoiceNumber,
            email: email
        });

        if (!originalBill) {
            return res.status(404).json({
                success: false,
                message: "Original sale bill not found"
            });
        }

        const validatedItems = [];
        let totalAmount = 0;
        let discountAmount = 0;

        // Validate each item
        for (const item of items) {
            const { itemName, batch, quantity, mrp, discount, returnReason } = item;
            
            // Check if item exists in original bill
            const originalItem = originalBill.items.find(
                i => i.itemName === itemName && i.batch === batch
            );

            if (!originalItem) {
                return res.status(400).json({
                    success: false,
                    message: `${itemName} (${batch}) not found in original bill`
                });
            }

            // Validate quantity
            if (quantity > originalItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Return quantity cannot exceed original purchase quantity`
                });
            }

            const itemTotal = quantity * mrp;
            const itemDiscount = (itemTotal * discount) / 100;
            
            validatedItems.push({
                itemName,
                batch,
                quantity,
                mrp,
                discount,
                returnReason
            });

            totalAmount += itemTotal;
            discountAmount += itemDiscount;
        }

        const netAmount = totalAmount - discountAmount;

        // Create return bill
        const returnBill = new ReturnBill({
            returnInvoiceNumber,
            originalInvoiceNumber,
            date: new Date(),
            partyName,
            email,
            gstNumber,
            items: validatedItems,
            totalAmount,
            discountAmount,
            netAmount
        });

        await returnBill.save();

        // Update inventory
        for (const item of validatedItems) {
            const inventoryItem = await Inventory.findOne({
                itemName: item.itemName,
                batch: item.batch,
                email: email
            });

            if (inventoryItem) {
                inventoryItem.quantity += item.quantity;
                await inventoryItem.save();
            }
        }

        res.status(201).json({
            success: true,
            message: "Return bill created successfully",
            data: returnBill
        });

    } catch (error) {
        console.error("Error creating return bill:", error);
        res.status(500).json({
            success: false,
            message: "Error creating return bill",
            error: error.message
        });
    }
};
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


export const getBatchDetails = async (req, res) => {
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
export const getBills = async (req, res) => {
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

export const getCustomerPurchases = async (req, res) => {
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


export const getInventory = async (req, res) => {
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
export const getNextInvoiceNumber = async (req, res) => {
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


