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
import purchaseHistoryRouter from './routes/billRoutes.js';

// Middleware
import errorMiddleware from './middleware/errorMiddleware.js';

// Config
dotenv.config({ path: './config/.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/expiry-bills', expiryBillRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expiry', expiryRoutes);
app.use('/api/purchase-history', purchaseHistoryRouter);
app.use('/api/returns', returnBillRoutes);

// Error Handling
app.use(errorMiddleware);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicineDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;