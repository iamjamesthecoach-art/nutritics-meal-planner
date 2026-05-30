import { FoodItem } from "@/data/food-bank";

export interface MealFoodRow {
  id: string;
  foodId: string;
  gramsInput: string;
}

export interface DayPlan {
  isTrainingDay: boolean;
  meals: Record<string, MealFoodRow[]>;
  date: string;
}

export interface SavedDay {
  date: string;
  isTrainingDay: boolean;
  meals: Record<string, MealFoodRow[]>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFibre: number;
}

export interface WeekPlanDay {
  label: string;
  isTrainingDay: boolean;
  meals: Record<string, MealFoodRow[]>;
}

export interface WeekPlan {
  days: WeekPlanDay[];
}

export const WEEK_PLAN_LABELS = [
  "Training Day 1",
  "Training Day 2",
  "Rest Day 1",
  "Rest Day 2",
];

export interface CustomRecipe {
  id: string;
  title: string;
  servings: number;
  ingredientRows: { foodId: string; grams: number }[];
  method: string[];
}

export interface AppState {
  targets: {
    bodyweightKg: number;
    activityLevel: string;
    goal: string;
    trainingDaysPerWeek: number;
  };
  preset: "fat-loss" | "muscle-gain";
  currentDay: DayPlan;
  savedDays: SavedDay[];
  customFoods: FoodItem[];
  customRecipes: CustomRecipe[];
  weekPlan: WeekPlan;
  activeWeekDay: number;
}

const STORAGE_KEY = "forged-meal-planner";

const TRAINING_MEALS = ["Pre-Workout", "Breakfast", "Lunch", "Snack", "Dinner"];
const REST_MEALS = ["Breakfast", "Lunch", "Snack", "Dinner"];

export function getMealSections(isTrainingDay: boolean): string[] {
  return isTrainingDay ? TRAINING_MEALS : REST_MEALS;
}

function createEmptyMeals(isTrainingDay: boolean): Record<string, MealFoodRow[]> {
  const sections = getMealSections(isTrainingDay);
  const meals: Record<string, MealFoodRow[]> = {};
  for (const section of sections) {
    meals[section] = [];
  }
  return meals;
}

export function createEmptyWeekPlan(): WeekPlan {
  return {
    days: WEEK_PLAN_LABELS.map((label) => ({
      label,
      isTrainingDay: label.startsWith("Training"),
      meals: createEmptyMeals(label.startsWith("Training")),
    })),
  };
}

export function getDefaultState(): AppState {
  return {
    targets: {
      bodyweightKg: 80,
      activityLevel: "Moderately active",
      goal: "Moderate cut",
      trainingDaysPerWeek: 4,
    },
    preset: "fat-loss",
    currentDay: {
      isTrainingDay: true,
      meals: createEmptyMeals(true),
      date: new Date().toISOString().split("T")[0],
    },
    savedDays: [],
    customFoods: [],
    customRecipes: [],
    weekPlan: createEmptyWeekPlan(),
    activeWeekDay: 0,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.currentDay.meals || Object.keys(parsed.currentDay.meals).length === 0) {
      parsed.currentDay.meals = createEmptyMeals(parsed.currentDay.isTrainingDay);
    }
    if (!parsed.weekPlan) {
      parsed.weekPlan = createEmptyWeekPlan();
    }
    if (!parsed.customRecipes) {
      parsed.customRecipes = [];
    }
    if (parsed.activeWeekDay === undefined) {
      parsed.activeWeekDay = 0;
    }
    return parsed;
  } catch {
    return getDefaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function switchDayType(state: AppState, isTrainingDay: boolean): AppState {
  const newMeals = createEmptyMeals(isTrainingDay);
  const oldMeals = state.currentDay.meals;

  for (const key of Object.keys(newMeals)) {
    if (oldMeals[key]) {
      newMeals[key] = oldMeals[key];
    }
  }

  return {
    ...state,
    currentDay: {
      ...state.currentDay,
      isTrainingDay,
      meals: newMeals,
    },
  };
}

export function resetDay(state: AppState): AppState {
  return {
    ...state,
    currentDay: {
      isTrainingDay: state.currentDay.isTrainingDay,
      meals: createEmptyMeals(state.currentDay.isTrainingDay),
      date: new Date().toISOString().split("T")[0],
    },
  };
}
