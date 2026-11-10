
import React, { useEffect, useRef, useState } from "react";
import ChatMarkdown from "./ChatMarkdown";
import "../style/ChatbotWidget.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://ourvision-backend.onrender.com").replace(/\/$/, "");

// Backend may call Gemini (fallback), so allow more time than a database lookup.
const REQUEST_TIMEOUT_MS = 90000;

// Number of earlier messages sent to the backend so Gemini can handle follow-ups.
const HISTORY_LIMIT = 6;

// Bot messages with these sources are not useful conversation context.
const NON_CONTEXT_SOURCES = ["FALLBACK", "UNAVAILABLE", "RATE_LIMITED"];

// Character typing animation
function AnimatedBotText({ text, onTypingUpdate, speed = 28 }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(Boolean(text));

  useEffect(() => {
    const fullText = text || "";
    let index = 0;
    let timeoutId;

    setDisplayedText("");
    setIsTyping(Boolean(fullText));

    if (!fullText) {
      return undefined;
    }

    const typeNextCharacter = () => {
      index += 1;
      setDisplayedText(fullText.slice(0, index));
      onTypingUpdate?.();

      if (index < fullText.length) {
        timeoutId = setTimeout(typeNextCharacter, speed);
      } else {
        setIsTyping(false);
      }
    };

    timeoutId = setTimeout(typeNextCharacter, speed);

    return () => clearTimeout(timeoutId);
  }, [text, speed, onTypingUpdate]);

  return (
    <div>
      <span>{displayedText}</span>
      {isTyping && <span className="ov-chat-typing-cursor">|</span>}
    </div>
  );
}

function AnimatedCharacter({ onClick, isOpen }) {
  const characterRef = useRef(null);
  const [pupils, setPupils] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      const character = characterRef.current;
      if (!character) return;

      const eye = character.querySelector(".ov-character-eye");
      if (!eye) return;

      const rect = eye.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const movement = Math.min(distance / 100, 1);

      setPupils({
        x: Math.cos(angle) * 4 * movement,
        y: Math.sin(angle) * 4 * movement
      });
    };

    const resetPupils = () => setPupils({ x: 0, y: 0 });

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("blur", resetPupils);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("blur", resetPupils);
    };
  }, []);

  const pupilStyle = {
    transform: `translate(calc(-50% + ${pupils.x}px), calc(-50% + ${pupils.y}px))`
  };

  return (
    <button
      ref={characterRef}
      type="button"
      className={`ov-character-button ${isOpen ? "is-open" : ""}`}
      onClick={onClick}
      aria-label={isOpen ? "Close chatbot" : "Open Our Vision Assistant"}
      aria-expanded={isOpen}
    >
      <span className="ov-character">
        <span className="ov-character-eyes">
          <span className="ov-character-eye">
            <span className="ov-character-pupil" style={pupilStyle} />
          </span>
          <span className="ov-character-eye">
            <span className="ov-character-pupil" style={pupilStyle} />
          </span>
        </span>

        <span className="ov-character-nose" />
        <span className="ov-character-mouth" />

        <span className="ov-character-bowtie">
          <span className="ov-character-bowtie-knot" />
        </span>
      </span>

      {!isOpen && <span className="ov-character-badge">1</span>}
      {isOpen && <span className="ov-character-close">×</span>}
    </button>
  );
}

function SmallCharacter() {
  return (
    <span className="ov-character ov-character-small">
      <span className="ov-character-eyes">
        <span className="ov-character-eye">
          <span className="ov-character-pupil" />
        </span>
        <span className="ov-character-eye">
          <span className="ov-character-pupil" />
        </span>
      </span>
      <span className="ov-character-nose" />
      <span className="ov-character-mouth" />
      <span className="ov-character-bowtie">
        <span className="ov-character-bowtie-knot" />
      </span>
    </span>
  );
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text: "Hi 👋, main Our Vision Assistant hoon. Aap mujhse Our Vision, date, time aur available information ke baare mein pooch sakte hain."
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const handleTypingUpdate = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  const sendMessage = async (event) => {
    event.preventDefault();

    const question = message.trim();
    if (!question || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: question
    };

    const history = messages
      .filter(
        (item) =>
          item.id !== "welcome" &&
          !item.isError &&
          !NON_CONTEXT_SOURCES.includes(item.source)
      )
      .slice(-HISTORY_LIMIT)
      .map((item) => ({
        role: item.role === "bot" ? "bot" : "user",
        text: item.text
      }));

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // The backend searches the database first and only then calls Gemini.
      // The Gemini API key lives on the server and is never sent to the browser.
      const response = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: question, history }),
        signal: controller.signal
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      // Do not treat HTTP error responses as successful chatbot answers.
      if (!response.ok) {
        const serverMessage = data?.answer || `Backend returned HTTP ${response.status}`;
        throw new Error(`HTTP ${response.status}: ${serverMessage}`);
      }

      if (!data || !data.answer) {
        throw new Error(`Invalid chatbot response (HTTP ${response.status})`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: data.answer,
          source: data.source
        }
      ]);
    } catch (error) {
      const timedOut = error?.name === "AbortError";
      console.error("[Our Vision Chatbot] Request failed:", {
        apiUrl: `${API_BASE}/api/chatbot/message`,
        name: error?.name,
        message: error?.message
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "bot",
          isError: true,
          text: timedOut
            ? "Server ko jawab dene mein 90 seconds se zyada lag rahe hain. Kripya Backend Render Logs check karein."
            : error?.message?.startsWith("HTTP")
              ? `Backend response: ${error.message}`
              : "Chatbot server se connect nahi ho pa raha. F12 → Console aur Network mein /api/chatbot/message ka error check karein."
        }
      ]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="ov-chatbot">
      {isOpen && (
        <section
          className="ov-chat-window"
          role="dialog"
          aria-label="Our Vision Assistant chat"
        >
          <header className="ov-chat-header">
            <div className="ov-chat-header-info">
              <span className="ov-chat-header-avatar">
                <SmallCharacter />
              </span>

              <div className="ov-chat-header-text">
                <strong>Our Vision Assistant</strong>
                <small>
                  <span className="ov-chat-online-dot" />
                  Online Assistant
                </small>
              </div>
            </div>

            <button
              type="button"
              className="ov-chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </header>

          <div className="ov-chat-messages" aria-live="polite">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`ov-chat-message ${item.role}`}
              >
                <div className="ov-chat-bubble">
                  {item.role === "bot" && item.source === "GEMINI" ? (
                    <ChatMarkdown text={item.text} />
                  ) : item.role === "bot" ? (
                    <AnimatedBotText
                      text={item.text}
                      speed={28}
                      onTypingUpdate={handleTypingUpdate}
                    />
                  ) : (
                    item.text
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ov-chat-message bot">
                <div className="ov-chat-bubble ov-chat-typing">
                  <span />
                  <span />
                  <span />
                  <small>Answer search ho raha hai...</small>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="ov-chat-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Apna question likhein..."
              aria-label="Your question"
              maxLength={1000}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
            >
              {loading ? "..." : "Send"}
            </button>
          </form>
        </section>
      )}

      <AnimatedCharacter
        isOpen={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      />
    </div>
  );
}
