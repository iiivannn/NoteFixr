"use client";
import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Settings, LogOut, X, Sun, Moon, Monitor } from "lucide-react";

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="settings-menu" ref={ref}>
      <button
        className="settings-trigger"
        onClick={() => setOpen((o) => !o)}
        title="Settings"
      >
        <Settings size={15} />
      </button>

      {open && (
        <div className="settings-dropdown">
          <div className="settings-dropdown-header">
            <span>Settings</span>
            <button onClick={() => setOpen(false)}>
              <X size={13} />
            </button>
          </div>

          <div className="settings-dropdown-items">
            <div className="settings-section-label">Theme</div>
            <div className="theme-switcher">
              <button
                className={`theme-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <Sun size={13} />
                Light
              </button>
              <button
                className={`theme-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <Moon size={13} />
                Dark
              </button>
              <button
                className={`theme-btn ${theme === "system" ? "active" : ""}`}
                onClick={() => setTheme("system")}
              >
                <Monitor size={13} />
                System
              </button>
            </div>

            <div className="settings-divider" />

            <div className="settings-section-label">Email</div>

            {session?.user?.email && (
              <div className="settings-email">{session.user.email}</div>
            )}

            <button
              className="settings-item settings-item--danger"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
