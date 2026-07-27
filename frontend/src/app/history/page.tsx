'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UploadCloud, FileText, CheckCircle, Loader2, Calendar } from 'lucide-react';

interface Report {
  date: string;
  testosterone: number | null;
  lh: number | null;
  fsh: number | null;
  tsh: number | null;
  insulin: number | null;
  amh: number | null;
  prolactin: number | null;
  vitamin_d: number | null;
  hba1c: number | null;
  glucose: number | null;
  file_name: string;
  summary: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedHormones, setSelectedHormones] = useState<string[]>(['Testosterone', 'Insulin', 'TSH']);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
  const userId = user?.uid || 'user123';

  useEffect(() => {
    if (user) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/get-reports?user_id=${user.uid}`);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const analyzeResponse = await axios.post(`${API_URL}/api/analyze-report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (analyzeResponse.data.status === 'success') {
        const hormones = analyzeResponse.data.hormones;
        const extractNum = (label: string) => {
          const match = hormones.find((h: any) => h.name.toLowerCase().includes(label.toLowerCase()));
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

        const saveData = {
          user_id: user.uid,
          date: new Date().toISOString().split('T')[0],
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
          summary: analyzeResponse.data.summary
        };

        await axios.post(`${API_URL}/api/save-report`, saveData);
        fetchReports();
        setFile(null);
        alert("Report uploaded and saved successfully! ✨");
      } else {
        alert('Failed to analyze report: ' + analyzeResponse.data.summary);
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Error uploading report');
    } finally {
      setUploading(false);
    }
  };

  const toggleHormone = (hormone: string) => {
    if (selectedHormones.includes(hormone)) {
      setSelectedHormones(selectedHormones.filter(h => h !== hormone));
    } else {
      setSelectedHormones([...selectedHormones, hormone]);
    }
  };

  const chartData = reports.map(report => ({
    date: report.date,
    Testosterone: report.testosterone || 0,
    Insulin: report.insulin || 0,
    TSH: report.tsh || 0,
    LH: report.lh || 0,
    FSH: report.fsh || 0,
    AMH: report.amh || 0,
    Prolactin: report.prolactin || 0,
    "Vitamin D": report.vitamin_d || 0,
    HbA1c: report.hba1c || 0,
    Glucose: report.glucose || 0,
  })).reverse();

  const hormoneOptions = [
    { label: 'Testosterone', key: 'Testosterone', color: '#8884d8' },
    { label: 'LH', key: 'LH', color: '#38bdf8' },
    { label: 'FSH', key: 'FSH', color: '#f43f5e' },
    { label: 'TSH', key: 'TSH', color: '#ffc658' },
    { label: 'Insulin', key: 'Insulin', color: '#82ca9d' },
    { label: 'AMH', key: 'AMH', color: '#ec4899' },
    { label: 'Prolactin', key: 'Prolactin', color: '#a855f7' },
    { label: 'Vitamin D', key: 'Vitamin D', color: '#eab308' },
    { label: 'HbA1c', key: 'HbA1c', color: '#f97316' },
    { label: 'Glucose', key: 'Glucose', color: '#14b8a6' },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pt-8 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-slate-800">Biomarker Report History</h1>
        <p className="text-slate-500 mt-2">Track hormone fluctuations, vitamin levels, and metabolic indicators longitudinally.</p>
      </header>

      {/* Upload Section */}
      <div className="glass-card p-6 mb-8 border border-white bg-white/60">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <UploadCloud className="text-blue-500" /> Upload New Report
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="w-full sm:flex-1 p-2 border border-slate-200 rounded-xl bg-white/80 outline-none text-sm text-slate-700"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : 'Upload & Analyze'}
          </button>
        </div>
      </div>

      {reports.length > 0 ? (
        <>
          {/* Progress Graph */}
          <div className="glass-card p-6 mb-8 border border-white bg-white/60">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-500" /> Hormone & Biomarker Trends
              </h2>
              {/* Checkboxes to select hormones */}
              <div className="flex flex-wrap gap-2">
                {hormoneOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => toggleHormone(option.key)}
                    style={{
                      borderColor: selectedHormones.includes(option.key) ? option.color : '#e2e8f0',
                      color: selectedHormones.includes(option.key) ? '#0f172a' : '#64748b',
                      backgroundColor: selectedHormones.includes(option.key) ? `${option.color}15` : 'transparent'
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[400px] w-full min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  {hormoneOptions.map(option => selectedHormones.includes(option.key) && (
                    <Line
                      key={option.key}
                      type="monotone"
                      dataKey={option.key}
                      stroke={option.color}
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History List */}
          <div className="glass-card p-6 border border-white bg-white/60">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="text-teal-500" /> Historical Records
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm font-semibold">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Testosterone (ng/dL)</th>
                    <th className="px-4 py-3 text-left">LH / FSH</th>
                    <th className="px-4 py-3 text-left">TSH (µIU/mL)</th>
                    <th className="px-4 py-3 text-left">Insulin (µIU/mL)</th>
                    <th className="px-4 py-3 text-left">Glucose (mg/dL)</th>
                    <th className="px-4 py-3 text-left">Summary Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report, index) => (
                    <tr key={index} className="text-slate-700 hover:bg-white/40 transition-colors text-sm">
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{report.date}</td>
                      <td className="px-4 py-3">{report.testosterone ?? '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {report.lh !== null && report.fsh !== null 
                          ? `${report.lh} / ${report.fsh} (Ratio: ${roundToTwo(report.lh / report.fsh)}:1)` 
                          : `${report.lh ?? '-'} / ${report.fsh ?? '-'}`
                        }
                      </td>
                      <td className="px-4 py-3">{report.tsh ?? '-'}</td>
                      <td className="px-4 py-3">{report.insulin ?? '-'}</td>
                      <td className="px-4 py-3">{report.glucose ?? '-'}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-500" title={report.summary}>
                        {report.summary || 'No summary parsed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-12 text-center border border-white bg-white/60">
          <FileText className="mx-auto mb-4 text-slate-400 opacity-60" size={48} />
          <h3 className="text-lg font-bold text-slate-700">No medical reports uploaded</h3>
          <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
            Upload your first health report above to initiate hormone tracking.
          </p>
        </div>
      )}
    </div>
  );
}

function roundToTwo(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}