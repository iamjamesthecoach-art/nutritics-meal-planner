export const ACTIVITY_LEVELS = [
  { label: "Sedentary", kcalPerKg: 24 },
  { label: "Lightly active", kcalPerKg: 26 },
  { label: "Moderately active", kcalPerKg: 28 },
  { label: "Very active", kcalPerKg: 31 },
  { label: "Athlete", kcalPerKg: 34 },
] as const;

export const GOALS = [
  { label: "Aggressive cut", adjustment: -0.25 },
  { label: "Moderate cut", adjustment: -0.15 },
  { label: "Maintain", adjustment: 0.0 },
  { label: "Lean gain", adjustment: 0.1 },
] as const;

export const PROTEIN_G_PER_KG = 2.0;
export const FAT_G_PER_KG = 0.5;
export const FIBRE_G_MIN = 30;
export const TRAINING_CARB_BOOST = 0.15; // training day gets 15% more carbs than rest day

export interface Targets {
  bodyweightKg: number;
  activityLevel: string;
  goal: string;
  trainingDaysPerWeek: number;
}

export interface CalculatedTargets {
  maintenance: number;
  targetAvg: number;
  proteinG: number;
  fatG: number;
  avgCarbsG: number;
  restCarbsG: number;
  trainingCarbsG: number;
  trainingDayKcal: number;
  restDayKcal: number;
  weeklyAvg: number;
  dailyBalance: number;
  weeklyBalance: number;
  estWeeklyWtChangeKg: number;
  status: "Deficit (fat loss)" | "Around maintenance" | "Surplus (gain)";
  fibreGMin: number;
}

export function calculateTargets(targets: Targets): CalculatedTargets {
  const activity = ACTIVITY_LEVELS.find((a) => a.label === targets.activityLevel);
  const goalObj = GOALS.find((g) => g.label === targets.goal);

  const kcalPerKg = activity?.kcalPerKg ?? 28;
  const goalAdj = goalObj?.adjustment ?? -0.15;

  const maintenance = targets.bodyweightKg * kcalPerKg;
  const targetAvg = maintenance * (1 + goalAdj);

  const proteinG = targets.bodyweightKg * PROTEIN_G_PER_KG;
  const fatG = targets.bodyweightKg * FAT_G_PER_KG;

  const avgCarbsG = Math.max(0, (targetAvg - proteinG * 4 - fatG * 9) / 4);

  const trainingDays = targets.trainingDaysPerWeek;
  const restDays = 7 - trainingDays;

  // Training day gets TRAINING_CARB_BOOST% more carbs than rest day.
  // Solve: T = R * (1 + boost), trainingDays*T + restDays*R = 7*avgCarbsG
  // → R = 7*avg / (trainingDays*(1+boost) + restDays)
  // When all 7 days are training, T = avgCarbsG (no boost needed).
  let restCarbsG: number;
  let trainingCarbsG: number;
  if (restDays === 0) {
    restCarbsG = avgCarbsG;
    trainingCarbsG = avgCarbsG;
  } else {
    restCarbsG = (7 * avgCarbsG) / (trainingDays * (1 + TRAINING_CARB_BOOST) + restDays);
    trainingCarbsG = restCarbsG * (1 + TRAINING_CARB_BOOST);
  }

  const trainingDayKcal = proteinG * 4 + trainingCarbsG * 4 + fatG * 9;
  const restDayKcal = proteinG * 4 + restCarbsG * 4 + fatG * 9;

  const weeklyAvg =
    (trainingDays * trainingDayKcal + (7 - trainingDays) * restDayKcal) / 7;
  const dailyBalance = weeklyAvg - maintenance;
  const weeklyBalance = dailyBalance * 7;
  const estWeeklyWtChangeKg = weeklyBalance / 7700;

  let status: CalculatedTargets["status"];
  if (Math.abs(dailyBalance) < 50) {
    status = "Around maintenance";
  } else if (dailyBalance < 0) {
    status = "Deficit (fat loss)";
  } else {
    status = "Surplus (gain)";
  }

  return {
    maintenance: Math.round(maintenance),
    targetAvg: Math.round(targetAvg),
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    avgCarbsG: Math.round(avgCarbsG * 10) / 10,
    restCarbsG: Math.round(restCarbsG * 10) / 10,
    trainingCarbsG: Math.round(trainingCarbsG * 10) / 10,
    trainingDayKcal: Math.round(trainingDayKcal),
    restDayKcal: Math.round(restDayKcal),
    weeklyAvg: Math.round(weeklyAvg * 10) / 10,
    dailyBalance: Math.round(dailyBalance),
    weeklyBalance: Math.round(weeklyBalance),
    estWeeklyWtChangeKg: Math.round(estWeeklyWtChangeKg * 100) / 100,
    status,
    fibreGMin: FIBRE_G_MIN,
  };
}

export interface FoodRowCalc {
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  fibreG: number;
}

export function calculateFoodRow(
  calPer100g: number,
  carbsPer100g: number,
  proteinPer100g: number,
  fatPer100g: number,
  fibrePer100g: number,
  gramsUsed: number
): FoodRowCalc {
  return {
    calories: Math.round((calPer100g * gramsUsed) / 100),
    carbsG: Math.round(((carbsPer100g * gramsUsed) / 100) * 10) / 10,
    proteinG: Math.round(((proteinPer100g * gramsUsed) / 100) * 10) / 10,
    fatG: Math.round(((fatPer100g * gramsUsed) / 100) * 10) / 10,
    fibreG: Math.round(((fibrePer100g * gramsUsed) / 100) * 10) / 10,
  };
}
