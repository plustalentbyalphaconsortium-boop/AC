
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { JOB_CATEGORIES } from '../constants';
import { Job, ApplicationStatus, JobAlertSubscription, UserProfile, GroundingChunk } from '../types';
import { getJobs, searchWebJobs } from '../api';
import { PencilIcon, TrashIcon, BellIcon, SparklesIcon, MagnifyingGlassIcon, BriefcaseIcon, CheckCircleIcon, ArrowPathIcon, AcademicCapIcon, MapPinIcon, XMarkIcon, ExclamationTriangleIcon, CommandLineIcon } from './icons/Icons';
import ApplicationModal from './ApplicationModal';
import { GoogleGenAI, Type } from "@google/genai";

const STATUS_STYLES: { [key in ApplicationStatus]: string } = {
    'Applied': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'Interviewing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Offer Received': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const APPLICATION_STATUSES: ApplicationStatus[] = ['Applied', 'Interviewing', 'Offer Received', 'Rejected'];

const highlightMatches = (text: string, searchTerm: string | undefined): React.ReactNode => {
    if (!text || !searchTerm?.trim()) return text;
    const searchWords = searchTerm.trim().split(/\s+/).filter(Boolean).map(word =>
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    if (searchWords.length === 0) return text;
    const regex = new RegExp(`(${searchWords.join('|')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, index) => {
                const isMatch = searchWords.some(word => new RegExp(`^${word}$`, 'i').test(part));
                return isMatch ? (
                    <mark key={index} className="bg-blue-100 dark:bg-blue-900/60 rounded-sm px-0.5 text-blue-800 dark:text-blue-200">
                        {part}
                    </mark>
                ) : part;
            })}
        </>
    );
};

const JobCard: React.FC<{
    job: Job;
    onUpdate: (id: number, updates: Partial<Pick<Job, 'applicationStatus' | 'notes'>>) => void;
    onClear: (id: number) => void;
    onApplyNow: (job: Job) => void;
    searchTerm?: string;
    userProfile: UserProfile | null;
}> = ({ job, onUpdate, onClear, onApplyNow, searchTerm, userProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [notes, setNotes] = useState(job.notes || '');
    const [status, setStatus] = useState(job.applicationStatus);
    const [matchAnalysis, setMatchAnalysis] = useState<{ score: number; reason: string; recommendedCourse?: string } | null>(null);
    const [isAnalyzingMatch, setIsAnalyzingMatch] = useState(false);

    const isTracked = job.applicationStatus !== undefined;

    useEffect(() => {
        setNotes(job.notes || '');
        setStatus(job.applicationStatus);
    }, [job]);

    const handleSave = () => {
        onUpdate(job.id, { applicationStatus: status, notes });
        setIsEditing(false);
    };

    const handleAnalyzeMatch = async () => {
        if (!userProfile?.masterResume) return;
        setIsAnalyzingMatch(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `Match Candidate to Job. Score 0-100. Return JSON. Role: ${job.title}. Description: ${job.description}. Resume: ${userProfile.masterResume.substring(0, 800)}`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER },
                            reason: { type: Type.STRING },
                            recommendedCourse: { type: Type.STRING }
                        },
                        required: ['score', 'reason', 'recommendedCourse']
                    }
                }
            });
            setMatchAnalysis(JSON.parse(response.text));
        } catch (error) {
            console.error("Match error:", error);
        } finally {
            setIsAnalyzingMatch(false);
        }
    };

    const getMatchColor = (score: number) => {
        if (score >= 80) return 'border-green-500/50 bg-green-50/10';
        if (score >= 50) return 'border-yellow-500/50 bg-yellow-50/10';
        return 'border-red-500/50 bg-red-50/10';
    };

    return (
        <li className={`bg-white dark:bg-gray-800/20 backdrop-blur-md p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col shadow-sm hover:shadow-xl relative group ${matchAnalysis ? getMatchColor(matchAnalysis.score) : job.isExternal ? 'border-blue-500/10' : 'border-gray-100 dark:border-gray-800'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-grow pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        {job.isExternal ? (
                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                <ArrowPathIcon className="h-2.5 w-2.5 animate-spin-slow" /> Nexus Live
                            </span>
                        ) : (
                            <span className="text-[9px] font-black uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                                Verified Internal
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight font-orbitron group-hover:text-blue-500 transition-colors">
                        {highlightMatches(job.title, searchTerm)}
                    </h3>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">{job.company}</p>
                </div>
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isTracked ? STATUS_STYLES[job.applicationStatus!] : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {isTracked ? job.applicationStatus : job.type}
                </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mb-4">
                <MapPinIcon className="h-3.5 w-3.5" /> {job.location}
            </div>

            <div className="flex-grow">
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4">
                    {job.description}
                </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                {matchAnalysis ? (
                    <div className="bg-blue-600/5 p-3 rounded-xl border border-blue-500/20 animate-scale-in">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Match Score</span>
                            <span className={`text-lg font-black font-orbitron ${matchAnalysis.score > 70 ? 'text-green-500' : 'text-yellow-500'}`}>{matchAnalysis.score}%</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight italic">"{matchAnalysis.reason}"</p>
                    </div>
                ) : userProfile?.masterResume && (
                    <button 
                        onClick={handleAnalyzeMatch}
                        disabled={isAnalyzingMatch}
                        className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/30 rounded-xl transition-all"
                    >
                        {isAnalyzingMatch ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : <SparklesIcon className="h-3 w-3" />}
                        {isAnalyzingMatch ? 'Analyzing Fit...' : 'AI Vibe Match'}
                    </button>
                )}

                <div className="flex gap-2">
                    {!isTracked ? (
                        job.isExternal ? (
                            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-blue-500 transition-all active:scale-95">
                                Apply Externally ↗
                            </a>
                        ) : (
                            <button onClick={() => onApplyNow(job)} className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg hover:bg-blue-500 transition-all active:scale-95">
                                Quick Apply
                            </button>
                        )
                    ) : !isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-700/50 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-white hover:bg-gray-200 transition-all">
                            <PencilIcon className="h-4 w-4" /> Manage Tracking
                        </button>
                    ) : (
                        <div className="flex-1 flex gap-2">
                             <button onClick={() => { onClear(job.id); setIsEditing(false); }} className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><TrashIcon className="h-5 w-5" /></button>
                             <button onClick={handleSave} className="flex-1 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Update</button>
                             <button onClick={() => setIsEditing(false)} className="p-2.5 bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300"><XMarkIcon className="h-5 w-5" /></button>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};

const JobSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800/10 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
        <div className="space-y-2 mb-8">
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-5/6"></div>
        </div>
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
    </div>
);

const JobSearch: React.FC<{ initialSearchTerm?: string; initialCategory?: string }> = ({ initialSearchTerm = '', initialCategory = 'All' }) => {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [externalJobs, setExternalJobs] = useState<Job[]>([]);
    const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isWebSearching, setIsWebSearching] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [applyingForJob, setApplyingForJob] = useState<Job | null>(null);

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                // Internal Jobs
                const internal = await getJobs();
                const tracked = JSON.parse(localStorage.getItem('trackedJobs') || '{}');
                setAllJobs(internal.map(j => ({ ...j, ...(tracked[j.id] || {}) })));
                
                // Profile
                const profile = localStorage.getItem('userProfile');
                if (profile) setUserProfile(JSON.parse(profile));

                // Auto-scan for Nexus jobs on mount
                handleWebSearch('Balkan Jobs', activeCategory);
            } catch (err) {
                console.error("Initial load error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleWebSearch = async (query: string, category: string) => {
        setIsWebSearching(true);
        try {
            const { jobs, sources } = await searchWebJobs(query, category);
            setExternalJobs(jobs);
            setGroundingSources(sources);
        } catch (e) {
            console.error("External search failed", e);
        } finally {
            setIsWebSearching(false);
        }
    };

    const handleUpdateJob = (jobId: number, updates: any) => {
        const updated = allJobs.map(j => j.id === jobId ? { ...j, ...updates } : j);
        setAllJobs(updated);
        const tracked = updated.reduce((acc, j) => {
            if (j.applicationStatus) acc[j.id] = { applicationStatus: j.applicationStatus, notes: j.notes };
            return acc;
        }, {} as any);
        localStorage.setItem('trackedJobs', JSON.stringify(tracked));
    };

    const handleClearTracking = (jobId: number) => {
        const updated = allJobs.map(j => {
            if (j.id === jobId) {
                const { applicationStatus, notes, ...rest } = j;
                return rest as Job;
            }
            return j;
        });
        setAllJobs(updated);
        const tracked = JSON.parse(localStorage.getItem('trackedJobs') || '{}');
        delete tracked[jobId];
        localStorage.setItem('trackedJobs', JSON.stringify(tracked));
    };

    const filteredJobs = useMemo(() => {
        const combined = [...externalJobs, ...allJobs];
        return combined.filter(j => {
            const matchesCat = activeCategory === 'All' || j.category === activeCategory;
            const query = searchTerm.toLowerCase().trim();
            const matchesSearch = !query || 
                j.title.toLowerCase().includes(query) || 
                j.company.toLowerCase().includes(query) || 
                j.location.toLowerCase().includes(query);
            return matchesCat && matchesSearch;
        }).sort((a, b) => (a.isExternal === b.isExternal ? 0 : a.isExternal ? -1 : 1));
    }, [allJobs, externalJobs, activeCategory, searchTerm]);

    const searchQuality = Math.min(100, (searchTerm.length / 30) * 100);
    const searchColor = searchQuality > 70 ? 'bg-green-500' : searchQuality > 30 ? 'bg-blue-500' : 'bg-gray-400';

    return (
        <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black font-orbitron text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                        Opportunity <span className="text-blue-500">Explorer</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">
                        Scanning the Alpha Nexus live for ethical, middleman-free roles in the Balkan region.
                    </p>
                </div>

                {/* Advanced Search Header */}
                <div className="bg-white dark:bg-gray-800/20 p-6 rounded-3xl border border-gray-200 dark:border-blue-500/20 shadow-2xl mb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                        <div className="lg:col-span-7 space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Intelligence</label>
                                <span className={`text-[9px] font-bold ${searchTerm.length > 50 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {searchTerm.length} / 50
                                </span>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value.slice(0, 50))}
                                    placeholder="Search by role, company, or skills..."
                                    className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-inner font-medium"
                                />
                                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-500 ${searchColor}`} style={{ width: `${searchQuality}%` }}></div>
                                </div>
                            </div>
                            {searchTerm.length > 0 && searchTerm.length < 5 && (
                                <p className="text-[9px] text-blue-500 font-bold flex items-center gap-1 animate-pulse">
                                    <ExclamationTriangleIcon className="h-3 w-3" /> Tip: Add more keywords for better AI Vibe matching.
                                </p>
                            )}
                        </div>

                        <div className="lg:col-span-3 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Industry Sector</label>
                            <select 
                                value={activeCategory} 
                                onChange={(e) => setActiveCategory(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                            >
                                {JOB_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <button 
                                onClick={() => handleWebSearch(searchTerm || 'Balkan jobs', activeCategory)}
                                disabled={isWebSearching}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] py-5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isWebSearching ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                                Nexus Scan
                            </button>
                        </div>
                    </div>
                </div>

                {/* SEO Grounding Sources Section */}
                {groundingSources.length > 0 && (
                    <div className="mb-12 animate-slide-up">
                        <div className="flex items-center gap-3 mb-4">
                            <CommandLineIcon className="h-4 w-4 text-blue-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Verified Search Grounding</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {groundingSources.map((source, i) => (
                                <a 
                                    key={i} 
                                    href={source.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-blue-900/10 border border-gray-200 dark:border-blue-500/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 transition-all flex items-center gap-2"
                                >
                                    <CheckCircleIcon className="h-3 w-3" />
                                    {source.web.title || 'Search Source'}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Feed Controls */}
                <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h3 className="text-xl font-bold font-orbitron flex items-center gap-2">
                        <BriefcaseIcon className="h-5 w-5 text-blue-500" />
                        Live Feed 
                        <span className="text-xs font-medium text-gray-400 ml-2">({filteredJobs.length} matches)</span>
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Streaming Nexus Data</span>
                        </div>
                    </div>
                </div>

                {/* Main Results Grid */}
                {isLoading || isWebSearching ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => <li key={i}><JobSkeleton /></li>)}
                    </ul>
                ) : filteredJobs.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredJobs.map(job => (
                            <JobCard 
                                key={job.id} 
                                job={job} 
                                onUpdate={handleUpdateJob} 
                                onClear={handleClearTracking} 
                                onApplyNow={setApplyingForJob} 
                                searchTerm={searchTerm}
                                userProfile={userProfile}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-24 bg-white dark:bg-gray-800/10 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MagnifyingGlassIcon className="h-8 w-8 text-gray-300" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white font-orbitron uppercase">No Matches Found</h4>
                        <p className="text-gray-500 text-sm mt-2">Try expanding your search parameters or scanning a different sector.</p>
                        <button onClick={() => { setSearchTerm(''); setActiveCategory('All'); }} className="mt-6 text-blue-500 font-black uppercase text-[10px] tracking-widest hover:underline">Reset Filters</button>
                    </div>
                )}
            </div>

            {applyingForJob && (
                <ApplicationModal
                    job={applyingForJob}
                    onClose={() => setApplyingForJob(null)}
                    onSubmit={(id) => handleUpdateJob(id, { applicationStatus: 'Applied', notes: 'Applied via Alpha Nexus' })}
                />
            )}
            
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default JobSearch;
