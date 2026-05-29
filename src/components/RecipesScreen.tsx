"use client";

import { useState } from "react";
import { RECIPES, Recipe } from "@/data/recipes";
import { AppState, getMealSections, generateId } from "@/lib/store";
import { FOOD_BANK } from "@/data/food-bank";
import { TabId } from "./BottomNav";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
  onNavigate: (tab: TabId) => void;
}

export default function RecipesScreen({ state, update, onNavigate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-[#1F2A33] mb-1">Recipes</h1>
      <p className="text-sm text-gray-500 mb-6">
        {RECIPES.length} recipes. Tap to expand, then add to your day.
      </p>

      <div className="space-y-4">
        {RECIPES.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            expanded={expandedId === recipe.id}
            onToggle={() =>
              setExpandedId(expandedId === recipe.id ? null : recipe.id)
            }
            state={state}
            update={update}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

function RecipeCard({
  recipe,
  expanded,
  onToggle,
  state,
  update,
  onNavigate,
}: {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
  onNavigate: (tab: TabId) => void;
}) {
  const [showMealPicker, setShowMealPicker] = useState(false);

  const addToDay = (mealSection: string) => {
    const allFoods = [...FOOD_BANK, ...state.customFoods];

    update((prev) => {
      const currentRows = prev.currentDay.meals[mealSection] || [];
      const newRows = recipe.ingredients.map((ing) => {
        const matchedFood = allFoods.find(
          (f) =>
            f.food.toLowerCase() === ing.food.toLowerCase() ||
            f.food.toLowerCase().includes(ing.food.toLowerCase().split(",")[0])
        );
        return {
          id: generateId(),
          foodId: matchedFood?.id || "",
          gramsInput: String(ing.grams),
        };
      }).filter((r) => r.foodId !== "");

      return {
        ...prev,
        currentDay: {
          ...prev.currentDay,
          meals: {
            ...prev.currentDay.meals,
            [mealSection]: [...currentRows, ...newRows],
          },
        },
      };
    });

    setShowMealPicker(false);
    onNavigate("day");
  };

  const sections = getMealSections(state.currentDay.isTrainingDay);

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-[#1F2A33]">{recipe.title}</h3>
            <p className="text-xs text-gray-500">{recipe.source}</p>
          </div>
          <span className="text-gray-400 text-lg">{expanded ? "-" : "+"}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-center">
          <div className="bg-white rounded p-1">
            <div className="font-bold text-[#1F2A33]">{recipe.totals.calories}</div>
            <div className="text-gray-500">kcal</div>
          </div>
          <div className="bg-white rounded p-1">
            <div className="font-bold text-[#1F2A33]">{recipe.totals.protein}g</div>
            <div className="text-gray-500">Protein</div>
          </div>
          <div className="bg-white rounded p-1">
            <div className="font-bold text-[#1F2A33]">{recipe.totals.carbs}g</div>
            <div className="text-gray-500">Carbs</div>
          </div>
          <div className="bg-white rounded p-1">
            <div className="font-bold text-[#1F2A33]">{recipe.totals.fat}g</div>
            <div className="text-gray-500">Fat</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <h4 className="text-xs font-bold text-[#1F2A33] uppercase mb-2">Ingredients</h4>
          <div className="space-y-1 mb-4">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{ing.food}</span>
                <span className="text-gray-500 ml-2 whitespace-nowrap">{ing.grams}g</span>
              </div>
            ))}
          </div>

          <h4 className="text-xs font-bold text-[#1F2A33] uppercase mb-2">Method</h4>
          <ol className="space-y-1 mb-4">
            {recipe.method.map((step, i) => (
              <li key={i} className="text-sm text-gray-700 flex gap-2">
                <span className="text-[#1F7A8C] font-medium">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {showMealPicker ? (
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 mb-2">Add to which meal?</p>
              <div className="grid grid-cols-2 gap-2">
                {sections.map((s) => (
                  <button
                    key={s}
                    onClick={() => addToDay(s)}
                    className="py-2 bg-[#1F7A8C] text-white rounded text-sm font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMealPicker(false)}
                className="w-full mt-2 py-1.5 text-xs text-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowMealPicker(true)}
              className="w-full py-2.5 bg-[#1F7A8C] text-white rounded-lg text-sm font-bold"
            >
              Add to my day
            </button>
          )}
        </div>
      )}
    </div>
  );
}
