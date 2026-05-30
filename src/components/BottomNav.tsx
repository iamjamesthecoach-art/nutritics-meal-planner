"use client";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "day", label: "Day", icon: "🍽️" },
  { id: "week", label: "Week", icon: "📅" },
  { id: "recipes", label: "Recipes", icon: "📖" },
  { id: "foods", label: "Foods", icon: "🥗" },
  { id: "me", label: "Me", icon: "👤" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a1a]/95 backdrop-blur-md border-t border-[#1e1e3a] z-50">
      <div className="flex max-w-lg mx-auto relative">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-colors relative ${
              active === tab.id
                ? "text-[#C9A84C]"
                : "text-[#4a4a6a]"
            }`}
          >
            {active === tab.id && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C9A84C] rounded-b" />
            )}
            <span className="text-base leading-none">{tab.icon}</span>
            <span className={`text-[10px] font-medium ${
              active === tab.id ? "text-[#C9A84C]" : "text-[#4a4a6a]"
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
