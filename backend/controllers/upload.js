import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { HfInference } from "@huggingface/inference";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: "dhpofwxol",
    api_key: "216772855271133",
    api_secret: "LzwCbqcX-IPIBOdD8CtmVkqbHQU"
});

// Initialize Hugging Face Inference API
const client = new HfInference("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");
// console.log("Hugging Face API Key:", process.env.HF_API_KEY);

// Set up multer for  local file storage
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
const uploadMiddleware = multer({ storage, fileFilter }).single("file");

// Function to upload file to Cloudinary
const uploadToCloudinary = async (localFilePath) => {
    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: "uploads"
        });
        fs.unlinkSync(localFilePath); // Delete local file after upload
        return result.secure_url; // Return the Cloudinary URL
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
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
                            text: "Extract the name, date of birth, and document type from this image."
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

        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error("Error processing image with Qwen:", error);
        throw new Error("Failed to process image with AI.");
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
            const cloudinaryUrl = await uploadToCloudinary(req.file.path);
            
            // Process image with Qwen
            const extractedInfo = await processImageWithQwen(cloudinaryUrl);

            res.status(200).json({
                message: "File uploaded to Cloudinary and processed successfully",
                file_url: cloudinaryUrl,    // Cloudinary URL
                extracted_text: extractedInfo
            });
        } catch (processingError) {
            res.status(500).json({ error: processingError.message });
        }
    });
};

export default upload;