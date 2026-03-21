"use client";
import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Wand2, FileText, ListChecks, Tag, Loader2 } from "lucide-react";

interface AiToolbarProps {
  editor: Editor;
  onTitleChange: (title: string) => void;
  showToast: (message: string, type: "success" | "error") => void;
}

export default function AiToolbar({
  editor,
  onTitleChange,
  showToast,
}: AiToolbarProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function runAction(mode: string) {
    if (!editor) return;
    setLoading(mode);

    try {
      const content = editor.getHTML();

      if (mode === "titleTag") {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, mode }),
        });
        const data = await res.json();
        if (data.title) {
          onTitleChange(data.title);
          showToast("Title and tags generated successfully", "success");
        } else {
          showToast("Could not generate title — try again", "error");
        }
        setLoading(null);
        return;
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mode }),
      });

      if (!res.body) {
        showToast("AI did not return a response", "error");
        setLoading(null);
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
        setLoading(null);
        return;
      }

      editor.commands.setContent(result);
      showToast(
        mode === "clean"
          ? "Note cleaned and organized"
          : mode === "summarize"
            ? "Note summarized"
            : "Tasks extracted",
        "success",
      );
    } catch {
      showToast("Something went wrong — please try again", "error");
    }

    setLoading(null);
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
        className={`ai-btn ${loading === "titleTag" ? "ai-btn--loading" : ""}`}
        onClick={() => runAction("titleTag")}
        disabled={!!loading}
        title="Auto-title & Tag"
      >
        {loading === "titleTag" ? (
          <Loader2 size={13} className="spin" />
        ) : (
          <Tag size={13} />
        )}
        Auto-title
      </button>
    </div>
  );
}
