import React, { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
  onClick,
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-surface rounded-xl shadow-card",
        paddingClasses[padding],
        hover && "transition-all duration-200 hover:shadow-elevated hover:bg-surface-hover cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {children}
    </div>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({
  icon,
  title,
  description,
  className = "",
  onClick,
}: FeatureCardProps) {
  return (
    <Card
      className={cn("flex flex-col gap-3", className)}
      onClick={onClick}
      hover={!!onClick}
    >
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="text-muted text-sm leading-relaxed">{description}</p>
      )}
    </Card>
  );
}