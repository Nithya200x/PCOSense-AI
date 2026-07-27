"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ReportAnalyzer() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{ hormones: Array<{name: string, value: string, status: string, desc: string}>, summary: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  const handleUpload = async () => {
    if (!file) return;
    setAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(
        `${API_URL}/api/analyze-report`,
        {
          method: "POST",
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error("Invalid response from server");
      }
      
      const data = await response.json();
      setResult({
        hormones: data.hormones,
        summary: data.summary
      });

      // Save report automatically to database if user is authenticated
      if (user && data.status === "success") {
        // Parse float values from strings
        const extractNum = (label: string) => {
          const match = data.hormones.find((h: any) => h.name.toLowerCase().includes(label.toLowerCase()));
          if (!match || match.value === "-") return null;
          const num = parseFloat(match.value.split(" ")[0]);
          return isNaN(num) ? null : num;
        };

        const testosterone = extractNum("testosterone");
        const lh = extractNum("lh") || extractNum("luteinizing");
        const fsh = extractNum("fsh") || extractNum("follicle");
        const tsh = extractNum("tsh") || extractNum("thyroid");
        const insulin = extractNum("insulin");
        const amh = extractNum("amh") || extractNum("müllerian") || extractNum("mullerian");
        const prolactin = extractNum("prolactin");
        const vitamin_d = extractNum("vitamin d");
        const hba1c = extractNum("hba1c");
        const glucose = extractNum("glucose");

        const savePayload = {
          user_id: user.uid,
          date: new Date().toISOString().split("T")[0],
          testosterone,
          lh,
          fsh,
          tsh,
          insulin,
          amh,
          prolactin,
          vitamin_d,
          hba1c,
          glucose,
          file_name: file.name,
          summary: data.summary
        };

        await fetch(`${API_URL}/api/save-report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savePayload)
        });
      }

    } catch (error) {
      console.error("Failed to analyze report:", error);
      setResult({
        hormones: [
          { name: "Error", value: "-", status: "high", desc: "Could not connect to backend to analyze report." }
        ],
        summary: "There was an error communicating with the server."
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 p-8 pt-8 max-w-5xl mx-auto w-full">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-slate-800">Medical Report Analyzer</h1>
        <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
          Upload your blood tests or ultrasound reports. Our AI will extract the medical jargon and explain your results in simple terms.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center border-dashed border-2 border-slate-300 hover:border-blue-500 transition-colors cursor-pointer group"
             onClick={() => document.getElementById("file-upload")?.click()}>
          <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UploadCloud size={32} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            {file ? file.name : "Click to upload report"}
          </h3>
          <p className="text-slate-500 text-sm">Supports JPG, PNG up to 10MB</p>
          
          {file && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              disabled={analyzing}
              className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {analyzing ? <><Loader2 size={18} className="animate-spin" /> Analyzing OCR...</> : "Analyze Report"}
            </button>
          )}
        </div>

        <div className="glass-card p-8 h-full">
          {analyzing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
              <p className="font-medium animate-pulse">Running Vision AI and extracting values...</p>
            </div>
          ) : result ? (
            <div className="animate-fade-in">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="text-emerald-500" /> Analysis Complete
              </h3>
              <p className="text-slate-700 bg-white/50 p-4 rounded-xl leading-relaxed text-sm mb-6 border border-white">
                {result.summary}
              </p>
              <div className="space-y-4">
                {result.hormones.map((item: {name: string, value: string, status: string, desc: string}, i: number) => (
                  <div key={i} className="bg-white/40 p-4 rounded-xl border border-white shadow-sm flex items-start gap-4">
                    <div className="mt-1">
                      {item.status === "normal" 
                        ? <CheckCircle size={20} className="text-emerald-500" />
                        : <AlertCircle size={20} className="text-amber-500" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-white">{item.value}</span>
                      </div>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>Your simplified results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

