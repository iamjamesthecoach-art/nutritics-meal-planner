"use client";

import { AppState } from "@/lib/store";
import {
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
      <h1 className="text-xl font-bold text-white mb-1">Set Your Targets</h1>
      <p className="text-sm text-[#9090b0] mb-6">
        Fill in your details. Everything below calculates automatically.
      </p>

      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-[#c0c0d8] mb-1">
            Bodyweight (kg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={t.bodyweightKg || ""}
            onChange={(e) => setField("bodyweightKg", Number(e.target.value))}
            className="w-full border border-[#3a3a5c] rounded-lg px-4 py-3 text-lg text-white bg-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#c0c0d8] mb-1">
            Goal
          </label>
          <select
            value={t.goal}
            onChange={(e) => setField("goal", e.target.value)}
            className="w-full border border-[#3a3a5c] rounded-lg px-4 py-3 text-lg text-white bg-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
          >
            {GOALS.map((g) => (
              <option key={g.label} value={g.label}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#c0c0d8] mb-1">
            Training days per week
          </label>
          <select
            value={t.trainingDaysPerWeek}
            onChange={(e) =>
              setField("trainingDaysPerWeek", Number(e.target.value))
            }
            className="w-full border border-[#3a3a5c] rounded-lg px-4 py-3 text-lg text-white bg-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#7C4DFF]"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-xl p-4 mb-6 border border-[#2a2a4a]">
        <h2 className="text-sm font-bold text-[#9090b0] uppercase tracking-wide mb-3">
          Your Calculated Daily Targets
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <TargetCard label="Training Day" kcal={calc.trainingDayKcal} highlight />
          <TargetCard label="Rest Day" kcal={calc.restDayKcal} />
        </div>

        <div className="grid grid-cols-5 text-center text-xs mb-1">
          <div className="font-medium text-[#6a6a8a]">Day</div>
          <div className="font-medium text-[#6a6a8a]">Protein</div>
          <div className="font-medium text-[#6a6a8a]">Carbs</div>
          <div className="font-medium text-[#6a6a8a]">Fat</div>
          <div className="font-medium text-[#6a6a8a]">Fibre</div>
        </div>
        <div className="grid grid-cols-5 text-center text-sm mb-1">
          <div className="font-medium text-white">Training</div>
          <div className="text-[#c0c0d8]">{calc.proteinG}g</div>
          <div className="text-[#c0c0d8]">{Math.round(calc.trainingCarbsG)}g</div>
          <div className="text-[#c0c0d8]">{calc.fatG}g</div>
          <div className="text-[#c0c0d8]">{calc.fibreGMin}g</div>
        </div>
        <div className="grid grid-cols-5 text-center text-sm">
          <div className="font-medium text-white">Rest</div>
          <div className="text-[#c0c0d8]">{calc.proteinG}g</div>
          <div className="text-[#c0c0d8]">{Math.round(calc.restCarbsG)}g</div>
          <div className="text-[#c0c0d8]">{calc.fatG}g</div>
          <div className="text-[#c0c0d8]">{calc.fibreGMin}g</div>
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-xl p-4 border border-[#2a2a4a]">
        <h2 className="text-sm font-bold text-[#9090b0] uppercase tracking-wide mb-3">
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
              ? "bg-[#7C4DFF]/20 text-[#A78BFA]"
              : calc.status === "Surplus (gain)"
              ? "bg-amber-500/20 text-amber-400"
              : "bg-[#252547] text-[#9090b0]"
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
        highlight
          ? "bg-gradient-to-r from-[#7C4DFF] to-[#6C3FC5] text-white"
          : "bg-[#252547] border border-[#3a3a5c] text-white"
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
      <span className="text-[#9090b0]">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
