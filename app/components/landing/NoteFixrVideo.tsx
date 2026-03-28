"use client";
import {
  AbsoluteFill,
  Html5Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from "remotion";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Pencil,
  Menu,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  Trash2,
  X,
  Wand2,
  FileText,
  ScanText,
  Loader2,
  ArrowUp,
  Minus,
  Sparkles,
} from "lucide-react";

/* ─── Colors ─── */
const C = {
  bg: "#1e1e1e",
  bgSecondary: "#252525",
  surface: "#2d2d2d",
  surfaceHover: "#3a3a3a",
  border: "#3a3a3a",
  text: "#e8e8e8",
  muted: "#888888",
  subtle: "#555555",
  accent: "#4db8ff",
  accentLight: "#1a3a5c",
  danger: "#e05252",
  lightBg: "#f3f3f3",
  lightBgSecondary: "#ebebeb",
  lightSurface: "#ffffff",
  lightSurfaceHover: "#e5e5e5",
  lightBorder: "#e0e0e0",
  lightText: "#1a1a1a",
  lightMuted: "#888888",
  lightSubtle: "#b0b0b0",
  lightAccent: "#0067c0",
  lightAccentLight: "#e8f1fb",
};
const FONT = "'Geist', sans-serif";
const MONO = "'Geist Mono', monospace";

