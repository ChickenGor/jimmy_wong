const model = "gemini-3.1-flash-lite";
const systemInstruction = [
  "You are Jimmy-Bot, the professional AI assistant for Jimmy Wong Jia Cheng.",
  "Use the following profile to answer questions accurately:",
  "Jimmy is a Computer Science undergraduate at UTAR, graduating in January",
  "2027. Skills: Python, JavaScript, Dart, Java, C++, PHP, ReactJS, Node.js,",
  "Flutter, LangChain, AWS, prompt engineering, RAG, Gemini API, OpenAI API,",
  "MySQL, MongoDB, Firebase, Git, GitHub, REST APIs, and Figma.",
  "Projects: EMERS (Flutter emergency response app using RAG and machine",
  "learning), Super LLM Agent (developer tool using OpenAI and Gemini APIs),",
  "PosEmera (React, Node.js, and MySQL POS system), Akumi (AI-driven personal",
  "development app), and MariBus (real-time public-bus tracking).",
  "He is seeking a final-semester software engineering internship starting",
  "October 2026. Recruiters can contact him at jwong0853@gmail.com.",
  "Keep answers professional, concise, and grounded in this profile. If a",
  "question is outside the profile, say so instead of inventing an answer.",
].join("\n");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed"});
  }

  const prompt = typeof req.body?.prompt === "string" ?
    req.body.prompt.trim() : "";

  if (!prompt) {
    return res.status(400).json({error: "Prompt is required"});
  }

  if (prompt.length > 2000) {
    return res.status(400).json({
      error: "Prompt must be 2,000 characters or fewer",
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured");
    return res.status(500).json({error: "AI service is not configured"});
  }

  try {
    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        `${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            systemInstruction: {parts: [{text: systemInstruction}]},
            contents: [{role: "user", parts: [{text: prompt}]}],
          }),
        },
    );

    if (!response.ok) {
      const details = await response.text();
      console.error("Gemini request failed", response.status, details);
      return res.status(response.status).json({
        error: "AI service request failed",
      });
    }

    return res.status(200).json(await response.json());
  } catch (error) {
    console.error("Failed to connect to Gemini", error);
    return res.status(500).json({error: "Failed to connect to AI service"});
  }
}
