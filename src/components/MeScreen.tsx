"use client";

import { useMemo } from "react";
import { AppState, SavedDay, resetDay, getMealSections } from "@/lib/store";
import { calculateTargets, calculateFoodRow } from "@/lib/calculations";
import { FOOD_BANK } from "@/data/food-bank";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
}

export default function MeScreen({ state, update }: Props) {
  const calc = calculateTargets(state.targets);
  const allFoods = useMemo(
    () => [...FOOD_BANK, ...state.customFoods],
    [state.customFoods]
  );

  const currentDayTotals = useMemo(() => {
    const sections = getMealSections(state.currentDay.isTrainingDay);
    let cal = 0, carbs = 0, pro = 0, fat = 0, fibre = 0;
    for (const section of sections) {
      for (const row of state.currentDay.meals[section] || []) {
        const food = allFoods.find((f) => f.id === row.foodId);
        if (!food) continue;
        const g = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
        if (isNaN(g) || g <= 0) continue;
        const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, g);
        cal += r.calories; carbs += r.carbsG; pro += r.proteinG; fat += r.fatG; fibre += r.fibreG;
      }
    }
    return { calories: Math.round(cal), protein: Math.round(pro * 10) / 10, carbs: Math.round(carbs * 10) / 10, fat: Math.round(fat * 10) / 10, fibre: Math.round(fibre * 10) / 10 };
  }, [state.currentDay, allFoods]);

  const saveCurrentDay = () => {
    const saved: SavedDay = {
      date: state.currentDay.date,
      isTrainingDay: state.currentDay.isTrainingDay,
      meals: state.currentDay.meals,
      totalCalories: currentDayTotals.calories,
      totalProtein: currentDayTotals.protein,
      totalCarbs: currentDayTotals.carbs,
      totalFat: currentDayTotals.fat,
      totalFibre: currentDayTotals.fibre,
    };
    update((prev) => ({
      ...prev,
      savedDays: [saved, ...prev.savedDays.filter((d) => d.date !== saved.date)],
    }));
  };

  const handleReset = () => {
    update((prev) => resetDay(prev));
  };

  const changePreset = () => {
    const newPreset = state.preset === "fat-loss" ? "muscle-gain" : "fat-loss";
    const newGoal = newPreset === "fat-loss" ? "Moderate cut" : "Lean gain";
    update((prev) => ({
      ...prev,
      preset: newPreset as "fat-loss" | "muscle-gain",
      targets: { ...prev.targets, goal: newGoal },
    }));
  };

  const generateSummary = (): string => {
    const sections = getMealSections(state.currentDay.isTrainingDay);
    const dayType = state.currentDay.isTrainingDay ? "Training Day" : "Rest Day";
    let text = `${dayType} - ${state.currentDay.date}\n`;
    text += `Target: ${state.currentDay.isTrainingDay ? calc.trainingDayKcal : calc.restDayKcal} kcal\n\n`;

    for (const section of sections) {
      const rows = state.currentDay.meals[section] || [];
      if (rows.length === 0) continue;
      text += `${section.toUpperCase()}\n`;
      for (const row of rows) {
        const food = allFoods.find((f) => f.id === row.foodId);
        if (!food) continue;
        const g = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
        const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, g);
        text += `  ${food.food} - ${g}g (${r.calories} kcal, P${r.proteinG}g)\n`;
      }
      text += "\n";
    }

    text += `TOTAL: ${currentDayTotals.calories} kcal | P ${currentDayTotals.protein}g | C ${currentDayTotals.carbs}g | F ${currentDayTotals.fat}g | Fi ${currentDayTotals.fibre}g`;
    return text;
  };

  const copyToClipboard = async () => {
    const text = generateSummary();
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Copied to clipboard");
    }
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-[#1F2A33] mb-6">Me</h1>

      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold text-[#1F2A33] uppercase tracking-wide mb-3">
          Current Preset
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#1F7A8C]">
            {state.preset === "fat-loss" ? "Fat Loss" : "Muscle Gain"}
          </span>
          <button
            onClick={changePreset}
            className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium text-[#1F2A33]"
          >
            Switch to {state.preset === "fat-loss" ? "Muscle Gain" : "Fat Loss"}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold text-[#1F2A33] uppercase tracking-wide mb-3">
          Today&apos;s Plan
        </h2>
        <div className="grid grid-cols-5 text-center text-sm mb-3">
          <div>
            <div className="font-bold text-[#1F2A33]">{currentDayTotals.calories}</div>
            <div className="text-xs text-gray-500">kcal</div>
          </div>
          <div>
            <div className="font-bold">{currentDayTotals.protein}g</div>
            <div className="text-xs text-gray-500">Protein</div>
          </div>
          <div>
            <div className="font-bold">{currentDayTotals.carbs}g</div>
            <div className="text-xs text-gray-500">Carbs</div>
          </div>
          <div>
            <div className="font-bold">{currentDayTotals.fat}g</div>
            <div className="text-xs text-gray-500">Fat</div>
          </div>
          <div>
            <div className="font-bold">{currentDayTotals.fibre}g</div>
            <div className="text-xs text-gray-500">Fibre</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveCurrentDay}
            className="flex-1 py-2.5 bg-[#1F7A8C] text-white rounded-lg text-sm font-medium"
          >
            Save Day
          </button>
          <button
            onClick={copyToClipboard}
            className="flex-1 py-2.5 bg-gray-200 text-[#1F2A33] rounded-lg text-sm font-medium"
          >
            Copy to Clipboard
          </button>
        </div>
        <button
          onClick={handleReset}
          className="w-full mt-2 py-2 text-sm text-red-500 font-medium"
        >
          Reset Day
        </button>
      </div>

      {state.savedDays.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h2 className="text-sm font-bold text-[#1F2A33] uppercase tracking-wide mb-3">
            History
          </h2>
          <div className="space-y-2">
            {state.savedDays.map((day, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-3 border border-gray-200"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-[#1F2A33]">
                    {day.date}
                  </span>
                  <span className="text-xs text-gray-500">
                    {day.isTrainingDay ? "Training" : "Rest"}
                  </span>
                </div>
                <div className="grid grid-cols-5 text-xs text-center text-gray-600">
                  <div>{day.totalCalories} kcal</div>
                  <div>P {day.totalProtein}g</div>
                  <div>C {day.totalCarbs}g</div>
                  <div>F {day.totalFat}g</div>
                  <div>Fi {day.totalFibre}g</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
