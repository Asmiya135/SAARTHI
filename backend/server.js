import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user.js";
import schemeRoutes from "./routes/scheme.js";
import voiceCommanderRoutes from "./routes/voiceCommander.js";
import pythonRoute from "./routes/pythonRoute.js";
import geminiRoute from "./routes/geminiRoute.js";
import connectDB from "./db/connect.js";
import passport from 'passport';
import authRoutes from "./routes/authRoutes.js";
import session from 'express-session'; 
import './passport-config.js'; 

dotenv.config();

const app = express();

connectDB()
    .then(() => console.log(" Database connected successfully"))
    .catch((err) => {
        console.error(" Database connection failed:", err);
        process.exit(1);
    });

app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true 
}));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/python', pythonRoute);
app.use("/api/voice", voiceCommanderRoutes);
app.use("/api/user", userRoutes);
app.use("/api/schemes", schemeRoutes);
app.use('/auth', authRoutes);
app.use("/api/gemini", geminiRoute);

app.get("/", (req, res) => {
    res.json({ message: "Server is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));