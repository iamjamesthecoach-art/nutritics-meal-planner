"use client";

import { useState, useMemo } from "react";
import { RECIPES, Recipe } from "@/data/recipes";
import { AppState, getMealSections, generateId, CustomRecipe } from "@/lib/store";
import { FOOD_BANK, FoodItem } from "@/data/food-bank";
import { calculateFoodRow } from "@/lib/calculations";
import { TabId } from "./BottomNav";
import RecipeCreatorScreen from "./RecipeCreatorScreen";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
  onNavigate: (tab: TabId) => void;
}

function customRecipeToDisplay(
  recipe: CustomRecipe,
  allFoods: FoodItem[]
): Recipe {
  const ingredients = recipe.ingredientRows
    .map((row) => {
      const food = allFoods.find((f) => f.id === row.foodId);
      if (!food) return null;
      const r = calculateFoodRow(
        food.calPer100g,
        food.carbsPer100g,
        food.proteinPer100g,
        food.fatPer100g,
        food.fibrePer100g,
        row.grams
      );
      return {
        food: food.food,
        grams: row.grams,
        calories: r.calories,
        protein: r.proteinG,
        carbs: r.carbsG,
        fat: r.fatG,
        fibre: r.fibreG,
      };
    })
    .filter(Boolean) as Recipe["ingredients"];

  const s = recipe.servings || 1;
  const totals = {
    calories: Math.round(
      ingredients.reduce((a, i) => a + i.calories, 0) / s
    ),
    protein:
      Math.round(
        (ingredients.reduce((a, i) => a + i.protein, 0) / s) * 10
      ) / 10,
    carbs:
      Math.round(
        (ingredients.reduce((a, i) => a + i.carbs, 0) / s) * 10
      ) / 10,
    fat:
      Math.round(
        (ingredients.reduce((a, i) => a + i.fat, 0) / s) * 10
      ) / 10,
    fibre:
      Math.round(
        (ingredients.reduce((a, i) => a + i.fibre, 0) / s) * 10
      ) / 10,
  };

  return {
    id: recipe.id,
    title: recipe.title,
    source: "My Recipe",
    servings: recipe.servings,
    ingredients,
    method: recipe.method,
    totals,
  };
}

