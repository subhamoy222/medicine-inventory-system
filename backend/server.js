import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Routes
import userRoutes from './routes/userRoutes.js';
import billRoutes from './routes/billRoutes.js';
import expiryBillRoutes from './routes/expiryBillRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import expiryRoutes from './routes/expiryRoutes.js';
import returnBillRoutes from './routes/returnBillRoutes.js';
//import purchaseHistoryRoutes from './routes/purchaseHistoryRoutes.js'; // Fixed import

// Middleware
import errorMiddleware from './middleware/errorMiddleware.js';

// Config
dotenv.config({ path: './config/.env' });

const app = express();

// CORS Setup (Fixed Order)
const corsOptions = {
  origin: "https://medicine-inventory-management-fy1fr4qcp-subhamoys-projects.vercel.app", // Allow Vercel frontend
  methods: "GET, POST, PUT, DELETE",
  credentials: true, // Allow cookies & authentication headers
};

app.use(cors(corsOptions)); // Ensure this is before other middleware
app.options("*", cors(corsOptions)); // Handle preflight requests

// Middleware
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/expiry-bills', expiryBillRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expiry', expiryRoutes);
//app.use('/api/purchase-history', purchaseHistoryRoutes); // Fixed route name
app.use('/api/returns', returnBillRoutes);

// Error Handling (Should be the last middleware)
app.use(errorMiddleware);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicineDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
