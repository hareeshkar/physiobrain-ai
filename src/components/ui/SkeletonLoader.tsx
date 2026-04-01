import React from "react";

interface SkeletonLoaderProps {
  variant?: "text" | "block" | "card";
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function SkeletonLoader({
  variant = "text",
  className = "",
  width,
  height,
}: SkeletonLoaderProps) {
  const baseClasses = "skeleton rounded";

  const variantStyles = {
    text: {
      width: width || "100%",
      height: height || 16,
    },
    block: {
      width: width || "100%",
      height: height || 80,
    },
    card: {
      width: width || "100%",
      height: height || 200,
    },
  };

  return (
    <div
      className={`${baseClasses} ${className}`}
      style={{
        ...variantStyles[variant],
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

// Compound component for loading states
interface SkeletonGroupProps {
  count?: number;
  variant?: "text" | "block" | "card";
  className?: string;
  spacing?: number;
}

export function SkeletonGroup({
  count = 3,
  variant = "text",
  className = "",
  spacing = 8,
}: SkeletonGroupProps) {
  return (
    <div className={`flex flex-col ${className}`} style={{ gap: `${spacing}px` }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLoader
          key={i}
          variant={variant}
          width={variant === "text" && i === count - 1 ? "70%" : undefined}
        />
      ))}
    </div>
  );
}