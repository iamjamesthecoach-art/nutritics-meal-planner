"use client";

const TABS = [
  { id: "targets", label: "Targets" },
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "foods", label: "Foods" },
  { id: "recipes", label: "Recipes" },
  { id: "me", label: "Me" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D1A] border-t border-[#2a2a4a] z-50">
      <div className="flex max-w-lg mx-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              active === tab.id
                ? "text-[#7C4DFF] border-t-2 border-[#7C4DFF]"
                : "text-[#6a6a8a]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
