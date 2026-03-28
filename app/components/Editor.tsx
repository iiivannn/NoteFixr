"use client";
import { useCallback, useState, useReducer, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import { useNotes } from "../lib/notes-context";
import SettingsMenu from "./SettingsMenu";
import AiToolbar from "./AiToolbar";
import { useRouter } from "next/navigation";
import FloatingAiPrompt from "./FloatingAiPrompt";
import Toast from "./Toast";
import { useToast } from "../lib/useToast";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Pencil,
  Menu,
} from "lucide-react";

interface EditorProps {
  noteId?: string;
  initialContent?: string;
  initialTitle?: string;
}

const SMART_SAVE_MESSAGES = [
  "Analyzing note...",
  "Cleaning structure...",
  "Organizing thoughts...",
  "Removing clutter...",
  "Polishing content...",
];

export default function Editor({
  noteId,
  initialContent = "",
  initialTitle = "",
}: EditorProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [showTitlePrompt, setShowTitlePrompt] = useState(false);
  const { refresh, setSidebarOpen, sidebarOpen, notifyDraftChange } =
    useNotes();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [smartSaving, setSmartSaving] = useState(false);
  const router = useRouter();
  const [promptTitle, setPromptTitle] = useState("");
  const { toast, showToast, hideToast } = useToast();
  const [smartSavingIndex, setSmartSavingIndex] = useState(0);
  const [smartSavingFade, setSmartSavingFade] = useState(true);

  useEffect(() => {
    if (!smartSaving) {
      const reset = setTimeout(() => {
        setSmartSavingIndex(0);
        setSmartSavingFade(true);
      }, 0);
      return () => clearTimeout(reset);
    }

    const interval = setInterval(() => {
      setSmartSavingFade(false);
      setTimeout(() => {
        setSmartSavingIndex((i) => (i + 1) % SMART_SAVE_MESSAGES.length);
        setSmartSavingFade(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [smartSaving]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 6],
        },
      }),
      Underline,
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "task-item",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: (() => {
      if (typeof window === "undefined") return initialContent || "<p></p>";
      if (noteId) {
        const draft = localStorage.getItem(`draft_${noteId}`);
        if (draft)
          return JSON.parse(draft).content || initialContent || "<p></p>";
      }
      return initialContent || "<p></p>";
    })(),
    editorProps: {
      attributes: {
        class: "editor-textarea",
        spellcheck: "false",
      },
      handleKeyDown(view, event) {
        if (event.key === "Tab") {
          event.preventDefault();
          const { state, dispatch } = view;
          dispatch(state.tr.insertText("\u00a0\u00a0\u00a0\u00a0"));
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      forceUpdate();
      if (noteId) {
        const currentContent = editor.getHTML();
        if (currentContent === initialContent) {
          localStorage.removeItem(`draft_${noteId}`);
        } else {
          localStorage.setItem(
            `draft_${noteId}`,
            JSON.stringify({ content: currentContent }),
          );
        }
        notifyDraftChange();
      }
    },
    onSelectionUpdate: () => forceUpdate(),
    onTransaction: () => forceUpdate(),
  });

  const saveNote = useCallback(
    async (overrideTitle?: string) => {
      if (!editor) return;
      setSaving(true);
      if (noteId) localStorage.removeItem(`draft_${noteId}`);

      const content = editor.getHTML();
      const finalTitle = overrideTitle ?? title;

      const res = await fetch("/api/notes", {
        method: noteId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noteId, title: finalTitle, content }),
      });

      const data = res.ok ? await res.json() : null;

      if (res.ok && data) {
        localStorage.removeItem(`draft_${noteId ?? "new"}`);
        document.cookie = `lastNoteId=${data.id}; path=/; max-age=31536000`;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        refresh();
        if (!noteId) router.replace(`/notes/${data.id}`);
      }
      setSaving(false);
    },
    [editor, noteId, title, refresh, router],
  );

  const getFirstLine = useCallback(() => {
    const text = editor?.getText() ?? "";
    const firstLine = text.split("\n").find((line) => line.trim() !== "") ?? "";
    return firstLine.trim();
  }, [editor]);

  const handleQuickSave = useCallback(async () => {
    if (!title) {
      const firstLine = getFirstLine();
      setPromptTitle(firstLine || "Untitled");
      setShowTitlePrompt(true);
      return;
    }
    await saveNote();
  }, [title, saveNote, getFirstLine]);

  const chars = editor?.getText().length;
  const words = editor?.getText().split(/\s+/).filter(Boolean).length;

  async function handleTitleSave() {
    setEditingTitle(false);
    if (!noteId || !title) return;
    await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: noteId, title }),
    });
    refresh();
  }

  const handleSmartSave = useCallback(
    async (overrideTitle?: string) => {
      const finalTitle = overrideTitle ?? title;
      if (!finalTitle) {
        const firstLine = getFirstLine();
        setPromptTitle(firstLine || "Untitled");
        setShowTitlePrompt(true);
        return;
      }
      if (!editor) return;
      setSmartSaving(true);

      if (noteId) localStorage.removeItem(`draft_${noteId}`);

      const raw = editor.getHTML();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: raw, mode: "clean" }),
      });

      let cleaned = raw;
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        showToast(errData?.error ?? "AI failed — note saved as-is", "error");
      } else if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
        }
        if (result.trim()) {
          cleaned = result;
          editor.commands.setContent(cleaned);
        }
      }

      const saveRes = await fetch("/api/notes", {
        method: noteId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: noteId,
          title: finalTitle,
          content: cleaned,
          rawContent: raw,
          saveMode: "SMART",
        }),
      });

      const data = saveRes.ok ? await saveRes.json() : null;

      if (saveRes.ok && data) {
        localStorage.removeItem(`draft_${noteId ?? "new"}`);
        document.cookie = `lastNoteId=${data.id}; path=/; max-age=31536000`;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        refresh();
        if (!noteId) router.replace(`/notes/${data.id}`);
      }

      setSmartSaving(false);
    },
    [editor, noteId, title, refresh, router, getFirstLine, showToast],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleSmartSave();
      } else if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleQuickSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleQuickSave, handleSmartSave]);

  if (!editor) return null;

  return (
    <div className="editor-wrapper">
      <div className="editor-menubar">
        <button
          className="sidebar-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle sidebar"
        >
          <Menu size={16} />
        </button>

        <div className="editor-note-title-wrapper">
          {editingTitle ? (
            <input
              className="editor-title-input"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") setEditingTitle(false);
              }}
            />
          ) : (
            <div
              className="editor-note-title"
              onClick={() => noteId && setEditingTitle(true)}
              style={{ cursor: noteId ? "pointer" : "default" }}
            >
              <span>{title || "Untitled"}</span>
              {noteId && <Pencil size={12} />}
            </div>
          )}
        </div>
        <div className="menubar-actions">
          <button
            className={saved ? "btn-saved" : "btn-save"}
            onClick={handleQuickSave}
            disabled={saving}
            title="Quick Save (Ctrl+S)"
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </button>
          <button
            className={smartSaving ? "btn-saved" : "btn-smart-save"}
            onClick={() => handleSmartSave()}
            disabled={smartSaving || saving}
            title="Smart Save — AI organizes then saves (Ctrl+Shift+S)"
            style={{ transition: "opacity 0.3s ease" }}
          >
            {smartSaving ? (
              <span
                style={{
                  opacity: smartSavingFade ? 1 : 0,
                  transition: "opacity 0.3s ease",
                  display: "inline-block",
                }}
              >
                {SMART_SAVE_MESSAGES[smartSavingIndex]}
              </span>
            ) : (
              "Smart Save"
            )}
          </button>
          <SettingsMenu />
        </div>
      </div>

      <div className="editor-toolbar">
        <select
          className="toolbar-select"
          onChange={(e) => {
            const val = e.target.value;
            switch (val) {
              case "h1":
                editor.chain().focus().setHeading({ level: 1 }).run();
                break;
              case "h2":
                editor.chain().focus().setHeading({ level: 2 }).run();
                break;
              case "h3":
                editor.chain().focus().setHeading({ level: 3 }).run();
                break;
              case "subheading":
                editor.chain().focus().setHeading({ level: 4 }).run();
                break;
              case "subtext":
                editor.chain().focus().setHeading({ level: 6 }).run();
                break;
              default:
                editor.chain().focus().setParagraph().run();
                break;
            }
          }}
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : editor.isActive("heading", { level: 4 })
                    ? "subheading"
                    : editor.isActive("heading", { level: 6 })
                      ? "subtext"
                      : "body"
          }
        >
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="subheading">Subheading</option>
          <option value="body">Body</option>
          <option value="subtext">Subtext</option>
        </select>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive("bold") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={14} />
        </button>

        <button
          className={`toolbar-btn ${editor.isActive("italic") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={14} />
        </button>

        <button
          className={`toolbar-btn ${editor.isActive("underline") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon size={14} />
        </button>

        <button
          className={`toolbar-btn ${editor.isActive("highlight") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <Highlighter size={14} />
        </button>

        <button
          className={`toolbar-btn ${editor.isActive("strike") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive("bulletList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List size={14} />
        </button>

        <button
          className={`toolbar-btn ${editor.isActive("orderedList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </button>

        <button
          className={`toolbar-btn ${editor.isActive("taskList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task list"
        >
          <ListChecks size={14} />
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive({ textAlign: "left" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          <AlignLeft size={14} />
        </button>

        <button
          className={`toolbar-btn ${editor.isActive({ textAlign: "center" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          <AlignCenter size={14} />
        </button>

        <button
          className={`toolbar-btn ${editor.isActive({ textAlign: "right" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <AlignRight size={14} />
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-btn"
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo size={14} />
        </button>

        <button
          className="toolbar-btn"
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo size={14} />
        </button>
      </div>

      <AiToolbar editor={editor} showToast={showToast} />
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} />
      </div>

      <div className="editor-statusbar">
        <span>{chars} chars</span>
        <span>{words} words</span>
      </div>

      {showTitlePrompt && (
        <div className="title-prompt-overlay">
          <div className="title-prompt-box">
            <h3>File Name</h3>
            <input
              type="text"
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const t = promptTitle || "Untitled";
                  setTitle(t);
                  setShowTitlePrompt(false);
                  saveNote(t);
                }
                if (e.key === "Escape") {
                  setShowTitlePrompt(false);
                }
              }}
            />
            <div className="title-prompt-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  const t = promptTitle || "Untitled";
                  setTitle(t);
                  setShowTitlePrompt(false);
                  saveNote(t);
                }}
                disabled={!promptTitle}
              >
                Save
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setShowTitlePrompt(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingAiPrompt editor={editor} showToast={showToast} />

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
