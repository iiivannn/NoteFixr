"use client";
import { Sparkles, Save, MessageSquare, NotebookPen } from "lucide-react";
import "../../styles/landing.scss";
import { useEffect, useRef } from "react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Note Cleaning",
    description:
      "Paste your notes and let AI organize them into clean, structured documents with proper formatting and headings.",
  },
  {
    icon: Save,
    title: "Smart Save",
    description:
      "One shortcut to clean and save. Press Ctrl+Shift+S and your notes get polished before they're stored.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    description:
      "Ask questions about your notes, get summaries, or have the AI rewrite sections — all inline while you work.",
  },
  {
    icon: NotebookPen,
    title: "Familiar Notepad Feel",
    description:
      "A clean, simple interface inspired by the notepad you already know — just open and start writing.",
  },
];

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleVisibility = () => {
      if (!videoRef.current) return;
      if (document.hidden) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">NoteFixr</span>
        <div className="landing-nav-links">
          <a href="/login" className="nav-link">
            Sign in
          </a>
          <a href="/register" className="nav-btn">
            Register
          </a>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>
          Your notes,
          <br />
          <span className="accent">fixed by AI</span>
        </h1>
        <p className="hero-subtitle">
          NoteFixr is an AI-powered notepad that organizes and structures your
          notes for you — so you can focus on writing, not formatting. When you
          don&apos;t have the time to fix them, we do it for you.
        </p>
        <div className="hero-actions">
          <a href="/login" className="btn-primary">
            Get Started
          </a>
        </div>
      </section>

      <section className="landing-video">
        <div className="video-wrapper">
          <video
            ref={videoRef}
            src="https://qapfxyqger0gwpnv.public.blob.vercel-storage.com/landing-video.mp4"
            autoPlay
            loop
            playsInline
            controls
            muted
            controlsList="nodownload"
            style={{
              width: "100%",
              borderRadius: 8,
            }}
          />
        </div>
      </section>

      <section className="landing-features">
        <h2>Everything you need to write better notes</h2>
        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="feature-card">
              <div className="feature-icon">
                <feature.icon size={22} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-logo">NoteFixr</span>
        <p>AI-powered notepad ready to fix your notes.</p>
        <p className="music-credit">
          Music:{" "}
          <a
            href="https://uppbeat.io/t/yawnathan/tokyo-spring-wooll-remix"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tokyo Spring (Wooll Remix)
          </a>{" "}
          by Yawnathan via Uppbeat
        </p>
      </footer>
    </div>
  );
}
