import React from "react";
import { cn } from "../../lib/utils";

export interface PillToggleOption<T extends string> {
  value: T;
  label: string;
}

interface PillToggleProps<T extends string> {
  options: Array<PillToggleOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: PillToggleProps<T>) {
  return (
    <div className={cn("inline-flex rounded-full bg-subtle p-1", className)}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-ink hover:bg-surface-hover"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}