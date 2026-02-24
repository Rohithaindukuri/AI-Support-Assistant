import { useState, useEffect, useRef } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [sessionId, setSessionId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // Load or create session
  useEffect(() => {
    let storedSession = localStorage.getItem("sessionId");

    if (!storedSession) {
      storedSession = Date.now().toString();
      localStorage.setItem("sessionId", storedSession);
    }

    setSessionId(storedSession);
    fetchConversation(storedSession);
  }, []);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch previous conversation
  const fetchConversation = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/conversations/${id}`);

      if (!res.ok) {
        throw new Error("Failed to fetch conversation");
      }

      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();

      const botMessage = {
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage = {
        role: "assistant",
        content: "Something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  // New chat
  const newChat = () => {
    const newSession = Date.now().toString();
    localStorage.setItem("sessionId", newSession);
    setSessionId(newSession);
    setMessages([]);
  };

  return (
    <div className="container">
      <div className="chat-header">
        <h2>AI Support Assistant</h2>
        <button onClick={newChat}>New Chat</button>
      </div>

      <div className="chat-box">
        {messages.map((msg, index) => {
          const time = msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <div
              key={index}
              className={`message ${
                msg.role === "user" ? "user" : "assistant"
              }`}
            >
              <div>{msg.content}</div>
              {time && <span className="timestamp">{time}</span>}
            </div>
          );
        })}

        {loading && (
          <div className="message assistant">
            Assistant is typing...
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;