"use client";
import { useState, useEffect, useCallback } from "react";

interface EditorProps {
  noteId?: string;
  initialContent?: string;
}

export default function Editor({ noteId, initialContent = "" }: EditorProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState("");
  const [showTitlePrompt, setShowTitlePrompt] = useState(false);

  const [content, setContent] = useState(() => {
    if (noteId) return initialContent;
    if (typeof window === "undefined") return initialContent;
    const draft = localStorage.getItem("draft");
    if (!draft) return initialContent;
    return JSON.parse(draft).content ?? initialContent;
  });

  const saveNote = useCallback(async () => {
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: noteId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: noteId, title, content }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem("draft");
      document.cookie = `lastNoteId=${data.id}; path=/; max-age=31536000`;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  }, [noteId, title, content]);

  const handleQuickSave = useCallback(async () => {
    if (!title) {
      setShowTitlePrompt(true);
      return;
    }
    await saveNote();
  }, [title, saveNote]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleQuickSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleQuickSave]);

  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem("draft", JSON.stringify({ content }));
    }, 30000);
    return () => clearInterval(timer);
  }, [content]);

  return (
    <div>
      <div className="editor-wrapper">
        <div className="editor-topbar">
          <div className="editor-actions">
            <button onClick={handleQuickSave} disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Quick Save"}
            </button>
          </div>
        </div>

        <textarea
          className="editor-textarea"
          placeholder="Start typing..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
        />

        <div className="editor-statusbar">
          <span>{content.length} chars</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>

      {showTitlePrompt && (
        <div className="title-prompt">
          <input
            type="text"
            placeholder="File name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && title) {
                setShowTitlePrompt(false);
                saveNote();
              }
              if (e.key === "Escape") setShowTitlePrompt(false);
            }}
          />
          <button
            onClick={() => {
              setShowTitlePrompt(false);
              saveNote();
            }}
            disabled={!title}
          >
            Save
          </button>
          <button onClick={() => setShowTitlePrompt(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
