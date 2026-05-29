"use client";

import { AppState } from "@/lib/store";
import {
  ACTIVITY_LEVELS,
  GOALS,
  calculateTargets,
} from "@/lib/calculations";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
}

export default function TargetsScreen({ state, update }: Props) {
  const t = state.targets;
  const calc = calculateTargets(t);

  const setField = (field: keyof typeof t, value: string | number) => {
    update((prev) => ({
      ...prev,
      targets: { ...prev.targets, [field]: value },
    }));
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-[#1F2A33] mb-1">Set Your Targets</h1>
      <p className="text-sm text-gray-500 mb-6">
        Fill in your details. Everything below calculates automatically.
      </p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-[#1F2A33] mb-1">
            Bodyweight (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={t.bodyweightKg || ""}
            onChange={(e) => setField("bodyweightKg", Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-[#1F2A33] focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1F2A33] mb-1">
            Activity level
          </label>
          <select
            value={t.activityLevel}
            onChange={(e) => setField("activityLevel", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-[#1F2A33] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]"
          >
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a.label} value={a.label}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1F2A33] mb-1">
            Goal
          </label>
          <select
            value={t.goal}
            onChange={(e) => setField("goal", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-[#1F2A33] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]"
          >
            {GOALS.map((g) => (
              <option key={g.label} value={g.label}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1F2A33] mb-1">
            Training days per week
          </label>
          <select
            value={t.trainingDaysPerWeek}
            onChange={(e) =>
              setField("trainingDaysPerWeek", Number(e.target.value))
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg text-[#1F2A33] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F7A8C]"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-bold text-[#1F2A33] uppercase tracking-wide mb-3">
          Your Calculated Daily Targets
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <TargetCard label="Training Day" kcal={calc.trainingDayKcal} highlight />
          <TargetCard label="Rest Day" kcal={calc.restDayKcal} />
        </div>

        <div className="grid grid-cols-5 text-center text-xs mb-1">
          <div className="font-medium text-gray-500">Day</div>
          <div className="font-medium text-gray-500">Protein</div>
          <div className="font-medium text-gray-500">Carbs</div>
          <div className="font-medium text-gray-500">Fat</div>
          <div className="font-medium text-gray-500">Fibre</div>
        </div>
        <div className="grid grid-cols-5 text-center text-sm mb-1">
          <div className="font-medium text-[#1F2A33]">Training</div>
          <div>{calc.proteinG}g</div>
          <div>{Math.round(calc.trainingCarbsG)}g</div>
          <div>{calc.fatG}g</div>
          <div>{calc.fibreGMin}g</div>
        </div>
        <div className="grid grid-cols-5 text-center text-sm">
          <div className="font-medium text-[#1F2A33]">Rest</div>
          <div>{calc.proteinG}g</div>
          <div>{Math.round(calc.restCarbsG)}g</div>
          <div>{calc.fatG}g</div>
          <div>{calc.fibreGMin}g</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h2 className="text-sm font-bold text-[#1F2A33] uppercase tracking-wide mb-3">
          Maintenance vs Your Goal
        </h2>

        <div className="space-y-2 text-sm">
          <Row label="Estimated maintenance (TDEE)" value={`${calc.maintenance.toLocaleString()} kcal/day`} />
          <Row label="Your target (daily average)" value={`${calc.targetAvg.toLocaleString()} kcal/day`} />
          <Row label="Daily deficit / surplus" value={`${calc.dailyBalance > 0 ? "+" : ""}${calc.dailyBalance} kcal`} />
          <Row label="Weekly deficit / surplus" value={`${calc.weeklyBalance > 0 ? "+" : ""}${calc.weeklyBalance.toLocaleString()} kcal`} />
          <Row label="Est. weekly weight change" value={`${calc.estWeeklyWtChangeKg > 0 ? "+" : ""}${calc.estWeeklyWtChangeKg} kg`} />
        </div>

        <div
          className={`mt-4 text-center py-2 rounded-lg font-bold text-sm ${
            calc.status === "Deficit (fat loss)"
              ? "bg-[#1F7A8C]/10 text-[#1F7A8C]"
              : calc.status === "Surplus (gain)"
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {calc.status}
        </div>
      </div>
    </div>
  );
}

function TargetCard({
  label,
  kcal,
  highlight,
}: {
  label: string;
  kcal: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 text-center ${
        highlight ? "bg-[#1F7A8C] text-white" : "bg-white border border-gray-200"
      }`}
    >
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold">{kcal.toLocaleString()}</div>
      <div className="text-xs opacity-70">kcal</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-[#1F2A33]">{value}</span>
    </div>
  );
}
