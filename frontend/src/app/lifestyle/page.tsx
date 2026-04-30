"use client";

import { Apple, Dumbbell, Moon, Droplets, CheckSquare, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";

export default function LifestyleEngine() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const dbRef = ref(database, `users/${user.uid}/lifestyle`);
      get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
        }
        setLoading(false);
      });
    }
  }, [user]);

  const generatePlan = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const profileRef = ref(database, `users/${user.uid}/profile`);
      const snap = await get(profileRef);
      const profile = snap.exists() ? snap.val() : {};

      const response = await fetch("http://localhost:8000/api/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile })
      });
      const result = await response.json();
      
      const dbRef = ref(database, `users/${user.uid}/lifestyle`);
      const { set } = await import("firebase/database");
      await set(dbRef, result);

      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex-1 p-8 text-center pt-24"><Loader2 className="animate-spin text-blue-600 inline mr-2"/> Loading...</div>;

  if (!data && !generating) {
    return (
      <div className="flex-1 p-8 pt-24 max-w-6xl mx-auto w-full min-h-[calc(100vh-80px)] text-center">
        <h1 className="text-4xl font-bold mb-4 text-slate-800">Personalized Lifestyle Engine</h1>
        <p className="mb-8 opacity-80 max-w-lg mx-auto text-slate-600">We need to generate your personalized AI meal and workout plan based on your profile symptoms.</p>
        <button onClick={generatePlan} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors shadow-md">
          Generate AI Plan
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 pt-8 max-w-6xl mx-auto w-full min-h-[calc(100vh-80px)]">
      <header className="mb-10 text-center border-b border-slate-200 pb-6">
        <h1 className="text-4xl font-bold text-slate-800">Personalized Lifestyle Engine</h1>
        <p className="text-slate-600 opacity-80 mt-3 max-w-2xl mx-auto">
          Tailored daily plans based on your symptom profile, cycle phase, and goals.
        </p>
      </header>

      {generating ? (
        <div className="text-center py-20 text-slate-600">
           <Loader2 className="animate-spin inline mb-4 text-blue-600" size={48} />
           <p className="font-bold animate-pulse">AI is crafting your perfect plan...</p>
        </div>
      ) : (
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card p-8 bg-white/60 border border-white">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Apple className="text-green-500" /> AI Meal Plan
            </h2>
            <div className="space-y-4">
              {(data?.meals || [
                { type: "Breakfast", time: "8:00 AM", meal: "Spinach & Mushroom Omelette", desc: "High protein.", calories: "350 kcal" },
                { type: "Lunch", time: "1:00 PM", meal: "Quinoa Salad", desc: "Complex carbs.", calories: "450 kcal" },
                { type: "Dinner", time: "7:30 PM", meal: "Baked Salmon", desc: "Omega-3.", calories: "400 kcal" }
              ]).map((m: any, i: number) => (
                 <MealCard key={i} {...m} />
              ))}
            </div>
          </section>

          <section className="glass-card p-8 bg-white/60 border border-white">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Dumbbell className="text-blue-500" /> Movement Routine
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {(data?.workouts || [
                 { title: "Morning Walk (LISS)", duration: "30 mins", focus: "Low Intensity", why: "Helps lower cortisol" },
                 { title: "Strength Training", duration: "45 mins", focus: "Lower Body", why: "Improves insulin resistance" }
              ]).map((w: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="font-bold text-slate-800 mb-2">{w.title}</div>
                  <div className="text-sm text-slate-600 mb-4">{w.duration} • {w.focus}</div>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block font-bold">{w.why}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-card p-6 bg-white/60 border border-white">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Moon className="text-indigo-500" size={20} /> Sleep Protocol
            </h3>
            <ul className="space-y-3">
              {(data?.sleep || [
                 "No screens after 9:30 PM",
                 "Magnesium Glycinate at 9:00 PM",
                 "Target 8 hours (10:30 PM - 6:30 AM)"
              ]).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckSquare size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card p-6 bg-white/60 border border-white">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Droplets className="text-teal-500" size={20} /> Daily Habits
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 text-slate-700">
                  <span className="font-bold">Water Intake</span>
                  <span className="font-bold text-slate-500">1.2 / 2.5 L</span>
                </div>
                <div className="h-2 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 w-[48%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 text-slate-700">
                  <span className="font-bold">Stress Level</span>
                  <span className="font-bold text-orange-500">High</span>
                </div>
                <p className="text-xs text-slate-500 opacity-80 mt-2 italic">Recommendation: Try 10 mins of Box Breathing.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      )}
    </div>
  );
}

function MealCard({ type, time, meal, desc, calories }: { type: string, time: string, meal: string, desc: string, calories: string }) {
  return (
    <div className="flex gap-6 items-center p-4 bg-white rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm">
      <div className="w-20 text-center shrink-0">
        <div className="text-sm font-bold text-slate-700">{type}</div>
        <div className="text-xs text-slate-500 opacity-80">{time}</div>
      </div>
      <div className="h-12 w-px bg-slate-200 hidden sm:block opacity-50"></div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-800">{meal}</h4>
        <p className="text-sm text-slate-600 opacity-80 mt-1">{desc}</p>
      </div>
      <div className="hidden md:block px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
        {calories}
      </div>
    </div>
  );
}
