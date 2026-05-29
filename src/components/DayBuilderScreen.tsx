"use client";

import { useState, useMemo } from "react";
import { AppState, getMealSections, generateId, MealFoodRow } from "@/lib/store";
import { calculateTargets, calculateFoodRow } from "@/lib/calculations";
import { FOOD_BANK, FoodItem } from "@/data/food-bank";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
}

export default function DayBuilderScreen({ state, update }: Props) {
  const calc = calculateTargets(state.targets);
  const isTraining = state.currentDay.isTrainingDay;
  const meals = state.currentDay.meals;
  const sections = getMealSections(isTraining);
  const allFoods = useMemo(
    () => [...FOOD_BANK, ...state.customFoods],
    [state.customFoods]
  );

  const dayTarget = isTraining
    ? {
        kcal: calc.trainingDayKcal,
        protein: calc.proteinG,
        carbs: Math.round(calc.trainingCarbsG),
        fat: calc.fatG,
        fibre: calc.fibreGMin,
      }
    : {
        kcal: calc.restDayKcal,
        protein: calc.proteinG,
        carbs: Math.round(calc.restCarbsG),
        fat: calc.fatG,
        fibre: calc.fibreGMin,
      };

  const dayTotals = useMemo(() => {
    let totalCal = 0, totalCarbs = 0, totalPro = 0, totalFat = 0, totalFibre = 0;
    for (const section of sections) {
      for (const row of meals[section] || []) {
        const food = allFoods.find((f) => f.id === row.foodId);
        if (!food) continue;
        const grams = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
        if (isNaN(grams) || grams <= 0) continue;
        const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, grams);
        totalCal += r.calories;
        totalCarbs += r.carbsG;
        totalPro += r.proteinG;
        totalFat += r.fatG;
        totalFibre += r.fibreG;
      }
    }
    return {
      calories: Math.round(totalCal),
      carbs: Math.round(totalCarbs * 10) / 10,
      protein: Math.round(totalPro * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fibre: Math.round(totalFibre * 10) / 10,
    };
  }, [meals, sections, allFoods]);

  const diff = {
    calories: dayTotals.calories - dayTarget.kcal,
    protein: Math.round((dayTotals.protein - dayTarget.protein) * 10) / 10,
    carbs: Math.round((dayTotals.carbs - dayTarget.carbs) * 10) / 10,
    fat: Math.round((dayTotals.fat - dayTarget.fat) * 10) / 10,
    fibre: Math.round((dayTotals.fibre - dayTarget.fibre) * 10) / 10,
  };

  const calorieStatus =
    Math.abs(diff.calories) <= 100
      ? "On target"
      : diff.calories < 0
      ? "Under"
      : "Over";

  const totalKcal = dayTotals.calories || 1;
  const macroSplit = {
    carbs: Math.round(((dayTotals.carbs * 4) / totalKcal) * 100),
    protein: Math.round(((dayTotals.protein * 4) / totalKcal) * 100),
    fat: Math.round(((dayTotals.fat * 9) / totalKcal) * 100),
  };

  const toggleDayType = () => {
    const newIsTraining = !isTraining;
    const newSections = getMealSections(newIsTraining);
    const newMeals: Record<string, MealFoodRow[]> = {};
    for (const s of newSections) {
      newMeals[s] = meals[s] || [];
    }
    update((prev) => ({
      ...prev,
      currentDay: { ...prev.currentDay, isTrainingDay: newIsTraining, meals: newMeals },
    }));
  };

  const addFoodRow = (section: string, foodId: string) => {
    update((prev) => {
      const current = prev.currentDay.meals[section] || [];
      return {
        ...prev,
        currentDay: {
          ...prev.currentDay,
          meals: {
            ...prev.currentDay.meals,
            [section]: [...current, { id: generateId(), foodId, gramsInput: "" }],
          },
        },
      };
    });
  };

  const updateGrams = (section: string, rowId: string, value: string) => {
    update((prev) => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        meals: {
          ...prev.currentDay.meals,
          [section]: (prev.currentDay.meals[section] || []).map((r) =>
            r.id === rowId ? { ...r, gramsInput: value } : r
          ),
        },
      },
    }));
  };

  const removeRow = (section: string, rowId: string) => {
    update((prev) => ({
      ...prev,
      currentDay: {
        ...prev.currentDay,
        meals: {
          ...prev.currentDay.meals,
          [section]: (prev.currentDay.meals[section] || []).filter(
            (r) => r.id !== rowId
          ),
        },
      },
    }));
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div
        className={`sticky top-0 z-40 px-4 py-2 text-center text-sm font-bold ${
          calc.status === "Deficit (fat loss)"
            ? "bg-gradient-to-r from-[#7C4DFF] to-[#6C3FC5] text-white"
            : calc.status === "Surplus (gain)"
            ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white"
            : "bg-[#252547] text-[#9090b0]"
        }`}
      >
        {calc.status} | {isTraining ? "Training" : "Rest"} Day | Target:{" "}
        {dayTarget.kcal.toLocaleString()} kcal
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Day Builder</h1>
          <button
            onClick={toggleDayType}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#252547] text-[#c0c0d8] border border-[#3a3a5c]"
          >
            Switch to {isTraining ? "Rest" : "Training"} Day
          </button>
        </div>

        {sections.map((section) => (
          <MealSection
            key={section}
            section={section}
            rows={meals[section] || []}
            allFoods={allFoods}
            onAddFood={(foodId) => addFoodRow(section, foodId)}
            onUpdateGrams={(rowId, val) => updateGrams(section, rowId, val)}
            onRemove={(rowId) => removeRow(section, rowId)}
          />
        ))}

        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#252547] border border-[#3a3a5c] text-white rounded-xl p-4 mt-4">
          <div className="grid grid-cols-6 text-xs text-center mb-2 text-[#6a6a8a]">
            <div></div>
            <div>kcal</div>
            <div>Carbs</div>
            <div>Protein</div>
            <div>Fat</div>
            <div>Fibre</div>
          </div>
          <div className="grid grid-cols-6 text-center text-sm font-bold mb-1">
            <div className="text-left text-xs">DAY TOTAL</div>
            <div>{dayTotals.calories}</div>
            <div>{dayTotals.carbs}g</div>
            <div>{dayTotals.protein}g</div>
            <div>{dayTotals.fat}g</div>
            <div>{dayTotals.fibre}g</div>
          </div>
          <div className="grid grid-cols-6 text-center text-sm mb-1 text-[#9090b0]">
            <div className="text-left text-xs">TARGET</div>
            <div>{dayTarget.kcal}</div>
            <div>{dayTarget.carbs}g</div>
            <div>{dayTarget.protein}g</div>
            <div>{dayTarget.fat}g</div>
            <div>{dayTarget.fibre}g</div>
          </div>
          <div className="grid grid-cols-6 text-center text-sm mb-2">
            <div className="text-left text-xs">DIFF</div>
            <div className={diff.calories > 0 ? "text-amber-400" : "text-emerald-400"}>
              {diff.calories > 0 ? "+" : ""}{diff.calories}
            </div>
            <div className="text-[#c0c0d8]">{diff.carbs > 0 ? "+" : ""}{diff.carbs}g</div>
            <div className="text-[#c0c0d8]">{diff.protein > 0 ? "+" : ""}{diff.protein}g</div>
            <div className="text-[#c0c0d8]">{diff.fat > 0 ? "+" : ""}{diff.fat}g</div>
            <div className="text-[#c0c0d8]">{diff.fibre > 0 ? "+" : ""}{diff.fibre}g</div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#3a3a5c]">
            <span
              className={`text-sm font-bold ${
                calorieStatus === "On target"
                  ? "text-emerald-400"
                  : calorieStatus === "Under"
                  ? "text-[#A78BFA]"
                  : "text-amber-400"
              }`}
            >
              {calorieStatus}
            </span>
            <span className="text-xs text-[#6a6a8a]">
              C {macroSplit.carbs}% / P {macroSplit.protein}% / F {macroSplit.fat}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MealSection({
  section,
  rows,
  allFoods,
  onAddFood,
  onUpdateGrams,
  onRemove,
}: {
  section: string;
  rows: MealFoodRow[];
  allFoods: FoodItem[];
  onAddFood: (foodId: string) => void;
  onUpdateGrams: (rowId: string, val: string) => void;
  onRemove: (rowId: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const sectionTotals = useMemo(() => {
    let cal = 0, carbs = 0, pro = 0, fat = 0, fibre = 0;
    for (const row of rows) {
      const food = allFoods.find((f) => f.id === row.foodId);
      if (!food) continue;
      const g = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
      if (isNaN(g) || g <= 0) continue;
      const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, g);
      cal += r.calories; carbs += r.carbsG; pro += r.proteinG; fat += r.fatG; fibre += r.fibreG;
    }
    return { cal: Math.round(cal), carbs: Math.round(carbs * 10) / 10, pro: Math.round(pro * 10) / 10, fat: Math.round(fat * 10) / 10, fibre: Math.round(fibre * 10) / 10 };
  }, [rows, allFoods]);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold text-[#A78BFA] uppercase tracking-wide">
          {section}
        </h2>
        {rows.length > 0 && (
          <span className="text-xs text-[#6a6a8a]">
            {sectionTotals.cal} kcal | P {sectionTotals.pro}g
          </span>
        )}
      </div>

      {rows.map((row) => {
        const food = allFoods.find((f) => f.id === row.foodId);
        if (!food) return null;
        const grams = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
        const validGrams = isNaN(grams) || grams <= 0 ? 0 : grams;
        const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, validGrams);
        return (
          <div key={row.id} className="bg-[#1a1a2e] rounded-lg p-3 mb-2 border border-[#2a2a4a]">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[#7C4DFF] font-medium">{food.category}</span>
                <div className="text-sm font-medium text-white truncate">{food.food}</div>
              </div>
              <button onClick={() => onRemove(row.id)} className="text-[#6a6a8a] text-lg ml-2 p-1">
                x
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder={`${food.typicalG}g`}
                value={row.gramsInput}
                onChange={(e) => onUpdateGrams(row.id, e.target.value)}
                className="w-20 border border-[#3a3a5c] rounded px-2 py-1.5 text-sm text-center text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF]"
              />
              <span className="text-xs text-[#6a6a8a]">g</span>
            </div>
            <div className="grid grid-cols-5 text-xs text-center text-[#9090b0]">
              <div><span className="font-medium text-white">{r.calories}</span> kcal</div>
              <div><span className="font-medium text-white">{r.carbsG}</span>g C</div>
              <div><span className="font-medium text-white">{r.proteinG}</span>g P</div>
              <div><span className="font-medium text-white">{r.fatG}</span>g F</div>
              <div><span className="font-medium text-white">{r.fibreG}</span>g Fi</div>
            </div>
          </div>
        );
      })}

      {showPicker ? (
        <FoodPicker
          foods={allFoods}
          onSelect={(foodId) => {
            onAddFood(foodId);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-2.5 border-2 border-dashed border-[#3a3a5c] rounded-lg text-sm text-[#6a6a8a] font-medium hover:border-[#7C4DFF] hover:text-[#7C4DFF] transition-colors"
        >
          + Add food
        </button>
      )}
    </div>
  );
}

function FoodPicker({
  foods,
  onSelect,
  onClose,
}: {
  foods: FoodItem[];
  onSelect: (foodId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return foods;
    const q = search.toLowerCase();
    return foods.filter(
      (f) =>
        f.food.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [search, foods]);

  return (
    <div className="border border-[#3a3a5c] rounded-lg bg-[#1a1a2e] shadow-lg shadow-purple-900/20">
      <div className="flex items-center p-2 border-b border-[#2a2a4a]">
        <input
          type="text"
          autoFocus
          placeholder="Search foods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-2 py-1.5 text-sm text-white bg-transparent focus:outline-none placeholder-[#6a6a8a]"
        />
        <button onClick={onClose} className="text-[#6a6a8a] px-2 text-sm">
          Cancel
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {filtered.map((food) => (
          <button
            key={food.id}
            onClick={() => onSelect(food.id)}
            className="w-full text-left px-3 py-2.5 border-b border-[#2a2a4a] hover:bg-[#252547] active:bg-[#2a2a4a]"
          >
            <span className="text-xs text-[#7C4DFF] font-medium">{food.category}</span>
            <div className="text-sm text-white">{food.food}</div>
            <div className="text-xs text-[#6a6a8a]">
              {food.typicalPortion} ({food.typicalG}g) | {food.calPer100g} kcal/100g
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-4 text-center text-sm text-[#6a6a8a]">No foods found</div>
        )}
      </div>
    </div>
  );
}
