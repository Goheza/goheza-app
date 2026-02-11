"use client"

import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { 
  Download, Eye, Heart, MessageCircle, Clock, Target, 
  Zap, Award, Instagram, ExternalLink, ChevronDown, MousePointer2
} from 'lucide-react';

// --- Components & Icons ---
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.3 6.3 0 01-1.87-1.57v8.43c-.02 2.22-.56 4.54-2.19 6.09-1.63 1.54-4.01 2.06-6.14 1.74-2.14-.32-4.14-1.74-5.02-3.74-.88-2.01-.65-4.48.6-6.26 1.25-1.78 3.48-2.73 5.64-2.42v4.06c-1.12-.13-2.31.25-3.03 1.14-.72.89-.72 2.22-.11 3.19.61.96 1.79 1.48 2.89 1.25 1.1-.23 1.93-1.25 1.94-2.37V.02z"/>
  </svg>
);

const CampaignAnalytics = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Mock function for download simulation
  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
      {/* Navbar */}
      <nav className="flex items-center justify-end px-8 py-4 border-b  w-full ">
      
        <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
        
          <button onClick={handleDownload} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-all">
            <Download size={16} /> {isDownloading ? 'Generating...' : 'Download Report'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {/* Campaign Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-red-500 font-bold text-xs uppercase tracking-widest">
              <Zap size={14} /> Campaign Live Performance
            </div>
            <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Volt Energy Peak Performance</h1>
            <p className="text-slate-500 font-medium">Reporting period: Oct 01 - Oct 30, 2026</p>
          </div>
        </div>

        {/* 1. Core Metrics (KPI Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <MetricCard label="Views" value="185.4K" icon={<Eye size={14}/>} />
          <MetricCard label="Likes" value="42.7K" icon={<Heart size={14}/>} />
          <MetricCard label="Comments" value="3,890" icon={<MessageCircle size={14}/>} />
          <MetricCard label="Eng. Rate" value="5.8%" growth="+1.2%" icon={<MousePointer2 size={14}/>} />
          <MetricCard label="Avg Watch" value="14.2s" icon={<Clock size={14}/>} />
          <MetricCard label="Completion" value="64%" icon={<Target size={14}/>} />
          <MetricCard label="Reach" value="145.2K" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 2. Retention & Engagement Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Daily Content Performance</h3>
              <div className="flex gap-4 text-[10px] font-bold uppercase">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Views</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200" /> Completion %</span>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip cursor={{stroke: '#EF4444', strokeWidth: 2}} />
                  <Area type="monotone" dataKey="views" stroke="#EF4444" fill="#FEF2F2" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Audience Ages (Demographics) */}
          <div className="bg-white p-6 rounded-2xl border-t-4 border-red-500 shadow-lg">
            <h3 className="font-bold text-lg mb-6">Audience Ages</h3>
            <div className="space-y-5">
              {[
                { range: '13-17', pct: 12 },
                { range: '18-24', pct: 48 },
                { range: '25-34', pct: 26 },
                { range: '35-44', pct: 10 },
                { range: '45+', pct: 4 },
              ].map((age, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span>{age.range}</span>
                    <span className={age.pct > 40 ? 'text-red-500' : 'text-slate-400'}>{age.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${age.pct > 40 ? 'bg-red-500' : 'bg-slate-300'}`} 
                      style={{ width: `${age.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Deep Dive Table (Mirroring your Brand UI Layout) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg">Individual Post Analysis</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4 text-center">Engagement Rate</th>
                <th className="px-6 py-4 text-center">Avg. Watchtime</th>
                <th className="px-6 py-4 text-center">Completion</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm">{row.title}</td>
                  <td className="px-6 py-4">
                    {row.platform === 'IG' ? <Instagram size={16} className="text-pink-500"/> : <TikTokIcon className="w-4 h-4 text-slate-900"/>}
                  </td>
                  <td className="px-6 py-4 text-center font-black text-red-500">{row.engRate}%</td>
                  <td className="px-6 py-4 text-center font-medium text-slate-600">{row.watchtime}s</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-bold">{row.completion}%</span>
                        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{width: `${row.completion}%`}} />
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase">Live</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

// --- Sub-components & Data ---

const MetricCard = ({ label, value, growth, icon }: any) => (
  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group transition-all hover:bg-white hover:shadow-md">
    <div className="text-red-500 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
      {icon}
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-black text-slate-900">{value}</span>
      {growth && <span className="text-[10px] font-bold text-green-500">{growth}</span>}
    </div>
  </div>
);

const performanceData = Array.from({ length: 20 }, (_, i) => ({
  name: i,
  views: Math.floor(Math.random() * 5000) + 2000,
}));

const tableData = [
  { title: 'Morning Routine x Volt', platform: 'TikTok', engRate: 8.2, watchtime: 18.4, completion: 72 },
  { title: 'Gym Bag Essentials', platform: 'IG', engRate: 4.5, watchtime: 12.1, completion: 54 },
  { title: 'The Flavor Test', platform: 'TikTok', engRate: 12.4, watchtime: 22.0, completion: 89 },
  { title: 'Late Night Study session', platform: 'IG', engRate: 3.1, watchtime: 9.5, completion: 41 },
];

export default CampaignAnalytics;