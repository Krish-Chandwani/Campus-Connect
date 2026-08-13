import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB, getDbReadyState } from "./config/db";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Campus Connect API is running",
    database: getDbReadyState(),
  });
});

app.use("/api/auth", authRoutes);

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI as string);
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
