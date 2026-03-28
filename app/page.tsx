import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import LandingPage from "./components/landing/LandingPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const cookieStore = await cookies();
    const lastNoteId = cookieStore.get("lastNoteId")?.value;

    if (lastNoteId) {
      redirect(`/notes/${lastNoteId}`);
    } else {
      redirect("/notes/new");
    }
  }

  return <LandingPage />;
}
