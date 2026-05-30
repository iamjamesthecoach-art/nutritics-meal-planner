"use client";

import { useMemo } from "react";
import { AppState, getMealSections } from "@/lib/store";
import { calculateTargets, calculateFoodRow } from "@/lib/calculations";
import { FOOD_BANK } from "@/data/food-bank";
import { TabId } from "./BottomNav";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
  onNavigate: (tab: TabId) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      return {
        section,
        calories: Math.round(cal),
        protein: Math.round(pro),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        itemCount: rows.length,
      };
    });
  }, [meals, sections, allFoods]);

  const totalConsumed = sectionData.reduce((a, s) => a + s.calories, 0);
  const totalProtein = sectionData.reduce((a, s) => a + s.protein, 0);
  const totalCarbs = sectionData.reduce((a, s) => a + s.carbs, 0);
  const totalFat = sectionData.reduce((a, s) => a + s.fat, 0);
  const remaining = dayTarget - totalConsumed;

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

  // Calorie ring
  const progress = dayTarget > 0 ? Math.min(totalConsumed / dayTarget, 1) : 0;
  const ringRadius = 70;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - progress * ringCircumference;

  const mealIcons: Record<string, string> = {
    "Pre-Workout": "⚡",
    Breakfast: "🌅",
    Lunch: "☀️",
    Snack: "🥤",
    Dinner: "🌙",
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Branded Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wide">
            <span className="text-[#C9A84C]">FORGED</span>{" "}
            <span className="text-white">METABOLISM</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8a8aa0] bg-[#1a1a2e] px-2.5 py-1 rounded-full border border-[#2a2a4a]">
            {isTraining ? "🏋️ Training" : "😴 Rest"} Day
          </span>
        </div>
      </div>

      {/* Today's Plan header */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white italic">Today&apos;s Plan</h2>
          <button
            onClick={() => onNavigate("day")}
            className="text-[#C9A84C] text-sm font-medium"
          >
            Edit →
          </button>
        </div>
      </div>

      {/* Calorie Ring */}
      <div className="mx-4 bg-[#111127] rounded-2xl border border-[#1e1e3a] p-6 mb-4">
        <div className="flex items-center justify-center gap-8">
          {/* Consumed */}
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00C9A7]">{totalConsumed}</div>
            <div className="text-xs text-[#6a6a8a]">Consumed</div>
          </div>

          {/* Ring */}
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {/* Background ring */}
              <circle
                cx="80"
                cy="80"
                r={ringRadius}
                fill="none"
                stroke="#1e1e3a"
                strokeWidth="10"
              />
              {/* Progress ring */}
              <circle
                cx="80"
                cy="80"
                r={ringRadius}
                fill="none"
                stroke={progress >= 1 ? "#C9A84C" : "#00C9A7"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 80 80)"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[10px] text-[#6a6a8a]">Calorie Goal:</div>
              <div className="text-3xl font-bold text-white">{dayTarget}</div>
              <div className="text-[10px] text-[#6a6a8a]">
                {remaining > 0 ? "Remaining" : "Over"}
              </div>
            </div>
          </div>

          {/* Remaining */}
          <div className="text-center">
            <div className={`text-2xl font-bold ${remaining >= 0 ? "text-white" : "text-[#C9A84C]"}`}>
              {Math.abs(remaining)}
            </div>
            <div className="text-xs text-[#6a6a8a]">
              {remaining >= 0 ? "Remaining" : "Over"}
            </div>
          </div>
        </div>

        {/* Macro bar */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#1e1e3a]">
          <div className="text-center">
            <div className="text-sm font-bold text-[#4A90D9]">{totalCarbs}g</div>
            <div className="text-[10px] text-[#6a6a8a]">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[#00C9A7]">{totalProtein}g</div>
            <div className="text-[10px] text-[#6a6a8a]">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[#C9A84C]">{totalFat}g</div>
            <div className="text-[10px] text-[#6a6a8a]">Fat</div>
          </div>
        </div>
      </div>

      {/* Meal Cards Grid */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        {sectionData.map((meal) => (
          <button
            key={meal.section}
            onClick={() => onNavigate("day")}
            className="bg-[#111127] rounded-xl border border-[#1e1e3a] p-4 text-left hover:border-[#C9A84C]/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{mealIcons[meal.section] || "🍽️"}</span>
              {meal.itemCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#00C9A7]" />
              )}
            </div>
            <div className="text-sm font-semibold text-white">{meal.section}</div>
            <div className="text-xs text-[#6a6a8a] mt-0.5">
              {meal.itemCount > 0
                ? `${meal.calories} kcal`
                : "Tap to add"}
            </div>
          </button>
        ))}
      </div>

      {/* Weekly View */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Weekly View</h2>
          <button
            onClick={() => onNavigate("week")}
            className="text-[#C9A84C] text-xs font-medium"
          >
            Plan Week →
          </button>
        </div>

        <div className="bg-[#111127] rounded-2xl border border-[#1e1e3a] p-4">
          {weekHasData ? (
            <>
              <div className="flex items-end justify-between gap-2 h-28 mb-3">
                {weekData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col items-center gap-[2px]">
                      <div
                        className="w-3 rounded-sm bg-[#4A90D9]"
                        style={{ height: `${Math.max((day.carbs / maxMacro) * 80, 2)}px` }}
                      />
                      <div
                        className="w-3 rounded-sm bg-[#00C9A7]"
                        style={{ height: `${Math.max((day.protein / maxMacro) * 80, 2)}px` }}
                      />
                      <div
                        className="w-3 rounded-sm bg-[#C9A84C]"
                        style={{ height: `${Math.max((day.fat / maxMacro) * 80, 2)}px` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mb-3">
                {weekData.map((day, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] text-[#6a6a8a]">
                    {day.label}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-[#4A90D9]" /> Carbs
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-[#00C9A7]" /> Protein
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-[#C9A84C]" /> Fats
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-sm text-[#6a6a8a]">No week plan yet</div>
              <button
                onClick={() => onNavigate("week")}
                className="text-xs text-[#C9A84C] font-medium mt-1"
              >
                Start planning →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
