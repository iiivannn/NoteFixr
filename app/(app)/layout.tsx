import Sidebar from "../components/Sidebar";
import "../styles/app.scss";
import { NotesProvider } from "../lib/notes-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotesProvider>
      <div className="app-layout">
        <Sidebar />

        <main>{children}</main>
      </div>
    </NotesProvider>
  );
}
