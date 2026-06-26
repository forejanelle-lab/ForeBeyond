"use client";

interface ProfileTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange?: (id: string) => void;
}

export function ProfileTabs({ tabs, activeTab, onChange }: ProfileTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-sage-dark/30 pb-px -mb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange?.(tab.id)}
          className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? "border-forest text-forest"
              : "border-transparent text-charcoal-light hover:text-forest"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
