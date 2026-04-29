"use client";

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
  return (
    <div className="flex-1 p-8 pt-32 max-w-7xl mx-auto w-full animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-slate-800">Your Health Overview</h1>
        <p className="text-slate-500 mt-2">Welcome back. Here is your personalized AI health breakdown.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ScoreCard 
          title="PCOS Risk Score" 
          value="High (78%)" 
          trend="+5% from last month" 
          icon={<AlertCircle className="text-red-500" />} 
          color="border-l-4 border-red-500" 
        />
        <ScoreCard 
          title="Cycle Regularity" 
          value="Irregular" 
          trend="Avg 36 days" 
          icon={<Calendar className="text-blue-500" />} 
          color="border-l-4 border-blue-500" 
        />
        <ScoreCard 
          title="Symptom Intensity" 
          value="Moderate" 
          trend="Acne, Fatigue" 
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
              desc="Don't forget your Inositol today for insulin regulation."
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
