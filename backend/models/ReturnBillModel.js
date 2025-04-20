import mongoose from 'mongoose';

const returnBillSchema = new mongoose.Schema(
    {
        returnInvoiceNumber: { type: String, required: true }, // Unique identifier for return bills
        originalInvoiceNumber: { type: String, required: true }, // Reference to original sale bill
        date: { type: Date, required: true, default: Date.now },
        partyName: { type: String, required: true },
        email: { type: String, required: true }, // Seller's email
        gstNumber: { type: String },

        items: [
            {
                itemName: { type: String, required: true },
                batch: { type: String, required: true },
                quantity: { type: Number, required: true },
                mrp: { type: Number, required: true },
                discount: { type: Number, default: 0 }, // Discount in percentage
                returnReason: { type: String, required: true },
            },
        ],

        totalAmount: { type: Number, required: true }, // Sum of (quantity * mrp) for all items
        discountAmount: { type: Number, default: 0 }, // Total discount amount
        netAmount: { type: Number, required: true }, // totalAmount - discountAmount
    },
    { timestamps: true }
);

const ReturnBill = mongoose.model('ReturnBill', returnBillSchema);

export default ReturnBill; 