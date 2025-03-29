// import express from 'express';
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import cors from 'cors';

// // Routes
// import userRoutes from './routes/userRoutes.js';
// import billRoutes from './routes/billRoutes.js';
// import expiryBillRoutes from './routes/expiryBillRoutes.js';
// import inventoryRoutes from './routes/inventoryRoutes.js';
// import expiryRoutes from './routes/expiryRoutes.js';
// import returnBillRoutes from './routes/returnBillRoutes.js';
// //import purchaseHistoryRoutes from './routes/purchaseHistoryRoutes.js'; // Fixed import

// // Middleware
// import errorMiddleware from './middleware/errorMiddleware.js';

// // Config
// dotenv.config({ path: './config/.env' });

// const app = express();

// // CORS Setup (Fixed Order)
// const corsOptions = {
//   origin: 'https://medicine-inventory-management-ni12o5zp5-subhamoys-projects.vercel.app', // Allow Vercel frontend
//   methods: "GET, POST, PUT, DELETE",
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true, // Allow cookies & authentication headers
// };

// app.use(cors(corsOptions)); // Ensure this is before other middleware
// app.options("*", cors(corsOptions)); // Handle preflight requests

// // Middleware
// app.use(express.json());

// // API Routes
// app.use('/api/users', userRoutes);
// app.use('/api/bills', billRoutes);
// app.use('/api/expiry-bills', expiryBillRoutes);
// app.use('/api/inventory', inventoryRoutes);
// app.use('/api/expiry', expiryRoutes);
// //app.use('/api/purchase-history', purchaseHistoryRoutes); // Fixed route name
// app.use('/api/returns', returnBillRoutes);

// // Error Handling (Should be the last middleware)
// app.use(errorMiddleware);

// // MongoDB Connection
// mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://2023aspire117:l3K25C1ulK4M1ebW@medicineinventorymanage.uktzwsn.mongodb.net/?retryWrites=true&w=majority&appName=MedicineInventoryManagement', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('✅ MongoDB connected successfully'))
// .catch((err) => {
//   console.error('❌ MongoDB connection error:', err.message);
//   process.exit(1);
// });

// // Server Start
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// export default app;

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

// // ✅ Allow Multiple Frontend Origins Dynamically
// const allowedOrigins = [
//   "https://inventory-frontent-q47t3oz9q-subhamoys-projects.vercel.app",
//   "https://medicine-inventory-management-bzluhdrbu-subhamoys-projects.vercel.app",
//   "https://medicine-inventory-management-me2cmek1q-subhamoys-projects.vercel.app",
//   "https://medicine-inventory-management-a1sej87ws-subhamoys-projects.vercel.app",
//   "https://medicine-inventory-management.vercel.app",
// ];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.log(`❌ CORS Blocked: ${origin}`); // Log blocked origins for debugging
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: "GET, POST, PUT, DELETE",
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true, // Allow cookies & authentication headers
// };

// app.use(cors(corsOptions));

// app.options("*", cors(corsOptions)); // Handle Preflight Requests

// Middleware
app.use(
  cors({
    origin: "*", // Add your frontend URLs here
    methods: "GET,POST,PUT,DELETE",
    credentials: true, // If using cookies/authentication
  })
);
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/expiry-bills', expiryBillRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expiry', expiryRoutes);
app.use('/api/returns', returnBillRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;




