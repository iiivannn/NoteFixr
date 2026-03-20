"use client";
import { createContext, useContext, useState, useCallback } from "react";

interface NotesContextType {
  refreshKey: number;
  refresh: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  draftKey: number;
  notifyDraftChange: () => void;
}

const NotesContext = createContext<NotesContextType>({
  refreshKey: 0,
  refresh: () => {},
  sidebarOpen: false,
  setSidebarOpen: () => {},
  draftKey: 0,
  notifyDraftChange: () => {},
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [draftKey, setDraftKey] = useState(0);
  const notifyDraftChange = useCallback(() => {
    setDraftKey((k) => k + 1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <NotesContext.Provider
      value={{
        refreshKey,
        refresh,
        sidebarOpen,
        setSidebarOpen,
        draftKey,
        notifyDraftChange,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);
