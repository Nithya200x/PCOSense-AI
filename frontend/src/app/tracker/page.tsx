"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ClipboardCheck, Activity, Pill, Droplets, Dumbbell, Apple, Moon, Loader2, Calendar, Smile, Plus, Trash2 } from "lucide-react";
import axios from "axios";

export default function TrackerPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"symptoms" | "period" | "wellness" | "meds">("symptoms");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [symptoms, setSymptoms] = useState({
    acne: false,
    cramps: false,
    bloating: false,
    fatigue: false,
    mood: "Normal",
  });
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [flow, setFlow] = useState("None");
  const [pain, setPain] = useState("None");
  const [water, setWater] = useState(0.0);
  const [weight, setWeight] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState(3);
  
  // Lists for dynamic tracking
  const [medications, setMedications] = useState<any[]>([
    { name: "Myo-inositol", dosage: "2000mg", taken: false },
    { name: "Metformin", dosage: "500mg", taken: false }
  ]);
  const [exercise, setExercise] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);

  // Input states for list additions
  const [newMed, setNewMed] = useState({ name: "", dosage: "" });
  const [newWork, setNewWork] = useState({ title: "", duration: "", focus: "", why: "" });
  const [newMeal, setNewMeal] = useState({ type: "Breakfast", meal: "", desc: "", calories: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API_URL}/api/track/history?user_id=${user.uid}`);
      setHistory(response.data.logs || []);
      
      // Load today's log if it exists
      const todayLog = (response.data.logs || []).find((l: any) => l.date === date);
      if (todayLog) {
        if (todayLog.symptoms) setSymptoms(todayLog.symptoms);
        if (todayLog.period_start) setPeriodStart(todayLog.period_start);
        if (todayLog.period_end) setPeriodEnd(todayLog.period_end);
        if (todayLog.flow) setFlow(todayLog.flow);
        if (todayLog.pain) setPain(todayLog.pain);
        if (todayLog.water_consumed) setWater(todayLog.water_consumed);
        if (todayLog.weight) setWeight(todayLog.weight.toString());
        if (todayLog.sleep_hours) setSleepHours(todayLog.sleep_hours.toString());
        if (todayLog.sleep_quality) setSleepQuality(todayLog.sleep_quality);
        if (todayLog.medications) setMedications(todayLog.medications);
        if (todayLog.exercise) setExercise(todayLog.exercise);
        if (todayLog.meals) setMeals(todayLog.meals);
      }
    } catch (e) {
      console.error("Error loading tracker history", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.uid,
        date: date,
        symptoms: symptoms,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        flow: flow !== "None" ? flow : null,
        pain: pain !== "None" ? pain : null,
        water_consumed: Number(water),
        weight: weight ? Number(weight) : null,
        sleep_hours: sleepHours ? Number(sleepHours) : null,
        sleep_quality: Number(sleepQuality),
        medications: medications,
        exercise: exercise,
        meals: meals
      };

      const res = await axios.post(`${API_URL}/api/track`, payload);
      if (res.data.status === "success") {
        await fetchHistory();
        alert("Daily log saved successfully! ✨");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving tracker log.");
    } finally {
      setSaving(false);
    }
  };

  const addMed = () => {
    if (!newMed.name) return;
    setMedications([...medications, { name: newMed.name, dosage: newMed.dosage, taken: false }]);
    setNewMed({ name: "", dosage: "" });
  };

  const addWorkout = () => {
    if (!newWork.title) return;
    setExercise([...exercise, { ...newWork }]);
    setNewWork({ title: "", duration: "", focus: "", why: "" });
  };

  const addMeal = () => {
    if (!newMeal.meal) return;
    setMeals([...meals, { ...newMeal }]);
    setNewMeal({ type: "Breakfast", meal: "", desc: "", calories: "" });
  };

  const deleteItem = (type: "med" | "work" | "meal", index: number) => {
    if (type === "med") {
      setMedications(medications.filter((_, i) => i !== index));
    } else if (type === "work") {
      setExercise(exercise.filter((_, i) => i !== index));
    } else if (type === "meal") {
      setMeals(meals.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex-1 p-8 pt-8 max-w-7xl mx-auto w-full min-h-screen">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-800">Dynamic Daily Tracker</h1>
        <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
          Log symptoms, cycle markers, and habits to train your PCOSense AI and calculate your personalized wellness stats.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side: Logger form */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="text-blue-500" /> Daily Entry
              </h2>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); }}
                className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 outline-none"
              />
            </div>

            {/* Tab navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <TabButton active={activeTab === "symptoms"} label="Symptoms" icon={<Activity size={16} />} onClick={() => setActiveTab("symptoms")} />
              <TabButton active={activeTab === "period"} label="Period" icon={<Calendar size={16} />} onClick={() => setActiveTab("period")} />
              <TabButton active={activeTab === "wellness"} label="Wellness" icon={<Droplets size={16} />} onClick={() => setActiveTab("wellness")} />
              <TabButton active={activeTab === "meds"} label="Medications & Lifestyle" icon={<Pill size={16} />} onClick={() => setActiveTab("meds")} />
            </div>

            {/* Tab contents */}
            {activeTab === "symptoms" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-slate-700">How are you feeling today?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <CheckboxLabel label="Acne Flare-up" checked={symptoms.acne} onChange={(e) => setSymptoms({ ...symptoms, acne: e.target.checked })} />
                  <CheckboxLabel label="Cramps / Pelvic Pain" checked={symptoms.cramps} onChange={(e) => setSymptoms({ ...symptoms, cramps: e.target.checked })} />
                  <CheckboxLabel label="Bloating" checked={symptoms.bloating} onChange={(e) => setSymptoms({ ...symptoms, bloating: e.target.checked })} />
                  <CheckboxLabel label="Fatigue / Low Energy" checked={symptoms.fatigue} onChange={(e) => setSymptoms({ ...symptoms, fatigue: e.target.checked })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mood Focus</label>
                  <select
                    value={symptoms.mood}
                    onChange={(e) => setSymptoms({ ...symptoms, mood: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white/70 text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Normal">Normal / Stable</option>
                    <option value="Happy">Happy / Energetic</option>
                    <option value="Tired">Tired / Low</option>
                    <option value="Anxious">Anxious / Stressed</option>
                    <option value="Moody">Moody / Irritable</option>
                    <option value="Calmer">Calm / Peaceful</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "period" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-slate-700">Period Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Period Start Date</label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white/70 text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Period End Date</label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white/70 text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Flow Intensity</label>
                    <select
                      value={flow}
                      onChange={(e) => setFlow(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white/70 text-slate-700 outline-none"
                    >
                      <option value="None">No Flow</option>
                      <option value="Spotting">Spotting</option>
                      <option value="Light">Light</option>
                      <option value="Medium">Medium</option>
                      <option value="Heavy">Heavy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Cramping Severity</label>
                    <select
                      value={pain}
                      onChange={(e) => setPain(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white/70 text-slate-700 outline-none"
                    >
                      <option value="None">None</option>
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "wellness" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-slate-700">Wellness & Vitals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1 flex items-center gap-1">
                      <Droplets size={14} className="text-teal-500" /> Water Intake (Liters)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={water}
                      onChange={(e) => setWater(parseFloat(e.target.value) || 0.0)}
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white/70 text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1 flex items-center gap-1">
                      <Activity size={14} className="text-indigo-500" /> Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 64.5"
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white/70 text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1 flex items-center gap-1">
                      <Moon size={14} className="text-purple-500" /> Sleep Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      placeholder="e.g. 7.5"
                      className="w-full p-3 border border-slate-200 rounded-xl bg-white/70 text-slate-700 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Sleep Quality (1 - 5)</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                      className="w-full mt-2 accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1 (Poor)</span>
                      <span>3 (Moderate)</span>
                      <span>5 (Excellent)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "meds" && (
              <div className="space-y-6 animate-fade-in overflow-y-auto max-h-[450px] pr-2">
                {/* Medications section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-1">
                    <Pill size={16} className="text-pink-500" /> Supplements & Medications
                  </h3>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Name (e.g. Metformin)"
                      value={newMed.name}
                      onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      className="flex-1 p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                      className="w-24 p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                    <button onClick={addMed} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm flex items-center gap-1 font-bold">
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {medications.map((med, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white/50 border border-slate-100 rounded-xl">
                        <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={med.taken}
                            onChange={(e) => {
                              const updated = [...medications];
                              updated[idx].taken = e.target.checked;
                              setMedications(updated);
                            }}
                            className="rounded text-blue-600 accent-blue-500 w-4 h-4"
                          />
                          <span>{med.name} <span className="text-slate-400 text-xs">({med.dosage})</span></span>
                        </label>
                        <button onClick={() => deleteItem("med", idx)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workouts section */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-1">
                    <Dumbbell size={16} className="text-orange-500" /> Workouts
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Activity (e.g. Walking)"
                      value={newWork.title}
                      onChange={(e) => setNewWork({ ...newWork, title: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 30 mins)"
                      value={newWork.duration}
                      onChange={(e) => setNewWork({ ...newWork, duration: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Focus (e.g. Cortisol reduction)"
                      value={newWork.focus}
                      onChange={(e) => setNewWork({ ...newWork, focus: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Reason why"
                      value={newWork.why}
                      onChange={(e) => setNewWork({ ...newWork, why: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                  </div>
                  <button onClick={addWorkout} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm flex items-center justify-center gap-1 font-bold mb-4">
                    <Plus size={16} /> Add Workout
                  </button>
                  <div className="space-y-2">
                    {exercise.map((work, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white/50 border border-slate-100 rounded-xl">
                        <div className="text-sm">
                          <div className="font-semibold text-slate-800">{work.title}</div>
                          <div className="text-xs text-slate-500">{work.duration} • {work.focus}</div>
                          {work.why && <div className="text-xs text-blue-600 mt-1 italic">{work.why}</div>}
                        </div>
                        <button onClick={() => deleteItem("work", idx)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meals Section */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-1">
                    <Apple size={16} className="text-green-500" /> Meals
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                      value={newMeal.type}
                      onChange={(e) => setNewMeal({ ...newMeal, type: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Meal Name"
                      value={newMeal.meal}
                      onChange={(e) => setNewMeal({ ...newMeal, meal: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newMeal.desc}
                      onChange={(e) => setNewMeal({ ...newMeal, desc: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Calories (e.g. 350 kcal)"
                      value={newMeal.calories}
                      onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                      className="p-2 border border-slate-200 rounded-xl bg-white/70 text-slate-700 text-sm outline-none"
                    />
                  </div>
                  <button onClick={addMeal} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm flex items-center justify-center gap-1 font-bold mb-4">
                    <Plus size={16} /> Add Meal
                  </button>
                  <div className="space-y-2">
                    {meals.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white/50 border border-slate-100 rounded-xl">
                        <div className="text-sm">
                          <span className="font-bold text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded mr-2">{m.type}</span>
                          <span className="font-semibold text-slate-800">{m.meal}</span>
                          <div className="text-xs text-slate-500 mt-1">{m.desc} {m.calories && `• ${m.calories}`}</div>
                        </div>
                        <button onClick={() => deleteItem("meal", idx)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving daily logs...</> : "Save Log for Today ✨"}
          </button>
        </div>

        {/* Right Side: Tracking History */}
        <div className="glass-card p-6 h-full max-h-[600px] flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Activity className="text-purple-500" /> Tracking History
          </h2>

          {loadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
          ) : history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
              <ClipboardCheck size={48} className="mb-2 opacity-50" />
              <p>No logged days yet. Record symptoms above.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {history.map((log, idx) => (
                <div key={idx} className="p-4 bg-white/40 border border-white hover:bg-white/60 transition-colors rounded-2xl shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-sm">{log.date}</span>
                    {log.flow && <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Flow: {log.flow}</span>}
                  </div>
                  {log.symptoms && (
                    <div className="flex flex-wrap gap-1.5">
                      {log.symptoms.acne && <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded font-medium">Acne</span>}
                      {log.symptoms.cramps && <span className="text-[10px] bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded font-medium">Cramps</span>}
                      {log.symptoms.bloating && <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded font-medium">Bloating</span>}
                      {log.symptoms.fatigue && <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-medium">Fatigue</span>}
                      {log.symptoms.mood && <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">Mood: {log.symptoms.mood}</span>}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100/50">
                    <div>💧 {log.water_consumed || 0} L</div>
                    {log.weight && <div>⚖️ {log.weight} kg</div>}
                    {log.sleep_hours && <div>🛌 {log.sleep_hours} hrs</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
        active
          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
          : "bg-white/50 border border-slate-200/50 text-slate-600 hover:bg-white hover:text-blue-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function CheckboxLabel({ label, checked, onChange }: { label: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className={`p-4 border rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${
      checked
        ? "bg-blue-50/50 border-blue-200 text-blue-700 shadow-sm"
        : "bg-white/40 border-slate-200 hover:bg-white/80 text-slate-700"
    }`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded text-blue-600 accent-blue-500 w-4 h-4"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}
