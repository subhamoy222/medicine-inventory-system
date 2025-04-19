import mongoose from 'mongoose';

const returnBillSchema = new mongoose.Schema({
  returnInvoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  originalInvoiceNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  partyName: {
    type: String,
    required: true
  },
  gstNumber: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  items: [{
    itemName: {
      type: String,
      required: true
    },
    batch: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    mrp: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const ReturnBill = mongoose.model('ReturnBill', returnBillSchema);

export default ReturnBill;