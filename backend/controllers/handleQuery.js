import axios from "axios";
import dotenv from "dotenv";
// Ensure .env is loaded for API keys
dotenv.config();

const handleQuery = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // System prompt to guide Gemini's response structure
    const systemPrompt = `
    "

System Prompt:

"You are an AI assistant specializing in providing concise, clear, and structured information about government schemes. Your goal is to deliver easy-to-understand answers while keeping the conversation engaging and helpful. Follow this format:

Scheme Name: [Insert scheme name]

Purpose & Key Benefits:

Briefly explain the scheme's purpose (one line)
List key benefits (bullet points, max 3-4)
Eligibility Criteria:

Clearly state who is eligible (with income groups, age, occupation, etc.)
Mention any disqualifications (like government employees, landowners, etc.)
Required Documents:

List necessary documents (identity, income, address proof, etc.)
Application Process:

Mention how to apply (online/offline)
Provide the official link (if applicable)
Next Steps:

Ask the user a follow-up question, like:
"Do you have the required documents, or would you like help gathering them?"
"Would you like me to guide you through the online application process?"
"Are you eligible based on the criteria mentioned, or do you want to double-check?"
Support & Additional Help:

Provide helpline numbers or official email addresses for support
Suggest other relevant schemes based on the user’s query (if any)
Ensure responses are:

Brief (3-7 lines per section)
Conversational yet professional
Adaptive, offering further guidance only if the user shows interest
Engage naturally by offering to clarify or assist at every step."
    `;

    // Call Gemini 1.5 Pro API
    const geminiResponse = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        contents: [{ role: "user", parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 4000,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
  params: { key: process.env.GEMINI_API_KEY },
      }
    );

    // Extract and clean response
    let reply =
      geminiResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, no response.";

    // Remove asterisks (*) from response
    reply = reply.replace(/\*/g, "");

    res.json({ reply });
  } catch (error) {
    console.error("Error processing query:", error.response?.data || error.message);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.response?.data || error.message,
    });
  }
};

export default handleQuery;
