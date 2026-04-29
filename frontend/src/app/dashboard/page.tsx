"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { database } from "@/lib/firebase";
import { ref, get, set } from "firebase/database";
import { Activity, AlertCircle, Calendar, Droplets, Flame, Pill, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const cycleData = [
  { month: "Jan", days: 32 },
  { month: "Feb", days: 45 },
  { month: "Mar", days: 28 },
  { month: "Apr", days: 50 },
  { month: "May", days: 35 },
  { month: "Jun", days: 31 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    avgCycleLength: "",
    symptoms: ""
  });

  useEffect(() => {
    if (user) {
      const profileRef = ref(database, `users/${user.uid}/profile`);
      get(profileRef).then((snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.val());
        }
        setLoading(false);
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setLoading(true);
      const profileRef = ref(database, `users/${user.uid}/profile`);
      await set(profileRef, formData);
      setProfile(formData);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen pt-24">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 p-8 pt-32 max-w-2xl mx-auto w-full animate-fade-in">
        <div className="glass-card p-8 rounded-3xl border border-white/40 shadow-xl bg-white/60 backdrop-blur-md">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to PCOSense AI ✨</h1>
          <p className="text-slate-500 mb-8">Before we prepare your dashboard, let's personalize your health insights.</p>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="e.g. 24"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="e.g. 65"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="e.g. 165"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Avg Cycle Length (days)</label>
                <input
                  type="number"
                  value={formData.avgCycleLength}
                  onChange={(e) => setFormData({...formData, avgCycleLength: e.target.value})}
                  className="w-full p-3 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="e.g. 32"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key Symptoms (comma separated)</label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                className="w-full p-3 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="e.g. Irregular periods, acne, fatigue"
                rows={3}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer z-50 relative"
            >
              Complete Setup & View Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 pt-10 max-w-7xl mx-auto w-full animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-slate-800">Your Health Overview</h1>
        <p className="text-slate-500 mt-2">Welcome back. Here is your personalized AI health breakdown based on your profile.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ScoreCard 
          title="PCOS Risk Score" 
          value="Tracking" 
          trend="Based on your detailed profile" 
          icon={<AlertCircle className="text-amber-500" />} 
          color="border-l-4 border-amber-500" 
        />
        <ScoreCard 
          title="Cycle Regularity" 
          value={profile.avgCycleLength ? `Avg ${profile.avgCycleLength} days` : "Irregular"}
          trend="From your provided details" 
          icon={<Calendar className="text-blue-500" />} 
          color="border-l-4 border-blue-500" 
        />
        <ScoreCard 
          title="Symptom Focus" 
          value="Monitored" 
          trend={profile.symptoms ? profile.symptoms.substring(0, 30) + (profile.symptoms.length > 30 ? "..." : "") : "Acne, Fatigue"}
          icon={<Activity className="text-purple-500" />} 
          color="border-l-4 border-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-blue-500" /> Cycle Trends
            </h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="days" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDays)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Flame className="text-orange-500" /> AI Insights
          </h2>
          <div className="space-y-4 flex-1">
            <InsightItem 
              icon={<Droplets size={16} className="text-blue-500" />}
              title="Hydration Alert"
              desc="You logged fatigue. Drinking 2L of water might help."
            />
            <InsightItem 
              icon={<Calendar size={16} className="text-purple-500" />}
              title="Cycle Prediction"
              desc="Based on history, next period expected in 5 days."
            />
            <InsightItem 
              icon={<Pill size={16} className="text-emerald-500" />}
              title="Supplement Reminder"
              desc="Don't forget your daily supplements."
            />
          </div>
          <button className="mt-4 w-full py-3 rounded-xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition-colors">
            View All Insights
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, value, trend, icon, color }: { title: string, value: string, trend: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`glass-card p-6 ${color} relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/60 rounded-xl shadow-sm">{icon}</div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        <p className="text-sm font-medium text-slate-500 mt-2">{trend}</p>
      </div>
      <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
        <Activity size={120} />
      </div>
    </div>
  );
}

function InsightItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start p-3 rounded-xl hover:bg-white/40 transition-colors border border-transparent hover:border-white/50 cursor-pointer">
      <div className="mt-1 p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      <div>
        <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