/* ─── Helpers ─── */
function fi(frame: number, start: number, dur = 20) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
function fo(frame: number, start: number, dur = 20) {
  return interpolate(frame, [start, start + dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/* ─── Caption ─── */
function Caption({ text, opacity }: { text: string; opacity: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${C.border}`,
        borderRadius: 20,
        padding: "8px 24px",
        fontSize: 20,
        color: C.text,
        fontFamily: FONT,
        fontWeight: 500,
        opacity,
        zIndex: 30,
        whiteSpace: "nowrap",
        letterSpacing: -0.3,
      }}
    >
      {text}
    </div>
  );
}

/* ─── AI Overlay ─── */
function AiOverlay({ opacity, label }: { opacity: number; label: string }) {
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `rgba(0,0,0,${0.55 * opacity})`,
        backdropFilter: `blur(${4 * opacity}px)`,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: C.accent,
          fontSize: 22,
          fontFamily: FONT,
          fontWeight: 500,
          textShadow: `0 0 20px ${C.accent}`,
        }}
      >
        <Wand2 size={22} />
        {label}
      </div>
    </div>
  );
}

/* ─── Dot Grid ─── */
function DotGrid({ frame }: { frame: number }) {
  const cols = 24,
    rows = 3;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 5px)`,
        gridTemplateRows: `repeat(${rows}, 5px)`,
        gap: 4,
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => {
        const offset = (i * 0.17) % 2;
        const t = (frame * 0.06 + offset) % 2;
        const op =
          t < 1
            ? interpolate(t, [0, 1], [0.12, 1])
            : interpolate(t, [1, 2], [1, 0.12]);
        return (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: C.text,
              opacity: op,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Sidebar Mockup ─── */
interface SNote {
  title: string;
  pinned: boolean;
  unsaved?: boolean;
}

function SidebarMockup({
  notes,
  activeIndex = 0,
  collapsed = false,
  highlightPinIndex,
  hoverIndex,
  searchText = "",
  light = false,
}: {
  notes: SNote[];
  activeIndex?: number;
  collapsed?: boolean;
  highlightPinIndex?: number;
  hoverIndex?: number;
  searchText?: string;
  light?: boolean;
}) {
  const bg = light ? C.lightBgSecondary : C.bgSecondary;
  const border = light ? C.lightBorder : C.border;
  const surfaceHover = light ? C.lightSurfaceHover : C.surfaceHover;
  const text = light ? C.lightText : C.text;
  const muted = light ? C.lightMuted : C.muted;
  const subtle = light ? C.lightSubtle : C.subtle;
  const accent = light ? C.lightAccent : C.accent;

  const pinned = notes.filter((n) => n.pinned);
  const unpinned = notes.filter((n) => !n.pinned);

  if (collapsed) {
    return (
      <div
        style={{
          width: 48,
          height: "100%",
          background: bg,
          borderRight: `1px solid ${border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 10,
          flexShrink: 0,
          gap: 10,
        }}
      >
        <div style={{ color: muted }}>
          <PanelLeftOpen size={15} />
        </div>
      </div>
    );
  }

  function noteRow(note: SNote, _i: number, isActive: boolean) {
    const noteIdx = notes.indexOf(note);
    const isPinHighlighted =
      highlightPinIndex !== undefined && noteIdx === highlightPinIndex;
    const isHovered = hoverIndex !== undefined && noteIdx === hoverIndex;
    const iconOp = isHovered ? 1 : 0;

    return (
      <div
        key={note.title}
        style={{
          padding: "7px 10px 5px",
          borderRadius: 4,
          background: isActive ? surfaceHover : "transparent",
          marginBottom: 2,
          border: "1px solid transparent",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: isActive ? text : muted,
              fontFamily: FONT,
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {note.title}
            {note.unsaved && (
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: accent,
                  marginLeft: 5,
                  verticalAlign: "middle",
                }}
              />
            )}
          </span>
          <div
            style={{
              color: isPinHighlighted ? accent : note.pinned ? accent : accent,
              flexShrink: 0,
              opacity: note.pinned ? 1 : iconOp,
            }}
          >
            <Pin size={12} />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <span style={{ fontSize: 10, color: subtle, fontFamily: FONT }}>
            Today
          </span>
          <div style={{ color: C.danger, opacity: iconOp, flexShrink: 0 }}>
            <Trash2 size={11} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 220,
        height: "100%",
        background: bg,
        borderRight: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 500,
            color: muted,
            textTransform: "uppercase" as const,
            letterSpacing: 0.8,
          }}
        >
          NOTEFIXR
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ color: accent }}>
            <Plus size={14} />
          </div>
          <div style={{ color: muted }}>
            <PanelLeftClose size={14} />
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div
          style={{
            height: 28,
            background: light ? C.lightBg : C.bg,
            border: `1px solid ${searchText ? accent : border}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            fontSize: 11,
            color: searchText ? text : subtle,
            fontFamily: FONT,
          }}
        >
          {searchText || "Search notes..."}
        </div>
      </div>
      <div style={{ flex: 1, padding: "2px 6px", overflowY: "hidden" }}>
        {pinned.length > 0 && (
          <>
            <div
              style={{
                fontSize: 10,
                color: subtle,
                fontFamily: FONT,
                textTransform: "uppercase" as const,
                letterSpacing: 0.6,
                padding: "4px 4px 2px",
              }}
            >
              Pinned
            </div>
            {pinned.map((n, i) =>
              noteRow(n, i, notes.indexOf(n) === activeIndex),
            )}
            <div style={{ height: 1, background: border, margin: "4px 0" }} />
            <div
              style={{
                fontSize: 10,
                color: subtle,
                fontFamily: FONT,
                textTransform: "uppercase" as const,
                letterSpacing: 0.6,
                padding: "4px 4px 2px",
              }}
            >
              Notes
            </div>
          </>
        )}
        {unpinned.map((n) =>
          noteRow(n, notes.indexOf(n), notes.indexOf(n) === activeIndex),
        )}
      </div>
    </div>
  );
}

/* ─── Editor Area ─── */
interface EditorProps {
  title?: string;
  titleEditing?: boolean;
  content: React.ReactNode;
  highlightFormat?: string[];
  highlightAiBtn?: string;
  showAiLoading?: boolean;
  aiLoadingLabel?: string;
  showSaveState?: "saving" | "saved" | "smart-saving" | null;
  showSettings?: boolean;
  settingsTheme?: "light" | "dark" | "system";
  showFloating?: boolean;
  floatingTyped?: string;
  floatingLoading?: boolean;
  floatingFrame?: number;
  light?: boolean;
}

function EditorArea({
  title = "Q3 Planning Meeting",
  titleEditing = false,
  content,
  highlightFormat = [],
  highlightAiBtn,
  showAiLoading = false,
  aiLoadingLabel = "AI Processing...",
  showSaveState,
  showSettings = false,
  settingsTheme = "dark",
  showFloating = false,
  floatingTyped,
  floatingLoading = false,
  floatingFrame = 0,
  light = false,
}: EditorProps) {
  const currentFrame = useCurrentFrame();
  const bg = light ? C.lightBg : C.bg;
  const border = light ? C.lightBorder : C.border;
  const text = light ? C.lightText : C.text;
  const muted = light ? C.lightMuted : C.muted;
  const subtle = light ? C.lightSubtle : C.subtle;
  const surface = light ? C.lightSurface : C.surface;
  const surfaceHover = light ? C.lightSurfaceHover : C.surfaceHover;
  const accent = light ? C.lightAccent : C.accent;
  const accentLight = light ? C.lightAccentLight : C.accentLight;

  const fmtBtns = [
    { key: "bold", icon: <Bold size={13} /> },
    { key: "italic", icon: <Italic size={13} /> },
    { key: "underline", icon: <Underline size={13} /> },
    { key: "highlight", icon: <Highlighter size={13} /> },
    { key: "strike", icon: <Strikethrough size={13} /> },
    null,
    { key: "list", icon: <List size={13} /> },
    { key: "listOrdered", icon: <ListOrdered size={13} /> },
    { key: "listChecks", icon: <ListChecks size={13} /> },
    null,
    { key: "alignLeft", icon: <AlignLeft size={13} /> },
    { key: "alignCenter", icon: <AlignCenter size={13} /> },
    { key: "alignRight", icon: <AlignRight size={13} /> },
    null,
    { key: "undo", icon: <Undo size={13} /> },
    { key: "redo", icon: <Redo size={13} /> },
  ];

  const aiBtns = [
    { key: "clean", label: "Clean", icon: <Wand2 size={13} /> },
    { key: "summarize", label: "Summarize", icon: <FileText size={13} /> },
    { key: "extractTasks", label: "Tasks", icon: <ListChecks size={13} /> },
    { key: "elaborate", label: "Elaborate", icon: <ScanText size={13} /> },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: bg,
        position: "relative",
      }}
    >
      {/* Menubar */}
      <div
        style={{
          height: 40,
          borderBottom: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
        }}
      >
        <div style={{ color: muted }}>
          <Menu size={15} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
          <span
            style={{
              fontSize: 13,
              color: text,
              fontFamily: FONT,
              fontWeight: 500,
              borderBottom: titleEditing ? `1.5px solid ${accent}` : "none",
              paddingBottom: 1,
            }}
          >
            {title}
          </span>
          <div style={{ color: titleEditing ? accent : subtle }}>
            <Pencil size={12} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: FONT,
              fontWeight: 500,
              color: showSaveState === "saved" ? accent : text,
              background:
                showSaveState === "saved" ? accentLight : surfaceHover,
            }}
          >
            {showSaveState === "saving"
              ? "Saving..."
              : showSaveState === "saved"
                ? "Saved"
                : "Save"}
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: FONT,
              fontWeight: 500,
              color: showSaveState === "smart-saving" ? accent : text,
              background:
                showSaveState === "smart-saving" ? accentLight : surfaceHover,
            }}
          >
            {showSaveState === "smart-saving" ? "Organizing..." : "Smart Save"}
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ color: muted }}>
              <Settings size={14} />
            </div>
            {showSettings && (
              <div
                style={{
                  position: "absolute",
                  top: 22,
                  right: 0,
                  width: 175,
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                  zIndex: 50,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderBottom: `1px solid ${border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: muted,
                      fontFamily: FONT,
                    }}
                  >
                    Settings
                  </span>
                  <div style={{ color: subtle }}>
                    <X size={12} />
                  </div>
                </div>
                <div style={{ padding: 4 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: subtle,
                      textTransform: "uppercase" as const,
                      letterSpacing: 0.6,
                      padding: "5px 10px 3px",
                      fontFamily: FONT,
                    }}
                  >
                    Theme
                  </div>
                  <div
                    style={{ display: "flex", gap: 4, padding: "0 6px 6px" }}
                  >
                    {(
                      [
                        {
                          val: "light",
                          icon: <Sun size={12} />,
                          label: "Light",
                        },
                        {
                          val: "dark",
                          icon: <Moon size={12} />,
                          label: "Dark",
                        },
                        {
                          val: "system",
                          icon: <Monitor size={12} />,
                          label: "System",
                        },
                      ] as const
                    ).map(({ val, icon, label: lbl }) => (
                      <div
                        key={val}
                        style={{
                          flex: 1,
                          padding: "6px 4px",
                          borderRadius: 4,
                          border: `1px solid ${settingsTheme === val ? accent : border}`,
                          background: settingsTheme === val ? accentLight : bg,
                          color: settingsTheme === val ? accent : muted,
                          fontSize: 10,
                          fontFamily: FONT,
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        {icon}
                        {lbl}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{ height: 1, background: border, margin: "2px 0" }}
                  />
                  <div
                    style={{
                      fontSize: 10,
                      color: subtle,
                      textTransform: "uppercase" as const,
                      letterSpacing: 0.6,
                      padding: "5px 10px 3px",
                      fontFamily: FONT,
                    }}
                  >
                    Email
                  </div>
                  <div
                    style={{
                      margin: "0 6px 6px",
                      padding: "5px 8px",
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: 4,
                      fontSize: 11,
                      color: muted,
                      fontFamily: FONT,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    hello@notefixr.app
                  </div>
                  <div
                    style={{ height: 1, background: border, margin: "2px 0" }}
                  />
                  <div
                    style={{
                      padding: "6px 10px",
                      fontSize: 12,
                      color: C.danger,
                      fontFamily: FONT,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <LogOut size={12} /> Sign out
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div
        style={{
          height: 36,
          borderBottom: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 2,
          background: surface,
        }}
      >
        <div
          style={{
            padding: "3px 8px",
            borderRadius: 3,
            border: `1px solid ${border}`,
            fontSize: 11,
            color: muted,
            fontFamily: FONT,
            marginRight: 4,
          }}
        >
          Body
        </div>
        <div
          style={{ width: 1, height: 18, background: border, margin: "0 4px" }}
        />
        {fmtBtns.map((btn, i) => {
          if (!btn)
            return (
              <div
                key={`div-${i}`}
                style={{
                  width: 1,
                  height: 18,
                  background: border,
                  margin: "0 4px",
                }}
              />
            );
          const active = highlightFormat.includes(btn.key);
          return (
            <div
              key={btn.key}
              style={{
                width: 26,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 3,
                color: active ? accent : muted,
                background: active ? accentLight : "transparent",
              }}
            >
              {btn.icon}
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "0 4px",
            borderLeft: `1px solid ${border}`,
            marginLeft: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: subtle,
              fontFamily: FONT,
              textTransform: "uppercase" as const,
              letterSpacing: 0.6,
              marginRight: 2,
            }}
          >
            AI
          </span>
          {aiBtns.map(({ key, label: lbl, icon }) => {
            const active = highlightAiBtn === key;
            const loading = showAiLoading && active;
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: `1px solid ${active ? accent : border}`,
                  background: active ? accentLight : "transparent",
                  color: active ? accent : muted,
                  fontSize: 11,
                  fontFamily: FONT,
                }}
              >
                {loading ? <Loader2 size={13} /> : icon}
                {lbl}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "20px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {content}
      </div>

      {/* Floating AI Prompt */}
      {showFloating && (
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 20,
          }}
        >
          {/* Loading dots — above input, right-aligned */}
          {floatingLoading && (
            <div
              style={{
                width: "65%",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  background: surface,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              >
                <DotGrid frame={floatingFrame} />
              </div>
            </div>
          )}

          {/* Input wrapper — rainbow gradient border when active */}
          {(() => {
            const showRainbow = !!(floatingTyped || floatingLoading);
            const gradPos = (currentFrame * (300 / 90)) % 300;
            return (
              <div
                style={{
                  width: "65%",
                  borderRadius: 14,
                  padding: 2,
                  backgroundImage: showRainbow
                    ? "linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff, #ff6b6b)"
                    : undefined,
                  backgroundSize: showRainbow ? "300% 100%" : undefined,
                  backgroundPosition: showRainbow
                    ? `${gradPos}% 50%`
                    : undefined,
                  backgroundColor: showRainbow ? undefined : border,
                }}
              >
                <div
                  style={{
                    background: surface,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 10px 10px 16px",
                    height: 42,
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: floatingTyped ? text : subtle,
                      fontFamily: FONT,
                      flex: 1,
                    }}
                  >
                    {floatingTyped || "Ask me anything about your note..."}
                  </span>
                  <div style={{ color: subtle, flexShrink: 0 }}>
                    <Minus size={13} />
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: floatingTyped ? accent : surfaceHover,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: floatingTyped ? "#fff" : subtle,
                      opacity: floatingLoading ? 0.4 : 1,
                      flexShrink: 0,
                    }}
                  >
                    <ArrowUp size={14} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Status Bar */}
      <div
        style={{
          height: 24,
          borderTop: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 10, color: subtle, fontFamily: MONO }}>
          47 words
        </span>
        <span style={{ fontSize: 10, color: subtle, fontFamily: MONO }}>
          238 characters
        </span>
      </div>

      {showAiLoading && <AiOverlay opacity={1} label={aiLoadingLabel} />}
    </div>
  );
}

/* ─── App Frame ─── */
function AppFrame({
  sidebar,
  editor,
  scale = 1,
  opacity = 1,
}: {
  sidebar: React.ReactNode;
  editor: React.ReactNode;
  scale?: number;
  opacity?: number;
}) {
  return (
    <div style={{ transform: `scale(${scale})`, opacity }}>
      <div
        style={{
          width: 1120,
          height: 560,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          overflow: "hidden",
          display: "flex",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {sidebar}
        {editor}
      </div>
    </div>
  );
}

/* ─── Note Content ─── */
const RAW_LINES = [
  "meeting notes - talked abt q3 targets",
  "john said we need 15% growth",
  "action items",
  "- fix the bug in auth URGENT",
  "- send report 2 sarah",
  "also remember to book flights for conf",
];

function RawContent({
  visible = 99,
  light = false,
}: {
  visible?: number;
  light?: boolean;
}) {
  return (
    <>
      {RAW_LINES.slice(0, visible).map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: light ? C.lightMuted : C.muted,
            lineHeight: 2.1,
          }}
        >
          {l}
        </div>
      ))}
    </>
  );
}

function CleanContent({ light = false }: { light?: boolean }) {
  const h = light ? C.lightText : C.text;
  const ac = light ? C.lightAccent : C.accent;
  const tx = light ? C.lightText : C.text;
  return (
    <>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 18,
          fontWeight: 700,
          color: h,
          lineHeight: 1.8,
        }}
      >
        Q3 Planning Meeting Notes
      </div>
      <div style={{ height: 6 }} />
      <div
        style={{
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 600,
          color: h,
          lineHeight: 2,
        }}
      >
        Key Discussion Points
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          color: tx,
          lineHeight: 2,
          paddingLeft: 8,
        }}
      >
        &bull; Q3 targets: 15% growth (per John)
      </div>
      <div style={{ height: 4 }} />
      <div
        style={{
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 600,
          color: h,
          lineHeight: 2,
        }}
      >
        Action Items
      </div>
      {[
        "Fix authentication bug (urgent)",
        "Send report to Sarah by Friday",
        "Book flights for conference",
      ].map((t) => (
        <div
          key={t}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            lineHeight: 2,
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              border: `1.5px solid ${ac}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontFamily: FONT, fontSize: 13, color: tx }}>{t}</span>
        </div>
      ))}
    </>
  );
}

