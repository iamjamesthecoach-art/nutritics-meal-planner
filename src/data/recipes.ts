export interface RecipeIngredient {
  food: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface Recipe {
  id: string;
  title: string;
  source: string;
  servings: number;
  ingredients: RecipeIngredient[];
  method: string[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre: number;
  };
}

export const RECIPES: Recipe[] = [
  {
    id: "high-protein-chicken-stir-fry",
    title: "High-Protein Chicken Stir-Fry",
    source: "Forged Performance",
    servings: 1,
    ingredients: [
      { food: "Chicken, light meat, raw", grams: 200, calories: 212, protein: 48.2, carbs: 0, fat: 2.2, fibre: 0 },
      { food: "Rice, white, basmati, raw", grams: 80, calories: 273, protein: 6.5, carbs: 61.0, fat: 0.4, fibre: 0.9 },
      { food: "Peppers, bell, raw, mixed", grams: 110, calories: 29, protein: 1.1, carbs: 5.3, fat: 0.3, fibre: 2.2 },
      { food: "Broccoli, green, steamed", grams: 85, calories: 29, protein: 3.5, carbs: 2.8, fat: 0.4, fibre: 3.2 },
      { food: "Soy sauce, reduced salt/sodium", grams: 18, calories: 8, protein: 0.5, carbs: 1.4, fat: 0, fibre: 0 },
      { food: "Oil, sesame", grams: 4, calories: 36, protein: 0, carbs: 0, fat: 4.0, fibre: 0 },
      { food: "Garlic, raw", grams: 2, calories: 2, protein: 0.2, carbs: 0.3, fat: 0, fibre: 0.1 },
      { food: "Ginger, fresh", grams: 3, calories: 1, protein: 0.1, carbs: 0.2, fat: 0, fibre: 0.1 },
    ],
    method: [
      "Cook basmati rice according to packet instructions.",
      "Dice chicken breast into bite-sized pieces.",
      "Heat sesame oil in a wok or large frying pan over high heat.",
      "Stir-fry chicken for 5-6 minutes until cooked through.",
      "Add sliced peppers, broccoli, minced garlic and grated ginger.",
      "Stir-fry for 3-4 minutes until veg is tender-crisp.",
      "Add soy sauce, toss to coat.",
      "Serve over the cooked rice.",
    ],
    totals: { calories: 590, protein: 60.1, carbs: 71.0, fat: 7.3, fibre: 6.5 },
  },
  {
    id: "overnight-protein-oats",
    title: "Overnight Protein Oats",
    source: "Forged Performance",
    servings: 1,
    ingredients: [
      { food: "Porridge oats, unfortified", grams: 60, calories: 224, protein: 6.5, carbs: 38.6, fat: 4.9, fibre: 4.7 },
      { food: "Whey protein isolate powder", grams: 30, calories: 114, protein: 27.0, carbs: 0.4, fat: 0.5, fibre: 0 },
      { food: "Milk, semi-skimmed, pasteurised, average", grams: 200, calories: 94, protein: 7.0, carbs: 9.0, fat: 3.4, fibre: 0 },
      { food: "Blueberries", grams: 80, calories: 34, protein: 0.7, carbs: 7.3, fat: 0.2, fibre: 1.2 },
      { food: "Chia seeds", grams: 10, calories: 38, protein: 1.8, carbs: 0.8, fat: 3.0, fibre: 3.9 },
      { food: "Honey, raw", grams: 7, calories: 22, protein: 0, carbs: 5.6, fat: 0, fibre: 0 },
    ],
    method: [
      "Combine oats, protein powder and chia seeds in a jar or bowl.",
      "Pour over the milk and stir well.",
      "Cover and refrigerate overnight (or at least 4 hours).",
      "Top with blueberries and drizzle with honey before serving.",
      "Can be eaten cold or microwaved for 2 minutes.",
    ],
    totals: { calories: 526, protein: 43.0, carbs: 61.7, fat: 12.0, fibre: 9.8 },
  },
  {
    id: "turkey-mince-chilli",
    title: "Turkey Mince Chilli",
    source: "Forged Performance",
    servings: 2,
    ingredients: [
      { food: "Turkey mince, raw 2% fat", grams: 300, calories: 342, protein: 71.7, carbs: 0, fat: 6.0, fibre: 0 },
      { food: "Black beans, canned, drained", grams: 120, calories: 108, protein: 9.8, carbs: 15.2, fat: 0.8, fibre: 10.6 },
      { food: "Tomatoes, canned, whole contents", grams: 400, calories: 80, protein: 4.4, carbs: 15.2, fat: 0.4, fibre: 3.2 },
      { food: "Onions, raw", grams: 120, calories: 43, protein: 1.2, carbs: 9.2, fat: 0.1, fibre: 2.6 },
      { food: "Pepper, capsicum, red, raw", grams: 160, calories: 35, protein: 1.3, carbs: 6.7, fat: 0.3, fibre: 3.5 },
      { food: "Garlic, raw", grams: 6, calories: 6, protein: 0.5, carbs: 0.9, fat: 0, fibre: 0.2 },
      { food: "Chilli powder", grams: 3, calories: 6, protein: 0.4, carbs: 0.2, fat: 0.4, fibre: 1.0 },
      { food: "Paprika", grams: 3, calories: 6, protein: 0.4, carbs: 0.3, fat: 0.4, fibre: 1.0 },
      { food: "Tomato puree", grams: 18, calories: 13, protein: 0.8, carbs: 2.3, fat: 0, fibre: 0.8 },
    ],
    method: [
      "Brown the turkey mince in a large saucepan over medium-high heat.",
      "Add diced onion, red pepper and garlic. Cook for 3-4 minutes.",
      "Stir in chilli powder, paprika and tomato puree. Cook for 1 minute.",
      "Add canned tomatoes and drained black beans.",
      "Bring to a simmer, reduce heat and cook for 20-25 minutes.",
      "Season with salt and pepper to taste.",
      "Serve with rice or in a tortilla wrap.",
    ],
    totals: { calories: 639, protein: 90.5, carbs: 50.0, fat: 8.4, fibre: 22.9 },
  },
  {
    id: "salmon-sweet-potato-bowl",
    title: "Salmon & Sweet Potato Bowl",
    source: "Forged Performance",
    servings: 1,
    ingredients: [
      { food: "Salmon, farmed, flesh only, raw", grams: 180, calories: 391, protein: 36.7, carbs: 0, fat: 27.0, fibre: 0.4 },
      { food: "Sweet potato, raw, flesh only", grams: 200, calories: 172, protein: 2.4, carbs: 39.2, fat: 0.6, fibre: 5.0 },
      { food: "Asparagus, raw", grams: 84, calories: 21, protein: 2.4, carbs: 1.7, fat: 0.5, fibre: 1.4 },
      { food: "Spinach, baby, raw", grams: 40, calories: 6, protein: 1.0, carbs: 0.1, fat: 0.2, fibre: 0.4 },
      { food: "Lemon juice, fresh", grams: 10, calories: 1, protein: 0, carbs: 0.2, fat: 0, fibre: 0 },
      { food: "Oil, olive", grams: 4, calories: 36, protein: 0, carbs: 0, fat: 4.0, fibre: 0 },
    ],
    method: [
      "Peel and dice sweet potato into 2cm cubes. Roast at 200C for 25 minutes.",
      "Season salmon fillet with salt, pepper and lemon juice.",
      "Pan-fry salmon skin-side down for 4 minutes, flip and cook 3 more minutes.",
      "Blanch or steam asparagus for 3 minutes until tender-crisp.",
      "Build bowl: bed of baby spinach, roasted sweet potato, asparagus and salmon.",
      "Drizzle with olive oil and a squeeze of lemon.",
    ],
    totals: { calories: 627, protein: 42.5, carbs: 41.2, fat: 32.3, fibre: 7.2 },
  },
  {
    id: "egg-and-toast-stack",
    title: "Egg & Toast Stack",
    source: "Forged Performance",
    servings: 1,
    ingredients: [
      { food: "Eggs, chicken, whole, raw", grams: 171, calories: 226, protein: 21.5, carbs: 0, fat: 15.4, fibre: 0 },
      { food: "Jason's White Ciabatta Sourdough", grams: 110, calories: 246, protein: 11.1, carbs: 49.0, fat: 0.9, fibre: 3.2 },
      { food: "Avocado, Hass, flesh only", grams: 35, calories: 60, protein: 0.7, carbs: 0.6, fat: 6.1, fibre: 1.1 },
      { food: "Tomatoes, standard, raw", grams: 43, calories: 6, protein: 0.2, carbs: 1.3, fat: 0, fibre: 0.4 },
      { food: "Spinach, baby, raw", grams: 20, calories: 3, protein: 0.5, carbs: 0, fat: 0.1, fibre: 0.2 },
      { food: "Sea Salt", grams: 1, calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 },
      { food: "Pepper, black", grams: 1, calories: 1, protein: 0.1, carbs: 0, fat: 0, fibre: 0.3 },
    ],
    method: [
      "Toast the ciabatta sourdough slices until golden.",
      "Fry or poach 3 eggs to your liking.",
      "Mash avocado with a fork and spread on toast.",
      "Layer baby spinach and sliced tomato on the toast.",
      "Top with eggs, season with salt and pepper.",
    ],
    totals: { calories: 542, protein: 34.1, carbs: 50.9, fat: 22.5, fibre: 5.2 },
  },
];
