import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Import Routes
import userRoutes from './routes/userRoutes.js';
import billRoutes from './routes/billRoutes.js';
import expiryBillRoutes from './routes/expiryBillRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import expiryRoutes from './routes/expiryRoutes.js';
import returnBillRoutes from './routes/returnBillRoutes.js';

// Middleware
import errorMiddleware from './middleware/errorMiddleware.js';

// Load Environment Variables
dotenv.config({ path: './config/.env' });

// Connect to MongoDB
connectDB();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://medicine-inventory-management.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/expiry-bills', expiryBillRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expiry', expiryRoutes);
app.use('/api/returns', returnBillRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
});

export default app;




