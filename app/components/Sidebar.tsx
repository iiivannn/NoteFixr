"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotes } from "../lib/notes-context";
import { Trash2 } from "lucide-react";

interface Note {
  id: string;
  title: string | null;
  updatedAt: string;
}

export default function Sidebar() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const { refreshKey, refresh } = useNotes();

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data.notes ?? []));
  }, [refreshKey]);

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data.notes ?? []));
  }, []);

  const filtered = notes.filter((n) =>
    (n.title ?? "Untitled").toLowerCase().includes(search.toLowerCase()),
  );

  function openNote(id: string) {
    router.push(`/notes/${id}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;

    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const cookies = document.cookie.split(";");
    const lastNoteId = cookies
      .find((c) => c.trim().startsWith("lastNoteId="))
      ?.split("=")[1];

    function clearLastNoteIdCookie() {
      document.cookie = "lastNoteId=; path=/; max-age=0";
    }

    if (lastNoteId === id) {
      clearLastNoteIdCookie();
    }

    refresh();
    router.push("/notes/new");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>NoteFixr</span>
        <button onClick={() => router.push("/notes/new")}>+ New</button>
      </div>

      <input
        className="sidebar-search"
        type="text"
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.map((note) => (
        <div
          key={note.id}
          className="sidebar-note-item"
          onClick={() => openNote(note.id)}
        >
          <span className="note-title">{note.title ?? "Untitled"}</span>
          <div className="note-item-footer">
            <span className="note-date">
              {new Date(note.updatedAt).toLocaleDateString()}
            </span>
            <button
              className="note-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(note.id);
              }}
              title="Delete note"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}
