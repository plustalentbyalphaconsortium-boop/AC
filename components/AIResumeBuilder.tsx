import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SparklesIcon, ClipboardIcon, LightbulbIcon, EnvelopeIcon, DocumentArrowDownIcon, CheckCircleIcon, ArrowPathIcon } from './icons/Icons';
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
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        setShowSuggestions(false);
    }, [data.headlineSuggestions]);

    const baseClasses = {
        container: 'p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-md shadow-inner font-sans text-sm relative group',
        headline: 'text-center text-xl sm:text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100',
        sectionTitle: 'text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200',
        hr: 'my-4 border-t border-gray-200 dark:border-gray-700',
        ul: 'list-disc list-inside space-y-1 pl-2',
        li: 'text-gray-600 dark:text-gray-400',
        p: 'text-gray-600 dark:text-gray-400'
    };

    const templateStyles: Record<Template, Partial<typeof baseClasses>> = {
        Modern: {},
        Classic: {
            headline: 'text-center text-lg sm:text-xl font-bold tracking-wider uppercase mb-2 text-gray-800 dark:text-gray-200',
            sectionTitle: 'text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 text-gray-700 dark:text-gray-300 border-b-2 pb-1 border-gray-300 dark:border-gray-600',
            hr: 'my-3 border-t border-gray-300 dark:border-gray-600',
        },
        Compact: {
            headline: 'text-center text-lg sm:text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100',
            sectionTitle: 'text-base sm:text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200',
            hr: 'my-2 border-t border-gray-200 dark:border-gray-700',
            ul: 'list-disc list-inside space-y-0.5 pl-2', 
        }
    };

    const templateClasses = { ...baseClasses, ...templateStyles[template] };

    return (
        <div className={templateClasses.container}>
            <div className="text-center mb-1 relative">
                <h2 className={templateClasses.headline}>{data.headline}</h2>
                <div className="flex items-center justify-center gap-4 mt-1">
                    {data.headlineSuggestions && data.headlineSuggestions.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowSuggestions(prev => !prev)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                            aria-expanded={showSuggestions}
                        >
                            {showSuggestions ? 'Hide' : 'Alternate'} Headlines
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onRegenerateHeadlines}
                        disabled={isRegeneratingHeadlines}
                        className="p-1 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:text-gray-400 disabled:cursor-wait"
                        title="Regenerate headline suggestions"
                    >
                        {isRegeneratingHeadlines ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <SparklesIcon className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
             {showSuggestions && (
                <div className="flex flex-wrap gap-2 justify-center my-3 animate-scale-in bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    {data.headlineSuggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onHeadlineChange(suggestion)}
                            className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 border text-left w-full ${
                                data.headline === suggestion
                                ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-sm'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 border-gray-300 dark:border-gray-600 hover:border-blue-300'
                            }`}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
            <hr className={templateClasses.hr} />
            
            <section>
                <h3 className={templateClasses.sectionTitle}>Summary</h3>
                <p className={templateClasses.p}>{data.summary}</p>
            </section>
            
            <section>
                <div className="flex justify-between items-center mt-4 mb-2">
                    <h3 className={templateClasses.sectionTitle}>Key Skills</h3>
                    <button
                        type="button"
                        onClick={onRegenerateSkills}
                        disabled={isRegeneratingSkills}
                        className="p-1 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:text-gray-400 disabled:cursor-wait"
                        aria-label="Regenerate key skills"
                    >
                        {isRegeneratingSkills ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <SparklesIcon className="h-4 w-4" />
                        )}
                    </button>
                </div>
                <ul className={templateClasses.ul}>
                    {data.keySkills.map((skill, i) => <li key={i} className={templateClasses.li}>{skill}</li>)}
                </ul>
            </section>
            
            <section>
                <h3 className={`${templateClasses.sectionTitle} mt-4 mb-2`}>Experience Highlights</h3>
                 <ul className={templateClasses.ul}>
                    {data.experienceHighlights.map((highlight, i) => <li key={i} className={templateClasses.li}>{highlight}</li>)}
                </ul>
            </section>

            <div className="mt-8 flex justify-center border-t border-gray-100 dark:border-gray-800 pt-6">
                <button
                    onClick={onCopy}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                        isCopied 
                        ? 'bg-green-600 text-white shadow-lg scale-105' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow hover:shadow-lg active:scale-95'
                    }`}
                >
                    {isCopied ? (
                        <><CheckCircleIcon className="h-5 w-5" /> Copied!</>
                    ) : (
                        <><ClipboardIcon className="h-5 w-5" /> Copy Text</>
                    )}
                </button>
            </div>
        </div>
    );
};

const CoverLetterPreview: React.FC<{ text: string }> = ({ text }) => (
    <div className="p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-md shadow-inner font-sans text-sm">
        <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
            {text}
        </pre>
    </div>
);

const AIResumeBuilder: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [userExperience, setUserExperience] = useState('');
    const [keyAchievements, setKeyAchievements] = useState('');
    const [error, setError] = useState('');
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [fileError, setFileError] = useState('');
    const [fileName, setFileName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<Template>('Modern');
    const [selectedTone, setSelectedTone] = useState<Tone>('Professional');
    const [activeTool, setActiveTool] = useState<ActiveTool>('resume');
    const [infoMessage, setInfoMessage] = useState('');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const [generatedResume, setGeneratedResume] = useState<AIResumeData | null>(null);
    const [isLoadingResume, setIsLoadingResume] = useState(false);
    const [isRegeneratingSkills, setIsRegeneratingSkills] = useState(false);
    const [isRegeneratingHeadlines, setIsRegeneratingHeadlines] = useState(false);
    const [resumeCopied, setResumeCopied] = useState(false);

    const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
    const [isLoadingCoverLetter, setIsLoadingCoverLetter] = useState(false);
    const [coverLetterCopied, setCoverLetterCopied] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);

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
        setFileError('');
        setFileName(file.name);

        try {
            const text = await parseFile(file);
            setUserExperience(text);
        } catch (err: any) {
            setFileError(err);
        } finally {
            setIsParsingFile(false);
        }
        event.target.value = '';
    };

    const handleGenerateResume = async () => {
        if (!jobDescription || !userExperience) {
            setError('Please fill in both job description and your experience.');
            return;
        }
        setIsLoadingResume(true);
        setError('');
        setGeneratedResume(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const prompt = `
                Create professional tailored resume content.
                Tone: ${selectedTone}
                Job: ${jobDescription}
                Experience: ${userExperience}
                Achievements: ${keyAchievements}

                Output JSON with:
                - headlineSuggestions: 4 variations
                - summary: 3-4 sentences
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
            const prompt = `Write a ${selectedTone} cover letter for: ${jobDescription}. Based on: ${userExperience}. Achievements: ${keyAchievements}. Body only.`;
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
            const prompt = `Generate 5 compelling resume headlines for this job: ${jobDescription}. Based on this experience: ${userExperience}. Tone: ${selectedTone}. JSON output only.`;
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
        doc.setFontSize(20);
        doc.text(generatedResume.headline, 10, 20);
        doc.setFontSize(12);
        doc.text("Summary", 10, 35);
        doc.text(doc.splitTextToSize(generatedResume.summary, 180), 10, 42);
        doc.save('resume.pdf');
    };

    return (
        <div className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-orbitron neon-text">AI Application Studio</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Instantly tailor your profile for any Balkan region opportunity.</p>
                </div>

                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 justify-center">
                    <button onClick={() => setActiveTool('resume')} className={`px-6 py-3 text-sm font-bold ${activeTool === 'resume' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Resume Builder</button>
                    <button onClick={() => setActiveTool('coverLetter')} className={`px-6 py-3 text-sm font-bold ${activeTool === 'coverLetter' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Cover Letter</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <section className="bg-white dark:bg-gray-800/40 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Job Description</label>
                            <textarea
                                rows={5}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm"
                                placeholder="Paste the job requirements here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </section>

                        <section className="bg-white dark:bg-gray-800/40 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Your Experience</label>
                                <label className="text-xs text-blue-600 font-bold cursor-pointer hover:underline">
                                    Upload PDF/DOCX
                                    <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                                </label>
                            </div>
                            <textarea
                                rows={5}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm"
                                placeholder="Paste your resume or background..."
                                value={userExperience}
                                onChange={(e) => setUserExperience(e.target.value)}
                            />
                            {fileName && <p className="text-xs text-green-500 mt-2">File Loaded: {fileName}</p>}
                        </section>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tone</label>
                                <select value={selectedTone} onChange={(e) => setSelectedTone(e.target.value as Tone)} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm">
                                    {tones.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Template</label>
                                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value as Template)} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm">
                                    {templates.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleMainAction}
                            disabled={isLoadingResume || isLoadingCoverLetter}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {(isLoadingResume || isLoadingCoverLetter) ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
                            Generate {activeTool === 'resume' ? 'Tailored Resume' : 'Cover Letter'}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="sticky top-24">
                            <div className="bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 min-h-[500px] overflow-hidden flex flex-col">
                                {activeTool === 'resume' && generatedResume ? (
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="p-4 flex justify-end gap-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                                             <button onClick={handleDownloadPdf} className="p-2 text-gray-500 hover:text-blue-600" title="Download PDF"><DocumentArrowDownIcon className="h-5 w-5" /></button>
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
                                    <div className="flex-1 overflow-y-auto p-4">
                                        <CoverLetterPreview text={generatedCoverLetter} />
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-gray-400">
                                        <SparklesIcon className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Generate content to see the live preview here.</p>
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