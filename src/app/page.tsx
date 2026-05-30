"use client";

import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import BottomNav, { TabId } from "@/components/BottomNav";
import DashboardScreen from "@/components/DashboardScreen";
import DayBuilderScreen from "@/components/DayBuilderScreen";
import FoodBankScreen from "@/components/FoodBankScreen";
import RecipesScreen from "@/components/RecipesScreen";
import MeScreen from "@/components/MeScreen";
import WeekPlannerScreen from "@/components/WeekPlannerScreen";

export default function Home() {
  const { state, update, loaded } = useAppState();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a1a]">
        <div className="text-center">
          <div className="text-xl font-bold tracking-wide">
            <span className="text-[#C9A84C]">FORGED</span>{" "}
            <span className="text-white">METABOLISM</span>
          </div>
          <div className="text-sm text-[#4a4a6a] mt-2">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      {activeTab === "dashboard" && (
        <DashboardScreen state={state} update={update} onNavigate={setActiveTab} />
      )}
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
