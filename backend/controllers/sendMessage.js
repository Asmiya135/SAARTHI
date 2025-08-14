import express from "express";
// import { storeSchemeName } from "../models/userReqSchemeSchema.js";
import axios from "axios";
import twilio from "twilio";
 
const router = express.Router();
 
// Twilio Configuration
// Add TWILIO_ACCOUNT_SID and twilio_token to your .env file
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.twilio_token;
const twilioClient = twilio(accountSid, authToken);
const twilioNumber = process.env.TWILIO_NUMBER || "whatsapp:+14155238886";
 
// Function to send WhatsApp message via Twilio
const sendWhatsAppMessage = async (llmResponse) => {
    try {
        // Fixed phone number
        const phoneNumber = "+919860232167";
 
        // Send the message using your Twilio number
        await twilioClient.messages.create({
            body: llmResponse,
            from: twilioNumber,  // Using the defined constant
            to: `whatsapp:${phoneNumber}`
        });
 
        console.log(`Message sent to ${phoneNumber} successfully`);
        return true;
    } catch (error) {
        console.error("WhatsApp message sending error:", error);
        return false;
    }
};
 
// Function to invoke LLM with scheme details
const invokeLLM = async (schemeName) => {
    try {
        const systemPrompt = `Provide details about the ${schemeName} scheme.
        Provide a concise response (maximum 1400 characters) with the following structure:
 
    1) Scheme Name: Provide the full official name of the scheme
 
    2) Benefits:
    - List key benefits using bullet points
    - Keep descriptions brief and clear     
    3) Eligibility:
    - Use bullet points to specify who can apply
    - Include any important criteria or conditions
 
    4) Documents Required:
    - Use bullet points to list all essential documents
    - Mention any special verification requirements
 
    5) Application Process:
    - Use bullet points for application steps
    - Keep instructions simple and actionable
 
    6) Link to Apply: Provide the official application website or portal
 
        Ensure the information is accurate, well-organized with bullet points, and fits within the character limit.
        CRITICAL: Keep the response concise and within 1400 characters and dont return anything else other than the thngs mentioned above, nothing  else means nothing else.`;
 
        const response = await axios.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            contents: [{
                parts: [{
                    text: systemPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY
            }
        });
 
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("LLM invocation error:", error);
        return "Error fetching scheme details.";
    }
};
 
// Main function to handle scheme extraction, LLM invocation, and WhatsApp messaging
const sendMessage = async (req, res) => {
    try {
        console.log("invoked");
        const { schemeName } = req.body;
        if (!schemeName) {
            return res.status(400).json({ error: "Scheme name is missing" });
        }
 
        // Store scheme name in the database
        // await storeSchemeName(schemeName);
 
        // Invoke LLM to get scheme details
        const llmResponse = await invokeLLM(schemeName);
 
        console.log("llm resp: "+llmResponse);
        // Send details to user's WhatsApp via Twilio
        await sendWhatsAppMessage(llmResponse);
 
 
        res.status(200).json({ message: "Scheme details sent via WhatsApp", details: llmResponse });
    } catch (error) {
        console.error("Error processing scheme request:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
 
export default sendMessage;
 