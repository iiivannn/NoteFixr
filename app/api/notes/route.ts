import { prisma } from "../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) return NextResponse.json({ notes: [] });

  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      updatedAt: true,
      pinned: true,
    },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const note = await prisma.note.create({
    data: {
      title: title || null,
      rawContent: content,
      userId: user.id,
    },
  });

  return NextResponse.json(note);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, title, content, rawContent, saveMode } = await req.json();

  const note = await prisma.note.update({
    where: { id },
    data: {
      title: title || null,
      rawContent: rawContent || content,
      cleanContent: saveMode === "SMART" ? content : undefined,
      saveMode: saveMode || "QUICK",
    },
  });

  return NextResponse.json(note);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
