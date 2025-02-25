import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import user from './routes/user.js';
import scheme from './routes/scheme.js';

import connectDB from "./db/connect.js";
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api/user',user);
app.use('/api/schemes',scheme);

connectDB();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
