"use client";
import { useCallback, useState, useReducer } from "react";
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

export default function Editor({
  noteId,
  initialContent = "",
  initialTitle = "",
}: EditorProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [showTitlePrompt, setShowTitlePrompt] = useState(false);
  const { refresh, setSidebarOpen, sidebarOpen } = useNotes();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [editingTitle, setEditingTitle] = useState(false);

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
    onUpdate: () => forceUpdate(),
    onSelectionUpdate: () => forceUpdate(),
    onTransaction: () => forceUpdate(),
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

    const data = res.ok ? await res.json() : null;

    if (res.ok && data) {
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
            switch (val) {
              case "heading":
                editor.chain().focus().setHeading({ level: 1 }).run();
                break;
              case "subheading":
                editor.chain().focus().setHeading({ level: 2 }).run();
                break;
              case "title":
                editor.chain().focus().setHeading({ level: 3 }).run();
                break;
              case "subtitle":
                editor.chain().focus().setHeading({ level: 4 }).run();
                break;
              case "caption":
                editor.chain().focus().setHeading({ level: 6 }).run();
                break;
              default:
                editor.chain().focus().setParagraph().run();
                break;
            }
          }}
          value={
            editor.isActive("heading", { level: 1 })
              ? "heading"
              : editor.isActive("heading", { level: 2 })
                ? "subheading"
                : editor.isActive("heading", { level: 3 })
                  ? "title"
                  : editor.isActive("heading", { level: 4 })
                    ? "subtitle"
                    : editor.isActive("heading", { level: 6 })
                      ? "caption"
                      : "body"
          }
        >
          <option value="heading">Heading</option>
          <option value="subheading">Subheading</option>
          <option value="title">Title</option>
          <option value="subtitle">Subtitle</option>
          <option value="body">Body</option>
          <option value="caption">Caption</option>
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

      <AiToolbar editor={editor} onTitleChange={(t) => setTitle(t)} />
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
