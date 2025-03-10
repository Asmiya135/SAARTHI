import express from "express";
import axios from "axios";
import dotenv from "dotenv";
 
dotenv.config();
 
const router = express.Router();
 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyD8qPRiFtUMPhSyAuryQjmTQqI0U1WGbeA";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
 
// System prompt to guide the model
const SYSTEM_PROMPT = `
You are a voice-based navigation assistant for a website.
 
Your task is to analyze user queries and determine the most appropriate page they intend to visit.
 
You can navigate users to the following pages based on their commands:
 
If the user says "home", navigate to "/".
If the user mentions "schemes", navigate to "schemes".
If the user mentions "documents", navigate to "documents".
If the user says "CSC", navigate to "csc".
If the user says "common service center", also navigate to "csc".
Response Format:
 
Respond only with a raw JSON object, without any additional text, markdown, or code blocks.
Your response must strictly follow this format:
{ "navigateTo": "PAGE_NAME" }
Example Inputs and Outputs:
 
User: Take me to schemes
Response: { "navigateTo": "schemes" }
User: Go to the common service center
Response: { "navigateTo": "csc" }
User: I want to check my documents
Response: { "navigateTo": "documents" }
If the user's request does not match any known page, do not attempt to generate a random response. Instead, return:
{ "navigateTo": null }
 
Ensure that navigation intent is determined precisely based on the given instructions.
 
IMPORTANT: Respond ONLY with a raw JSON object with no markdown formatting, code blocks, or backticks.
Your response should be exactly in this format:
{ "navigateTo": "PAGE_NAME" }
 
`;
 
router.post("/process-query", async (req, res) => {
    try {
        const { userQuery } = req.body;
        if (!userQuery) return res.status(400).json({ error: "Query is required." });
 
        // Format the request for Gemini API
        const response = await axios.post(
            `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: SYSTEM_PROMPT },
                            { text: userQuery }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    topK: 40
                }
            }
        );
 
        // Extract the response from Gemini
        let aiResponse = response.data.candidates[0].content.parts[0].text;
 
        try {
            // Clean the response if it contains markdown code blocks
            if (aiResponse.includes("```")) {
                // Extract content between code blocks if present
                const match = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (match && match[1]) {
                    aiResponse = match[1].trim();
                } else {
                    // Remove any backticks
                    aiResponse = aiResponse.replace(/```json|```/g, "").trim();
                }
            }
 
            // Parse the cleaned JSON response
            const parsedResponse = JSON.parse(aiResponse);
            return res.json(parsedResponse);
        } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            console.log("Raw AI response:", aiResponse);
 
            // Fallback: Try to extract the page name directly using regex
            const pageMatch = aiResponse.match(/"navigateTo"\s*:\s*"([^"]*)"/);
            if (pageMatch && pageMatch[1]) {
                return res.json({ navigateTo: pageMatch[1] });
            }
 
            // If all extraction attempts fail
            return res.json({ navigateTo: null, error: "Could not parse response" });
        }
    } catch (error) {
        console.error("Error processing query:", error.response?.data || error.message);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});
 
export default router;