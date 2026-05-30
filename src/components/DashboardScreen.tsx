"use client";

import { useMemo } from "react";
import { AppState, getMealSections } from "@/lib/store";
import { calculateTargets, calculateFoodRow, GOALS } from "@/lib/calculations";
import { FOOD_BANK } from "@/data/food-bank";
import { TabId } from "./BottomNav";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
  onNavigate: (tab: TabId) => void;
}

export default function DashboardScreen({ state, update, onNavigate }: Props) {
  const calc = calculateTargets(state.targets);
  const isTraining = state.currentDay.isTrainingDay;
  const meals = state.currentDay.meals;
  const sections = getMealSections(isTraining);
  const allFoods = useMemo(() => [...FOOD_BANK, ...state.customFoods], [state.customFoods]);

  const dayTarget = isTraining ? calc.trainingDayKcal : calc.restDayKcal;

  const setField = (field: string, value: string | number) => {
    update((prev) => ({ ...prev, targets: { ...prev.targets, [field]: value } }));
  };

  const toggleDayType = () => {
    update((prev) => ({ ...prev, currentDay: { ...prev.currentDay, isTrainingDay: !prev.currentDay.isTrainingDay } }));
  };

  const sectionData = useMemo(() => {
    return sections.map((section) => {
      let cal = 0, pro = 0, carbs = 0, fat = 0;
      const rows = meals[section] || [];
      for (const row of rows) {
        const food = allFoods.find((f) => f.id === row.foodId);
        if (!food) continue;
        const g = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
        if (isNaN(g) || g <= 0) continue;
        const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, g);
        cal += r.calories; pro += r.proteinG; carbs += r.carbsG; fat += r.fatG;
      }
      return { section, calories: Math.round(cal), protein: Math.round(pro), carbs: Math.round(carbs), fat: Math.round(fat), itemCount: rows.length };
    });
  }, [meals, sections, allFoods]);

  const totalConsumed = sectionData.reduce((a, s) => a + s.calories, 0);
  const totalProtein = sectionData.reduce((a, s) => a + s.protein, 0);
  const totalCarbs = sectionData.reduce((a, s) => a + s.carbs, 0);
  const totalFat = sectionData.reduce((a, s) => a + s.fat, 0);
  const remaining = dayTarget - totalConsumed;

  const progress = dayTarget > 0 ? Math.min(totalConsumed / dayTarget, 1) : 0;
  const ringR = 68;
  const ringC = 2 * Math.PI * ringR;
  const ringOff = ringC - progress * ringC;

  const weekData = useMemo(() => {
    return state.weekPlan.days.map((day) => {
      let carbs = 0, pro = 0, fat = 0;
      for (const section of getMealSections(day.isTrainingDay)) {
        for (const row of day.meals[section] || []) {
          const food = allFoods.find((f) => f.id === row.foodId);
          if (!food) continue;
          const g = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
          if (isNaN(g) || g <= 0) continue;
          const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, g);
          carbs += r.carbsG; pro += r.proteinG; fat += r.fatG;
        }
      }
      return { label: day.label.replace("Training Day ", "T").replace("Rest Day ", "R"), carbs: Math.round(carbs), protein: Math.round(pro), fat: Math.round(fat) };
    });
  }, [state.weekPlan.days, allFoods]);

  const weekHasData = weekData.some((d) => d.carbs + d.protein + d.fat > 0);
  const maxMacro = Math.max(...weekData.map((d) => Math.max(d.carbs, d.protein, d.fat)), 1);

  return (
    <div className="pb-24 max-w-lg mx-auto">

      {/* ── Header ─────────────────────────────── */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold tracking-[0.15em] uppercase" style={{ letterSpacing: "0.15em" }}>
          <span style={{ color: "var(--gold)" }}>Forged</span>
          <span className="font-light ml-1.5" style={{ color: "var(--text-primary)" }}>Metabolism</span>
        </h1>
      </div>

      {/* ── Setup ──────────────────────────────── */}
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: "linear-gradient(to bottom, var(--bg-raised-top), var(--bg-raised))", border: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-bottom)", boxShadow: "var(--shadow-card)" }}>
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: "var(--border-subtle)" }}>
          <InputCell label="Weight" suffix="kg" type="number" value={state.targets.bodyweightKg || ""} onChange={(v) => setField("bodyweightKg", Number(v))} />
          <InputCell label="Height" suffix="cm" type="number" value={state.targets.heightCm || ""} onChange={(v) => setField("heightCm", Number(v))} />
          <InputCell label="Age" suffix="yrs" type="number" value={state.targets.ageYears || ""} onChange={(v) => setField("ageYears", Number(v))} />
        </div>
        <div className="grid grid-cols-2 divide-x" style={{ borderTop: "1px solid var(--border-subtle)", borderColor: "var(--border-subtle)" }}>
          <div className="p-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: "var(--text-tertiary)" }}>Goal</div>
            <select value={state.targets.goal} onChange={(e) => setField("goal", e.target.value)}
              className="w-full bg-transparent text-[13px] font-semibold focus:outline-none cursor-pointer" style={{ color: "var(--text-primary)" }}>
              {GOALS.map((g) => (<option key={g.label} value={g.label} style={{ background: "var(--bg-raised)" }}>{g.label}</option>))}
            </select>
          </div>
          <div className="p-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: "var(--text-tertiary)" }}>Training</div>
            <select value={state.targets.trainingDaysPerWeek} onChange={(e) => setField("trainingDaysPerWeek", Number(e.target.value))}
              className="w-full bg-transparent text-[13px] font-semibold focus:outline-none cursor-pointer" style={{ color: "var(--text-primary)" }}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (<option key={n} value={n} style={{ background: "var(--bg-raised)" }}>{n}x / week</option>))}
            </select>
          </div>
        </div>

        {/* Computed strip */}
        <div className="grid grid-cols-4 divide-x py-3" style={{ background: "var(--bg-base)", borderTop: "1px solid var(--border-subtle)", borderColor: "var(--border-subtle)" }}>
          <Stat value={calc.trainingDayKcal} label="Training" color="var(--teal)" />
          <Stat value={calc.restDayKcal} label="Rest" color="var(--text-secondary)" />
          <Stat value={`${calc.proteinG}g`} label="Protein" color="var(--text-primary)" />
          <Stat value={`${calc.fatG}g`} label="Fat" color="var(--text-primary)" />
        </div>
      </div>

      {/* ── Calorie Ring ───────────────────────── */}
      <div className="mx-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Today</SectionLabel>
          <div className="flex items-center gap-2">
            <button onClick={toggleDayType}
              className="text-[11px] font-semibold uppercase tracking-[0.1em] px-2.5 py-1.5 rounded-lg transition-all duration-150 hover:-translate-y-px active:translate-y-px"
              style={{
                color: isTraining ? "var(--teal)" : "var(--text-secondary)",
                background: "linear-gradient(to bottom, var(--bg-raised-top), var(--bg-raised))",
                border: "1px solid var(--border-subtle)",
                borderBottom: "1px solid var(--border-bottom)",
                boxShadow: "0 2px 8px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.04)",
              }}>
              {isTraining ? "Training" : "Rest"}
            </button>
            <button onClick={() => onNavigate("day")} className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--gold)" }}>
              Edit
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(to bottom, var(--bg-raised-top), var(--bg-raised))", border: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-bottom)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-[28px] font-extrabold tabular-nums leading-none" style={{ color: "var(--teal)" }}>{totalConsumed}</div>
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] mt-1" style={{ color: "var(--text-tertiary)" }}>Eaten</div>
            </div>

            <div className="relative flex-shrink-0">
              <svg width="130" height="130" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={ringR} fill="none" strokeWidth="7" style={{ stroke: "var(--bg-elevated)" }} />
                <circle cx="80" cy="80" r={ringR} fill="none" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={ringC} strokeDashoffset={ringOff} transform="rotate(-90 80 80)"
                  className="transition-all duration-700 ease-out"
                  style={{ stroke: progress >= 1 ? "var(--gold)" : "var(--teal)" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[32px] font-extrabold tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>{dayTarget}</div>
                <div className="text-[9px] font-medium uppercase tracking-[0.2em] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Goal</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-[28px] font-extrabold tabular-nums leading-none" style={{ color: remaining >= 0 ? "var(--text-primary)" : "var(--gold)" }}>{Math.abs(remaining)}</div>
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] mt-1" style={{ color: "var(--text-tertiary)" }}>{remaining >= 0 ? "Left" : "Over"}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 mt-5 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <Stat value={`${totalCarbs}g`} label="Carbs" color="oklch(0.65 0.12 250)" />
            <Stat value={`${totalProtein}g`} label="Protein" color="var(--teal)" />
            <Stat value={`${totalFat}g`} label="Fat" color="var(--gold)" />
          </div>
        </div>
      </div>

      {/* ── Meals ──────────────────────────────── */}
      <div className="mx-4 mt-5">
        {(() => {
          const top = sectionData.length > 4 ? sectionData.slice(0, 3) : sectionData.slice(0, 2);
          const bottom = sectionData.length > 4 ? sectionData.slice(3) : sectionData.slice(2);
          return (
            <>
              <div className={`grid gap-2.5 ${top.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                {top.map((m) => <MealCard key={m.section} meal={m} onClick={() => onNavigate("day")} />)}
              </div>
              {bottom.length > 0 && (
                <div className={`grid gap-2.5 mt-2.5 ${bottom.length === 2 ? "grid-cols-2 max-w-[66%] mx-auto" : "grid-cols-" + bottom.length}`}>
                  {bottom.map((m) => <MealCard key={m.section} meal={m} onClick={() => onNavigate("day")} />)}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ── Weekly ─────────────────────────────── */}
      <div className="mx-4 mt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Week</SectionLabel>
          <button onClick={() => onNavigate("week")} className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--gold)" }}>Plan</button>
        </div>
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(to bottom, var(--bg-raised-top), var(--bg-raised))", border: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-bottom)", boxShadow: "var(--shadow-card)" }}>
          {weekHasData ? (
            <>
              <div className="flex items-end justify-between gap-1 h-20 mb-2">
                {weekData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-px">
                    <div className="w-2 rounded-sm" style={{ height: `${Math.max((d.carbs / maxMacro) * 60, 2)}px`, background: "oklch(0.65 0.12 250)" }} />
                    <div className="w-2 rounded-sm" style={{ height: `${Math.max((d.protein / maxMacro) * 60, 2)}px`, background: "var(--teal)" }} />
                    <div className="w-2 rounded-sm" style={{ height: `${Math.max((d.fat / maxMacro) * 60, 2)}px`, background: "var(--gold)" }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                {weekData.map((d, i) => <div key={i} className="flex-1 text-center text-[9px] font-medium" style={{ color: "var(--text-tertiary)" }}>{d.label}</div>)}
              </div>
              <div className="flex justify-center gap-4 mt-3 text-[9px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm" style={{ background: "oklch(0.65 0.12 250)" }} /> Carbs</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm" style={{ background: "var(--teal)" }} /> Protein</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm" style={{ background: "var(--gold)" }} /> Fat</span>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No week plan yet</div>
              <button onClick={() => onNavigate("week")} className="text-[11px] font-semibold mt-1" style={{ color: "var(--gold)" }}>Start planning</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Primitives ──────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-secondary)" }}>{children}</h2>;
}

function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[15px] font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[8px] font-semibold uppercase tracking-[0.2em] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{label}</div>
    </div>
  );
}

function InputCell({ label, suffix, type, value, onChange }: { label: string; suffix: string; type: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div className="p-3">
      <div className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</div>
      <div className="flex items-baseline gap-1">
        <input type={type} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-12 bg-transparent text-xl font-extrabold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ color: "var(--text-primary)" }} />
        <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>{suffix}</span>
      </div>
    </div>
  );
}

function MealCard({ meal, onClick }: { meal: { section: string; calories: number; protein: number; carbs: number; fat: number; itemCount: number }; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="rounded-xl p-3 text-left transition-all duration-150 hover:-translate-y-0.5 active:translate-y-px"
      style={{
        background: "linear-gradient(to bottom, var(--bg-raised-top), var(--bg-raised))",
        border: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-bottom)",
        boxShadow: "var(--shadow-card)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-secondary)" }}>{meal.section}</span>
        {meal.itemCount > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--teal)" }} />}
      </div>
      {meal.itemCount > 0 ? (
        <>
          <span className="text-lg font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>{meal.calories}</span>
          <span className="text-[10px] font-medium ml-0.5" style={{ color: "var(--text-tertiary)" }}>kcal</span>
          <div className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            P{meal.protein} C{meal.carbs} F{meal.fat}
          </div>
        </>
      ) : (
        <div className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>+ Add</div>
      )}
    </button>
  );
}
