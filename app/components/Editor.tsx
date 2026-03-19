"use client";
import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import { useNotes } from "../lib/notes-context";
import SettingsMenu from "./SettingsMenu";

interface EditorProps {
  noteId?: string;
  initialContent?: string;
  initialTitle?: string;
}

export default function Editor({
  noteId,
  initialContent = "",
  initialTitle = "",
}: EditorProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [showTitlePrompt, setShowTitlePrompt] = useState(false);
  const { refresh } = useNotes();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: {
        class: "editor-textarea",
        spellcheck: "false",
      },
    },
  });

  const saveNote = useCallback(async () => {
    if (!editor) return;
    setSaving(true);

    const content = editor.getHTML();

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
      refresh();
    }

    setSaving(false);
  }, [editor, noteId, title, refresh]);

  const handleQuickSave = useCallback(async () => {
    if (!title) {
      setShowTitlePrompt(true);
      return;
    }
    await saveNote();
  }, [title, saveNote]);

  if (!editor) return null;

  const chars = editor.getText().length;
  const words = editor.getText().split(/\s+/).filter(Boolean).length;

  return (
    <div className="editor-wrapper">
      <div className="editor-menubar">
        <span className="editor-note-title">{title || "Untitled"}</span>
        <div className="menubar-actions">
          <button
            className={saved ? "btn-saved" : "btn-save"}
            onClick={handleQuickSave}
            disabled={saving}
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
          </button>
          <SettingsMenu />
        </div>
      </div>

      <div className="editor-toolbar">
        <select
          className="toolbar-select"
          onChange={(e) => {
            const val = e.target.value;
            if (val === "p") editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({ level: parseInt(val) as 1 | 2 | 3 })
                .run();
          }}
          value={
            editor.isActive("heading", { level: 1 })
              ? "1"
              : editor.isActive("heading", { level: 2 })
                ? "2"
                : editor.isActive("heading", { level: 3 })
                  ? "3"
                  : "p"
          }
        >
          <option value="p">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive("bold") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("italic") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("underline") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("highlight") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          H
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("strike") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive("bulletList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          ☰
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("orderedList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          ≡
        </button>
        <button
          className={`toolbar-btn ${editor.isActive("taskList") ? "active" : ""}`}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task list"
        >
          ☑
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn ${editor.isActive({ textAlign: "left" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align left"
        >
          ←
        </button>
        <button
          className={`toolbar-btn ${editor.isActive({ textAlign: "center" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          ↔
        </button>
        <button
          className={`toolbar-btn ${editor.isActive({ textAlign: "right" }) ? "active" : ""}`}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          →
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-btn"
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          ↩
        </button>
        <button
          className="toolbar-btn"
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          ↪
        </button>
      </div>

      <EditorContent editor={editor} />

      <div className="editor-statusbar">
        <span>{chars} chars</span>
        <span>{words} words</span>
      </div>

      {showTitlePrompt && (
        <div className="title-prompt-overlay">
          <div className="title-prompt-box">
            <h3>Name your note</h3>
            <input
              type="text"
              placeholder="Give this note a title..."
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
            <div className="title-prompt-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowTitlePrompt(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowTitlePrompt(false);
                  saveNote();
                }}
                disabled={!title}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
