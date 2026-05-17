"use client";
import { Check, Loader2, Circle } from "lucide-react";

export type AiProgress = {
  phases: string[];
  currentIndex: number;
};

interface AiProgressBannerProps {
  progress: AiProgress | null;
}

export default function AiProgressBanner({ progress }: AiProgressBannerProps) {
  if (!progress || progress.phases.length === 0) return null;

  return (
    <div className="ai-checklist" role="status" aria-live="polite">
      {progress.phases.map((phase, i) => {
        const status =
          i < progress.currentIndex
            ? "done"
            : i === progress.currentIndex
              ? "active"
              : "pending";
        return (
          <div
            key={i}
            className={`ai-checklist-row ai-checklist-row--${status}`}
          >
            <span className="ai-checklist-icon">
              {status === "done" ? (
                <Check size={12} strokeWidth={3} />
              ) : status === "active" ? (
                <Loader2 size={12} className="spin" />
              ) : (
                <Circle size={10} strokeWidth={2} />
              )}
            </span>
            <span className="ai-checklist-text">{phase}</span>
          </div>
        );
      })}
    </div>
  );
}
