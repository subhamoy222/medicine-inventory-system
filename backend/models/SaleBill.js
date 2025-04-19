import mongoose from 'mongoose';

const saleBillSchema = new mongoose.Schema({
  saleInvoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  receiptNumber: {
    type: String,
    required: true
  },
  partyName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  gstNo: {
    type: String,
    required: true
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
      required: true
    },
    mrp: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const SaleBill = mongoose.model('SaleBill', saleBillSchema);

export default SaleBill; 