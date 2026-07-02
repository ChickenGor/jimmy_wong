// 1. Load environment variables at the absolute top
require('dotenv').config();

const { onRequest } = require("firebase-functions/v2/https");
const fetch = require('node-fetch');

// 2. Wrap your logic in a simple handler
exports.getChatResponse = onRequest({ 
    region: "us-central1",
    maxInstances: 10,
    cors: true 
}, async (req, res) => {
    
    // Check if API key is loaded
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "API Key not configured" });
    }

    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to connect to AI service" });
    }
});