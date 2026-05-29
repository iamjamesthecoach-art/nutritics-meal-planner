"use client";

import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import BottomNav, { TabId } from "@/components/BottomNav";
import TargetsScreen from "@/components/TargetsScreen";
import DayBuilderScreen from "@/components/DayBuilderScreen";
import FoodBankScreen from "@/components/FoodBankScreen";
import RecipesScreen from "@/components/RecipesScreen";
import MeScreen from "@/components/MeScreen";
import WeekPlannerScreen from "@/components/WeekPlannerScreen";

export default function Home() {
  const { state, update, loaded } = useAppState();
  const [activeTab, setActiveTab] = useState<TabId>("targets");

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-bold text-white">Forged Metabolism</div>
          <div className="text-sm text-[#9090b0] mt-1">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D0D1A]">
      {activeTab === "targets" && <TargetsScreen state={state} update={update} />}
      {activeTab === "day" && <DayBuilderScreen state={state} update={update} />}
      {activeTab === "week" && <WeekPlannerScreen state={state} update={update} />}
      {activeTab === "foods" && <FoodBankScreen state={state} update={update} />}
      {activeTab === "recipes" && (
        <RecipesScreen state={state} update={update} onNavigate={setActiveTab} />
      )}
      {activeTab === "me" && <MeScreen state={state} update={update} />}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </main>
  );
}
