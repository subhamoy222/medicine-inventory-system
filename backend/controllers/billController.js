// backend/controllers/billController.js

import Bill from '../models/Bill.js';
import SaleBill from '../models/SaleBillModel.js';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js'; // Adjust the path as needed
import CustomerPurchase from "../models/CustomerPurchase.js"; // Adjust the path if necessary
import ReturnBill from '../models/returnBillModel.js';  // Fixed import path
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
        const { saleInvoiceNumber, date, receiptNumber, partyName, items } = req.body;
        const email = req.user.email;

        if (!email) {
            return res.status(400).json({ message: 'User email is required' });
        }

        console.log('Creating sale bill with data:', {
            saleInvoiceNumber,
            date,
            receiptNumber,
            partyName,
            email,
            items
        });

        // Check if there are any inventory items for this user
        const userInventory = await Inventory.find({ email });
        console.log('User inventory items:', userInventory.map(item => ({
            itemName: item.itemName,
            batch: item.batch,
            quantity: item.quantity
        })));

        // Validate required fields
        if (!saleInvoiceNumber || !date || !receiptNumber || !partyName || !items || !items.length) {
            return res.status(400).json({ message: 'All fields, including items, are required' });
        }

        // Validate GST numbers in items
        const gstNumbers = items.map(item => item.gstNo);
        const uniqueGstNos = [...new Set(gstNumbers)];
        if (uniqueGstNos.length !== 1) {
            return res.status(400).json({ message: 'All items in a bill must belong to the same GST number' });
        }
        const gstNo = uniqueGstNos[0];

        let totalAmount = 0;
        let discountAmount = 0;

        // Process items and validate inventory
        for (const item of items) {
            const { itemName, batch, quantity, mrp, discount } = item;

            console.log('Processing item:', {
                itemName,
                batch,
                quantity,
                mrp,
                discount
            });

            // Validate item fields
            if (!itemName || !batch || !gstNo) {
                return res.status(400).json({ message: `Invalid input in item: ${JSON.stringify(item)}` });
            }

            // Convert to numbers
            const parsedQuantity = Number(quantity);
            const parsedMrp = Number(mrp);
            const parsedDiscount = Number(discount);

            // Validate numeric values
            if (isNaN(parsedQuantity) || isNaN(parsedMrp) || isNaN(parsedDiscount)) {
                return res.status(400).json({ message: `Invalid numeric values in item: ${JSON.stringify(item)}` });
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

            console.log('Inventory check result:', inventoryItem);

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

        console.log('Creating sale bill with amounts:', {
            totalAmount,
            discountAmount,
            netAmount
        });

        // Create sale bill
        const newBill = new SaleBill({
            saleInvoiceNumber,
            date,
            receiptNumber,
            partyName,
            items: await Promise.all(items.map(async (item) => {
                // Get the inventory item to get its expiry date
                const inventoryItem = await Inventory.findOne({
                    email,
                    itemName: item.itemName,
                    batch: item.batch
                });

                if (!inventoryItem) {
                    throw new Error(`Inventory item not found for ${item.itemName} (${item.batch})`);
                }

                return {
                    ...item,
                    quantity: Number(item.quantity),
                    mrp: Number(item.mrp),
                    discount: Number(item.discount),
                    amount: Number(item.quantity) * Number(item.mrp),
                    expiryDate: inventoryItem.expiryDate // Include expiry date from inventory
                };
            })),
            totalAmount,
            discountAmount,
            netAmount,
            email,
            gstNo
        });

        console.log('Saving sale bill:', newBill);

        const savedBill = await newBill.save();

        console.log('Sale bill saved successfully:', savedBill);

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
            date,
            receiptNumber,
            customerName,
            items,
            email,
            originalBillNumber
        } = req.body;

        // Validate required fields
        if (!date || !receiptNumber || !customerName || !items || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Get total sold quantities for this customer
        const soldItems = await SaleBill.aggregate([
            {
                $match: {
                    email: email,
                    partyName: customerName
                }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: {
                        itemName: '$items.itemName',
                        batch: '$items.batch'
                    },
                    totalSold: { $sum: '$items.quantity' },
                    expiryDate: { $last: '$items.expiryDate' }  // Changed from $first to $last to get most recent
                }
            }
        ]);

        console.log('Sold items aggregation result:', JSON.stringify(soldItems, null, 2));

        // Get total returned quantities for this customer
        const returnedItems = await ReturnBill.aggregate([
            {
                $match: {
                    email: email,
                    customerName: customerName
                }
            },
            {
                $unwind: '$items'
            },
            {
                $group: {
                    _id: {
                        itemName: '$items.itemName',
                        batch: '$items.batch'
                    },
                    totalReturned: { $sum: '$items.quantity' }
                }
            }
        ]);

        // Create a map for easy lookup of returned quantities
        const returnedQuantityMap = new Map(
            returnedItems.map(item => [
                `${item._id.itemName}-${item._id.batch}`,
                item.totalReturned
            ])
        );

        // Create a map for sold items data
        const soldItemsMap = new Map(
            soldItems.map(item => [
                `${item._id.itemName}-${item._id.batch}`,
                {
                    totalSold: item.totalSold,
                    expiryDate: item.expiryDate
                }
            ])
        );

        // Validate each return item
        for (const item of items) {
            const key = `${item.itemName}-${item.batch}`;
            const soldData = soldItemsMap.get(key);
            const returnedQuantity = returnedQuantityMap.get(key) || 0;

            console.log('Validating item:', {
                itemName: item.itemName,
                batch: item.batch,
                soldData: soldData,
                returnedQuantity: returnedQuantity
            });

            // Check if item was actually sold to this customer
            if (!soldData) {
                return res.status(400).json({
                    message: `Item ${item.itemName} (Batch: ${item.batch}) was not sold to this customer`
                });
            }

            // Calculate returnable quantity
            const returnableQuantity = soldData.totalSold - returnedQuantity;

            // Validate return quantity
            if (item.quantity > returnableQuantity) {
                return res.status(400).json({
                    message: `Cannot return ${item.quantity} units of ${item.itemName} (Batch: ${item.batch}). Maximum returnable quantity is ${returnableQuantity}`
                });
            }

            // Get expiry date from the original sale bill
            console.log('Searching for sale bill with criteria:', {
                email,
                customerName,
                itemDetails: {
                    itemName: item.itemName,
                    batch: item.batch
                }
            });

            // First try to get expiry date from inventory
            const inventoryItem = await Inventory.findOne({
                email,
                itemName: { $regex: new RegExp('^' + item.itemName + '$', 'i') },
                batch: { $regex: new RegExp('^' + item.batch + '$', 'i') }
            });

            console.log('Inventory item found:', inventoryItem ? {
                itemName: inventoryItem.itemName,
                batch: inventoryItem.batch,
                expiryDate: inventoryItem.expiryDate
            } : 'No inventory item found');

            // Find all sale bills for this item
            const saleBills = await SaleBill.find({
                email,
                partyName: customerName,
                'items.itemName': { $regex: new RegExp('^' + item.itemName + '$', 'i') },
                'items.batch': { $regex: new RegExp('^' + item.batch + '$', 'i') }
            }).sort({ date: -1 }); // Get most recent first

            console.log('Sale bills found:', saleBills.map(bill => ({
                id: bill._id,
                date: bill.date,
                items: bill.items.filter(i => 
                    i.itemName.toLowerCase() === item.itemName.toLowerCase() &&
                    i.batch.toLowerCase() === item.batch.toLowerCase()
                )
            })));

            // Get expiry date from either inventory or sale bills
            let expiryDate;
            if (inventoryItem && inventoryItem.expiryDate) {
                expiryDate = new Date(inventoryItem.expiryDate);
            } else if (saleBills.length > 0) {
                // Try to find expiry date in any of the sale bills
                for (const bill of saleBills) {
                    const saleItem = bill.items.find(i =>
                        i.itemName.toLowerCase() === item.itemName.toLowerCase() &&
                        i.batch.toLowerCase() === item.batch.toLowerCase()
                    );
                    if (saleItem && saleItem.expiryDate) {
                        expiryDate = new Date(saleItem.expiryDate);
                        break;
                    }
                }
            }

            if (!expiryDate) {
                // If no expiry date found, we'll need to update the sale bills with the current inventory expiry date
                if (inventoryItem) {
                    // Update all sale bills for this item with the inventory expiry date
                    await SaleBill.updateMany(
                        {
                            email,
                            'items.itemName': { $regex: new RegExp('^' + item.itemName + '$', 'i') },
                            'items.batch': { $regex: new RegExp('^' + item.batch + '$', 'i') }
                        },
                        {
                            $set: {
                                'items.$.expiryDate': inventoryItem.expiryDate
                            }
                        }
                    );
                    expiryDate = new Date(inventoryItem.expiryDate);
                } else {
                    return res.status(400).json({
                        message: `Cannot verify expiry date for ${item.itemName} (Batch: ${item.batch}). Item not found in inventory.`
                    });
                }
            }

            const currentDate = new Date();

            console.log('Date validation:', {
                itemName: item.itemName,
                batch: item.batch,
                expiryDate: expiryDate,
                currentDate: currentDate,
                isExpired: expiryDate < currentDate
            });

            if (expiryDate < currentDate) {
                return res.status(400).json({
                    message: `Cannot return expired item ${item.itemName} (Batch: ${item.batch}). Expiry date: ${expiryDate.toISOString().split('T')[0]}`
                });
            }
        }

        // Calculate totals
        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
        const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const gstAmount = totalAmount * 0.18; // Assuming 18% GST
        const netAmount = totalAmount - totalDiscount + gstAmount;

        // Generate return invoice number
        const returnInvoiceNumber = `RET${Date.now().toString().slice(-6)}`;

        // Create return bill
        const returnBill = new ReturnBill({
            returnInvoiceNumber,
            originalBillNumber,
            date,
            receiptNumber,
            customerName,
            items,
            totalAmount,
            totalDiscount,
            gstAmount,
            netAmount,
            email
        });

        await returnBill.save();

        // Update inventory
        for (const item of items) {
            await Inventory.findOneAndUpdate(
                { 
                    itemName: item.itemName, 
                    batch: item.batch,
                    email
                },
                { $inc: { quantity: item.quantity } }
            );
        }

        // Update customer purchase history to reflect return
        await CustomerPurchase.findOneAndUpdate(
            { 
                customerName: customerName,
                'purchaseHistory.items.itemName': items[0].itemName,
                'purchaseHistory.items.batch': items[0].batch
            },
            {
                $inc: {
                    'purchaseHistory.$.items.$[item].quantity': -items[0].quantity
                }
            },
            {
                arrayFilters: [
                    { 'item.itemName': items[0].itemName, 'item.batch': items[0].batch }
                ]
            }
        );

        res.status(201).json({
            message: 'Return bill created successfully',
            returnBill,
            returnableQuantities: Object.fromEntries(
                items.map(item => {
                    const key = `${item.itemName}-${item.batch}`;
                    const soldData = soldItemsMap.get(key);
                    const returnedQuantity = returnedQuantityMap.get(key) || 0;
                    return [
                        key,
                        {
                            originalSold: soldData.totalSold,
                            previouslyReturned: returnedQuantity,
                            currentReturn: item.quantity,
                            remainingReturnable: soldData.totalSold - returnedQuantity - item.quantity
                        }
                    ]
                })
            )
        });
    } catch (error) {
        console.error('Error in createReturnBill:', error);
        res.status(500).json({ message: error.message });
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

export const getMedicineSalesDetails = async (req, res) => {
    try {
        const { medicineName, startDate, endDate, partyName } = req.query;
        const userId = req.user.id;
        const email = req.user.email;

        console.log('Request parameters:', {
            medicineName,
            startDate,
            endDate,
            partyName,
            userId,
            email
        });

        // Validate required fields
        if (!medicineName) {
            return res.status(400).json({ message: 'Medicine name is required' });
        }

        // Build the base query
        const query = {
            $and: [
                {
                    $or: [
                        { userId: userId },
                        { email: email }
                    ]
                },
                {
                    'items.itemName': { $regex: new RegExp(medicineName, 'i') }
                }
            ]
        };

        // Add date range filter if provided
        if (startDate || endDate) {
            query.$and.push({
                date: {
                    ...(startDate && { $gte: new Date(startDate) }),
                    ...(endDate && { $lte: new Date(endDate) })
                }
            });
        }

        // Add party name filter if provided - using exact match
        if (partyName) {
            query.$and.push({
                partyName: partyName // Exact match for party name
            });
        }

        console.log('MongoDB Query:', JSON.stringify(query, null, 2));

        // Find all sale bills matching the criteria
        const saleBills = await SaleBill.find(query);

        console.log(`Found ${saleBills.length} sale bills matching criteria`);

        if (saleBills.length === 0) {
            return res.status(404).json({ 
                message: 'No sales found for the specified criteria',
                debug: {
                    query: query,
                    filters: {
                        medicineName,
                        dateRange: {
                            start: startDate,
                            end: endDate
                        },
                        partyName
                    }
                }
            });
        }

        // Calculate total sales and prepare response
        let totalQuantity = 0;
        let totalAmount = 0;
        let totalDiscount = 0;

        // Prepare detailed response
        const salesDetails = saleBills.map(bill => {
            // Find matching items in the bill
            const matchingItems = bill.items.filter(item => 
                item.itemName.toLowerCase().includes(medicineName.toLowerCase())
            );

            // Calculate totals for matching items
            matchingItems.forEach(item => {
                totalQuantity += item.quantity;
                totalAmount += (item.quantity * item.mrp);
                totalDiscount += (item.discount || 0);
            });

            // Return sale details for each matching item
            return matchingItems.map(item => ({
                saleInvoiceNumber: bill.saleInvoiceNumber,
                date: bill.date,
                partyName: bill.partyName,
                quantity: item.quantity,
                mrp: item.mrp,
                discount: item.discount || 0,
                gstNo: item.gstNo || '',
                batch: item.batch || ''
            }));
        }).flat(); // Flatten the array of arrays

        res.status(200).json({
            totalSales: totalQuantity,
            totalAmount,
            totalDiscount,
            salesDetails,
            summary: {
                totalQuantity,
                totalAmount,
                totalDiscount,
                averagePrice: totalQuantity > 0 ? (totalAmount / totalQuantity).toFixed(2) : 0
            },
            debug: {
                appliedFilters: {
                    medicineName,
                    startDate,
                    endDate,
                    partyName
                },
                resultCount: salesDetails.length,
                query: query
            }
        });
    } catch (error) {
        console.error('Error in getMedicineSalesDetails:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};



// Controller to get filtered purchase history
export const getPurchaseBillHistory = async (req, res) => {
  try {
    const { fromDate, toDate, partyName, medicineName } = req.query;
    const userEmail = req.user.email; // Extract email from authenticated user

    // Step 1: Base filter for purchase bills of the logged-in user
    const filter = {
      billType: 'purchase',
      email: userEmail,
    };

    // Step 2: Add optional filters

    // Filter by date range if provided
    if (fromDate && toDate) {
      filter.date = {
        $gte: new Date(fromDate), // Greater than or equal to fromDate
        $lte: new Date(toDate),   // Less than or equal to toDate
      };
    }

    // Filter by party name if provided
    if (partyName) {
      filter.partyName = { $regex: new RegExp(partyName, 'i') }; // Case-insensitive search
    }

    // Step 3: Fetch filtered bills
    const allBills = await Bill.find(filter);

    let filteredBills = allBills;

    // Step 4: Filter by medicine name if provided
    if (medicineName) {
      filteredBills = allBills.filter(bill =>
        bill.items.some(item =>
          item.itemName.toLowerCase().includes(medicineName.toLowerCase()) // Case-insensitive search for itemName
        )
      );
    }

    // Step 5: Return result
    if (filteredBills.length === 0) {
      return res.status(404).json({ success: false, message: 'No purchase bills found matching the criteria.' });
    }

    res.status(200).json({ success: true, data: filteredBills });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching purchase history.' });
  }
};

// Get sale bill details for return
export const getSaleBillDetails = async (req, res) => {
    try {
        const { billId } = req.params;
        const bill = await Bill.findById(billId);
        
        if (!bill) {
            return res.status(404).json({ message: 'Sale bill not found' });
        }

        res.json(bill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get medicines by party name
export const getMedicinesByParty = async (req, res) => {
    try {
        const { partyName } = req.query;
        const email = req.user?.email || req.query.email;
        
        console.log('Request parameters:', { partyName, email });
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find all sale bills for this email and exact party name
        const saleBills = await SaleBill.find({ 
            email: email.toLowerCase(),
            partyName: partyName // Exact match for party name
        });

        console.log('Total bills found for email and party:', saleBills.length);

        // If no bills found at all, return early
        if (saleBills.length === 0) {
            return res.status(404).json({ 
                message: 'No sales found for this party',
                debug: {
                    email,
                    partyName,
                    totalBills: 0
                }
            });
        }

        // Aggregate medicines and their quantities
        const medicineMap = new Map();
        
        saleBills.forEach(bill => {
            bill.items.forEach(item => {
                const key = `${item.itemName}-${item.batch}`;
                if (medicineMap.has(key)) {
                    const existing = medicineMap.get(key);
                    const newQuantity = existing.quantity + item.quantity;
                    const newAmount = existing.totalAmount + (item.quantity * item.mrp);
                    
                    // Update the entry with new totals and weighted average MRP
                    medicineMap.set(key, {
                        itemName: item.itemName,
                        batch: item.batch,
                        quantity: newQuantity,
                        mrp: newAmount / newQuantity, // Calculate weighted average MRP
                        totalAmount: newAmount
                    });
                } else {
                    medicineMap.set(key, {
                        itemName: item.itemName,
                        batch: item.batch,
                        quantity: item.quantity,
                        mrp: item.mrp,
                        totalAmount: item.quantity * item.mrp
                    });
                }
            });
        });

        // Convert Map to array and sort by medicine name
        const medicines = Array.from(medicineMap.values())
            .sort((a, b) => a.itemName.localeCompare(b.itemName));

        // Format numbers to 2 decimal places
        const formattedMedicines = medicines.map(m => ({
            ...m,
            mrp: Number(m.mrp.toFixed(2)),
            totalAmount: Number(m.totalAmount.toFixed(2))
        }));

        console.log('Final results:', {
            totalBills: saleBills.length,
            medicinesFound: medicines.length,
            medicines: formattedMedicines
        });

        res.json(formattedMedicines);
    } catch (error) {
        console.error('Error in getMedicinesByParty:', error);
        res.status(500).json({ message: error.message });
    }
};
