import React, { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { ElegantSpinner } from "./ElegantSpinner";

interface BaseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseClasses =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variantClasses = {
      primary:
        "bg-accent text-white shadow-md hover:bg-accent/90 hover:shadow-lg",
      secondary:
        "bg-surface text-ink border border-subtle hover:bg-surface-hover hover:border-subtle/80",
      ghost:
        "bg-transparent text-ink underline-offset-4 hover:underline hover:text-accent",
    };

    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <ElegantSpinner size="sm" className="mr-2" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

BaseButton.displayName = "BaseButton";

interface PrimaryButtonProps extends Omit<BaseButtonProps, "variant"> {}

export function PrimaryButton(props: PrimaryButtonProps) {
  return <BaseButton variant="primary" {...props} />;
}

interface SecondaryButtonProps extends Omit<BaseButtonProps, "variant"> {}

export function SecondaryButton(props: SecondaryButtonProps) {
  return <BaseButton variant="secondary" {...props} />;
}

interface GhostButtonProps extends Omit<BaseButtonProps, "variant"> {}

export function GhostButton(props: GhostButtonProps) {
  return <BaseButton variant="ghost" {...props} />;
}