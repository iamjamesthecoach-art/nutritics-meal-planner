"use client";

const TABS = [
  { id: "dashboard", label: "Home" },
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "recipes", label: "Recipes" },
  { id: "foods", label: "Foods" },
  { id: "me", label: "Profile" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a1a]/95 backdrop-blur-md border-t border-[#1a1a30] z-50">
      <div className="flex max-w-lg mx-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-3 text-center transition-colors relative ${
              active === tab.id
                ? "text-[#C9A84C]"
                : "text-[#3a3a5a] hover:text-[#5a5a7a]"
            }`}
          >
            {active === tab.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[#C9A84C] rounded-b" />
            )}
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
