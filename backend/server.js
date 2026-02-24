require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const db = require("./db");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// ===============================
// Rate Limiting
// ===============================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 requests per IP
});
app.use(limiter);

// ===============================
// Load Documentation
// ===============================
const docs = JSON.parse(fs.readFileSync("./docs.json", "utf8"));

// ===============================
// Helper: Get Last 5 Pairs (10 messages)
// ===============================
function getRecentMessages(sessionId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT role, content FROM messages
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [sessionId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.reverse());
      }
    );
  });
}

// ===============================
// Chat Endpoint
// ===============================
app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    // Validate input
    if (!sessionId || !message) {
      return res.status(400).json({ error: "Missing sessionId or message" });
    }

    // Create session if not exists
    db.run(
      `INSERT OR IGNORE INTO sessions (id, created_at, updated_at)
       VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [sessionId]
    );

    // Store user message
    db.run(
      `INSERT INTO messages (session_id, role, content, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [sessionId, "user", message]
    );

    // Get recent history
    const history = await getRecentMessages(sessionId);

    const docsText = docs.map((d) => d.content).join("\n");

    const historyText = history
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `
You are a support assistant.

Strict Rules:
1. Answer ONLY using the provided documentation.
2. Do NOT use outside knowledge.
3. If the answer is not found in the documentation,
   respond exactly with:
   "Sorry, I don’t have information about that."

Documentation:
${docsText}

Conversation History:
${historyText}

Current Question:
${message}
`;

    // ===============================
    // Call Gemini API
    // ===============================
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    const reply =
      geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Sorry, I don’t have information about that.";

    const tokensUsed =
      geminiResponse.data?.usageMetadata?.totalTokenCount || 0;

    // Store assistant reply
    db.run(
      `INSERT INTO messages (session_id, role, content, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [sessionId, "assistant", reply]
    );

    // Update session updated_at
    db.run(
      `UPDATE sessions
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [sessionId]
    );

    // Return response
    res.json({ reply, tokensUsed });

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Server or LLM error" });
  }
});

// ===============================
// Fetch Conversation
// ===============================
app.get("/api/conversations/:sessionId", (req, res) => {
  db.all(
    `SELECT role, content, created_at FROM messages
     WHERE session_id = ?
     ORDER BY created_at ASC`,
    [req.params.sessionId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    }
  );
});

// ===============================
// List Sessions
// ===============================
app.get("/api/sessions", (req, res) => {
  db.all(
    `SELECT * FROM sessions ORDER BY updated_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    }
  );
});

// ===============================
const PORT = process.env.PORT || 5000;
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});