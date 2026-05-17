"use client";
import { useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import { Wand2, FileText, ListChecks, ScanText, Loader2 } from "lucide-react";
import type { AiProgress } from "./AiProgressBanner";

interface AiToolbarProps {
  editor: Editor;
  showToast: (message: string, type: "success" | "error") => void;
  setAiProgress: (progress: AiProgress | null) => void;
}

const PHASES: Record<string, string[]> = {
  clean: [
    "Reading your note",
    "Fixing grammar and structure",
    "Reorganizing sections",
    "Polishing the result",
  ],
  summarize: [
    "Reading your note",
    "Identifying key points",
    "Drafting the summary",
    "Finalizing the overview",
  ],
  extractTasks: [
    "Reading your note",
    "Finding action items",
    "Building the task list",
  ],
  elaborate: [
    "Reading your note",
    "Searching the web",
    "Cross-referencing sources",
    "Expanding the content",
  ],
};

const PHASE_INTERVAL_MS = 1800;

export default function AiToolbar({
  editor,
  showToast,
  setAiProgress,
}: AiToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realProgressRef = useRef(false);
  const progressRef = useRef<AiProgress | null>(null);

  function updateProgress(next: AiProgress | null) {
    progressRef.current = next;
    setAiProgress(next);
  }

  function startCycling(mode: string) {
    realProgressRef.current = false;
    const phases = PHASES[mode] ?? ["Working on your note"];
    let i = 0;
    updateProgress({ phases, currentIndex: 0 });
    cycleTimerRef.current = setInterval(() => {
      if (realProgressRef.current) return;
      if (i >= phases.length - 1) {
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
  }

  function stopChecklist() {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    realProgressRef.current = false;
    updateProgress(null);
  }

  function completeAndStop() {
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
  }

  function takeOverWithLongPath(total: number) {
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
  }

  function updateProcessingLabel(current: number, total: number) {
    const prev = progressRef.current;
    if (!prev) return;
    const phases = [...prev.phases];
    phases[0] = `Processing section ${Math.max(1, current)} of ${total}`;
    updateProgress({ ...prev, phases, currentIndex: 0 });
  }

  function advanceToAssembling() {
    const prev = progressRef.current;
    if (!prev) return;
    updateProgress({ ...prev, currentIndex: prev.phases.length - 1 });
  }

  async function runAction(mode: string) {
    if (!editor) return;
    setLoading(mode);
    startCycling(mode);

    let success = false;
    try {
      const content = editor.getHTML();

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mode }),
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
      let finalHtml = "";
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
                finalHtml = event.html ?? "";
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
          finalHtml += decoder.decode(value, { stream: true });
        }
      }

      if (errored) return;

      if (!finalHtml.trim()) {
        showToast("AI returned an empty response — try again", "error");
        return;
      }

      editor.commands.setContent(finalHtml);
      showToast(
        mode === "clean"
          ? "Note cleaned and organized"
          : mode === "summarize"
            ? "Note summarized"
            : mode === "extractTasks"
              ? "Tasks extracted"
              : "Note elaborated",
        "success",
      );
      success = true;
    } catch {
      showToast("Something went wrong — please try again", "error");
    } finally {
      if (success) {
        completeAndStop();
      } else {
        stopChecklist();
      }
      setLoading(null);
    }
  }

  return (
    <div className="ai-toolbar">
      <span className="ai-toolbar-label">AI</span>

      <button
        className={`ai-btn ${loading === "clean" ? "ai-btn--loading" : ""}`}
        onClick={() => runAction("clean")}
        disabled={!!loading}
        title="Clean & Organize"
      >
        {loading === "clean" ? (
          <Loader2 size={13} className="spin" />
        ) : (
          <Wand2 size={13} />
        )}
        Clean
      </button>

      <button
        className={`ai-btn ${loading === "summarize" ? "ai-btn--loading" : ""}`}
        onClick={() => runAction("summarize")}
        disabled={!!loading}
        title="Summarize"
      >
        {loading === "summarize" ? (
          <Loader2 size={13} className="spin" />
        ) : (
          <FileText size={13} />
        )}
        Summarize
      </button>

      <button
        className={`ai-btn ${loading === "extractTasks" ? "ai-btn--loading" : ""}`}
        onClick={() => runAction("extractTasks")}
        disabled={!!loading}
        title="Extract Tasks"
      >
        {loading === "extractTasks" ? (
          <Loader2 size={13} className="spin" />
        ) : (
          <ListChecks size={13} />
        )}
        Tasks
      </button>

      <button
        className={`ai-btn ${loading === "elaborate" ? "ai-btn--loading" : ""}`}
        onClick={() => runAction("elaborate")}
        disabled={!!loading}
        title="Explains the content further"
      >
        {loading === "elaborate" ? (
          <Loader2 size={13} className="spin" />
        ) : (
          <ScanText size={13} />
        )}
        Elaborate
      </button>
    </div>
  );
}
