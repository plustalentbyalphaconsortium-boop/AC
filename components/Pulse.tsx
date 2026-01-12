
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { CpuChipIcon, ChartBarIcon, TrendingUpIcon, MapPinIcon } from './icons/Icons';

const Pulse: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPulse = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                const prompt = "Generate a realistic set of hiring trends and demand metrics for the Balkan region in 2024. Return JSON with 'velocity' (line data), 'sectors' (bar data), and 'growth' (percentage).";
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                growth: { type: Type.NUMBER },
                                velocity: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } } } },
                                sectors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, demand: { type: Type.NUMBER } } } }
                            }
                        }
                    }
                });
                setStats(JSON.parse(response.text));
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPulse();
    }, []);

    if (isLoading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-600/40"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Syncing Intelligence...</p>
            </div>
        </div>
    );

    return (
        <div className="py-12 md:py-16 px-6 max-w-7xl mx-auto space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                    <h2 className="text-3xl font-black font-orbitron uppercase tracking-tighter">Consortium <span className="text-blue-600">Pulse</span></h2>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time alliance hiring velocity.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Global Sync: Live</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-blue-600 p-8 rounded-xl text-white shadow-xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                        <TrendingUpIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Network Growth Index</h3>
                    <div className="text-6xl font-black font-orbitron">+{stats.growth}%</div>
                    <p className="text-[9px] mt-4 font-bold uppercase tracking-widest opacity-60">Consolidated Demand Acceleration</p>
                </div>
                
                <div className="lg:col-span-8 bg-white dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <TrendingUpIcon className="h-4 w-4" /> Hiring Velocity (30 Days)
                    </h3>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.velocity}>
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0c0c14', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800 p-6 rounded-xl">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-2">
                        <CpuChipIcon className="h-4 w-4" /> Sector Distribution
                    </h3>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.sectors}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 'bold' }} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0c0c14', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                                <Bar dataKey="demand" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800 p-5 rounded-xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-600">
                            <MapPinIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Primary Hub</h4>
                            <p className="text-xs text-gray-900 dark:text-gray-200 font-bold">Bucharest ↔ Dhaka</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800 p-5 rounded-xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-cyan-600/10 rounded-full flex items-center justify-center text-cyan-600">
                            <ChartBarIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Ethics Index</h4>
                            <p className="text-xs text-gray-900 dark:text-gray-200 font-bold">98.4% Transparency</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800 p-5 rounded-xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-600/10 rounded-full flex items-center justify-center text-violet-600">
                            <TrendingUpIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Avg Placement</h4>
                            <p className="text-xs text-gray-900 dark:text-gray-200 font-bold">18.5 Days</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pulse;
