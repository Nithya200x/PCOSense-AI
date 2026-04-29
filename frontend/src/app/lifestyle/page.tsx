import { Apple, Dumbbell, Moon, Droplets, CheckSquare } from "lucide-react";

export default function LifestyleEngine() {
  return (
    <div className="flex-1 p-8 pt-32 max-w-6xl mx-auto w-full">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-800">Personalized Lifestyle Engine</h1>
        <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
          Tailored daily plans based on your symptom profile, cycle phase, and goals.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Apple className="text-rose-500" /> AI Meal Plan
            </h2>
            <div className="space-y-4">
              <MealCard 
                type="Breakfast" 
                time="8:00 AM"
                meal="Spinach & Mushroom Omelette with Avocado"
                desc="High protein and healthy fats to stabilize morning blood sugar."
                calories="350 kcal"
              />
              <MealCard 
                type="Lunch" 
                time="1:00 PM"
                meal="Quinoa Salad with Grilled Chicken & Pumpkin Seeds"
                desc="Complex carbs and zinc-rich seeds for hormone balance."
                calories="450 kcal"
              />
              <MealCard 
                type="Dinner" 
                time="7:30 PM"
                meal="Baked Salmon with Roasted Asparagus"
                desc="Omega-3 fatty acids to reduce systemic inflammation."
                calories="400 kcal"
              />
            </div>
          </section>

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Dumbbell className="text-orange-500" /> Movement Routine
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/40 p-5 rounded-2xl border border-white">
                <div className="font-semibold text-slate-800 mb-2">Morning Walk (LISS)</div>
                <div className="text-sm text-slate-500 mb-4">30 mins • Low Intensity</div>
                <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded inline-block font-medium">Helps lower cortisol</div>
              </div>
              <div className="bg-white/40 p-5 rounded-2xl border border-white">
                <div className="font-semibold text-slate-800 mb-2">Strength Training</div>
                <div className="text-sm text-slate-500 mb-4">45 mins • Focus: Lower Body</div>
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block font-medium">Improves insulin sensitivity</div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-card p-6 bg-gradient-to-b from-white/60 to-purple-50/60">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Moon className="text-indigo-500" size={20} /> Sleep Protocol
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <CheckSquare size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                No screens after 9:30 PM
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <CheckSquare size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                Magnesium Glycinate at 9:00 PM
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600">
                <CheckSquare size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                Target 8 hours (10:30 PM - 6:30 AM)
              </li>
            </ul>
          </section>

          <section className="glass-card p-6 bg-gradient-to-b from-white/60 to-blue-50/60">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Droplets className="text-blue-500" size={20} /> Daily Habits
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Water Intake</span>
                  <span className="text-blue-600 font-bold">1.2 / 2.5 L</span>
                </div>
                <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[48%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Stress Level (User Logged)</span>
                  <span className="text-amber-600 font-bold">High</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">Recommendation: Try 10 mins of Box Breathing.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MealCard({ type, time, meal, desc, calories }: { type: string, time: string, meal: string, desc: string, calories: string }) {
  return (
    <div className="flex gap-6 items-center p-4 bg-white/40 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow">
      <div className="w-20 text-center shrink-0">
        <div className="text-sm font-bold text-slate-700">{type}</div>
        <div className="text-xs text-slate-500">{time}</div>
      </div>
      <div className="h-12 w-px bg-slate-200 hidden sm:block"></div>
      <div className="flex-1">
        <h4 className="font-semibold text-slate-800">{meal}</h4>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
      <div className="hidden md:block px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold">
        {calories}
      </div>
    </div>
  );
}
