"use client";
import { useEffect, useState, useReducer } from "react";
import { useRouter } from "next/navigation";
import { useNotes } from "../lib/notes-context";
import {
  Trash2,
  Pin,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Plus,
} from "lucide-react";
import DeleteModal from "./DeleteModal";

interface Note {
  id: string;
  title: string | null;
  updatedAt: string;
  pinned: boolean;
  rawContent: string;
}

export default function Sidebar() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const { refreshKey, refresh, sidebarOpen, setSidebarOpen, draftKey } =
    useNotes();
  const [collapsed, setCollapsed] = useState(false);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const filtered = notes.filter((n) => {
    const query = search.toLowerCase();
    const titleMatch = (n.title ?? "Untitled").toLowerCase().includes(query);

    const savedContent = (n.rawContent ?? "")
      .replace(/<[^>]*>/g, "")
      .toLowerCase();
    const savedMatch = savedContent.includes(query);

    const draft = localStorage.getItem(`draft_${n.id}`);
    const draftContent = draft
      ? JSON.parse(draft)
          .content.replace(/<[^>]*>/g, "")
          .toLowerCase()
      : "";
    const draftMatch = draftContent.includes(query);

    return titleMatch || savedMatch || draftMatch;
  });
  const pinnedNotes = filtered.filter((n) => n.pinned);
  const unpinnedNotes = filtered.filter((n) => !n.pinned);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    forceUpdate();
  }, [draftKey]);

  useEffect(() => {
    function handleStorage() {
      forceUpdate();
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data.notes ?? []));
  }, [refreshKey]);

  function openNote(id: string) {
    router.push(`/notes/${id}`);
  }

  function hasDraft(id: string) {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(`draft_${id}`);
  }

  async function handlePin(id: string, pinned: boolean) {
    await fetch("/api/notes/pin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: !pinned }),
    });
    refresh();
  }

  function noteItem(note: Note) {
    return (
      <div
        key={note.id}
        className={`sidebar-note-item ${note.pinned ? "sidebar-note-item--pinned" : ""}`}
        onClick={() => openNote(note.id)}
        onMouseEnter={() => router.prefetch(`/notes/${note.id}`)}
      >
        <div className="note-title-row">
          {hasDraft(note.id) && (
            <span className="unsaved-dot" title="Unsaved changes" />
          )}
          <span className="note-title">
            <span className="note-title-text">{note.title ?? "Untitled"}</span>
          </span>
          <button
            className={`note-pin-btn ${note.pinned ? "note-pin-btn--active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePin(note.id, note.pinned);
            }}
            title={note.pinned ? "Unpin" : "Pin"}
          >
            <Pin size={14} />
          </button>
        </div>

        <div className="note-item-footer">
          <span className="note-date">
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
          <div className="note-item-actions">
            <button
              className="note-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(note.id, note.title ?? "Untitled");
              }}
              title="Delete note"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleDelete(id: string, title: string) {
    setDeleteTarget({ id, title });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });

    const cookies = document.cookie.split(";");
    const lastNoteId = cookies
      .find((c) => c.trim().startsWith("lastNoteId="))
      ?.split("=")[1];

    function clearLastNoteIdCookie() {
      document.cookie = "lastNoteId=; path=/; max-age=0";
    }

    if (lastNoteId === deleteTarget.id) clearLastNoteIdCookie();

    setDeleteTarget(null);
    refresh();
    router.push("/notes/new");
  }

  return (
    <>
      <div
        className={`sidebar-overlay ${sidebarOpen ? "sidebar-overlay--visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${sidebarOpen ? "sidebar--open" : ""}`}
      >
        <div className="sidebar-header">
          {(!collapsed || sidebarOpen) && <span>NOTEFIXR</span>}
          <div className="sidebar-header-actions">
            {(!collapsed || sidebarOpen) && (
              <button
                className="sidebar-icon-btn"
                onClick={() => router.push("/notes/new")}
                title="New note"
              >
                <Plus size={15} />
              </button>
            )}
            <button
              className="sidebar-toggle"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen size={15} />
              ) : (
                <PanelLeftClose size={15} />
              )}
            </button>
            <button
              className="sidebar-close-mobile"
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {(!collapsed || sidebarOpen) && (
          <>
            <input
              className="sidebar-search"
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="sidebar-notes">
              {pinnedNotes.length === 0 && unpinnedNotes.length === 0 && (
                <p className="sidebar-empty">No notes yet</p>
              )}

              {pinnedNotes.length > 0 && (
                <>
                  <p className="sidebar-section-label">Pinned</p>
                  {pinnedNotes.map((note) => noteItem(note))}
                  <div className="sidebar-section-divider" />
                </>
              )}

              {unpinnedNotes.length > 0 && (
                <>
                  {pinnedNotes.length > 0 && (
                    <p className="sidebar-section-label">Notes</p>
                  )}
                  {unpinnedNotes.map((note) => noteItem(note))}
                </>
              )}
            </div>
          </>
        )}
      </aside>

      {deleteTarget && (
        <DeleteModal
          noteName={deleteTarget.title}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
