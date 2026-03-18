import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const lastNoteId = cookieStore.get("lastNoteId")?.value;

  if (lastNoteId) {
    redirect(`/notes/${lastNoteId}`);
  } else {
    redirect("/notes/new");
  }
}
