
import React from 'react';
import { View, Feature } from '../types';

interface HeroProps {
    features: Feature[];
    setActiveView: (view: View) => void;
}

const AlphaBanner: React.FC = () => {
    return (
        <div className="relative group select-none">
            <div className="absolute -inset-10 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-colors duration-700"></div>
            <div className="relative z-10 space-y-[-0.3rem]">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 uppercase leading-none opacity-90">
                    ALPHA
                </h2>
                <h2 className="text-3xl md:text-5xl font-black tracking-[0.4em] text-blue-600/90 uppercase leading-none pl-1">
                    CONSORTIUM
                </h2>
                <div className="mt-6 flex items-center gap-4 border-l-2 border-blue-600 pl-4 py-1">
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] leading-tight">
                        Strategic Talent Corridor <br/> Balkans • South Asia
                    </p>
                </div>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ feature: Feature; setActiveView: (view: View) => void; }> = ({ feature, setActiveView }) => {
    const { icon: Icon, title, description, view } = feature;
    return (
        <button
            onClick={() => setActiveView(view)}
            className="group relative bg-white dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800/50 p-6 text-left transition-all duration-300 hover:border-blue-600/40 hover:bg-blue-600/[0.01] flex flex-col min-h-[160px]"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 flex items-center justify-center rounded bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    {Icon ? <Icon className="h-5 w-5" /> : <div className="h-5 w-5 bg-blue-500 rounded-full" />}
                </div>
                <span className="text-[8px] font-black tracking-widest text-gray-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Launch Module</span>
            </div>
            <h3 className="text-[11px] font-black text-gray-900 dark:text-white font-orbitron uppercase tracking-widest mb-2">{title}</h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium line-clamp-2">{description}</p>
            <div className="absolute bottom-0 left-0 h-[2px] bg-blue-600 w-0 group-hover:w-full transition-all duration-500"></div>
        </button>
    );
};

const Hero: React.FC<HeroProps> = ({ features, setActiveView }) => {
    const seekerFeatures = features.slice(0, 9);
    const employerFeatures = features.slice(9);

    return (
        <div className="relative overflow-hidden bg-white dark:bg-[#05050a]">
            {/* Ambient Ticker */}
            <div className="bg-gray-50 dark:bg-blue-900/10 border-y border-gray-100 dark:border-gray-800/50 py-2 overflow-hidden whitespace-nowrap">
                <div className="animate-marquee inline-block text-[9px] font-black uppercase tracking-[0.2em] text-blue-600/60 dark:text-blue-400/40">
                    Nepal Node Active • Bangladesh Compliance 98% • Romania Demand High • Visa Processing: 14 Days Average • New Nepalese Technical Alliances Forming •
                </div>
                <div className="animate-marquee inline-block text-[9px] font-black uppercase tracking-[0.2em] text-blue-600/60 dark:text-blue-400/40">
                    Nepal Node Active • Bangladesh Compliance 98% • Romania Demand High • Visa Processing: 14 Days Average • New Nepalese Technical Alliances Forming •
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-12 md:py-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    <div className="lg:col-span-7 space-y-8">
                        <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-blue-600/20 bg-blue-600/5 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                            </span>
                            Consortium Nexus: Active
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white font-orbitron leading-[0.95] tracking-tighter">
                            THE ETHICAL <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">TALENT ALLIANCE</span>
                        </h1>
                        <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg font-medium leading-relaxed">
                            Connecting industrial excellence in South Asia directly with Balkan manufacturing and tech hubs. Data-driven and strategic.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <button onClick={() => setActiveView(View.Jobs)} className="px-8 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0">
                                Secure Opportunity
                            </button>
                            <button onClick={() => setActiveView(View.HRServices)} className="px-8 py-4 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                                For Employers
                            </button>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-5 flex justify-center lg:justify-end">
                        <AlphaBanner />
                    </div>
                </div>

                <div className="mt-24 space-y-24">
                    <section>
                        <div className="flex items-center gap-6 mb-8">
                            <h2 className="text-sm font-black text-gray-900 dark:text-white font-orbitron uppercase tracking-[0.3em]">Alliance Capabilities</h2>
                            <div className="h-px flex-grow bg-gradient-to-r from-blue-600/20 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50">
                            {seekerFeatures.map(f => <FeatureCard key={f.view} feature={f} setActiveView={setActiveView} />)}
                        </div>
                    </section>

                    <section className="bg-gray-50/50 dark:bg-[#0c0c14]/50 -mx-6 px-6 py-16 border-y border-gray-100 dark:border-gray-900">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex items-center gap-6 mb-8">
                                <h2 className="text-sm font-black text-gray-900 dark:text-white font-orbitron uppercase tracking-[0.3em]">Corporate Infrastructure</h2>
                                <div className="h-px flex-grow bg-gradient-to-r from-cyan-600/20 to-transparent"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {employerFeatures.map(f => <FeatureCard key={f.view} feature={f} setActiveView={setActiveView} />)}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    animation: marquee 40s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Hero;
