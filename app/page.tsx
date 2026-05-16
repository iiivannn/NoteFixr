import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import { prisma } from "./lib/prisma";
import LandingPage from "./components/landing/LandingPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const cookieStore = await cookies();
    const lastNoteId = cookieStore.get("lastNoteId")?.value;

    if (lastNoteId) {
      const note = await prisma.note.findUnique({
        where: { id: lastNoteId },
        select: { id: true },
      });
      if (note) {
        redirect(`/notes/${lastNoteId}`);
      }
    }
    redirect("/notes/new");
  }

  return <LandingPage />;
}
