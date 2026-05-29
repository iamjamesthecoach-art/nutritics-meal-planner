"use client";

import { useState, useMemo } from "react";
import { AppState, generateId } from "@/lib/store";
import { FOOD_BANK, FoodItem } from "@/data/food-bank";

interface Props {
  state: AppState;
  update: (updater: (prev: AppState) => AppState) => void;
}

const CATEGORIES = [
  "All",
  "Protein",
  "Carbohydrate",
  "Fat",
  "Vegetable",
  "Fruit",
  "Snack",
  "Free / Condiment",
];

export default function FoodBankScreen({ state, update }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);

  const allFoods = useMemo(
    () => [...FOOD_BANK, ...state.customFoods],
    [state.customFoods]
  );

  const filtered = useMemo(() => {
    let list = allFoods;
    if (category !== "All") {
      list = list.filter((f) => f.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.food.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allFoods, search, category]);

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Food Bank</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-gradient-to-r from-[#7C4DFF] to-[#6C3FC5] text-white rounded-lg text-sm font-medium"
          >
            + Custom Food
          </button>
        </div>

        {showAddForm && (
          <AddCustomFoodForm
            onAdd={(food) => {
              update((prev) => ({
                ...prev,
                customFoods: [...prev.customFoods, food],
              }));
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        <input
          type="text"
          placeholder="Search foods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-[#3a3a5c] rounded-lg px-4 py-3 text-sm text-white bg-[#1a1a2e] mb-3 focus:outline-none focus:ring-2 focus:ring-[#7C4DFF] placeholder-[#6a6a8a]"
        />

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium ${
                category === cat
                  ? "bg-gradient-to-r from-[#7C4DFF] to-[#6C3FC5] text-white"
                  : "bg-[#252547] text-[#9090b0]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#6a6a8a] mb-3">
          {filtered.length} food{filtered.length !== 1 ? "s" : ""} | values per 100g
        </p>

        <div className="space-y-2">
          {filtered.map((food) => (
            <div
              key={food.id}
              className="bg-[#1a1a2e] rounded-lg p-3 border border-[#2a2a4a]"
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-xs text-[#7C4DFF] font-medium">
                    {food.category}
                    {food.isCustom && " (custom)"}
                  </span>
                  <div className="text-sm font-medium text-white">{food.food}</div>
                </div>
              </div>
              <div className="text-xs text-[#6a6a8a] mb-2">
                {food.typicalPortion || "No typical portion"} ({food.typicalG}g)
              </div>
              <div className="grid grid-cols-5 text-xs text-center text-[#9090b0]">
                <div>
                  <span className="font-medium text-white">{food.calPer100g}</span>
                  <br />kcal
                </div>
                <div>
                  <span className="font-medium text-white">{food.carbsPer100g}</span>g
                  <br />Carbs
                </div>
                <div>
                  <span className="font-medium text-white">{food.proteinPer100g}</span>g
                  <br />Protein
                </div>
                <div>
                  <span className="font-medium text-white">{food.fatPer100g}</span>g
                  <br />Fat
                </div>
                <div>
                  <span className="font-medium text-white">{food.fibrePer100g}</span>g
                  <br />Fibre
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddCustomFoodForm({
  onAdd,
  onCancel,
}: {
  onAdd: (food: FoodItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [cat, setCat] = useState("Protein");
  const [typicalG, setTypicalG] = useState("100");
  const [cal, setCal] = useState("");
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [fibre, setFibre] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !cal) return;
    onAdd({
      id: `custom-${generateId()}`,
      category: cat,
      food: name.trim(),
      typicalPortion: "",
      typicalG: Number(typicalG) || 100,
      calPer100g: Number(cal) || 0,
      carbsPer100g: Number(carbs) || 0,
      proteinPer100g: Number(protein) || 0,
      fatPer100g: Number(fat) || 0,
      fibrePer100g: Number(fibre) || 0,
      isCustom: true,
    });
  };

  return (
    <div className="bg-[#1a1a2e] rounded-xl p-4 mb-4 border border-[#3a3a5c]">
      <h3 className="text-sm font-bold text-white mb-3">Add Custom Food</h3>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Food name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] placeholder-[#6a6a8a]"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="w-full border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white bg-[#252547]"
        >
          {CATEGORIES.filter((c) => c !== "All").map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" inputMode="numeric" placeholder="Typical g" value={typicalG} onChange={(e) => setTypicalG(e.target.value)} className="border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] placeholder-[#6a6a8a]" />
          <input type="number" inputMode="decimal" placeholder="Cal/100g" value={cal} onChange={(e) => setCal(e.target.value)} className="border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] placeholder-[#6a6a8a]" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input type="number" inputMode="decimal" placeholder="Carbs" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] placeholder-[#6a6a8a]" />
          <input type="number" inputMode="decimal" placeholder="Protein" value={protein} onChange={(e) => setProtein(e.target.value)} className="border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] placeholder-[#6a6a8a]" />
          <input type="number" inputMode="decimal" placeholder="Fat" value={fat} onChange={(e) => setFat(e.target.value)} className="border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] placeholder-[#6a6a8a]" />
          <input type="number" inputMode="decimal" placeholder="Fibre" value={fibre} onChange={(e) => setFibre(e.target.value)} className="border border-[#3a3a5c] rounded px-3 py-2 text-sm text-white bg-[#252547] focus:outline-none focus:ring-1 focus:ring-[#7C4DFF] placeholder-[#6a6a8a]" />
        </div>
        <p className="text-xs text-[#6a6a8a]">All values per 100g</p>
        <div className="flex gap-2">
          <button onClick={handleSubmit} className="flex-1 py-2 bg-gradient-to-r from-[#7C4DFF] to-[#6C3FC5] text-white rounded text-sm font-medium">
            Add Food
          </button>
          <button onClick={onCancel} className="px-4 py-2 bg-[#252547] text-[#9090b0] rounded text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
