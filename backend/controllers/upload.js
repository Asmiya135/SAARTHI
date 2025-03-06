import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { HfInference } from "@huggingface/inference";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";
import User from "../models/user.js"; // Adjust the path based on your project structure

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: "dhpofwxol",
    api_key: "216772855271133",
    api_secret: "LzwCbqcX-IPIBOdD8CtmVkqbHQU"
});

// Initialize Hugging Face Inference API
const client = new HfInference("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");

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI("AIzaSyD8qPRiFtUMPhSyAuryQjmTQqI0U1WGbeA");

// Set up multer for local file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Temporary local directory
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        return cb(new Error("Only image files (jpeg, jpg, png, gif) are allowed!"), false);
    }
};

// Initialize multer middleware
const uploadMiddleware = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single("file");

// Function to upload file to Cloudinary
const uploadToCloudinary = async (localFilePath) => {
    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: "uploads"
        });
        fs.unlinkSync(localFilePath); // Delete local file after upload
        return result.secure_url; // Return the Cloudinary URL
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        throw new Error("Failed to upload to Cloudinary.");
    }
};

// Function to process image with Qwen model
const processImageWithQwen = async (imageUrl) => {
    try {
        const chatCompletion = await client.chatCompletion({
            model: "Qwen/Qwen2-VL-7B-Instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Extract the name, date of birth, and document type from this image. Return the output in JSON format as:
                            {
                                "full_name": "<Extracted Name>",
                                "dob": "<Extracted Date of Birth in DDMMYYYY format without '/'>",
                                "document_type": "<Extracted Document Type>"
                            } . STRICT: DONT SEND ANY OTHER RESPONSE, JUST THE JSON FORMAT TEXT AND NOT EVEN A WORD APART FROM THAT , JUST CURL BRACES AND DATA INSIDE AND CURL CLOSED. NEITHER THE CLOSING STATEMENT. `
                        },
                        {
                            type: "image_url",
                            image_url: { url: imageUrl }
                        }
                    ]
                }
            ],
            provider: "nebius",
            max_tokens: 500,
        });

        // Clean up the response to remove markdown formatting
        let content = chatCompletion.choices[0].message.content;
        content = content.replace(/```json|```/g, '').trim();
        return content;
    } catch (error) {
        console.error("Error processing image with Qwen:", error);
        throw new Error("Failed to process image with AI.");
    }
};

// Function to compare extracted info with stored data using Gemini
const compareWithGemini = async (extractedInfo) => {
    try {
        let parsedInfo = extractedInfo;
        if (typeof extractedInfo === 'string') {
            try {
                const cleanedString = extractedInfo.replace(/```json|```/g, '').trim();
                parsedInfo = JSON.parse(cleanedString);
            } catch (e) {
                console.error("Error parsing extractedInfo:", e);
                return { 
                    isMatch: false, 
                    message: "There is a mismatch in your document details, which may cause rejection. Please verify and update your details as necessary."
                };
            }
        }

        const extractedName = parsedInfo.full_name;
        const extractedDOB = parsedInfo.dob;

        // Find user in database
        const user = await User.findOne({ full_name: extractedName });
        
        if (!user) {
            console.log("No user found in database with name:", extractedName);
            return { 
                isMatch: false,
                userFound: false,
                extractedName: extractedName,
                extractedDOB: extractedDOB,
                documentType: parsedInfo.document_type || "Unknown",
                message: "There is a mismatch in your document details, which may cause rejection. Please verify and update your details as necessary."
            };
        }

        const storedDOB = user.dob.toString();
        
        // Use Gemini to compare and generate response
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        const prompt = `
You are a document verification system. Compare the following information:

Extracted Information:
- Date of Birth: ${extractedDOB}
- Document Type: ${parsedInfo.document_type || "Unknown"}

Database Information:
- Name: ${user.full_name}
- Date of Birth: ${storedDOB}

Check if the date of birth matches. If there's a mismatch, generate a 3-5 line alert message informing the user that this may lead to rejection and guide them on how to correct it.

If they match, confirm that everything is in order.

Also provide a boolean value indicating if the dates match (true or false).

Format your response as a JSON object like this:
{
  "isMatch": boolean,
  "message": "your message here"
}
`;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        try {
            const parsedResponse = JSON.parse(responseText.replace(/```json|```/g, '').trim());
            parsedResponse.userFound = true;
            return parsedResponse;
        } catch (e) {
            console.error("Invalid JSON from Gemini:", responseText);
            return {
                isMatch: false,
                userFound: true,
                message: "The system detected a potential mismatch in your document. Please verify your information and try again."
            };
        }
    } catch (error) {
        console.error("Gemini Comparison Error:", error);
        return {
            isMatch: false,
            message: "There is a mismatch in your document details, which may cause rejection. Please verify and update your details as necessary."
        };
    }
};

// Upload controller
const upload = (req, res) => {
    uploadMiddleware(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            console.log("No file uploaded");
            return res.status(400).json({ error: "No file uploaded" });
        }

        try {
            // Upload file to Cloudinary
            console.log("uploading to cloud");
            const cloudinaryUrl = await uploadToCloudinary(req.file.path);
            
            // Process image with Qwen
            const extractedInfo = await processImageWithQwen(cloudinaryUrl);
            console.log("Extracted Info:", extractedInfo);
            
            // Send directly to Gemini for comparison without prechecks
            const comparisonResult = await compareWithGemini(extractedInfo);

            // Prepare response
            const response = {
                message: "File uploaded to Cloudinary and processed successfully",
                file_url: cloudinaryUrl,
                extracted_info: extractedInfo,
                comparison_result: comparisonResult
            };

            res.status(200).json(response);
        } catch (processingError) {
            res.status(500).json({ error: processingError.message });
        }
    });
};

export default upload;