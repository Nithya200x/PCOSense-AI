'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Report {
  date: string;
  testosterone: number;
  insulin: number;
  tsh: number;
}

export default function HistoryPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const userId = 'user123'; // Mock user ID

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/get-reports?user_id=${userId}`);
      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // First, analyze the report
      const formData = new FormData();
      formData.append('file', file);

      const analyzeResponse = await axios.post('http://localhost:8000/api/analyze-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (analyzeResponse.data.status === 'success') {
        // Extract values
        const hormones = analyzeResponse.data.hormones;
        const testosterone = parseFloat(hormones.find((h: any) => h.name === 'Testosterone')?.value?.split(' ')[0] || '0');
        const insulin = parseFloat(hormones.find((h: any) => h.name === 'Insulin (Fasting)')?.value?.split(' ')[0] || '0');
        const tsh = parseFloat(hormones.find((h: any) => h.name === 'Thyroid (TSH)')?.value?.split(' ')[0] || '0');

        // Save the report
        const saveData = {
          user_id: userId,
          date: new Date().toISOString().split('T')[0],
          testosterone,
          insulin,
          tsh,
          file_name: file.name,
        };

        await axios.post('http://localhost:8000/api/save-report', saveData);
        fetchReports(); // Refresh the list
        setFile(null);
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

  const chartData = reports.map(report => ({
    date: report.date,
    Testosterone: report.testosterone,
    Insulin: report.insulin,
    TSH: report.tsh,
  })).reverse(); // Reverse to show chronological order

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Report History</h1>

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Report</h2>
          <div className="flex gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload & Analyze'}
            </button>
          </div>
        </div>

        {/* Progress Graph */}
        {reports.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Hormone Trends</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Testosterone" stroke="#8884d8" />
                <Line type="monotone" dataKey="Insulin" stroke="#82ca9d" />
                <Line type="monotone" dataKey="TSH" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Report History</h2>
          {reports.length === 0 ? (
            <p className="text-gray-500">No reports uploaded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Testosterone (ng/dL)</th>
                    <th className="px-4 py-2 text-left">Insulin (µIU/mL)</th>
                    <th className="px-4 py-2 text-left">TSH (µIU/mL)</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{report.date}</td>
                      <td className="px-4 py-2">{report.testosterone}</td>
                      <td className="px-4 py-2">{report.insulin}</td>
                      <td className="px-4 py-2">{report.tsh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}