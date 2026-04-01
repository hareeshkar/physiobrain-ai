import React from "react";
import { Clock, PlayCircle, RefreshCw, CheckCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface SessionLike {
  id: string;
  type: 'simulator' | 'exam';
  config: {
    module: string;
    ageGroup?: string;
    complexity?: string;
  };
  duration: number;
  ended: boolean;
  feedback?: string;
}

interface SessionCardProps {
  session: SessionLike;
  onAction: () => void;
  className?: string;
}

export function SessionCard({ session, onAction, className = "" }: SessionCardProps) {
  const status = !session.ended
    ? { label: "Ongoing", color: "bg-green-100 text-green-700", action: "Continue" }
    : !session.feedback
      ? { label: "Awaiting", color: "bg-yellow-100 text-yellow-700", action: "Generate Feedback" }
      : { label: "Completed", color: "bg-accent/10 text-accent", action: "View Feedback" };

  return (
    <div className={cn("bg-surface rounded-xl shadow-card p-5 border border-subtle", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-mono", session.type === 'exam' ? "bg-accent text-white" : "bg-ink text-white")}>{session.type}</span>
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-mono", status.color)}>{status.label}</span>
      </div>

      <h3 className="font-display font-semibold text-lg text-ink mb-1">{session.config.module}</h3>
      <p className="font-sans text-sm text-muted mb-4">
        {session.config.ageGroup || 'Session'} {session.config.complexity ? `• ${session.config.complexity}` : ''}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-subtle">
        <span className="inline-flex items-center gap-1 text-xs text-muted font-mono">
          <Clock className="w-3.5 h-3.5" />
          {Math.floor(session.duration / 60)}m {session.duration % 60}s
        </span>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1 text-xs font-mono uppercase text-accent hover:text-ink transition-colors"
        >
          {status.action === 'Continue' && <PlayCircle className="w-3.5 h-3.5" />}
          {status.action === 'Generate Feedback' && <RefreshCw className="w-3.5 h-3.5" />}
          {status.action === 'View Feedback' && <CheckCircle className="w-3.5 h-3.5" />}
          {status.action}
        </button>
      </div>
    </div>
  );
}