function SummaryContent() {
  return (
    <>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 18,
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.8,
        }}
      >
        Summary
      </div>
      <div style={{ height: 4 }} />
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          color: C.muted,
          lineHeight: 1.8,
          marginBottom: 8,
        }}
      >
        The Q3 planning meeting set a 15% growth target with three assigned
        action items.
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 14,
          fontWeight: 600,
          color: C.text,
          lineHeight: 2,
        }}
      >
        Key Points
      </div>
      {[
        "15% growth target for Q3 (John)",
        "Auth bug: urgent fix required",
        "Report due to Sarah by Friday",
      ].map((t) => (
        <div
          key={t}
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: C.text,
            lineHeight: 2,
            paddingLeft: 8,
          }}
        >
          &bull; {t}
        </div>
      ))}
    </>
  );
}

function TasksContent() {
  const tasks = [
    { text: "Fix authentication bug (URGENT)", done: false },
    { text: "Send report to Sarah by Friday", done: false },
    { text: "Book flights for conference", done: false },
    { text: "Review Q3 growth metrics with John", done: false },
  ];
  return (
    <>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 18,
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.8,
        }}
      >
        Extracted Tasks
      </div>
      <div style={{ height: 6 }} />
      {tasks.map(({ text, done }) => (
        <div
          key={text}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            lineHeight: 2,
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: 3,
              border: `1.5px solid ${done ? C.subtle : C.accent}`,
              background: done ? C.subtle : "transparent",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: done ? C.subtle : C.text,
              textDecoration: done ? "line-through" : "none",
            }}
          >
            {text}
          </span>
        </div>
      ))}
    </>
  );
}

