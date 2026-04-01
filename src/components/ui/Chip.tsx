import React from "react";
import { cn } from "../../lib/utils";

interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, active = false, onClick, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        active
          ? "bg-accent text-white shadow-button"
          : "bg-subtle text-ink hover:bg-surface-hover",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
}