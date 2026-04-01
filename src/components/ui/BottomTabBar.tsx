import React from "react";
import { Brain, Plus, Clock, Menu } from "lucide-react";
import { cn } from "../../lib/utils";

type TabId = "home" | "create" | "history" | "more";

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface BottomTabBarProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  className?: string;
}

const defaultTabs: TabItem[] = [
  { id: "home", label: "Home", icon: <Brain size={24} /> },
  { id: "create", label: "Create", icon: <Plus size={24} /> },
  { id: "history", label: "History", icon: <Clock size={24} /> },
  { id: "more", label: "More", icon: <Menu size={24} /> },
];

export function BottomTabBar({
  activeTab = "home",
  onTabChange,
  className = "",
}: BottomTabBarProps) {
  const tabs = onTabChange
    ? defaultTabs.map((tab) => ({
        ...tab,
        onClick: () => onTabChange(tab.id),
      }))
    : defaultTabs;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-surface border-t border-subtle safe-bottom",
        className
      )}
      style={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-around h-16 bg-surface">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-200 rounded-lg min-w-[44px] min-h-[44px]",
                isActive
                  ? "text-accent scale-105"
                  : "text-muted hover:text-ink hover:bg-surface-hover"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "transition-transform duration-200",
                  isActive && "scale-110"
                )}
              >
                {tab.icon}
              </span>
              <span
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}