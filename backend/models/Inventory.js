import mongoose from 'mongoose';

// Define the schema for Inventory
const inventorySchema = new mongoose.Schema(
    {
        itemName: { type: String, required: true },
        batch: { type: String, required: true },
        email: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        pack: { type: String, required: true },
        quantity: { type: Number, required: true, default: 0 },
        purchaseRate: { type: Number, required: true },
        mrp: { type: Number, required: true },
        gstPercentage: { type: Number, required: true },
        description: { type: String, required: false },
    },
    {
        timestamps: true,
    }
);

// Check if the model is already compiled
const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

export default Inventory;

// import mongoose from 'mongoose';

// const inventorySchema = new mongoose.Schema(
//     {
//         itemName: { type: String, required: true },
//         batch: { type: String, required: true },
//         email: { type: String, required: true }, // Replace gstNo with email
//         expiryDate: { type: Date, required: true },
//         quantity: { type: Number, required: true, default: 0 },
//         amount: { type: Number, required: true },
//         purchaseRate: { type: Number, required: true },
//         mrp: { type: Number, required: true },
//         gstPercentage: { type: Number, required: true },
//         description: { type: String, required: false },
//     },
//     { timestamps: true }
// );

// // Check if the model is already defined to avoid the OverwriteModelError
// const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

// export default Inventory;


