import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { useTheme } from '../contexts/ThemeContext';
import { View, Job } from '../types';
import { JOB_CATEGORIES } from '../constants';
import { 
    DocumentPlusIcon, 
    SparklesIcon, 
    CheckCircleIcon, 
    MagnifyingGlassIcon, 
    ChartBarIcon, 
    ExclamationTriangleIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    ArrowPathIcon
} from './icons/Icons';

interface PostJobProps {
    setActiveView: (view: View) => void;
}

const GoogleSnippetPreview: React.FC<{ job: any }> = ({ job }) => (
  <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm font-sans max-w-xl">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">A</div>
      <div className="text-xs text-gray-800 dark:text-gray-300">alphaconsortium.ai › jobs › {job.category.toLowerCase()}</div>
    </div>
    <div className="text-xl text-blue-800 dark:text-blue-400 hover:underline cursor-pointer mb-1">
      {job.title || 'Job Title'} - {job.company || 'Company Name'}
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
      <span className="text-gray-500 dark:text-gray-500 mr-1">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —</span>
      {job.description || 'Provide a description to see how it will appear in Google Search results...'}
    </div>
  </div>
);

const PostJob: React.FC<PostJobProps> = ({ setActiveView }) => {
    const { theme } = useTheme();
    const [jobData, setJobData] = useState({
        title: '',
        company: '',
        location: '',
        type: 'Full-time' as 'Full-time' | 'Part-time' | 'Contract',
        category: JOB_CATEGORIES[1], 
        description: '',
        salaryMin: '',
        salaryMax: '',
        qualifications: '',
    });
    const [isPosting, setIsPosting] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        firstInputRef.current?.focus();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setJobData(prev => ({ ...prev, [name]: value }));
    };

    // SEO Scoring Logic
    const seoMetrics = useMemo(() => {
        const desc = jobData.description.toLowerCase();
        const wordCount = jobData.description.split(/\s+/).filter(Boolean).length;
        
        return {
            hasResponsibilities: desc.includes('responsibilities') || desc.includes('what you will do') || desc.includes('role'),
            hasQualifications: desc.includes('qualifications') || desc.includes('requirements') || desc.includes('what we look for'),
            hasBenefits: desc.includes('benefits') || desc.includes('perks') || desc.includes('what we offer'),
            hasLocation: jobData.location.length > 2,
            hasSalary: jobData.salaryMin !== '' || jobData.salaryMax !== '',
            idealLength: wordCount >= 100 && wordCount <= 400,
            wordCount
        };
    }, [jobData]);

    const strengthScore = useMemo(() => {
        let score = 0;
        if (seoMetrics.hasResponsibilities) score += 20;
        if (seoMetrics.hasQualifications) score += 20;
        if (seoMetrics.hasBenefits) score += 20;
        if (seoMetrics.hasLocation) score += 10;
        if (seoMetrics.hasSalary) score += 15;
        if (seoMetrics.idealLength) score += 15;
        return score;
    }, [seoMetrics]);

    const handleEnhanceDescription = async () => {
        if (!jobData.title || !jobData.description) {
            setError("Please provide a Job Title and a basic Description to enhance.");
            return;
        }
        setIsEnhancing(true);
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a world-class Industrial Recruitment Copywriter for Alpha Consortium.
                Rewrite this job description to be elite, professional, and SEO-optimized for the Balkan-South Asia industrial talent corridor.
                
                **Context:**
                We are recruiting skilled professionals (often from Bangladesh/Nepal) for roles in the Balkans (e.g., Romania, Croatia).
                The tone should be: High-status, secure, transparent, and authoritative.
                
                **Directives:**
                1. Structural Excellence: Use headers for [Core Mission], [Key Responsibilities], [Required Technical Expertise], and [Alliance Benefits].
                2. SEO Injection: Naturally weave in "${jobData.title}" and "${jobData.location}".
                3. Clarity: Remove all corporate fluff. Use punchy bullet points.
                4. Engagement: Highlight the strategic value of the role within the "Alpha Consortium Alliance".
                
                **Input Metadata:**
                - Role: ${jobData.title}
                - Location: ${jobData.location}
                - Salary Logic: ${jobData.salaryMin && jobData.salaryMax ? `$${jobData.salaryMin} - $${jobData.salaryMax}` : 'Confidential'}
                - Raw Requirements: ${jobData.qualifications}
                
                **Draft Content:**
                ${jobData.description}

                Output ONLY the formatted, optimized description text.
            `;
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            setJobData(prev => ({ ...prev, description: response.text }));
        } catch (e) {
            console.error(e);
            setError("Nexus link unstable. Please retry optimization.");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const requiredFields: (keyof typeof jobData)[] = ['title', 'company', 'location', 'description'];
        for (const field of requiredFields) {
            if (!jobData[field]) {
                // Fix: Wrap 'field' in String() to avoid implicit symbol-to-string conversion error in template literal
                setError(`Please complete the ${String(field)} sector.`);
                return;
            }
        }
        
        setIsPosting(true);
        setError('');
        setSuccess('');

        setTimeout(() => {
            try {
                const { salaryMin, salaryMax, ...restOfJobData } = jobData;
                const newJob: Job = {
                    ...restOfJobData,
                    id: Date.now(),
                    postedDate: new Date().toISOString().split('T')[0],
                    salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
                    salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
                };

                const savedJobsData = localStorage.getItem('postedJobs');
                const postedJobs: Job[] = savedJobsData ? JSON.parse(savedJobsData) : [];
                postedJobs.unshift(newJob);
                localStorage.setItem('postedJobs', JSON.stringify(postedJobs));

                setSuccess(`Deployment Successful: "${newJob.title}" is live on the Nexus.`);
                setTimeout(() => {
                    setActiveView(View.Jobs);
                }, 2500);

            } catch (storageError) {
                setError("Protocol Error: Local registry full.");
                setIsPosting(false);
            }
        }, 1500);
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#05050a] min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4 bg-blue-600/5 px-4 py-1 rounded-full border border-blue-600/20">
                        Employer Registry Hub
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white font-orbitron uppercase">
                        Initialize <span className="text-blue-600">Opportunity</span>
                    </h2>
                    <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: theme === 'dark' ? '#d1d5db' : '#4b5563', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto', fontWeight: 500 }}>
                        Deploy high-visibility job listings across the Alpha Nexus industrial corridors.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-7">
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0c0c14] backdrop-blur-sm p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Position Title</label>
                                    <input ref={firstInputRef} type="text" name="title" id="title" required value={jobData.title} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" placeholder="e.g., Technical Welder" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="company" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Employer Entity</label>
                                    <input type="text" name="company" id="company" required value={jobData.company} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" placeholder="Consortium Partner" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Balkan Hub</label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input type="text" name="location" id="location" required value={jobData.location} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" placeholder="Romania, etc." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Industry Sector</label>
                                    <select id="category" name="category" value={jobData.category} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold appearance-none">
                                        {JOB_CATEGORIES.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contract Logic</label>
                                    <select id="type" name="type" value={jobData.type} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold appearance-none">
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Contract">Contract</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="salaryMin" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salary Floor (EUR)</label>
                                    <div className="relative">
                                        <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input type="number" name="salaryMin" id="salaryMin" value={jobData.salaryMin} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" placeholder="1200" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="salaryMax" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salary Ceiling (EUR)</label>
                                    <div className="relative">
                                        <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input type="number" name="salaryMax" id="salaryMax" value={jobData.salaryMax} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" placeholder="2500" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deployment Manifesto (Description)</label>
                                    <button 
                                        type="button" 
                                        onClick={handleEnhanceDescription} 
                                        disabled={isEnhancing || !jobData.description} 
                                        className="inline-flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                    >
                                        {isEnhancing ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : <SparklesIcon className="h-3 w-3" />}
                                        {isEnhancing ? 'Optimizing...' : 'AI SEO Forge'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <textarea name="description" id="description" rows={8} required value={jobData.description} onChange={handleInputChange} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[200px]" placeholder="Outline the core responsibilities and benefits..." />
                                    
                                    {/* Real-time Strength Meter */}
                                    <div className="absolute bottom-4 right-4 flex items-center gap-3 bg-white dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800 rounded-full px-4 py-1 shadow-sm">
                                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-700 ${strengthScore > 70 ? 'bg-green-500' : strengthScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                style={{ width: `${strengthScore}%` }} 
                                            />
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Strength: {strengthScore}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center pt-4">
                                <button type="submit" disabled={isPosting || !!success} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-2xl transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:transform-none">
                                    {isPosting ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                            Broadcasting to Nexus...
                                        </span>
                                    ) : success ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <CheckCircleIcon className="h-4 w-4" />
                                            Deployment Active
                                        </span>
                                    ) : 'Initialize Live Listing'}
                                </button>
                                {error && <p className="mt-4 text-red-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">{error}</p>}
                                {success && <p className="mt-4 text-green-500 text-[10px] font-bold uppercase tracking-widest">{success}</p>}
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-5 space-y-8 sticky top-24">
                        <div className="space-y-4">
                             <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                <MagnifyingGlassIcon className="h-4 w-4 text-blue-600" />
                                Search Intelligence Preview
                            </h3>
                            <GoogleSnippetPreview job={jobData} />
                            <p className="text-[9px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                                Our Nexus Engine auto-populates Schema.org/JobPosting JSON-LD for maximum visibility on Google Job Search.
                            </p>
                        </div>
                        
                        <div className="bg-white dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800 p-8 rounded-3xl shadow-xl space-y-6">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                <ChartBarIcon className="h-4 w-4 text-blue-600" />
                                SEO Audit Dashboard
                            </h3>
                            
                            <div className="space-y-4">
                                <ChecklistRow label="Hub Location Specificity" checked={seoMetrics.hasLocation} />
                                <ChecklistRow label="Salary Transparency Score" checked={seoMetrics.hasSalary} />
                                <ChecklistRow label="Duty Matrix (Responsibilities)" checked={seoMetrics.hasResponsibilities} />
                                <ChecklistRow label="Technical Bar (Qualifications)" checked={seoMetrics.hasQualifications} />
                                <ChecklistRow label="Alliance Perks (Benefits)" checked={seoMetrics.hasBenefits} />
                                <ChecklistRow label="Ideal Density (100-400 words)" checked={seoMetrics.idealLength} subtext={`${seoMetrics.wordCount} words current`} />
                            </div>

                            <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                                <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/20">
                                    <h4 className="text-[10px] font-black uppercase text-blue-600 mb-2 flex items-center gap-2">
                                        <SparklesIcon className="h-3 w-3" />
                                        Alpha Strategist Tip
                                    </h4>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400/90 font-medium leading-relaxed">
                                        Jobs with transparent <span className="font-black">EUR salary ranges</span> and clear <span className="font-black">relocation support headers</span> see 4.2x higher engagement from elite South Asian technical talent.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChecklistRow: React.FC<{ label: string; checked: boolean; subtext?: string }> = ({ label, checked, subtext }) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${checked ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-gray-100 dark:bg-gray-800 text-transparent'}`}>
                <CheckCircleIcon className="h-3 w-3" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${checked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{label}</span>
        </div>
        {subtext && <span className="text-[9px] font-black text-gray-500 dark:text-gray-600 uppercase tracking-tighter">{subtext}</span>}
        {!checked && <ExclamationTriangleIcon className="h-3 w-3 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
);

export default PostJob;