import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SparklesIcon, ClipboardIcon, LightbulbIcon, EnvelopeIcon, DocumentArrowDownIcon, CheckCircleIcon, ArrowPathIcon, RocketLaunchIcon, BriefcaseIcon, UserCircleIcon, ExclamationTriangleIcon } from './icons/Icons';
import { parseFile } from '../utils/fileParser';
import { AIResumeData, UserProfile } from '../types';

declare const jspdf: any;

type Template = 'Modern' | 'Classic' | 'Compact';
type Tone = 'Professional' | 'Creative' | 'Bold';
type ActiveTool = 'resume' | 'coverLetter';

interface ResumePreviewProps {
    data: AIResumeData;
    template: Template;
    onRegenerateSkills: () => void;
    isRegeneratingSkills: boolean;
    onRegenerateHeadlines: () => void;
    isRegeneratingHeadlines: boolean;
    onHeadlineChange: (newHeadline: string) => void;
    onCopy: () => void;
    isCopied: boolean;
}

const HeadlineArchetypes = ['The Authority', 'The Innovator', 'The Results-Driven', 'The Visionary'];

const ResumePreview: React.FC<ResumePreviewProps> = ({ 
    data, 
    template, 
    onRegenerateSkills, 
    isRegeneratingSkills, 
    onRegenerateHeadlines,
    isRegeneratingHeadlines,
    onHeadlineChange,
    onCopy,
    isCopied
}) => {
    const baseClasses = {
        container: 'p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-md shadow-inner font-sans text-sm relative group',
        headline: 'text-center text-xl sm:text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100 font-orbitron',
        sectionTitle: 'text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-1 mb-3',
        hr: 'my-6 border-t border-gray-200 dark:border-gray-700',
        ul: 'list-disc list-inside space-y-1.5 pl-2',
        li: 'text-gray-600 dark:text-gray-400',
        p: 'text-gray-600 dark:text-gray-400 leading-relaxed'
    };

    const templateStyles: Record<Template, Partial<typeof baseClasses>> = {
        Modern: {},
        Classic: {
            headline: 'text-center text-lg sm:text-xl font-bold tracking-wider uppercase mb-2 text-gray-800 dark:text-gray-200',
            sectionTitle: 'text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 text-gray-700 dark:text-gray-300 border-b-2 pb-1 border-gray-300 dark:border-gray-600',
        },
        Compact: {
            headline: 'text-center text-lg sm:text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100',
            sectionTitle: 'text-base sm:text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200',
            hr: 'my-4 border-t border-gray-200 dark:border-gray-700',
        }
    };

    const templateClasses = { ...baseClasses, ...templateStyles[template] };

    return (
        <div className={templateClasses.container}>
            {/* Unique Feature: Headline Archetype Switcher */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Tailored Headlines</span>
                    <button
                        type="button"
                        onClick={onRegenerateHeadlines}
                        disabled={isRegeneratingHeadlines}
                        className="text-xs flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                        {isRegeneratingHeadlines ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : <ArrowPathIcon className="h-3 w-3" />}
                        Refresh Variations
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {data.headlineSuggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => onHeadlineChange(suggestion)}
                            className={`p-2 rounded-lg text-[10px] font-bold transition-all border text-center ${
                                data.headline === suggestion
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-400'
                            }`}
                        >
                            <div className="opacity-50 mb-1">{HeadlineArchetypes[i]}</div>
                            <div className="truncate">{suggestion}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center mb-8">
                <h2 className={templateClasses.headline}>{data.headline}</h2>
                <div className="w-16 h-1 bg-blue-600 mx-auto mt-2 rounded-full"></div>
            </div>
            
            <section>
                <h3 className={templateClasses.sectionTitle}>Strategic Summary</h3>
                <p className={templateClasses.p}>{data.summary}</p>
            </section>
            
            <section className="mt-8">
                <div className="flex justify-between items-center mb-2">
                    <h3 className={templateClasses.sectionTitle}>Key Skills</h3>
                    <button
                        type="button"
                        // Fix: Changed handleRegenerateSkills to onRegenerateSkills to match props
                        onClick={onRegenerateSkills}
                        disabled={isRegeneratingSkills}
                        className="p-1 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        <SparklesIcon className={`h-4 w-4 ${isRegeneratingSkills ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {data.keySkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700">
                            {skill}
                        </span>
                    ))}
                </div>
            </section>
            
            <section className="mt-8">
                <h3 className={templateClasses.sectionTitle}>Experience Highlights</h3>
                 <ul className={templateClasses.ul}>
                    {data.experienceHighlights.map((highlight, i) => <li key={i} className={templateClasses.li}>{highlight}</li>)}
                </ul>
            </section>

            <div className="mt-12 flex justify-center border-t border-gray-100 dark:border-gray-800 pt-6 gap-4">
                <button
                    onClick={onCopy}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                        isCopied 
                        ? 'bg-green-600 text-white shadow-lg scale-105' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95'
                    }`}
                >
                    {isCopied ? <CheckCircleIcon className="h-5 w-5" /> : <ClipboardIcon className="h-5 w-5" />}
                    {isCopied ? 'Copied!' : 'Copy Text'}
                </button>
            </div>
        </div>
    );
};

const CoverLetterPreview: React.FC<{ text: string }> = ({ text }) => (
    <div className="p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-md shadow-inner font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        <pre className="whitespace-pre-wrap font-sans">
            {text}
        </pre>
    </div>
);

// Helper component for enhanced input fields
const EnhancedInput: React.FC<{
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    maxLength?: number;
    minLength?: number;
    showUpload?: boolean;
    // Fix: Updated prop type from () => void to include ChangeEvent argument
    onUploadClick?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileName?: string;
    id: string;
}> = ({ label, value, onChange, placeholder, maxLength = 5000, minLength = 50, showUpload, onUploadClick, fileName, id }) => {
    const charCount = value.length;
    const isTooShort = charCount > 0 && charCount < minLength;
    const isExceeding = charCount > maxLength;
    
    // Quality Score Logic (0-100)
    const qualityScore = Math.min(100, Math.max(0, (charCount / 800) * 100));
    const scoreColor = qualityScore > 70 ? 'bg-green-500' : qualityScore > 30 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <label htmlFor={id} className="block text-xs font-black uppercase tracking-widest text-gray-400">
                    {label}
                </label>
                <div className="flex items-center gap-3">
                    {showUpload && (
                         <label className="text-xs text-blue-600 font-bold cursor-pointer hover:underline flex items-center gap-1">
                            <ArrowPathIcon className="h-3 w-3" /> {fileName ? 'Change File' : 'Upload CV'}
                            <input type="file" className="hidden" accept=".pdf,.docx" onChange={onUploadClick as any} />
                        </label>
                    )}
                    <span className={`text-[10px] font-bold ${isExceeding ? 'text-red-500' : 'text-gray-500'}`}>
                        {charCount} / {maxLength}
                    </span>
                </div>
            </div>
            
            <div className="relative">
                <textarea
                    id={id}
                    rows={6}
                    className={`w-full bg-gray-50 dark:bg-gray-900 border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans leading-relaxed ${
                        isTooShort ? 'border-yellow-400 shadow-[0_0_0_1px_rgba(250,204,21,0.5)]' : 
                        isExceeding ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.5)]' : 
                        'border-gray-200 dark:border-gray-700'
                    }`}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                
                {/* Visual Quality Bar */}
                <div className="absolute bottom-3 right-3 w-20 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden opacity-40 hover:opacity-100 transition-opacity">
                    <div 
                        className={`h-full transition-all duration-700 ${scoreColor}`} 
                        style={{ width: `${qualityScore}%` }}
                    />
                </div>
            </div>

            <div className="flex justify-between items-start min-h-[1.5rem]">
                {isTooShort ? (
                    <p className="text-[10px] text-yellow-600 dark:text-yellow-500 font-bold flex items-center gap-1 animate-pulse">
                        <ExclamationTriangleIcon className="h-3 w-3" /> Input is quite short. More detail usually yields better results.
                    </p>
                ) : isExceeding ? (
                    <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                        <ExclamationTriangleIcon className="h-3 w-3" /> Character limit exceeded. Please shorten your input.
                    </p>
                ) : fileName ? (
                     <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3" /> {fileName} parsed successfully
                    </p>
                ) : null}
            </div>
        </div>
    );
};

const AIResumeBuilder: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [userExperience, setUserExperience] = useState('');
    const [keyAchievements, setKeyAchievements] = useState('');
    const [error, setError] = useState('');
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [fileName, setFileName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<Template>('Modern');
    const [selectedTone, setSelectedTone] = useState<Tone>('Professional');
    const [activeTool, setActiveTool] = useState<ActiveTool>('resume');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const [generatedResume, setGeneratedResume] = useState<AIResumeData | null>(null);
    const [isLoadingResume, setIsLoadingResume] = useState(false);
    const [isRegeneratingSkills, setIsRegeneratingSkills] = useState(false);
    const [isRegeneratingHeadlines, setIsRegeneratingHeadlines] = useState(false);
    const [resumeCopied, setResumeCopied] = useState(false);

    const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
    const [isLoadingCoverLetter, setIsLoadingCoverLetter] = useState(false);

    const templates: Template[] = ['Modern', 'Classic', 'Compact'];
    const tones: Tone[] = ['Professional', 'Creative', 'Bold'];
    
    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                const profile: UserProfile = JSON.parse(savedProfile);
                setUserProfile(profile);
                if (profile.masterResume && !userExperience) {
                    setUserExperience(profile.masterResume);
                }
            }
        } catch (error) {
            console.error("Failed to load user profile", error);
        }
    }, []);
    
     const handleMainAction = () => {
        if (activeTool === 'resume') handleGenerateResume();
        else handleGenerateCoverLetter();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsingFile(true);
        setFileName(file.name);

        try {
            const text = await parseFile(file);
            setUserExperience(text);
        } catch (err: any) {
            setError(err);
        } finally {
            setIsParsingFile(false);
        }
        event.target.value = '';
    };

    const handleGenerateResume = async () => {
        if (jobDescription.length < 20 || userExperience.length < 20) {
            setError('Please provide more detailed information in both fields for a quality resume.');
            return;
        }
        setIsLoadingResume(true);
        setError('');
        setGeneratedResume(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const prompt = `
                Create professional tailored resume content for a South Asian candidate moving to the Balkans.
                Tone: ${selectedTone}
                Job: ${jobDescription}
                Experience: ${userExperience}
                Achievements: ${keyAchievements}

                Output JSON with:
                - headlineSuggestions: 4 distinct variations (Professional, Innovative, Achievement-focused, Visionary)
                - summary: 3-4 sentences highlighting regional adaptability
                - keySkills: 8-10 items
                - experienceHighlights: 5 items
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            headlineSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            summary: { type: Type.STRING },
                            keySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            experienceHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['headlineSuggestions', 'summary', 'keySkills', 'experienceHighlights']
                    },
                }
            });
            
            const parsed = JSON.parse(response.text);
            setGeneratedResume({ ...parsed, headline: parsed.headlineSuggestions[0] });

        } catch (e: any) {
            console.error(e);
            setError('Failed to generate resume. Please try again.');
        } finally {
            setIsLoadingResume(false);
        }
    };
    
    const handleGenerateCoverLetter = async () => {
        if (!jobDescription || !userExperience) {
            setError('Please provide both job details and your background.');
            return;
        }
        setIsLoadingCoverLetter(true);
        setError('');
        setGeneratedCoverLetter(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Write a professional cover letter for a candidate applying from Bangladesh/Nepal to a Balkan company.
                Tone: ${selectedTone}
                Job: ${jobDescription}
                Candidate background: ${userExperience}
                Highlights: ${keyAchievements}
                
                Address regional relocation interest and cultural readiness. Output only the letter body.
            `;

            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setGeneratedCoverLetter(response.text);
        } catch (e) {
            setError('Failed to generate cover letter.');
        } finally {
            setIsLoadingCoverLetter(false);
        }
    };
    
    const handleRegenerateSkills = async () => {
        if (!jobDescription || !userExperience) return;
        setIsRegeneratingSkills(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `List 10 most relevant skills for this job: ${jobDescription}. Based on this experience: ${userExperience}. JSON output only.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { keySkills: { type: Type.ARRAY, items: { type: Type.STRING } } },
                        required: ['keySkills']
                    }
                }
            });
            const parsed = JSON.parse(response.text);
            setGeneratedResume(prev => prev ? { ...prev, keySkills: parsed.keySkills } : null);
        } catch (e) {
            setError('Failed to refresh skills.');
        } finally {
            setIsRegeneratingSkills(false);
        }
    };

    const handleRegenerateHeadlines = async () => {
        if (!jobDescription || !userExperience) return;
        setIsRegeneratingHeadlines(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `Generate 4 compelling resume headlines for this job: ${jobDescription}. Based on this experience: ${userExperience}. Tone: ${selectedTone}. JSON output only.`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { headlineSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
                        required: ['headlineSuggestions']
                    }
                }
            });
            const parsed = JSON.parse(response.text);
            setGeneratedResume(prev => prev ? { 
                ...prev, 
                headlineSuggestions: parsed.headlineSuggestions,
                headline: parsed.headlineSuggestions[0] 
            } : null);
        } catch (e) {
            setError('Failed to refresh headlines.');
        } finally {
            setIsRegeneratingHeadlines(false);
        }
    };

    const handleHeadlineChange = (newHeadline: string) => {
        setGeneratedResume(prev => prev ? { ...prev, headline: newHeadline } : null);
    };

    const handleCopyResume = () => {
        if (!generatedResume) return;
        const { headline, summary, keySkills, experienceHighlights } = generatedResume;
        const text = `${headline}\n\nSUMMARY\n${summary}\n\nSKILLS\n${keySkills.join(', ')}\n\nHIGHLIGHTS\n${experienceHighlights.join('\n')}`;
        navigator.clipboard.writeText(text).then(() => {
            setResumeCopied(true);
            setTimeout(() => setResumeCopied(false), 2000);
        });
    };

    const handleDownloadPdf = () => {
        if (!generatedResume) return;
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text(generatedResume.headline, 20, 20);
        doc.setFontSize(14);
        doc.text("Strategic Summary", 20, 35);
        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(generatedResume.summary, 170), 20, 42);
        doc.save('alpha_tailored_resume.pdf');
    };

    return (
        <div className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-orbitron neon-text">AI Application Studio</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Instantly tailor your profile for any Balkan region opportunity.</p>
                </div>

                <div className="flex border-b border-gray-200 dark:border-gray-800 mb-10 justify-center">
                    <button onClick={() => setActiveTool('resume')} className={`px-8 py-4 text-sm font-bold flex items-center gap-2 ${activeTool === 'resume' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <UserCircleIcon className="h-4 w-4" /> Resume Builder
                    </button>
                    <button onClick={() => setActiveTool('coverLetter')} className={`px-8 py-4 text-sm font-bold flex items-center gap-2 ${activeTool === 'coverLetter' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <EnvelopeIcon className="h-4 w-4" /> Cover Letter
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                            
                            <EnhancedInput 
                                id="resume-job-description"
                                label="Job Description"
                                placeholder="Paste the Balkan job requirements here..."
                                value={jobDescription}
                                onChange={setJobDescription}
                            />

                            <EnhancedInput 
                                id="resume-experience"
                                label="Your Experience"
                                placeholder="Paste your current resume or experience..."
                                value={userExperience}
                                onChange={setUserExperience}
                                showUpload
                                onUploadClick={handleFileChange}
                                fileName={fileName}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Voice Tone</label>
                                    <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value as Tone)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {tones.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                {activeTool === 'resume' && (
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Template</label>
                                        <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value as Template)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            {templates.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button
                                id="resume-generate-button"
                                onClick={handleMainAction}
                                disabled={isLoadingResume || isLoadingCoverLetter}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                            >
                                {(isLoadingResume || isLoadingCoverLetter) ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <RocketLaunchIcon className="h-5 w-5" />}
                                Generate {activeTool === 'resume' ? 'Tailored CV' : 'Cover Letter'}
                            </button>
                            {error && <p className="text-red-500 text-xs font-bold text-center animate-bounce mt-2">{error}</p>}
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="sticky top-24">
                            <div className="bg-gray-50 dark:bg-gray-800/10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 min-h-[600px] overflow-hidden flex flex-col shadow-inner">
                                {activeTool === 'resume' && generatedResume ? (
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                        <div className="p-4 flex justify-end gap-2 bg-white/80 dark:bg-black/40 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
                                             <button onClick={handleDownloadPdf} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors" title="Download PDF"><DocumentArrowDownIcon className="h-4 w-4" /> Download PDF</button>
                                        </div>
                                        <ResumePreview 
                                            data={generatedResume} 
                                            template={selectedTemplate} 
                                            onRegenerateSkills={handleRegenerateSkills}
                                            isRegeneratingSkills={isRegeneratingSkills}
                                            onRegenerateHeadlines={handleRegenerateHeadlines}
                                            isRegeneratingHeadlines={isRegeneratingHeadlines}
                                            onHeadlineChange={handleHeadlineChange}
                                            onCopy={handleCopyResume}
                                            isCopied={resumeCopied}
                                        />
                                    </div>
                                ) : activeTool === 'coverLetter' && generatedCoverLetter ? (
                                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                        <CoverLetterPreview text={generatedCoverLetter} />
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-pulse">
                                            <SparklesIcon className="h-10 w-10 text-blue-500 opacity-50" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-orbitron">Ready to Build</h3>
                                            <p className="text-gray-400 text-sm max-w-xs mx-auto">Fill in the job details to generate your optimized application content.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIResumeBuilder;