import Sidebar from "../components/Sidebar";
import "../styles/app/index.scss";
import { NotesProvider } from "../lib/notes-context";
import SessionWrapper from "../components/SessionWrapper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionWrapper>
      <NotesProvider>
        <div className="app-layout">
          <Sidebar />

          <main>{children}</main>
        </div>
      </NotesProvider>
    </SessionWrapper>
  );
}