function ElaborateContent() {
  return (
    <>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 18,
          fontWeight: 700,
          color: C.text,
          lineHeight: 1.8,
        }}
      >
        Q3 Planning Meeting
      </div>
      <div style={{ height: 6 }} />
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          marginBottom: 2,
        }}
      >
        Growth Target
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          color: C.muted,
          lineHeight: 1.7,
          marginBottom: 8,
        }}
      >
        The 15% Q3 growth target requires focused execution. Engineering should
        prioritize high-impact features while keeping technical debt manageable.
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          marginBottom: 2,
        }}
      >
        Auth Bug Priority
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          color: C.muted,
          lineHeight: 1.7,
          marginBottom: 8,
        }}
      >
        Security issues in authentication carry high risk. Immediate remediation
        prevents data breaches and maintains user trust — always address urgent
        security issues first.
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          marginBottom: 2,
        }}
      >
        Next Steps
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          color: C.muted,
          lineHeight: 1.7,
        }}
      >
        Confirm Sarah&apos;s report deadline, book flights early for cost
        savings, and schedule a follow-up on growth metrics.
      </div>
    </>
  );
}

/* ─── Animated Cursor ─── */
function AnimatedCursor({
  x,
  y,
  clicking = false,
}: {
  x: number;
  y: number;
  clicking?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - 8,
        top: y - 8,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.9)",
        border: "2px solid rgba(0,0,0,0.4)",
        transform: clicking ? "scale(0.75)" : "scale(1)",
        zIndex: 200,
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
        transition: "none",
      }}
    />
  );
}

