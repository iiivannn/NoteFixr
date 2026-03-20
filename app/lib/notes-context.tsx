"use client";
import { createContext, useContext, useState, useCallback } from "react";

interface NotesContextType {
  refreshKey: number;
  refresh: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const NotesContext = createContext<NotesContextType>({
  refreshKey: 0,
  refresh: () => {},
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <NotesContext.Provider
      value={{ refreshKey, refresh, sidebarOpen, setSidebarOpen }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);
