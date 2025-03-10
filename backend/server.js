import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user.js";
import schemeRoutes from "./routes/scheme.js";
import voiceCommanderRoutes from "./routes/voiceCommander.js";
import connectDB from "./db/connect.js";
 import ngrok from 'ngrok';
dotenv.config();
 
const app = express();
 
// Connect to Database before starting the server
connectDB()
    .then(() => console.log("Database connected successfully"))
    .catch((err) => {
        console.error("Database connection failed:", err);
        process.exit(1); // Exit if DB connection fails
    });
 
// Middleware
app.use(cors());
app.use(express.json());
 
// Routes
app.use("/api/voice", voiceCommanderRoutes);
app.use("/api/user", userRoutes);
app.use("/api/schemes", schemeRoutes);
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
 
// ngrok.connect({ addr: 4000, authtoken_from_env: true })
// 	.then(listener => console.log(`Ingress established at: ${listener.url()}`));