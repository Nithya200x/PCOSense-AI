import Link from "next/link";
import { ArrowRight, Activity, ShieldCheck, BrainCircuit, Mic } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-8 pb-20">
      <div className="max-w-4xl w-full animate-slide-up space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm font-medium text-blue-700 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          The Future of Women&apos;s Healthcare
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
          Take control with <br />
          <span className="gradient-text">PCOSense AI</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Early awareness, intelligent guidance, and personalized support for women affected by PCOS. 
          Understand your body, analyze reports, and get actionable insights.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link href="/dashboard" className="px-8 py-4 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
            Enter Platform <ArrowRight size={20} />
          </Link>
          <Link href="/chat" className="px-8 py-4 rounded-full glass-card font-semibold text-slate-700 hover:bg-white/60 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
            <Mic size={20} className="text-purple-500" /> Try Voice AI
          </Link>
        </div>
      </div>

      <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        <FeatureCard 
          icon={<BrainCircuit className="text-blue-500" size={32} />}
          title="AI Conversational Support"
          desc="Chat naturally about your symptoms. Get immediate, human-like guidance tailored to you."
        />
        <FeatureCard 
          icon={<Activity className="text-purple-500" size={32} />}
          title="Smart Risk Score"
          desc="Track cycle irregularities and lifestyle habits to generate a dynamic health risk score."
        />
        <FeatureCard 
          icon={<ShieldCheck className="text-emerald-500" size={32} />}
          title="Report Analyzer"
          desc="Upload medical reports. We extract the values and explain them in simple terms."
        />
      </div>
      
      <div className="mt-20 text-sm text-slate-400 max-w-md text-center glass-panel px-6 py-4">
        Disclaimer: This tool supports awareness and is not a medical diagnosis replacement. Always consult with a healthcare professional.
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-card p-8 text-left hover:-translate-y-2 transition-transform duration-300">
      <div className="w-14 h-14 rounded-2xl bg-white/50 flex items-center justify-center mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
