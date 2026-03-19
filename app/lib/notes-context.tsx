"use client";
import { createContext, useContext, useState, useCallback } from "react";

interface NotesContextType {
  refreshKey: number;
  refresh: () => void;
}

const NotesContext = createContext<NotesContextType>({
  refreshKey: 0,
  refresh: () => {},
});

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <NotesContext.Provider value={{ refreshKey, refresh }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);