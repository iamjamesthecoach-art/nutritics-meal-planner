"use client";

import { useState, useMemo } from "react";
import { AppState, getMealSections, generateId, MealFoodRow, createEmptyWeekPlan } from "@/lib/store";
import { calculateTargets, calculateFoodRow } from "@/lib/calculations";
import { FOOD_BANK, FoodItem } from "@/data/food-bank";
import { generateWeekPdf } from "@/lib/generate-week-pdf";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
}

export default function WeekPlannerScreen({ state, update }: Props) {
  const calc = calculateTargets(state.targets);
  const activeIdx = state.activeWeekDay;
  const activeDay = state.weekPlan.days[activeIdx];
  const sections = getMealSections(activeDay.isTrainingDay);
  const allFoods = useMemo(
    () => [...FOOD_BANK, ...state.customFoods],
    [state.customFoods]
  );

  const dayTotals = useMemo(() => {
    const days = state.weekPlan.days.map((day) => {
      let cal = 0, carbs = 0, pro = 0, fat = 0, fibre = 0;
      const daySections = getMealSections(day.isTrainingDay);
      for (const section of daySections) {
        for (const row of day.meals[section] || []) {
          const food = allFoods.find((f) => f.id === row.foodId);
          if (!food) continue;
          const g = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
          if (isNaN(g) || g <= 0) continue;
          const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, g);
          cal += r.calories; carbs += r.carbsG; pro += r.proteinG; fat += r.fatG; fibre += r.fibreG;
        }
      }
      return { calories: Math.round(cal), protein: Math.round(pro * 10) / 10, carbs: Math.round(carbs * 10) / 10, fat: Math.round(fat * 10) / 10, fibre: Math.round(fibre * 10) / 10 };
    });
    return days;
  }, [state.weekPlan.days, allFoods]);

  const activeDayTotals = dayTotals[activeIdx];
  const dayTarget = activeDay.isTrainingDay ? calc.trainingDayKcal : calc.restDayKcal;

  const addFoodRow = (section: string, foodId: string) => {
    update((prev) => {
      const days = [...prev.weekPlan.days];
      const day = { ...days[activeIdx] };
      const current = day.meals[section] || [];
      day.meals = {
        ...day.meals,
        [section]: [...current, { id: generateId(), foodId, gramsInput: "" }],
      };
      days[activeIdx] = day;
      return { ...prev, weekPlan: { ...prev.weekPlan, days } };
    });
  };

  const updateGrams = (section: string, rowId: string, value: string) => {
    update((prev) => {
      const days = [...prev.weekPlan.days];
      const day = { ...days[activeIdx] };
      day.meals = {
        ...day.meals,
        [section]: (day.meals[section] || []).map((r) =>
          r.id === rowId ? { ...r, gramsInput: value } : r
        ),
      };
      days[activeIdx] = day;
      return { ...prev, weekPlan: { ...prev.weekPlan, days } };
    });
  };

  const removeRow = (section: string, rowId: string) => {
    update((prev) => {
      const days = [...prev.weekPlan.days];
      const day = { ...days[activeIdx] };
      day.meals = {
        ...day.meals,
        [section]: (day.meals[section] || []).filter((r) => r.id !== rowId),
      };
      days[activeIdx] = day;
      return { ...prev, weekPlan: { ...prev.weekPlan, days } };
    });
  };

  const copyDayTo = (fromIdx: number, toIdx: number) => {
    update((prev) => {
      const days = [...prev.weekPlan.days];
      const source = days[fromIdx];
      const targetIsTraining = days[toIdx].isTrainingDay;
      // Deep copy meals
      const copiedMeals: Record<string, MealFoodRow[]> = {};
      const targetSections = getMealSections(targetIsTraining);
      for (const s of targetSections) {
        copiedMeals[s] = (source.meals[s] || []).map((r) => ({
          ...r,
          id: generateId(),
        }));
      }
      days[toIdx] = { ...days[toIdx], meals: copiedMeals };
      return { ...prev, weekPlan: { ...prev.weekPlan, days } };
    });
  };

  const resetWeek = () => {
    update((prev) => ({
      ...prev,
      weekPlan: createEmptyWeekPlan(),
      activeWeekDay: 0,
    }));
  };

  const weekHasFood = state.weekPlan.days.some((d) =>
    Object.values(d.meals).some((rows) => rows.length > 0)
  );

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="sticky top-0 z-40 bg-[#0a0a1a]/95 backdrop-blur-md border-b border-[#1e1e3a]">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-white">Week Planner</h1>
            {weekHasFood && (
              <button
                onClick={() => generateWeekPdf(state)}
                className="px-3 py-1.5 bg-gradient-to-r from-[#C9A84C] to-[#A8893E] text-white rounded-lg text-xs font-medium"
              >
                Download PDF
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {state.weekPlan.days.map((day, i) => {
              const hasFood = Object.values(day.meals).some((rows) => rows.length > 0);
              return (
                <button
                  key={i}
                  onClick={() => update((prev) => ({ ...prev, activeWeekDay: i }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium text-center transition-all ${
                    activeIdx === i
                      ? "bg-gradient-to-r from-[#C9A84C] to-[#A8893E] text-white"
                      : hasFood
                      ? "bg-[#161633] text-[#C9A84C] border border-[#C9A84C]/30"
                      : "bg-[#161633] text-[#9090b0]"
                  }`}
                >
                  <div>{day.isTrainingDay ? "T" : "R"}{day.isTrainingDay ? i + 1 : i - 1}</div>
                  {hasFood && <div className="text-[10px] mt-0.5">{dayTotals[i].calories} kcal</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white">{activeDay.label}</h2>
            <span className="text-xs text-[#6a6a8a]">
              Target: {dayTarget} kcal | Current: {activeDayTotals.calories} kcal
            </span>
          </div>
          <CopyDayDropdown
            days={state.weekPlan.days}
            activeIdx={activeIdx}
            onCopy={(fromIdx) => copyDayTo(fromIdx, activeIdx)}
          />
        </div>

        <div className="grid grid-cols-5 text-center text-xs mb-4 bg-[#111127] rounded-lg p-2 border border-[#1e1e3a]">
          <div>
            <div className="font-bold text-white">{activeDayTotals.calories}</div>
            <div className="text-[#6a6a8a]">kcal</div>
          </div>
          <div>
            <div className="font-bold text-white">{activeDayTotals.protein}g</div>
            <div className="text-[#6a6a8a]">Protein</div>
          </div>
          <div>
            <div className="font-bold text-white">{activeDayTotals.carbs}g</div>
            <div className="text-[#6a6a8a]">Carbs</div>
          </div>
          <div>
            <div className="font-bold text-white">{activeDayTotals.fat}g</div>
            <div className="text-[#6a6a8a]">Fat</div>
          </div>
          <div>
            <div className="font-bold text-white">{activeDayTotals.fibre}g</div>
            <div className="text-[#6a6a8a]">Fibre</div>
          </div>
        </div>

        {sections.map((section) => (
          <MealSection
            key={section}
            section={section}
            rows={activeDay.meals[section] || []}
            allFoods={allFoods}
            onAddFood={(foodId) => addFoodRow(section, foodId)}
            onUpdateGrams={(rowId, val) => updateGrams(section, rowId, val)}
            onRemove={(rowId) => removeRow(section, rowId)}
          />
        ))}

        {weekHasFood && (
          <button
            onClick={resetWeek}
            className="w-full mt-4 py-2 text-sm text-red-400 font-medium"
          >
            Reset Week Plan
          </button>
        )}
      </div>
    </div>
  );
}

function CopyDayDropdown({
  days,
  activeIdx,
  onCopy,
}: {
  days: { label: string; meals: Record<string, MealFoodRow[]> }[];
  activeIdx: number;
  onCopy: (fromIdx: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const otherDays = days
    .map((d, i) => ({ ...d, idx: i }))
    .filter((d, i) => i !== activeIdx && Object.values(d.meals).some((r) => r.length > 0));

  if (otherDays.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 bg-[#161633] text-[#9090b0] rounded-lg text-xs font-medium border border-[#2a2a4a]"
      >
        Copy from...
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-[#111127] border border-[#2a2a4a] rounded-lg shadow-lg z-50">
          {otherDays.map((d) => (
            <button
              key={d.idx}
              onClick={() => { onCopy(d.idx); setOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-[#c0c0d8] hover:bg-[#161633] whitespace-nowrap"
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type PickerCategory = "protein" | "carbs" | "veg" | "other" | null;

const PICKER_BUTTONS: { key: PickerCategory & string; label: string; icon: string }[] = [
  { key: "protein", label: "Protein", icon: "🥩" },
  { key: "carbs", label: "Carbs", icon: "🍚" },
  { key: "veg", label: "Veg", icon: "🥦" },
  { key: "other", label: "Other", icon: "+" },
];

const CATEGORY_MAP: Record<string, string[]> = {
  protein: ["Protein"],
  carbs: ["Carbohydrate"],
  veg: ["Vegetable"],
  other: ["Fat", "Fruit", "Snack", "Free / Condiment"],
};

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
  const [activePicker, setActivePicker] = useState<PickerCategory>(null);

  const sectionTotals = useMemo(() => {
    let cal = 0, pro = 0;
    for (const row of rows) {
      const food = allFoods.find((f) => f.id === row.foodId);
      if (!food) continue;
      const g = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
      if (isNaN(g) || g <= 0) continue;
      const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, g);
      cal += r.calories; pro += r.proteinG;
    }
    return { cal: Math.round(cal), pro: Math.round(pro * 10) / 10 };
  }, [rows, allFoods]);

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-[#C9A84C] uppercase tracking-wide">{section}</h3>
        {rows.length > 0 && (
          <span className="text-xs text-[#6a6a8a]">{sectionTotals.cal} kcal | P {sectionTotals.pro}g</span>
        )}
      </div>

      {rows.map((row) => {
        const food = allFoods.find((f) => f.id === row.foodId);
        if (!food) return null;
        const grams = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
        const validGrams = isNaN(grams) || grams <= 0 ? 0 : grams;
        const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, validGrams);
        return (
          <div key={row.id} className="bg-[#111127] rounded-lg p-3 mb-2 border border-[#1e1e3a]">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[#C9A84C] font-medium">{food.category}</span>
                <div className="text-sm font-medium text-white truncate">{food.food}</div>
              </div>
              <button onClick={() => onRemove(row.id)} className="text-[#6a6a8a] text-lg ml-2 p-1">x</button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                inputMode="numeric"
                placeholder={`${food.typicalG}g`}
                value={row.gramsInput}
                onChange={(e) => onUpdateGrams(row.id, e.target.value)}
                className="w-20 border border-[#2a2a4a] rounded px-2 py-1.5 text-sm text-center text-white bg-[#161633] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
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

      {activePicker ? (
        <FoodPicker
          foods={allFoods}
          categories={CATEGORY_MAP[activePicker]}
          pickerLabel={PICKER_BUTTONS.find((b) => b.key === activePicker)?.label || ""}
          onSelect={(foodId) => { onAddFood(foodId); setActivePicker(null); }}
          onClose={() => setActivePicker(null)}
        />
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {PICKER_BUTTONS.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setActivePicker(btn.key as PickerCategory)}
              className="py-2.5 border-2 border-dashed border-[#2a2a4a] rounded-lg text-xs text-[#6a6a8a] font-medium hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors flex flex-col items-center gap-0.5"
            >
              <span className="text-base">{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FoodPicker({
  foods,
  categories,
  pickerLabel,
  onSelect,
  onClose,
}: {
  foods: FoodItem[];
  categories: string[];
  pickerLabel: string;
  onSelect: (foodId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const categoryFiltered = foods.filter((f) => categories.includes(f.category));
    if (!search.trim()) return categoryFiltered;
    const q = search.toLowerCase();
    return categoryFiltered.filter(
      (f) =>
        f.food.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [search, foods, categories]);

  return (
    <div className="border border-[#2a2a4a] rounded-lg bg-[#111127] shadow-lg shadow-purple-900/20">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs font-bold text-[#C9A84C] uppercase tracking-wide">
          {pickerLabel}
        </span>
        <button onClick={onClose} className="text-[#6a6a8a] text-xs font-medium">
          Cancel
        </button>
      </div>
      <div className="flex items-center px-2 pb-2 border-b border-[#1e1e3a]">
        <input
          type="text"
          autoFocus
          placeholder={`Search ${pickerLabel.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-2 py-1.5 text-sm text-white bg-transparent focus:outline-none placeholder-[#6a6a8a]"
        />
      </div>
      <div className="max-h-60 overflow-y-auto">
        {filtered.map((food) => (
          <button
            key={food.id}
            onClick={() => onSelect(food.id)}
            className="w-full text-left px-3 py-2.5 border-b border-[#1e1e3a] hover:bg-[#161633] active:bg-[#1e1e3a]"
          >
            {categories.length > 1 && (
              <span className="text-xs text-[#C9A84C] font-medium">{food.category}</span>
            )}
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
