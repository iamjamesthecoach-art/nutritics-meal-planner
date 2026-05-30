"use client";

import { useState, useMemo } from "react";
import { AppState, generateId, CustomRecipe } from "@/lib/store";
import { calculateFoodRow } from "@/lib/calculations";
import { FOOD_BANK, FoodItem } from "@/data/food-bank";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
  onClose: () => void;
  editRecipe?: CustomRecipe;
}

type PickerCategory = "protein" | "carbs" | "veg" | "other" | null;

const CATEGORY_MAP: Record<string, string[]> = {
  protein: ["Protein"],
  carbs: ["Carbohydrate"],
  veg: ["Vegetable"],
  other: ["Fat", "Fruit", "Snack", "Free / Condiment"],
};

const PICKER_BUTTONS: { key: string; label: string; icon: string }[] = [
  { key: "protein", label: "Protein", icon: "🥩" },
  { key: "carbs", label: "Carbs", icon: "🍚" },
  { key: "veg", label: "Veg", icon: "🥦" },
  { key: "other", label: "Other", icon: "+" },
];

interface IngredientRow {
  id: string;
  foodId: string;
  grams: string;
}

export default function RecipeCreatorScreen({
  state,
  update,
  onClose,
  editRecipe,
}: Props) {
  const allFoods = useMemo(
    () => [...FOOD_BANK, ...state.customFoods],
    [state.customFoods]
  );

  const [title, setTitle] = useState(editRecipe?.title || "");
  const [servings, setServings] = useState(String(editRecipe?.servings || 1));
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    editRecipe
      ? editRecipe.ingredientRows.map((r) => ({
          id: generateId(),
          foodId: r.foodId,
          grams: String(r.grams),
        }))
      : []
  );
  const [methodSteps, setMethodSteps] = useState<string[]>(
    editRecipe?.method || [""]
  );
  const [activePicker, setActivePicker] = useState<PickerCategory>(null);
  const [error, setError] = useState("");

  const addIngredient = (foodId: string) => {
    const food = allFoods.find((f) => f.id === foodId);
    setIngredients((prev) => [
      ...prev,
      {
        id: generateId(),
        foodId,
        grams: food ? String(food.typicalG) : "100",
      },
    ]);
    setActivePicker(null);
  };

  const updateIngredientGrams = (id: string, value: string) => {
    setIngredients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, grams: value } : r))
    );
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((r) => r.id !== id));
  };

  const totals = useMemo(() => {
    let cal = 0,
      pro = 0,
      carbs = 0,
      fat = 0,
      fibre = 0;
    for (const row of ingredients) {
      const food = allFoods.find((f) => f.id === row.foodId);
      if (!food) continue;
      const g = Number(row.grams);
      if (isNaN(g) || g <= 0) continue;
      const r = calculateFoodRow(
        food.calPer100g,
        food.carbsPer100g,
        food.proteinPer100g,
        food.fatPer100g,
        food.fibrePer100g,
        g
      );
      cal += r.calories;
      pro += r.proteinG;
      carbs += r.carbsG;
      fat += r.fatG;
      fibre += r.fibreG;
    }
    const s = Number(servings) || 1;
    return {
      calories: Math.round(cal / s),
      protein: Math.round((pro / s) * 10) / 10,
      carbs: Math.round((carbs / s) * 10) / 10,
      fat: Math.round((fat / s) * 10) / 10,
      fibre: Math.round((fibre / s) * 10) / 10,
    };
  }, [ingredients, allFoods, servings]);

  const addMethodStep = () => setMethodSteps((prev) => [...prev, ""]);

  const updateMethodStep = (idx: number, value: string) => {
    setMethodSteps((prev) => prev.map((s, i) => (i === idx ? value : s)));
  };

  const removeMethodStep = (idx: number) => {
    setMethodSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveRecipe = () => {
    if (!title.trim()) {
      setError("Give your recipe a name");
      return;
    }
    if (ingredients.length === 0) {
      setError("Add at least one ingredient");
      return;
    }
    setError("");

    const recipe: CustomRecipe = {
      id: editRecipe?.id || generateId(),
      title: title.trim(),
      servings: Number(servings) || 1,
      ingredientRows: ingredients.map((r) => ({
        foodId: r.foodId,
        grams: Number(r.grams) || 0,
      })),
      method: methodSteps.filter((s) => s.trim() !== ""),
    };

    update((prev) => {
      const existing = prev.customRecipes || [];
      const filtered = existing.filter((r) => r.id !== recipe.id);
      return {
        ...prev,
        customRecipes: [...filtered, recipe],
      };
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D1A] overflow-y-auto">
      <div className="max-w-lg mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">
            {editRecipe ? "Edit Recipe" : "Create Recipe"}
          </h1>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-[#6a6a8a] border border-[#3a3a5c] rounded-lg"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Title & Servings */}
        <div className="mb-4">
          <label className="text-xs font-bold text-[#A78BFA] uppercase tracking-wide block mb-1">
            Recipe Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chicken Tikka Rice Bowl"
            className="w-full px-3 py-2.5 bg-[#1a1a2e] border border-[#3a3a5c] rounded-lg text-sm text-white placeholder-[#6a6a8a] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF]"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-[#A78BFA] uppercase tracking-wide block mb-1">
            Servings
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="w-20 px-3 py-2.5 bg-[#1a1a2e] border border-[#3a3a5c] rounded-lg text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-[#7C4DFF]"
          />
        </div>

        {/* Per-serving totals */}
        <div className="grid grid-cols-5 text-center text-xs mb-4 bg-[#1a1a2e] rounded-lg p-2 border border-[#2a2a4a]">
          <div>
            <div className="font-bold text-white">{totals.calories}</div>
            <div className="text-[#6a6a8a]">kcal</div>
          </div>
          <div>
            <div className="font-bold text-white">{totals.protein}g</div>
            <div className="text-[#6a6a8a]">Protein</div>
          </div>
          <div>
            <div className="font-bold text-white">{totals.carbs}g</div>
            <div className="text-[#6a6a8a]">Carbs</div>
          </div>
          <div>
            <div className="font-bold text-white">{totals.fat}g</div>
            <div className="text-[#6a6a8a]">Fat</div>
          </div>
          <div>
            <div className="font-bold text-white">{totals.fibre}g</div>
            <div className="text-[#6a6a8a]">Fibre</div>
          </div>
        </div>
        <p className="text-xs text-[#6a6a8a] text-center mb-6">Per serving</p>

        {/* Ingredients */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wide mb-2">
            Ingredients
          </h2>

          {ingredients.map((row) => {
            const food = allFoods.find((f) => f.id === row.foodId);
            if (!food) return null;
            const g = Number(row.grams);
            const validG = isNaN(g) || g <= 0 ? 0 : g;
            const r = calculateFoodRow(
              food.calPer100g,
              food.carbsPer100g,
              food.proteinPer100g,
              food.fatPer100g,
              food.fibrePer100g,
              validG
            );
            return (
              <div
                key={row.id}
                className="bg-[#1a1a2e] rounded-lg p-3 mb-2 border border-[#2a2a4a]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-[#7C4DFF] font-medium">
                      {food.category}
                    </span>
                    <div className="text-sm font-medium text-white truncate">
                      {food.food}
                    </div>
                  </div>
                  <button
                    onClick={() => removeIngredient(row.id)}
                    className="text-[#6a6a8a] text-lg ml-2 p-1"
                  >
                    x
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={row.grams}
                    onChange={(e) =>
                      updateIngredientGrams(row.id, e.target.value)
                    }
                    className="w-20 border border-[#3a3a5c] rounded px-2 py-1.5 text-sm text-center text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF]"
                  />
                  <span className="text-xs text-[#6a6a8a]">g</span>
                </div>
                <div className="grid grid-cols-5 text-xs text-center text-[#9090b0]">
                  <div>
                    <span className="font-medium text-white">{r.calories}</span>{" "}
                    kcal
                  </div>
                  <div>
                    <span className="font-medium text-white">{r.carbsG}</span>g
                    C
                  </div>
                  <div>
                    <span className="font-medium text-white">
                      {r.proteinG}
                    </span>
                    g P
                  </div>
                  <div>
                    <span className="font-medium text-white">{r.fatG}</span>g F
                  </div>
                  <div>
                    <span className="font-medium text-white">{r.fibreG}</span>g
                    Fi
                  </div>
                </div>
              </div>
            );
          })}

          {activePicker ? (
            <IngredientPicker
              foods={allFoods}
              categories={CATEGORY_MAP[activePicker]}
              pickerLabel={
                PICKER_BUTTONS.find((b) => b.key === activePicker)?.label || ""
              }
              onSelect={addIngredient}
              onClose={() => setActivePicker(null)}
            />
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {PICKER_BUTTONS.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() =>
                    setActivePicker(btn.key as PickerCategory)
                  }
                  className="py-2.5 border-2 border-dashed border-[#3a3a5c] rounded-lg text-xs text-[#6a6a8a] font-medium hover:border-[#7C4DFF] hover:text-[#7C4DFF] transition-colors flex flex-col items-center gap-0.5"
                >
                  <span className="text-base">{btn.icon}</span>
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Method */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wide mb-2">
            Method (optional)
          </h2>
          {methodSteps.map((step, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <span className="text-sm text-[#7C4DFF] font-medium mt-2.5">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={step}
                onChange={(e) => updateMethodStep(idx, e.target.value)}
                placeholder={`Step ${idx + 1}...`}
                className="flex-1 px-3 py-2 bg-[#1a1a2e] border border-[#3a3a5c] rounded-lg text-sm text-white placeholder-[#6a6a8a] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF]"
              />
              {methodSteps.length > 1 && (
                <button
                  onClick={() => removeMethodStep(idx)}
                  className="text-[#6a6a8a] text-lg px-1"
                >
                  x
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addMethodStep}
            className="text-sm text-[#7C4DFF] font-medium"
          >
            + Add step
          </button>
        </div>

        {/* Save */}
        <button
          onClick={saveRecipe}
          className="w-full py-3 bg-gradient-to-r from-[#7C4DFF] to-[#6C3FC5] text-white rounded-xl text-sm font-bold"
        >
          {editRecipe ? "Save Changes" : "Save Recipe"}
        </button>
      </div>
    </div>
  );
}

function IngredientPicker({
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
    const categoryFiltered = foods.filter((f) =>
      categories.includes(f.category)
    );
    if (!search.trim()) return categoryFiltered;
    const q = search.toLowerCase();
    return categoryFiltered.filter(
      (f) =>
        f.food.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [search, foods, categories]);

  return (
    <div className="border border-[#3a3a5c] rounded-lg bg-[#1a1a2e] shadow-lg shadow-purple-900/20">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs font-bold text-[#A78BFA] uppercase tracking-wide">
          {pickerLabel}
        </span>
        <button
          onClick={onClose}
          className="text-[#6a6a8a] text-xs font-medium"
        >
          Cancel
        </button>
      </div>
      <div className="flex items-center px-2 pb-2 border-b border-[#2a2a4a]">
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
            className="w-full text-left px-3 py-2.5 border-b border-[#2a2a4a] hover:bg-[#252547] active:bg-[#2a2a4a]"
          >
            {categories.length > 1 && (
              <span className="text-xs text-[#7C4DFF] font-medium">
                {food.category}
              </span>
            )}
            <div className="text-sm text-white">{food.food}</div>
            <div className="text-xs text-[#6a6a8a]">
              {food.typicalPortion} ({food.typicalG}g) | {food.calPer100g}{" "}
              kcal/100g
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-4 text-center text-sm text-[#6a6a8a]">
            No foods found
          </div>
        )}
      </div>
    </div>
  );
}