/* ─── Circular Close ─── */
function CircularClose({
  progress,
  cx,
  cy,
}: {
  progress: number;
  cx: number;
  cy: number;
}) {
  // max radius needed to cover all four corners from the origin
  const maxR =
    Math.ceil(
      Math.sqrt(
        Math.pow(Math.max(cx, 1280 - cx), 2) +
          Math.pow(Math.max(cy, 720 - cy), 2),
      ),
    ) + 20;
  const r = interpolate(progress, [0, 1], [0, maxR], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (r <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#000",
        zIndex: 300,
        clipPath: `circle(${r}px at ${cx}px ${cy}px)`,
      }}
    />
  );
}

/* ─── Note Data ─── */
const NOTES_INITIAL: SNote[] = [
  { title: "Q3 Planning Meeting", pinned: false },
  { title: "Project Roadmap", pinned: false },
  { title: "API Integration Notes", pinned: false, unsaved: true },
  { title: "Weekly Standup", pinned: false },
  { title: "Bug Tracker Summary", pinned: false },
];

const NOTES_AFTER_PIN: SNote[] = [
  { title: "API Integration Notes", pinned: true, unsaved: true },
  { title: "Q3 Planning Meeting", pinned: false },
  { title: "Project Roadmap", pinned: false },
  { title: "Weekly Standup", pinned: false },
  { title: "Bug Tracker Summary", pinned: false },
];

/* ═══════════════════════════════════
   SCENES
   ═══════════════════════════════════ */

