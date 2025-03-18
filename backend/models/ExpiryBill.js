import mongoose from 'mongoose';

const expiryBillSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    batch: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true },
    purchaseRate: { type: Number, required: true },
    mrp: { type: Number, required: true },
    gstPercentage: { type: Number, required: true },
    description: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const ExpiryBill = mongoose.model('ExpiryBill', expiryBillSchema);

export default ExpiryBill;