export default function RecipesScreen({ state, update, onNavigate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<CustomRecipe | undefined>(
    undefined
  );
  const [activeFilter, setActiveFilter] = useState<"all" | "forged" | "mine">(
    "all"
  );

  const allFoods = useMemo(
    () => [...FOOD_BANK, ...state.customFoods],
    [state.customFoods]
  );

  const customDisplayRecipes = useMemo(
    () =>
      (state.customRecipes || []).map((r) =>
        customRecipeToDisplay(r, allFoods)
      ),
    [state.customRecipes, allFoods]
  );

  const allRecipes = useMemo(() => {
    if (activeFilter === "forged") return RECIPES;
    if (activeFilter === "mine") return customDisplayRecipes;
    return [...RECIPES, ...customDisplayRecipes];
  }, [activeFilter, customDisplayRecipes]);

  const customRecipeIds = new Set(
    (state.customRecipes || []).map((r) => r.id)
  );

  const deleteCustomRecipe = (id: string) => {
    update((prev) => ({
      ...prev,
      customRecipes: (prev.customRecipes || []).filter((r) => r.id !== id),
    }));
    setExpandedId(null);
  };

  const editCustomRecipe = (id: string) => {
    const recipe = (state.customRecipes || []).find((r) => r.id === id);
    if (recipe) {
      setEditingRecipe(recipe);
      setShowCreator(true);
    }
  };

  if (showCreator) {
    return (
      <RecipeCreatorScreen
        state={state}
        update={update}
        onClose={() => {
          setShowCreator(false);
          setEditingRecipe(undefined);
        }}
        editRecipe={editingRecipe}
      />
    );
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold text-white">Recipes</h1>
        <button
          onClick={() => {
            setEditingRecipe(undefined);
            setShowCreator(true);
          }}
          className="px-3 py-1.5 bg-gradient-to-r from-[#C9A84C] to-[#A8893E] text-white rounded-lg text-xs font-medium"
        >
          + Create
        </button>
      </div>
      <p className="text-sm text-[#9090b0] mb-4">
        {allRecipes.length} recipes. Tap to expand, then add to your day.
      </p>

      {/* Filter tabs */}
      {(state.customRecipes || []).length > 0 && (
        <div className="flex gap-2 mb-4">
          {(
            [
              { key: "all", label: "All" },
              { key: "forged", label: "Forged" },
              { key: "mine", label: "My Recipes" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-[#C9A84C] text-white"
                  : "bg-[#161633] text-[#9090b0]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {allRecipes.map((recipe) => (
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
            isCustom={customRecipeIds.has(recipe.id)}
            onEdit={() => editCustomRecipe(recipe.id)}
            onDelete={() => deleteCustomRecipe(recipe.id)}
          />
        ))}
        {allRecipes.length === 0 && (
          <div className="text-center text-sm text-[#6a6a8a] py-8">
            No recipes yet. Tap + Create to make your first.
          </div>
        )}
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
  isCustom,
  onEdit,
  onDelete,
}: {
  recipe: Recipe;
  expanded: boolean;
  onToggle: () => void;
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
  onNavigate: (tab: TabId) => void;
  isCustom: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const addToDay = (mealSection: string) => {
    const allFoods = [...FOOD_BANK, ...state.customFoods];

    update((prev) => {
      const currentRows = prev.currentDay.meals[mealSection] || [];
      const newRows = recipe.ingredients
        .map((ing) => {
          const matchedFood = allFoods.find(
            (f) =>
              f.food.toLowerCase() === ing.food.toLowerCase() ||
              f.food
                .toLowerCase()
                .includes(ing.food.toLowerCase().split(",")[0])
          );
          return {
            id: generateId(),
            foodId: matchedFood?.id || "",
            gramsInput: String(ing.grams),
          };
        })
        .filter((r) => r.foodId !== "");

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
    <div className="bg-[#111127] rounded-xl overflow-hidden border border-[#1e1e3a]">
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-white">{recipe.title}</h3>
            <p className="text-xs text-[#6a6a8a]">
              {recipe.source}
              {recipe.servings > 1 && ` · ${recipe.servings} servings`}
            </p>
          </div>
          <span className="text-[#6a6a8a] text-lg">
            {expanded ? "-" : "+"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-center">
          <div className="bg-[#161633] rounded p-1">
            <div className="font-bold text-white">{recipe.totals.calories}</div>
            <div className="text-[#6a6a8a]">kcal</div>
          </div>
          <div className="bg-[#161633] rounded p-1">
            <div className="font-bold text-white">{recipe.totals.protein}g</div>
            <div className="text-[#6a6a8a]">Protein</div>
          </div>
          <div className="bg-[#161633] rounded p-1">
            <div className="font-bold text-white">{recipe.totals.carbs}g</div>
            <div className="text-[#6a6a8a]">Carbs</div>
          </div>
          <div className="bg-[#161633] rounded p-1">
            <div className="font-bold text-white">{recipe.totals.fat}g</div>
            <div className="text-[#6a6a8a]">Fat</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <h4 className="text-xs font-bold text-[#C9A84C] uppercase mb-2">
            Ingredients
          </h4>
          <div className="space-y-1 mb-4">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#c0c0d8]">{ing.food}</span>
                <span className="text-[#6a6a8a] ml-2 whitespace-nowrap">
                  {ing.grams}g
                </span>
              </div>
            ))}
          </div>

          {recipe.method.length > 0 && (
            <>
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase mb-2">
                Method
              </h4>
              <ol className="space-y-1 mb-4">
                {recipe.method.map((step, i) => (
                  <li
                    key={i}
                    className="text-sm text-[#c0c0d8] flex gap-2"
                  >
                    <span className="text-[#C9A84C] font-medium">
                      {i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {showMealPicker ? (
            <div className="bg-[#161633] rounded-lg border border-[#2a2a4a] p-3">
              <p className="text-xs text-[#6a6a8a] mb-2">
                Add to which meal?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {sections.map((s) => (
                  <button
                    key={s}
                    onClick={() => addToDay(s)}
                    className="py-2 bg-gradient-to-r from-[#C9A84C] to-[#A8893E] text-white rounded text-sm font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMealPicker(false)}
                className="w-full mt-2 py-1.5 text-xs text-[#6a6a8a]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setShowMealPicker(true)}
                className="w-full py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#A8893E] text-white rounded-lg text-sm font-bold"
              >
                Add to my day
              </button>
              {isCustom && (
                <div className="flex gap-2">
                  <button
                    onClick={onEdit}
                    className="flex-1 py-2 bg-[#161633] text-[#C9A84C] rounded-lg text-sm font-medium border border-[#2a2a4a]"
                  >
                    Edit
                  </button>
                  {showDeleteConfirm ? (
                    <button
                      onClick={onDelete}
                      className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium border border-red-500/30"
                    >
                      Confirm Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex-1 py-2 bg-[#161633] text-red-400 rounded-lg text-sm font-medium border border-[#2a2a4a]"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