/* S0: Intro */
function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const tagOp = fi(frame, 12);
  const tagY = interpolate(frame, [12, 30], [14, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${logoS})`,
          fontFamily: MONO,
          fontSize: 72,
          fontWeight: 500,
          color: C.text,
        }}
      >
        NOTEFIXR
      </div>
      <div
        style={{
          opacity: tagOp,
          transform: `translateY(${tagY}px)`,
          fontSize: 22,
          color: C.muted,
          marginTop: 14,
          fontFamily: FONT,
        }}
      >
        Your notes, fixed by AI
      </div>
    </AbsoluteFill>
  );
}

/* S1: App Overview */
function LayoutScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  const scale = interpolate(s, [0, 1], [0.92, 1]);
  const visible = Math.min(
    RAW_LINES.length,
    Math.ceil(
      interpolate(frame, [10, 70], [0, RAW_LINES.length], {
        extrapolateRight: "clamp",
      }),
    ),
  );

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Caption
        text="Write your raw notes — AI does the rest"
        opacity={fi(frame, 5)}
      />
      <div style={{ marginTop: 30 }}>
        <AppFrame
          scale={scale}
          opacity={s}
          sidebar={<SidebarMockup notes={NOTES_INITIAL} activeIndex={0} />}
          editor={<EditorArea showFloating content={<RawContent visible={visible} />} />}
        />
      </div>
    </AbsoluteFill>
  );
}

/* S2: Toolbar Quick (4s) */
function ToolbarQuickScene() {
  const frame = useCurrentFrame();
  const showFormat = frame < 90;
  const highlightFormat = showFormat
    ? ["bold", "italic", "underline", "highlight", "list", "listChecks"]
    : [];
  const highlightAiBtn = !showFormat ? "clean" : undefined;
  const captionText = showFormat
    ? "Full rich text formatting"
    : "Four AI tools to transform your notes";
  const captionOp = showFormat ? fi(frame, 5) : fi(frame, 90, 12);

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Caption text={captionText} opacity={captionOp} />
      <div style={{ marginTop: 30 }}>
        <AppFrame
          sidebar={<SidebarMockup notes={NOTES_INITIAL} />}
          editor={
            <EditorArea
              showFloating
              content={<RawContent />}
              highlightFormat={highlightFormat}
              highlightAiBtn={highlightAiBtn}
            />
          }
        />
      </div>
    </AbsoluteFill>
  );
}

/* S9: Save & Smart Save */
function SaveScene() {
  const frame = useCurrentFrame();

  const saveState: "saving" | "saved" | "smart-saving" | null =
    frame >= 25 && frame < 80
      ? "saving"
      : frame >= 80 && frame < 140
        ? "saved"
        : frame >= 160 && frame < 230
          ? "smart-saving"
          : null;

  const captionText =
    frame < 140
      ? "Ctrl+S to save instantly"
      : frame < 230
        ? "Smart Save (Ctrl+Shift+S) — AI polishes before saving"
        : "Two ways to save your work";

  const captionOp =
    frame < 140 ? fi(frame, 0) : frame < 230 ? fi(frame, 140) : fi(frame, 230);

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Caption text={captionText} opacity={captionOp} />
      <div style={{ marginTop: 30 }}>
        <AppFrame
          sidebar={<SidebarMockup notes={NOTES_INITIAL} />}
          editor={
            <EditorArea
              showFloating
              content={frame >= 160 ? <CleanContent /> : <RawContent />}
              showSaveState={saveState}
            />
          }
        />
      </div>
    </AbsoluteFill>
  );
}

/* S10: Settings — dark / light / system */
function SettingsScene() {
  const frame = useCurrentFrame();

  // 3 phases × 80 frames each
  const phase = frame < 80 ? 0 : frame < 160 ? 1 : 2;
  const phaseStart = phase * 80;
  const themes = ["dark", "light", "system"] as const;
  const currentTheme = themes[phase];
  const isLight = phase === 1;

  const captionTexts = [
    "Dark mode — focused writing",
    "Light mode — bright and clean",
    "System — follows your OS preference",
  ];
  const captionOp = fi(frame, phaseStart, 10);

  return (
    <AbsoluteFill
      style={{
        background: isLight ? C.lightBg : C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Caption text={captionTexts[phase]} opacity={captionOp} />
      <div style={{ marginTop: 30 }}>
        <AppFrame
          sidebar={<SidebarMockup notes={NOTES_INITIAL} light={isLight} />}
          editor={
            <EditorArea
              showFloating
              content={isLight ? <CleanContent light /> : <CleanContent />}
              showSettings
              settingsTheme={currentTheme}
              light={isLight}
            />
          }
        />
      </div>
    </AbsoluteFill>
  );
}

/* S7: Sidebar (9s) */
function SidebarScene() {
  const frame = useCurrentFrame();

  const PHASES = {
    intro: 0,
    hover: 40,
    pinClick: 100,
    pinDone: 155,
    pinnedShow: 215,
    search: 265,
    searchDone: 310,
  };

  const showHover = frame >= PHASES.hover && frame < PHASES.pinDone;
  const pinDone = frame >= PHASES.pinDone;
  const searchActive = frame >= PHASES.search;

  const notes = pinDone ? NOTES_AFTER_PIN : NOTES_INITIAL;
  const hoverIdx = showHover ? 2 : undefined;

  const SEARCH_QUERY = "API Inte";
  const searchText = searchActive
    ? SEARCH_QUERY.slice(
        0,
        Math.floor(
          interpolate(
            frame,
            [PHASES.search, PHASES.searchDone],
            [0, SEARCH_QUERY.length],
            { extrapolateRight: "clamp" },
          ),
        ),
      )
    : "";

  const phaseStarts = [
    0,
    PHASES.hover,
    PHASES.pinClick,
    PHASES.pinDone,
    PHASES.pinnedShow,
    PHASES.search,
  ];
  const phaseIdx =
    frame < PHASES.hover
      ? 0
      : frame < PHASES.pinClick
        ? 1
        : frame < PHASES.pinDone
          ? 2
          : frame < PHASES.pinnedShow
            ? 3
            : frame < PHASES.search
              ? 4
              : 5;
  const captionOp = fi(frame, phaseStarts[phaseIdx], 10);

  const captionText =
    phaseIdx === 0
      ? "Organize notes in the sidebar"
      : phaseIdx === 1
        ? "Hover to reveal Pin and Delete"
        : phaseIdx === 2
          ? "Pin keeps it at the top"
          : phaseIdx === 3
            ? "Pinned — always visible at the top"
            : phaseIdx === 4
              ? "Search your notes by keyword"
              : "Instant filtering as you type";

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Caption text={captionText} opacity={captionOp} />
      <div style={{ marginTop: 30 }}>
        <AppFrame
          sidebar={
            <SidebarMockup
              notes={notes}
              activeIndex={0}
              hoverIndex={hoverIdx}
              highlightPinIndex={
                frame >= PHASES.pinClick && frame < PHASES.pinDone
                  ? 2
                  : undefined
              }
              searchText={searchText}
            />
          }
          editor={<EditorArea showFloating content={<RawContent />} />}
        />
      </div>
    </AbsoluteFill>
  );
}

/* ─── AI Processing Scene Factory ─── */
function makeAiScene(
  buttonKey: string,
  scenelabel: string,
  AfterContent: React.ComponentType,
  loadingLabel: string,
) {
  return function AiScene() {
    const frame = useCurrentFrame();

    const LOAD_START = 20;
    const LOAD_END = 110;
    const AFTER_START = 120;

    const overlayOp =
      frame < LOAD_END ? fi(frame, LOAD_START, 12) : fo(frame, LOAD_END, 12);

    const showAfter = frame >= AFTER_START;
    const afterOp = fi(frame, AFTER_START, 20);
    const rawOp = showAfter ? fo(frame, AFTER_START, 20) : 1;

    return (
      <AbsoluteFill
        style={{
          background: C.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Caption text={scenelabel} opacity={fi(frame, 0, 8)} />
        <div style={{ marginTop: 30, position: "relative" }}>
          <AppFrame
            sidebar={<SidebarMockup notes={NOTES_INITIAL} />}
            editor={
              <EditorArea
                showFloating
                highlightAiBtn={buttonKey}
                showAiLoading={overlayOp > 0.05}
                aiLoadingLabel={loadingLabel}
                content={
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        opacity: rawOp,
                        position: showAfter ? "absolute" : "relative",
                        top: 0,
                        left: 0,
                        right: 0,
                      }}
                    >
                      <RawContent />
                    </div>
                    {showAfter && (
                      <div style={{ opacity: afterOp }}>
                        <AfterContent />
                      </div>
                    )}
                  </div>
                }
              />
            }
          />
        </div>
      </AbsoluteFill>
    );
  };
}

const AiCleanScene = makeAiScene(
  "clean",
  "Clean — messy notes → structured content",
  CleanContent,
  "Organizing your thoughts and ideas...",
);
const AiSummarizeScene = makeAiScene(
  "summarize",
  "Summarize — key points in one click",
  SummaryContent,
  "Summarizing your notes...",
);
const AiTasksScene = makeAiScene(
  "extractTasks",
  "Tasks — AI extracts every action item",
  TasksContent,
  "Extracting action items...",
);
const AiElaborateScene = makeAiScene(
  "elaborate",
  "Elaborate — expand notes with context",
  ElaborateContent,
  "Explaining your notes further...",
);

/* S13: AI Chat */
function AiChatScene() {
  const frame = useCurrentFrame();
  const PROMPT = "What should I prioritize from this note?";
  const AI_RESPONSE =
    "Fix the authentication bug first — it\u2019s urgent and blocks other work. Then send the report to Sarah (deadline-sensitive). Book conference flights last since it\u2019s not time-critical.";

  const typedCount = Math.floor(
    interpolate(frame, [20, 75], [0, PROMPT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typed = frame >= 20 ? PROMPT.slice(0, typedCount) : undefined;
  const loading = frame >= 85 && frame < 115;
  const responded = frame >= 115;

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Caption
        text="Ask AI anything about your note"
        opacity={fi(frame, 0, 8)}
      />
      <div style={{ marginTop: 30 }}>
        <AppFrame
          sidebar={<SidebarMockup notes={NOTES_INITIAL} />}
          editor={
            <EditorArea
              showFloating
              floatingTyped={typed}
              floatingLoading={loading}
              floatingFrame={frame - 85}
              content={
                responded ? (
                  <div>
                    <RawContent />
                    <div style={{ height: 12 }} />
                    <div
                      style={{
                        height: 1,
                        background: C.border,
                        marginBottom: 12,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ color: C.accent }}>
                        <Sparkles size={13} />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: C.accent,
                          fontFamily: FONT,
                          fontWeight: 500,
                        }}
                      >
                        AI Response
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: C.text,
                        fontFamily: FONT,
                        lineHeight: 1.7,
                        opacity: fi(frame, 115, 18),
                      }}
                    >
                      {AI_RESPONSE}
                    </div>
                  </div>
                ) : (
                  <RawContent />
                )
              }
            />
          }
        />
      </div>
    </AbsoluteFill>
  );
}

/* S14: Ending — tagline + cursor + curtain */
function EndingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame, fps, config: { damping: 12 } });
  const tagOp = fi(frame, 30);
  const btnOp = fi(frame, 55);

  // Button fades in at frame 55, fully visible ~frame 75
  // Wait 2s (60 frames) → cursor appears at frame 135
  const cursorVisible = frame >= 135;
  const cursorX = interpolate(frame, [135, 163], [340, 640], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  });
  const cursorY = interpolate(frame, [135, 163], [230, 460], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  });
  const clicking = frame >= 165 && frame < 173;

  // Circular blackout: starts on click (frame 165), 30 frames = 1s
  const curtainProgress = interpolate(frame, [165, 195], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            transform: `scale(${logoS})`,
            fontFamily: MONO,
            fontSize: 64,
            fontWeight: 500,
            color: C.text,
            marginBottom: 16,
          }}
        >
          NOTEFIXR
        </div>
        <div
          style={{
            opacity: tagOp,
            fontSize: 20,
            color: C.muted,
            fontFamily: FONT,
            marginBottom: 36,
          }}
        >
          AI-powered notepad ready to fix your notes.
        </div>
        <div
          style={{
            opacity: btnOp,
            display: "inline-block",
            padding: "12px 44px",
            background: clicking ? C.accentLight : C.accent,
            border: `2px solid ${C.accent}`,
            color: clicking ? C.accent : "#fff",
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: FONT,
            transform: clicking ? "scale(0.94)" : "scale(1)",
          }}
        >
          Get Started
        </div>
      </div>

      {cursorVisible && (
        <AnimatedCursor x={cursorX} y={cursorY} clicking={clicking} />
      )}

      <CircularClose progress={curtainProgress} cx={640} cy={460} />
    </AbsoluteFill>
  );
}

/* ═══════════════════════════════════
   COMPOSITION
   Total: 2520 frames = 84s

   S0  Intro:          0    - 90
   S1  Layout:         90   - 270
   S2  ToolbarQuick:   270  - 420   (150f — slower phases)
   S3  AiClean:        420  - 630
   S4  AiSummarize:    630  - 840
   S5  AiTasks:        840  - 1050
   S6  AiElaborate:    1050 - 1260
   S7  AiChat:         1260 - 1440
   S8  Sidebar:        1440 - 1770  (330f — slower pin)
   S9  Save:           1770 - 2040  (270f — more read time)
   S10 Settings:       2040 - 2280  (240f — 3×80f phases)
   S11 Ending:         2280 - 2520  (240f — 2s wait before click)
   ═══════════════════════════════════ */
export default function NoteFixrVideo() {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Html5Audio src={staticFile("landing-bg-music.mp3")} volume={0.45} />

      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>
      <Sequence from={90} durationInFrames={180}>
        <LayoutScene />
      </Sequence>
      <Sequence from={270} durationInFrames={150}>
        <ToolbarQuickScene />
      </Sequence>
      <Sequence from={420} durationInFrames={210}>
        <AiCleanScene />
      </Sequence>
      <Sequence from={630} durationInFrames={210}>
        <AiSummarizeScene />
      </Sequence>
      <Sequence from={840} durationInFrames={210}>
        <AiTasksScene />
      </Sequence>
      <Sequence from={1050} durationInFrames={210}>
        <AiElaborateScene />
      </Sequence>
      <Sequence from={1260} durationInFrames={180}>
        <AiChatScene />
      </Sequence>
      <Sequence from={1440} durationInFrames={330}>
        <SidebarScene />
      </Sequence>
      <Sequence from={1770} durationInFrames={270}>
        <SaveScene />
      </Sequence>
      <Sequence from={2040} durationInFrames={240}>
        <SettingsScene />
      </Sequence>
      <Sequence from={2280} durationInFrames={240}>
        <EndingScene />
      </Sequence>
    </AbsoluteFill>
  );
}

export const VIDEO_CONFIG = {
  fps: 30,
  durationInFrames: 2520,
  width: 1280,
  height: 720,
};
