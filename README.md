# 🧠 AI-Powered Support Assistant

A full-stack AI-powered Support Assistant built using **React.js, Node.js (Express), SQLite, and Gemini LLM**.

The assistant answers strictly based on provided product documentation, maintains session-wise conversation context, and stores all messages in SQLite.

---

# 🚀 Tech Stack

## Frontend
- React.js (Vite)
- JavaScript
- CSS

## Backend
- Node.js
- Express.js
- SQLite
- Axios
- express-rate-limit

## LLM
- Google Gemini API (Free Tier)

---

# 🎯 Functional Features

- Chat-based user interface
- Session-wise context memory
- Persistent storage using SQLite
- Strict document-based answering
- Rate limiting per IP
- Clean JSON error handling
- Token usage tracking
- Timestamp display in UI


```markdown
# 📂 Project Structure
AI-SUPPORT-ASSISTANT/
│
├── backend/
│ ├── server.js
│ ├── db.js
│ ├── docs.json
│
├── frontend/
│ ├── src/
│ ├── public/
│
└── README.md


# Setup Instructions

## 1️⃣ Clone Repository

```bash
git clone <your-repository-url>
cd AI-SUPPORT-ASSISTANT

2️⃣ Backend Setup
cd backend
npm install

Create a .env file inside backend:

PORT=5000
GEMINI_API_KEY=your_gemini_api_key

Backend runs at:http://localhost:5000


3️⃣ Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs at:http://localhost:5173


🔌 API Documentation
✅ POST /api/chat
Sends a message to the AI assistant.

Request Body
{
  "sessionId": "abc123",
  "message": "How can I reset my password?"
}
Response
{
  "reply": "Users can reset password from Settings > Security.",
  "tokensUsed": 159
}

✅ GET /api/conversations/:sessionId
Returns all messages for the given session in chronological order.

Example:

GET /api/conversations/abc123
✅ GET /api/sessions
Returns all session IDs sorted by last updated time.

Example:

GET /api/sessions



🗄 Database Schema
sessions Table

| Column     | Type     | Description                 |
| ---------- | -------- | --------------------------- |
| id         | TEXT     | sessionId                   |
| created_at | DATETIME | Session creation time (UTC) |
| updated_at | DATETIME | Last activity time (UTC)    |

messages Table

| Column     | Type     | Description                  |
| ---------- | -------- | ---------------------------- |
| id         | INTEGER  | Primary Key (Auto Increment) |
| session_id | TEXT     | Foreign Key to sessions      |
| role       | TEXT     | "user" or "assistant"        |
| content    | TEXT     | Message content              |
| created_at | DATETIME | Message timestamp            |


🧠 Context & Memory Implementation

Last 5 user-assistant pairs (10 messages) are retrieved from SQLite.

Context is injected into the LLM prompt dynamically.

Context is stored in SQLite, not in memory.

Conversation persists even after server restart.


📄 Document-Based Answering

The assistant strictly answers using docs.json.

If the answer is not found in the documentation, it responds with:

"Sorry, I don’t have information about that."

The assistant does not hallucinate or use external knowledge.


🛡 Rate Limiting & Error Handling

Maximum 10 requests per minute per IP.

Handles:

Missing sessionId/message (400 error)

LLM API failures (500 error)

Database failures (500 error)

Returns structured JSON error responses.


📌 Assumptions

SQLite is sufficient for demo-scale application.

Gemini free-tier API is used.

All timestamps are stored in UTC and converted to local time in the frontend.

Documentation is small enough to be fully injected into the prompt.