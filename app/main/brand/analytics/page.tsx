"use client"

import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, Eye, Heart, MessageCircle, 
  Bookmark, Share2, ExternalLink, Instagram, Music2, Target, Award
} from 'lucide-react';

// --- Custom TikTok Icon ---
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.3 6.3 0 01-1.87-1.57v8.43c-.02 2.22-.56 4.54-2.19 6.09-1.63 1.54-4.01 2.06-6.14 1.74-2.14-.32-4.14-1.74-5.02-3.74-.88-2.01-.65-4.48.6-6.26 1.25-1.78 3.48-2.73 5.64-2.42v4.06c-1.12-.13-2.31.25-3.03 1.14-.72.89-.72 2.22-.11 3.19.61.96 1.79 1.48 2.89 1.25 1.1-.23 1.93-1.25 1.94-2.37V.02z"/>
  </svg>
);

const CampaignAnalytics = () => {
  const [activePlatform, setActivePlatform] = useState<'Both' | 'Instagram' | 'TikTok'>('Both');

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">
      

      <main className="max-w-7xl mx-auto p-8">
        
        {/* Campaign Context Header */}
        <div className="bg-slate-900 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
                <Target size={120} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-500 text-[10px] font-black uppercase px-2 py-1 rounded">Active Campaign</span>
                        <span className="text-slate-400 text-sm">ID: #GH-9921</span>
                    </div>
                    <h1 className="text-4xl font-black mb-1 italic uppercase tracking-tighter">Summer Peak Energy 2026</h1>
                    <p className="text-slate-400 font-medium">Brand: <span className="text-white">Volt Energy Drink Co.</span> • Ends in 12 days</p>
                </div>
                <div className="flex gap-2">
                    {/* <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all">
                        <ExternalLink size={16} /> View Brief
                    </button> */}
                </div>
            </div>
        </div>

        {/* Campaign KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <KPICard label="Total Reach" value="145.2K" growth="12%" />
          <KPICard label="Impressions" value="320.8K" growth="8%" />
          <KPICard label="Likes" value="42.7K" />
          <KPICard label="Comments" value="3,890" />
          <KPICard label="Plays" value="185.4K" />
          <KPICard label="Saves" value="12.1K" />
          <KPICard label="Shares" value="5,620" />
        </div>

        {/* Charts: Engagement Over Time & Platform Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-lg">Engagement vs Views (Live)</h3>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Engagement</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200" /> Views</span>
                </div>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="engagement" stroke="#EF4444" fillOpacity={1} fill="url(#colorEng)" strokeWidth={3} />
                  <Area type="monotone" dataKey="views" stroke="#e2e8f0" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border-t-4 border-red-500 shadow-lg flex flex-col">
            <h3 className="font-bold text-lg mb-6">Campaign Split</h3>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                            <Cell fill="#EF4444" />
                            <Cell fill="#0F172A" />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-auto space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-xs"><Instagram size={14} className="text-pink-500" /> Instagram</div>
                    <span className="font-black">62%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 font-bold text-xs"><TikTokIcon className="w-3.5 h-3.5" /> TikTok</div>
                    <span className="font-black">38%</span>
                </div>
            </div>
          </div>
        </div>

        {/* Campaign Post Grid */}
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Linked Campaign Content</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['Both', 'Instagram', 'TikTok'].map(p => (
                        <button 
                            key={p} 
                            onClick={() => setActivePlatform(p as any)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activePlatform === p ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {posts.filter(p => activePlatform === 'Both' || p.platform === activePlatform).map((post, i) => (
                    <div key={i} className="group relative aspect-[4/5] bg-slate-100 rounded-3xl overflow-hidden shadow-sm border border-slate-200">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                            {post.platform === 'Instagram' ? (
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white border border-white/20">
                                    <Instagram size={16} />
                                </div>
                            ) : (
                                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white border border-white/20">
                                    <TikTokIcon className="w-4 h-4" />
                                </div>
                            )}
                            {post.isTop && <div className="bg-red-500 text-white text-[10px] font-black px-2 py-2 rounded-xl flex items-center gap-1 uppercase"><Award size={12}/> Top</div>}
                        </div>
                        <div className="absolute bottom-0 p-6 z-20 w-full text-white">
                            <p className="font-bold text-sm mb-3 line-clamp-1">{post.caption}</p>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Eye size={12} className="text-red-500"/> {post.views}</span>
                                <span className="flex items-center gap-1"><Heart size={12} className="text-red-500"/> {post.likes}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </main>
    </div>
  );
};

// --- Helpers ---
const KPICard = ({ label, value, growth }: { label: string, value: string, growth?: string }) => (
  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-black text-slate-900 tracking-tighter">{value}</span>
      {growth && <span className="text-[10px] font-bold text-green-500">+{growth}</span>}
    </div>
  </div>
);

const chartData = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i + 1}`,
  engagement: Math.floor(Math.random() * 2000) + 1000,
  views: Math.floor(Math.random() * 5000) + 3000,
}));

const pieData = [
  { name: 'Instagram', value: 62 },
  { name: 'TikTok', value: 38 },
];

const posts = [
  { platform: 'Instagram', views: '45.2K', likes: '8.4K', caption: 'Summer Energy with Volt!', isTop: true },
  { platform: 'TikTok', views: '89.1K', likes: '12.4K', caption: 'How I stay awake #ad' },
  { platform: 'Instagram', views: '12.5K', likes: '2.1K', caption: 'The new flavor is 🔥' },
  { platform: 'TikTok', views: '21.4K', likes: '3.1K', caption: 'Volt Energy Haul' },
];

export default CampaignAnalytics;