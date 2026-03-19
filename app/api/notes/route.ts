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
    include: { notes: { orderBy: { updatedAt: "desc" } } },
  });

  return NextResponse.json({ notes: user?.notes ?? [] });
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

  const { id, title, content } = await req.json();

  const note = await prisma.note.update({
    where: { id },
    data: {
      title: title || null,
      rawContent: content,
    },
  });

  return NextResponse.json(note);
}
