import mongoose from 'mongoose';

const saleBillSchema = new mongoose.Schema(
    {
        saleInvoiceNumber: { type: String, required: true }, // Unique identifier for sale bills
        date: { type: Date, required: true, default: Date.now },
        receiptNumber: { type: String, required: true },
        partyName: { type: String, required: true },
        email: { type: String, required: true }, // Seller's email

        items: [
            {
                itemName: { type: String, required: true },
                batch: { type: String, required: true },
                quantity: { type: Number, required: true },
                mrp: { type: Number, required: true },
                discount: { type: Number, default: 0 }, // Discount in percentage
            },
        ],

        totalAmount: { type: Number, required: true }, // Sum of (quantity * mrp) for all items
        discountAmount: { type: Number, default: 0 }, // Total discount amount
        netAmount: { type: Number, required: true }, // totalAmount - discountAmount
    },
    { timestamps: true }
);

const SaleBill = mongoose.model('SaleBill', saleBillSchema);

export default SaleBill;
