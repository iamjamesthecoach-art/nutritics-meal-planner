"use client";

import jsPDF from "jspdf";
import { AppState, getMealSections } from "@/lib/store";
import { calculateTargets, calculateFoodRow } from "@/lib/calculations";
import { FOOD_BANK, FoodItem } from "@/data/food-bank";

export function generateDayPdf(state: AppState) {
  const calc = calculateTargets(state.targets);
  const allFoods: FoodItem[] = [...FOOD_BANK, ...state.customFoods];
  const sections = getMealSections(state.currentDay.isTrainingDay);
  const dayType = state.currentDay.isTrainingDay ? "Training Day" : "Rest Day";
  const targetKcal = state.currentDay.isTrainingDay
    ? calc.trainingDayKcal
    : calc.restDayKcal;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 20;

  const teal = [31, 122, 140] as const;
  const dark = [31, 42, 51] as const;

  doc.setFillColor(...teal);
  doc.rect(0, 0, pageW, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Meal Plan", margin, 16);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${dayType}  |  ${state.currentDay.date}  |  Target: ${targetKcal} kcal`, margin, 28);

  y = 46;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text(`${state.targets.bodyweightKg} kg  |  ${state.targets.activityLevel}  |  ${state.targets.goal}  |  ${state.targets.trainingDaysPerWeek} training days/wk`, margin, y);
  y += 10;

  let totalCal = 0, totalCarbs = 0, totalPro = 0, totalFat = 0, totalFibre = 0;

  for (const section of sections) {
    const rows = state.currentDay.meals[section] || [];

    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4.5, pageW - margin * 2, 7, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...teal);
    doc.text(section.toUpperCase(), margin + 2, y);

    const colX = { food: margin + 2, grams: 100, kcal: 118, carbs: 136, protein: 152, fat: 168, fibre: 180 };
    y += 6;
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text("Food", colX.food, y);
    doc.text("g", colX.grams, y);
    doc.text("kcal", colX.kcal, y);
    doc.text("C (g)", colX.carbs, y);
    doc.text("P (g)", colX.protein, y);
    doc.text("F (g)", colX.fat, y);
    doc.text("Fi (g)", colX.fibre, y);
    y += 5;

    if (rows.length === 0) {
      doc.setTextColor(180, 180, 180);
      doc.setFont("helvetica", "italic");
      doc.text("No foods added", colX.food, y);
      y += 6;
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
        totalCal += r.calories; totalCarbs += r.carbsG; totalPro += r.proteinG; totalFat += r.fatG; totalFibre += r.fibreG;

        const name = food.food.length > 35 ? food.food.slice(0, 33) + ".." : food.food;
        doc.setFontSize(8);
        doc.text(name, colX.food, y);
        doc.text(String(g), colX.grams, y);
        doc.text(String(r.calories), colX.kcal, y);
        doc.text(String(r.carbsG), colX.carbs, y);
        doc.text(String(r.proteinG), colX.protein, y);
        doc.text(String(r.fatG), colX.fat, y);
        doc.text(String(r.fibreG), colX.fibre, y);
        y += 5;
      }
    }
    y += 4;
  }

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  y += 2;
  doc.setDrawColor(...teal);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 7;

  doc.setFillColor(...teal);
  doc.rect(margin, y - 5, pageW - margin * 2, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const colX = { food: margin + 2, grams: 100, kcal: 118, carbs: 136, protein: 152, fat: 168, fibre: 180 };
  doc.text("DAY TOTAL", colX.food, y);
  doc.text(String(Math.round(totalCal)), colX.kcal, y);
  doc.text(String(Math.round(totalCarbs * 10) / 10), colX.carbs, y);
  doc.text(String(Math.round(totalPro * 10) / 10), colX.protein, y);
  doc.text(String(Math.round(totalFat * 10) / 10), colX.fat, y);
  doc.text(String(Math.round(totalFibre * 10) / 10), colX.fibre, y);

  y += 10;
  doc.setTextColor(...dark);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`TARGET: ${targetKcal} kcal`, margin + 2, y);
  const diff = Math.round(totalCal) - targetKcal;
  const diffLabel = diff > 0 ? `+${diff}` : String(diff);
  doc.text(`DIFFERENCE: ${diffLabel} kcal`, margin + 60, y);

  y += 12;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text("Generated by Forged Metabolism Meal Planner", margin, y);

  doc.save(`meal-plan-${state.currentDay.date}.pdf`);
}
