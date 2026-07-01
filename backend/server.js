import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./utils/db.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

// Load environment variables from .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,   // your Vercel URL, set as an env var on Render
  "http://localhost:5173",  // keep dev working
].filter(Boolean);

// Core middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // allow curl/Postman (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/health",  healthRoutes);
app.use("/api/auth",    authRoutes);
app.use("/api/groups",  groupRoutes);
app.use("/api/groups",  expenseRoutes);
app.use("/api/groups",  paymentRoutes);   //  payments live under /api/groups/:groupId/payments

// 404 + error handling (must come after routes)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
