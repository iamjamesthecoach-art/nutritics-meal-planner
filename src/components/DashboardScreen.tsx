"use client";

import { useMemo } from "react";
import { AppState, getMealSections } from "@/lib/store";
import { calculateTargets, calculateFoodRow, ACTIVITY_LEVELS, GOALS } from "@/lib/calculations";
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
  const allFoods = useMemo(
    () => [...FOOD_BANK, ...state.customFoods],
    [state.customFoods]
  );

  const dayTarget = isTraining ? calc.trainingDayKcal : calc.restDayKcal;

  const setField = (field: string, value: string | number) => {
    update((prev) => ({
      ...prev,
      targets: { ...prev.targets, [field]: value },
    }));
  };

  const toggleDayType = () => {
    update((prev) => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        isTrainingDay: !prev.currentDay.isTrainingDay,
      },
    }));
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

  // Calorie ring
  const progress = dayTarget > 0 ? Math.min(totalConsumed / dayTarget, 1) : 0;
  const ringRadius = 70;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - progress * ringCircumference;

  // Weekly macro data
  const weekData = useMemo(() => {
    return state.weekPlan.days.map((day) => {
      let carbs = 0, pro = 0, fat = 0;
      const daySections = getMealSections(day.isTrainingDay);
      for (const section of daySections) {
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
      {/* Header */}
      <div className="px-5 pt-5 pb-1">
        <h1 className="text-[22px] font-bold tracking-wider">
          <span className="text-[#C9A84C]">FORGED</span>
          <span className="text-[#e0e0e8] font-light ml-2">METABOLISM</span>
        </h1>
      </div>

      {/* ── Your Setup ─────────────────────────── */}
      <div className="px-4 pt-4">
        <div className="bg-[#111127] rounded-2xl border border-[#1a1a30] overflow-hidden shadow-[0_4px_24px_rgba(201,168,76,0.06),0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="grid grid-cols-2 gap-px bg-[#1a1a30]">
            {/* Bodyweight */}
            <div className="bg-[#111127] p-3.5">
              <label className="text-[10px] uppercase tracking-widest text-[#5a5a7a] font-medium block mb-1.5">Bodyweight</label>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  value={state.targets.bodyweightKg || ""}
                  onChange={(e) => setField("bodyweightKg", Number(e.target.value))}
                  className="w-16 bg-transparent text-2xl font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-sm text-[#5a5a7a]">kg</span>
              </div>
            </div>

            {/* Goal */}
            <div className="bg-[#111127] p-3.5">
              <label className="text-[10px] uppercase tracking-widest text-[#5a5a7a] font-medium block mb-1.5">Goal</label>
              <select
                value={state.targets.goal}
                onChange={(e) => setField("goal", e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none appearance-none cursor-pointer"
              >
                {GOALS.map((g) => (
                  <option key={g.label} value={g.label} className="bg-[#111127] text-white">{g.label}</option>
                ))}
              </select>
            </div>

            {/* Activity */}
            <div className="bg-[#111127] p-3.5">
              <label className="text-[10px] uppercase tracking-widest text-[#5a5a7a] font-medium block mb-1.5">Activity</label>
              <select
                value={state.targets.activityLevel}
                onChange={(e) => setField("activityLevel", e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none appearance-none cursor-pointer"
              >
                {ACTIVITY_LEVELS.map((a) => (
                  <option key={a.label} value={a.label} className="bg-[#111127] text-white">{a.label}</option>
                ))}
              </select>
            </div>

            {/* Training days */}
            <div className="bg-[#111127] p-3.5">
              <label className="text-[10px] uppercase tracking-widest text-[#5a5a7a] font-medium block mb-1.5">Training Days</label>
              <select
                value={state.targets.trainingDaysPerWeek}
                onChange={(e) => setField("trainingDaysPerWeek", Number(e.target.value))}
                className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none appearance-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n} className="bg-[#111127] text-white">{n}x / week</option>
                ))}
              </select>
            </div>
          </div>

          {/* Computed targets strip */}
          <div className="bg-[#0d0d1e] px-4 py-3 flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-[#00C9A7]">{calc.trainingDayKcal}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5a5a7a]">Training</div>
            </div>
            <div className="w-px h-8 bg-[#1a1a30]" />
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-[#8a8aa0]">{calc.restDayKcal}</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5a5a7a]">Rest</div>
            </div>
            <div className="w-px h-8 bg-[#1a1a30]" />
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-white">{calc.proteinG}g</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5a5a7a]">Protein</div>
            </div>
            <div className="w-px h-8 bg-[#1a1a30]" />
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-white">{calc.fatG}g</div>
              <div className="text-[9px] uppercase tracking-wider text-[#5a5a7a]">Fat</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Today's Plan ───────────────────────── */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#e0e0e8] uppercase tracking-wider">Today&apos;s Plan</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDayType}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all duration-150 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] hover:translate-y-[-1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:translate-y-[1px] active:shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${
                isTraining
                  ? "border-[#00C9A7]/30 text-[#00C9A7] bg-gradient-to-b from-[#0a2a25] to-[#061a18]"
                  : "border-[#5a5a7a]/30 text-[#8a8aa0] bg-gradient-to-b from-[#1a1a30] to-[#111125]"
              }`}
            >
              {isTraining ? "Training" : "Rest"}
            </button>
            <button onClick={() => onNavigate("day")} className="text-[#C9A84C] text-xs font-medium">
              Edit
            </button>
          </div>
        </div>

        {/* Calorie Ring */}
        <div className="bg-gradient-to-b from-[#131330] to-[#0e0e24] rounded-2xl border border-[#1a1a30] p-5 mb-4 shadow-[0_0_30px_rgba(0,201,167,0.06),0_6px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center min-w-[60px]">
              <div className="text-xl font-bold text-[#00C9A7]">{totalConsumed}</div>
              <div className="text-[10px] text-[#5a5a7a] uppercase tracking-wider">Consumed</div>
            </div>

            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={ringRadius} fill="none" stroke="#151530" strokeWidth="8" />
                <circle
                  cx="80" cy="80" r={ringRadius} fill="none"
                  stroke={progress >= 1 ? "#C9A84C" : "#00C9A7"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 80 80)"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[9px] text-[#5a5a7a] uppercase tracking-wider">Goal</div>
                <div className="text-2xl font-bold text-white leading-tight">{dayTarget}</div>
              </div>
            </div>

            <div className="text-center min-w-[60px]">
              <div className={`text-xl font-bold ${remaining >= 0 ? "text-white" : "text-[#C9A84C]"}`}>
                {Math.abs(remaining)}
              </div>
              <div className="text-[10px] text-[#5a5a7a] uppercase tracking-wider">
                {remaining >= 0 ? "Left" : "Over"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-[#1a1a30]">
            <div className="text-center">
              <div className="text-sm font-semibold text-[#4A90D9]">{totalCarbs}g</div>
              <div className="text-[9px] text-[#5a5a7a] uppercase tracking-wider">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-[#00C9A7]">{totalProtein}g</div>
              <div className="text-[9px] text-[#5a5a7a] uppercase tracking-wider">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-[#C9A84C]">{totalFat}g</div>
              <div className="text-[9px] text-[#5a5a7a] uppercase tracking-wider">Fat</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Meals ──────────────────────────────── */}
      <div className="px-4">
        {(() => {
          const topRow = sectionData.length > 4 ? sectionData.slice(0, 3) : sectionData.slice(0, 2);
          const bottomRow = sectionData.length > 4 ? sectionData.slice(3) : sectionData.slice(2);
          const MealCard = ({ meal }: { meal: typeof sectionData[0] }) => (
            <button
              onClick={() => onNavigate("day")}
              className="bg-gradient-to-b from-[#161638] to-[#0f0f28] rounded-xl border border-[#22223e] border-b-[#0c0c20] p-3.5 text-left shadow-[0_0_20px_rgba(201,168,76,0.04),0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_0_28px_rgba(201,168,76,0.08),0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-all duration-150 group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] uppercase tracking-widest text-[#9090a8] font-semibold">
                  {meal.section}
                </span>
                {meal.itemCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] shadow-[0_0_6px_rgba(0,201,167,0.5)]" />
                )}
              </div>
              {meal.itemCount > 0 ? (
                <div>
                  <span className="text-lg font-bold text-white">{meal.calories}</span>
                  <span className="text-xs text-[#7a7a96] ml-1">kcal</span>
                  <div className="text-[10px] text-[#7a7a96] mt-0.5">
                    P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#505068] font-medium group-hover:text-[#C9A84C] transition-colors">
                  + Add foods
                </div>
              )}
            </button>
          );
          return (
            <>
              <div className={`grid gap-2.5 mb-2.5 ${topRow.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                {topRow.map((meal) => <MealCard key={meal.section} meal={meal} />)}
              </div>
              {bottomRow.length > 0 && (
                <div className={`grid gap-2.5 ${bottomRow.length === 2 ? "grid-cols-2 max-w-[66%] mx-auto" : "grid-cols-2"}`}>
                  {bottomRow.map((meal) => <MealCard key={meal.section} meal={meal} />)}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ── Weekly View ────────────────────────── */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#e0e0e8] uppercase tracking-wider">Week</h2>
          <button onClick={() => onNavigate("week")} className="text-[#C9A84C] text-xs font-medium">
            Plan
          </button>
        </div>

        <div className="bg-gradient-to-b from-[#131330] to-[#0e0e24] rounded-2xl border border-[#1a1a30] p-4 shadow-[0_0_24px_rgba(74,144,217,0.05),0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]">
          {weekHasData ? (
            <>
              <div className="flex items-end justify-between gap-1.5 h-24 mb-2">
                {weekData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-[1px]">
                    <div className="w-2.5 rounded-sm bg-[#4A90D9]" style={{ height: `${Math.max((day.carbs / maxMacro) * 70, 2)}px` }} />
                    <div className="w-2.5 rounded-sm bg-[#00C9A7]" style={{ height: `${Math.max((day.protein / maxMacro) * 70, 2)}px` }} />
                    <div className="w-2.5 rounded-sm bg-[#C9A84C]" style={{ height: `${Math.max((day.fat / maxMacro) * 70, 2)}px` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mb-3">
                {weekData.map((day, i) => (
                  <div key={i} className="flex-1 text-center text-[9px] text-[#5a5a7a]">{day.label}</div>
                ))}
              </div>
              <div className="flex justify-center gap-4 text-[9px] text-[#5a5a7a]">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-[#4A90D9]" /> Carbs</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-[#00C9A7]" /> Protein</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-[#C9A84C]" /> Fat</span>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <div className="text-xs text-[#3a3a5a]">No week plan yet</div>
              <button onClick={() => onNavigate("week")} className="text-xs text-[#C9A84C] font-medium mt-1">
                Start planning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
