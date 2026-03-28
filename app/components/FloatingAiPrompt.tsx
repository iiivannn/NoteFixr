"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { ArrowUp, Minus, Sparkles } from "lucide-react";

interface FloatingAiPromptProps {
  editor: Editor | null;
  showToast: (message: string, type: "success" | "error") => void;
}

const PLACEHOLDERS = [
  "Ask me anything about your note...",
  "Clean and organize this for me...",
  "Summarize the key points...",
  "Extract all action items...",
  "Explain this concept further...",
  "Fix the grammar and structure...",
  "What does this section mean?",
  "Turn this into a task list...",
  "Search the web for more context...",
  "Make this more professional...",
  "Simplify this for me...",
  "What can NoteFixr do?",
];

const GRID_COLS = 24;
const GRID_ROWS = 3;
const TOTAL_DOTS = GRID_COLS * GRID_ROWS;

const DOT_DELAYS = Array.from({ length: TOTAL_DOTS }, () =>
  (Math.random() * 2).toFixed(2),
);

const DOT_DURATIONS = Array.from({ length: TOTAL_DOTS }, () =>
  (0.4 + Math.random() * 1.2).toFixed(2),
);

export default function FloatingAiPrompt({
  editor,
  showToast,
}: FloatingAiPromptProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const current = PLACEHOLDERS[placeholderIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && placeholderText.length < current.length) {
      timeout = setTimeout(() => {
        setPlaceholderText(current.slice(0, placeholderText.length + 1));
      }, 50);
    } else if (!isDeleting && placeholderText.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && placeholderText.length > 0) {
      timeout = setTimeout(() => {
        setPlaceholderText(current.slice(0, placeholderText.length - 1));
      }, 30);
    } else if (isDeleting && placeholderText.length === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
      }, 0);
    }

    return () => clearTimeout(timeout);
  }, [placeholderText, isDeleting, placeholderIndex]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !editor || loading) return;
    setLoading(true);

    const noteContent = editor.getHTML();
    const userQuery = input.trim();
    setInput("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent, query: userQuery }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        showToast(errData?.error ?? "Something went wrong — please try again", "error");
        setLoading(false);
        return;
      }

      if (!res.body) {
        showToast("AI did not return a response", "error");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }

      if (!result.trim()) {
        showToast("AI returned an empty response — try again", "error");
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(result);
        if (parsed.refused) {
          showToast(parsed.reason, "error");
          setLoading(false);
          return;
        }
      } catch {
        // not JSON — valid HTML, proceed
      }

      const currentContent = editor.getHTML();
      const hasContent =
        currentContent !== "<p></p>" && currentContent.trim() !== "";

      const replaceKeywords = /\b(clean|organize|fix|restructure|rewrite|format|correct|reformat|tidy|proofread|revise|summarize|shorten|improve|simplify|condense|rephrase|edit)\b/i;
      const shouldReplace = replaceKeywords.test(userQuery);

      if (!hasContent) {
        editor.commands.setContent(result);
      } else if (shouldReplace) {
        editor.commands.setContent(result);
      } else {
        editor.commands.focus("end");
        editor.commands.insertContent(`<p></p>${result}<p></p>`);
      }
      showToast("AI has updated your note", "success");
    } catch {
      showToast("Something went wrong — please try again", "error");
    }

    setLoading(false);
  }, [input, editor, loading, showToast]);

  return (
    <div className="floating-ai-prompt">
      {loading && (
        <div className="ai-thinking-wrapper">
          <div className="ai-thinking">
            <div className="ai-thinking-grid">
              {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
                <span
                  key={i}
                  className="ai-thinking-cell"
                  style={{
                    animationDelay: `${DOT_DELAYS[i]}s`,
                    animationDuration: `${DOT_DURATIONS[i]}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {minimized ? (
        <button
          className="floating-ai-minimized"
          onClick={() => setMinimized(false)}
          title="Open AI prompt"
        >
          <Sparkles size={14} /> Ask AI
        </button>
      ) : (
        <div className="floating-ai-wrapper">
          <label htmlFor="ai-chat" className="floating-ai-inner">
            <input
              ref={inputRef}
              className="floating-ai-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder={placeholderText}
              disabled={loading}
              id="ai-chat"
            />
            <button
              className="floating-ai-minimize"
              onClick={() => setMinimized(true)}
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              className={`floating-ai-send ${loading ? "floating-ai-send--loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              title="Send (Enter)"
            >
              <ArrowUp size={14} />
            </button>
          </label>
        </div>
      )}
    </div>
  );
}
