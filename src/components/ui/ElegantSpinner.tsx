import React from "react";

interface ElegantSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: 20,
  md: 32,
  lg: 48,
};

export function ElegantSpinner({ size = "md", className = "" }: ElegantSpinnerProps) {
  const dimension = sizeMap[size];
  const strokeWidth = size === "sm" ? 2 : size === "md" ? 2.5 : 3;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {/* Outer arc */}
      <svg
        width={dimension}
        height={dimension}
        viewBox={`0 0 ${dimension} ${dimension}`}
        className="elegant-spin-outer animate-spin"
        style={{ animationDuration: "1.2s" }}
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={(dimension - strokeWidth) / 2}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="60 200"
          transform={`rotate(-90 ${dimension / 2} ${dimension / 2})`}
        />
      </svg>

      {/* Middle arc */}
      <svg
        width={dimension * 0.7}
        height={dimension * 0.7}
        viewBox={`0 0 ${dimension * 0.7} ${dimension * 0.7}`}
        className="elegant-spin-middle absolute animate-spin"
        style={{
          top: dimension * 0.15,
          left: dimension * 0.15,
          animationDuration: "1.5s",
          animationDirection: "reverse",
        }}
      >
        <circle
          cx={(dimension * 0.7) / 2}
          cy={(dimension * 0.7) / 2}
          r={(dimension * 0.7 - strokeWidth) / 2}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          strokeDasharray="40 180"
          transform={`rotate(-90 ${(dimension * 0.7) / 2} ${(dimension * 0.7) / 2})`}
        />
      </svg>

      {/* Inner arc */}
      <svg
        width={dimension * 0.4}
        height={dimension * 0.4}
        viewBox={`0 0 ${dimension * 0.4} ${dimension * 0.4}`}
        className="elegant-spin-inner absolute animate-spin"
        style={{
          top: dimension * 0.3,
          left: dimension * 0.3,
          animationDuration: "1.8s",
        }}
      >
        <circle
          cx={(dimension * 0.4) / 2}
          cy={(dimension * 0.4) / 2}
          r={(dimension * 0.4 - strokeWidth) / 2}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth * 0.6}
          strokeLinecap="round"
          strokeDasharray="25 100"
          transform={`rotate(-90 ${(dimension * 0.4) / 2} ${(dimension * 0.4) / 2})`}
        />
      </svg>
    </div>
  );
}