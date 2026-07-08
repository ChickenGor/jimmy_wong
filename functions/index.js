require('dotenv').config();

const {onRequest} = require('firebase-functions/v2/https');
const fetch = require('node-fetch');

exports.getChatResponse = onRequest({
  region: 'us-central1',
  maxInstances: 10,
  cors: true,
  invoker: 'public',
}, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const body = req.body || {};
  const prompt = typeof body.prompt === 'string' && body.prompt.trim()
    ? body.prompt
    : body.contents?.[0]?.parts?.map((part) => part.text).join('\n') || '';

  if (!apiKey) {
    return res.status(500).json({error: 'API Key not configured'});
  }

  if (!prompt) {
    return res.status(400).json({error: 'Prompt is required'});
  }

  try {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            contents: [{role: 'user', parts: [{text: prompt}]}],
          }),
        },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'AI service request failed',
        details: errorText,
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({error: 'Failed to connect to AI service'});
  }
});
