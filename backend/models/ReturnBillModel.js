const mongoose = require('mongoose');

// Schema for individual items in the return bill
const returnItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  pack: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseRate: {
    type: Number,
    required: true,
    min: 0
  },
  mrp: {
    type: Number,
    required: true,
    min: 0
  },
  gstPercentage: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    required: true
  },
  gstAmount: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  returnReason: {
    type: String,
    required: true,
    trim: true
  },
  originalBillNumber: {
    type: String,
    required: true,
    trim: true
  },
  originalBillDate: {
    type: Date,
    required: true
  },
  damageStatus: {
    type: String,
    enum: ['damaged', 'expired', 'wrong_item', 'other'],
    required: true
  },
  damageDescription: {
    type: String,
    trim: true
  }
});

// Main return bill schema
const returnBillSchema = new mongoose.Schema({
  returnInvoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  receiptNumber: {
    type: String,
    required: true,
    trim: true
  },
  partyName: {
    type: String,
    required: true,
    trim: true
  },
  items: [returnItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    required: true
  },
  gstAmount: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  approvedBy: {
    type: String,
    trim: true
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create and export the model
const ReturnBill = mongoose.model('ReturnBill', returnBillSchema);

module.exports = ReturnBill; 