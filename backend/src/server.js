import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import candidateRoutes from "./routes/candidate.js";
import recruiterRoutes from "./routes/recruiter.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Resumer backend running" });
});

app.use("/auth", authRoutes);
app.use("/candidate", candidateRoutes);
app.use("/recruiter", recruiterRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ajaysahani06:As2673447@cluster0.uvhot.mongodb.net/resumeapp";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });


