"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { ArrowUp, Minus, Sparkles } from "lucide-react";
import type { AiProgress } from "./AiProgressBanner";

interface FloatingAiPromptProps {
  editor: Editor | null;
  showToast: (message: string, type: "success" | "error") => void;
  setAiProgress: (progress: AiProgress | null) => void;
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

const CHAT_PHASES = [
  "Thinking about your request",
  "Working on a response",
  "Drafting the result",
  "Polishing the wording",
];

const PHASE_INTERVAL_MS = 1800;

export default function FloatingAiPrompt({
  editor,
  showToast,
  setAiProgress,
}: FloatingAiPromptProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [minimized, setMinimized] = useState(false);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realProgressRef = useRef(false);
  const progressRef = useRef<AiProgress | null>(null);

  const updateProgress = useCallback(
    (next: AiProgress | null) => {
      progressRef.current = next;
      setAiProgress(next);
    },
    [setAiProgress],
  );

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

  const startCycling = useCallback(() => {
    realProgressRef.current = false;
    let i = 0;
    updateProgress({ phases: CHAT_PHASES, currentIndex: 0 });
    cycleTimerRef.current = setInterval(() => {
      if (realProgressRef.current) return;
      if (i >= CHAT_PHASES.length - 1) {
        if (cycleTimerRef.current) {
          clearInterval(cycleTimerRef.current);
          cycleTimerRef.current = null;
        }
        return;
      }
      i += 1;
      const prev = progressRef.current;
      if (prev) updateProgress({ ...prev, currentIndex: i });
    }, PHASE_INTERVAL_MS);
  }, [updateProgress]);

  const stopChecklist = useCallback(() => {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    realProgressRef.current = false;
    updateProgress(null);
  }, [updateProgress]);

  const completeAndStop = useCallback(() => {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    realProgressRef.current = true;
    const prev = progressRef.current;
    if (!prev) {
      updateProgress(null);
      return;
    }
    updateProgress({ ...prev, currentIndex: prev.phases.length });
    setTimeout(() => updateProgress(null), 700);
  }, [updateProgress]);

  const takeOverWithLongPath = useCallback(
    (total: number) => {
      realProgressRef.current = true;
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
      updateProgress({
        phases: [
          `Processing section 1 of ${total}`,
          "Assembling final result",
        ],
        currentIndex: 0,
      });
    },
    [updateProgress],
  );

  const updateProcessingLabel = useCallback(
    (current: number, total: number) => {
      const prev = progressRef.current;
      if (!prev) return;
      const phases = [...prev.phases];
      phases[0] = `Processing section ${Math.max(1, current)} of ${total}`;
      updateProgress({ ...prev, phases, currentIndex: 0 });
    },
    [updateProgress],
  );

  const advanceToAssembling = useCallback(() => {
    const prev = progressRef.current;
    if (!prev) return;
    updateProgress({ ...prev, currentIndex: prev.phases.length - 1 });
  }, [updateProgress]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !editor || loading) return;
    setLoading(true);
    startCycling();

    const noteContent = editor.getHTML();
    const userQuery = input.trim();
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    let success = false;
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent, query: userQuery }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        showToast(errData?.error ?? "Something went wrong — please try again", "error");
        return;
      }

      if (!res.body) {
        showToast("AI did not return a response", "error");
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      const isNdjson = contentType.includes("application/x-ndjson");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let errored = false;
      let longPathInitialized = false;

      if (isNdjson) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const event = JSON.parse(trimmed);
              if (event.type === "progress") {
                if (event.phase === "processing") {
                  if (!longPathInitialized) {
                    takeOverWithLongPath(event.total);
                    longPathInitialized = true;
                  }
                  if (event.current > 0) {
                    updateProcessingLabel(event.current, event.total);
                  }
                } else if (event.phase === "assembling") {
                  if (!longPathInitialized) {
                    takeOverWithLongPath(event.total);
                    longPathInitialized = true;
                  }
                  advanceToAssembling();
                }
              } else if (event.type === "result") {
                result = event.html ?? "";
              } else if (event.type === "error") {
                showToast(event.message, "error");
                errored = true;
              }
            } catch {
              // ignore malformed lines
            }
          }
        }
      } else {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
        }
      }

      if (errored) return;

      if (!result.trim()) {
        showToast("AI returned an empty response — try again", "error");
        return;
      }

      try {
        const parsed = JSON.parse(result);
        if (parsed.refused) {
          showToast(parsed.reason, "error");
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
      success = true;
    } catch {
      showToast("Something went wrong — please try again", "error");
    } finally {
      if (success) {
        completeAndStop();
      } else {
        stopChecklist();
      }
      setLoading(false);
    }
  }, [
    input,
    editor,
    loading,
    showToast,
    startCycling,
    stopChecklist,
    completeAndStop,
    takeOverWithLongPath,
    updateProcessingLabel,
    advanceToAssembling,
  ]);

  return (
    <div className="floating-ai-prompt">
      <div className={`floating-ai-stack ${minimized ? "is-minimized" : ""}`}>
        <button
          className="floating-ai-minimized"
          onClick={() => setMinimized(false)}
          title="Open AI prompt"
          aria-hidden={!minimized}
          tabIndex={minimized ? 0 : -1}
        >
          <Sparkles size={14} /> Ask AI
        </button>
        <div
          className="floating-ai-wrapper"
          aria-hidden={minimized}
        >
          <label htmlFor="ai-chat" className="floating-ai-inner">
            <textarea
              ref={inputRef}
              className="floating-ai-input"
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={placeholderText}
              disabled={loading}
              id="ai-chat"
              tabIndex={minimized ? -1 : 0}
            />
            <button
              className="floating-ai-minimize"
              onClick={() => setMinimized(true)}
              title="Minimize"
              tabIndex={minimized ? -1 : 0}
            >
              <Minus size={14} />
            </button>
            <button
              className={`floating-ai-send ${loading ? "floating-ai-send--loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              title="Send (Enter)"
              tabIndex={minimized ? -1 : 0}
            >
              <ArrowUp size={14} />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
}
