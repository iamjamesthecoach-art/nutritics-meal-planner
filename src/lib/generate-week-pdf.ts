"use client";

import jsPDF from "jspdf";
import { AppState, getMealSections } from "@/lib/store";
import { calculateTargets, calculateFoodRow } from "@/lib/calculations";
import { FOOD_BANK, FoodItem } from "@/data/food-bank";

interface ShoppingItem {
  food: string;
  category: string;
  totalGrams: number;
}

export function generateWeekPdf(state: AppState) {
  const calc = calculateTargets(state.targets);
  const allFoods: FoodItem[] = [...FOOD_BANK, ...state.customFoods];

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  const purple = [124, 77, 255] as const;
  const dark = [13, 13, 26] as const;

  // --- Title page ---
  doc.setFillColor(...purple);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Week Meal Plan", margin, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${state.targets.bodyweightKg}kg | ${state.targets.goal} | ${state.targets.trainingDaysPerWeek} training days/wk`, margin, 28);

  let y = 46;

  // Shopping list aggregation
  const shoppingMap = new Map<string, ShoppingItem>();

  // --- Each day ---
  for (const day of state.weekPlan.days) {
    const sections = getMealSections(day.isTrainingDay);
    const targetKcal = day.isTrainingDay ? calc.trainingDayKcal : calc.restDayKcal;

    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    // Day header
    doc.setFillColor(...purple);
    doc.rect(margin, y - 5, pageW - margin * 2, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${day.label}  |  Target: ${targetKcal} kcal`, margin + 3, y);
    y += 10;

    let dayCal = 0, dayCarbs = 0, dayPro = 0, dayFat = 0, dayFibre = 0;

    for (const section of sections) {
      const rows = day.meals[section] || [];

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 4.5, pageW - margin * 2, 7, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...purple);
      doc.text(section.toUpperCase(), margin + 2, y);

      const colX = { food: margin + 2, grams: 100, kcal: 118, carbs: 136, protein: 152, fat: 168, fibre: 180 };
      y += 5;
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text("Food", colX.food, y);
      doc.text("g", colX.grams, y);
      doc.text("kcal", colX.kcal, y);
      doc.text("C", colX.carbs, y);
      doc.text("P", colX.protein, y);
      doc.text("F", colX.fat, y);
      doc.text("Fi", colX.fibre, y);
      y += 4;

      if (rows.length === 0) {
        doc.setTextColor(180, 180, 180);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.text("No foods added", colX.food, y);
        y += 5;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...dark);
        for (const row of rows) {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          const food = allFoods.find((f) => f.id === row.foodId);
          if (!food) continue;
          const g = row.gramsInput === "" ? food.typicalG : Number(row.gramsInput);
          if (isNaN(g) || g <= 0) continue;
          const r = calculateFoodRow(food.calPer100g, food.carbsPer100g, food.proteinPer100g, food.fatPer100g, food.fibrePer100g, g);
          dayCal += r.calories; dayCarbs += r.carbsG; dayPro += r.proteinG; dayFat += r.fatG; dayFibre += r.fibreG;

          // Add to shopping list
          const existing = shoppingMap.get(food.id);
          if (existing) {
            existing.totalGrams += g;
          } else {
            shoppingMap.set(food.id, { food: food.food, category: food.category, totalGrams: g });
          }

          const name = food.food.length > 30 ? food.food.slice(0, 28) + ".." : food.food;
          doc.setFontSize(7);
          doc.text(name, colX.food, y);
          doc.text(String(g), colX.grams, y);
          doc.text(String(r.calories), colX.kcal, y);
          doc.text(String(r.carbsG), colX.carbs, y);
          doc.text(String(r.proteinG), colX.protein, y);
          doc.text(String(r.fatG), colX.fat, y);
          doc.text(String(r.fibreG), colX.fibre, y);
          y += 4;
        }
      }
      y += 2;
    }

    // Day totals row
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    const colX = { food: margin + 2, kcal: 118, carbs: 136, protein: 152, fat: 168, fibre: 180 };
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(`Total: ${Math.round(dayCal)} kcal`, colX.food, y);
    doc.setFontSize(7);
    doc.text(`C ${Math.round(dayCarbs)}g  P ${Math.round(dayPro)}g  F ${Math.round(dayFat)}g  Fi ${Math.round(dayFibre)}g`, colX.kcal, y);

    const diff = Math.round(dayCal) - targetKcal;
    const diffLabel = diff > 0 ? `+${diff}` : String(diff);
    doc.setTextColor(diff > 0 ? 200 : 80, diff > 0 ? 120 : 180, diff > 0 ? 60 : 80);
    doc.text(`(${diffLabel} kcal)`, colX.fat + 10, y);

    y += 10;
  }

  // --- Shopping List ---
  doc.addPage();
  y = 20;

  doc.setFillColor(...purple);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Shopping List", margin, 18);

  y = 40;

  // Group by category
  const shoppingItems = Array.from(shoppingMap.values());
  const categories = Array.from(new Set(shoppingItems.map((i) => i.category))).sort();

  for (const cat of categories) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4.5, pageW - margin * 2, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...purple);
    doc.text(cat.toUpperCase(), margin + 2, y);
    y += 6;

    const items = shoppingItems.filter((i) => i.category === cat).sort((a, b) => a.food.localeCompare(b.food));

    for (const item of items) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...dark);

      const gramsDisplay = item.totalGrams >= 1000
        ? `${(item.totalGrams / 1000).toFixed(1)}kg`
        : `${Math.round(item.totalGrams)}g`;

      doc.text(`☐  ${item.food}`, margin + 2, y);
      doc.text(gramsDisplay, pageW - margin - 15, y);
      y += 5;
    }
    y += 3;
  }

  // Footer
  y += 5;
  if (y > 275) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text("Generated by Forged Metabolism Meal Planner", margin, y);

  doc.save("week-meal-plan.pdf");
}
