import Editor from "../../../components//Editor";
import { prisma } from "../../../lib/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NoteIdPage({ params }: Props) {
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });

  if (!note) {
    localStorage.removeItem("lastNoteId");
    notFound();
  }

  return <Editor noteId={note.id} initialContent={note.rawContent} />;
}
