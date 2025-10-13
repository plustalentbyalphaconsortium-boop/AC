import React, { useState, useEffect } from 'react';
import { Job, UserProfile, AICoverLetterSuggestions, ResumeScore } from '../types';
import { XMarkIcon, BriefcaseIcon, SparklesIcon, CheckBadgeIcon } from './icons/Icons';
import { useModalFocus } from '../hooks/useModalFocus';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

type Tone = 'Professional' | 'Creative' | 'Bold';

const RadioButtonGroup: React.FC<{
    items: string[];
    selectedItem: string;
    onSelect: (item: string) => void;
    disabled?: boolean;
}> = ({ items, selectedItem, onSelect, disabled }) => (
    <div
        role="radiogroup"
        className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-900/50 p-1"
    >
        {items.map((item) => (
            <button
                key={item}
                type="button"
                role="radio"
                aria-checked={selectedItem === item}
                tabIndex={selectedItem === item ? 0 : -1}
                onClick={() => onSelect(item)}
                disabled={disabled}
                className={`w-full rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900 ${
                    selectedItem === item
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
            >
                {item}
            </button>
        ))}
    </div>
);

const ScoreDonut: React.FC<{ score: number }> = ({ score }) => {
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const scoreColor = score > 75 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    className="text-gray-200 dark:text-gray-600"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={scoreColor}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.1, 0.8, 0.2, 1)' }}
                />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-xl ${scoreColor}`}>
                {score}
            </div>
        </div>
    );
};


interface ApplicationModalProps {
    job: Job;
    onClose: () => void;
    onSubmit: (jobId: number) => void;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ job, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        coverLetter: ''
    });
    const [keyAchievements, setKeyAchievements] = useState('');
    const [selectedTone, setSelectedTone] = useState<Tone>('Professional');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizeError, setOptimizeError] = useState('');
    const [coverLetterSuggestions, setCoverLetterSuggestions] = useState<AICoverLetterSuggestions['suggestions'] | null>(null);
    const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState('');
    
    const modalRef = useModalFocus(onClose, true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                const profile: UserProfile = JSON.parse(savedProfile);
                setUserProfile(profile);
                setFormData(prev => ({
                    ...prev,
                    name: profile.name || '',
                    email: profile.email || '',
                }));
            }
        } catch (error) {
            console.error("Failed to load user profile from localStorage", error);
        }
    }, []);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'coverLetter') {
            setCoverLetterSuggestions(null);
            setOptimizeError('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || isSubmitted) return;
        
        setIsSubmitting(true);
        setTimeout(() => {
            onSubmit(job.id);
            setIsSubmitting(false);
            setIsSubmitted(true);
            
            setTimeout(() => {
                onClose();
            }, 2000);
        }, 1500);
    };
    
    const handleOptimizeCoverLetter = async () => {
        if (!formData.coverLetter) {
            setOptimizeError("Please write a draft cover letter first.");
            return;
        }

        setIsOptimizing(true);
        setOptimizeError('');
        setCoverLetterSuggestions(null);

        const suggestionsSchema = {
            type: Type.OBJECT,
            properties: {
                suggestions: {
                    type: Type.ARRAY,
                    description: "A list of 3-4 specific, actionable suggestions for improving the cover letter.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            suggestion: { type: Type.STRING, description: 'The core suggestion.' },
                            why: { type: Type.STRING, description: 'A brief explanation of why this suggestion is important.' },
                            example: { type: Type.STRING, description: 'A short, concrete example of the suggestion in practice.' }
                        },
                        required: ['suggestion', 'why', 'example']
                    }
                }
            },
            required: ['suggestions']
        };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as an expert career coach specializing in helping people land jobs at top companies. Your feedback should be clear, constructive, and easy to understand, even for someone new to writing cover letters.
                The suggestions should adopt the following tone: ${selectedTone}.
                
                - Professional: Formal, corporate, and achievement-oriented feedback.
                - Creative: More expressive, dynamic feedback.
                - Bold: Confident, direct, and impactful feedback.

                Analyze the provided Job Description, Candidate's Resume, and their draft Cover Letter.
                Provide 3-4 specific, actionable suggestions. For each suggestion, provide three things:
                1.  **The Suggestion:** A clear, concise piece of advice.
                2.  **Why it Matters:** A simple explanation of the benefit of this change.
                3.  **An Example:** A short, concrete snippet showing how to apply the suggestion.

                Focus on tailoring the content to the job, highlighting skills from the resume, and incorporating key achievements if provided. Do not rewrite the entire letter.
                
                **Job Description:**
                ${job.description}

                **Candidate's Master Resume:**
                ${userProfile?.masterResume || '(No master resume provided)'}
                
                ${keyAchievements ? `**Candidate's Key Achievements (Prioritize these):**\n${keyAchievements}` : ''}

                **Draft Cover Letter:**
                ${formData.coverLetter}

                Return your feedback as a JSON object matching the provided schema.
            `;
            
             const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: suggestionsSchema,
                }
            });

            const text = response.text.trim();
            const parsedJson: AICoverLetterSuggestions = JSON.parse(text);
            setCoverLetterSuggestions(parsedJson.suggestions);

        } catch (e) {
            console.error(e);
            setOptimizeError("Sorry, we couldn't get suggestions at this time. Please try again.");
        } finally {
            setIsOptimizing(false);
        }
    };
    
     const handleAnalyzeResume = async () => {
        if (!userProfile?.masterResume) {
            setAnalyzeError("Please save your Master Resume in 'My Dashboard' to use this feature.");
            return;
        }

        setIsAnalyzing(true);
        setAnalyzeError('');
        setResumeScore(null);
        
        const scoreSchema = {
            type: Type.OBJECT,
            properties: {
                match_score: { 
                    type: Type.INTEGER, 
                    description: "An integer score from 0-100 representing how well the resume matches the job description." 
                },
                explanation: { 
                    type: Type.STRING, 
                    description: "A brief, 2-3 sentence explanation for the score, highlighting strengths and key missing qualifications."
                }
            },
            required: ['match_score', 'explanation']
        };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                You are an AI resume evaluator. Compare the following resume to the job description and return a match score (0–100) with explanation.

                Resume:
                ${userProfile.masterResume}

                Job Description:
                ${job.title}
                ${job.description}
                ${job.qualifications || ''}

                Instructions:
                - Analyze for keyword match, relevant experience, education, and skills.
                - Score based on alignment with job requirements.
                - Return score and a brief explanation as a JSON object matching the schema.
            `;
            
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: scoreSchema,
                }
            });
            
            const text = response.text.trim();
            const parsedJson: ResumeScore = JSON.parse(text);
            setResumeScore(parsedJson);

        } catch(e) {
            console.error(e);
            setAnalyzeError("Sorry, we couldn't analyze your resume at this time. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-labelledby="application-modal-title"
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
                style={{ animationFillMode: 'forwards' }}
            >
                <div className="p-6 relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Close"
                    >
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    
                    {!isSubmitted ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <BriefcaseIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                                <div>
                                    <h2 id="application-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Apply for {job.title}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">at {job.company}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                    <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                    <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cover Letter</label>
                                    <textarea name="coverLetter" id="coverLetter" rows={4} required value={formData.coverLetter} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Briefly explain why you're a good fit for this role..."></textarea>
                                </div>

                                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600/50 space-y-3">
                                    <div className="flex justify-between items-center">
                                         <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Application Tools</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button 
                                            type="button" 
                                            onClick={handleAnalyzeResume} 
                                            disabled={isAnalyzing || !userProfile?.masterResume}
                                            className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-wait"
                                        >
                                            <CheckBadgeIcon className="h-4 w-4" /> 
                                            {isAnalyzing ? 'Analyzing...' : 'Analyze Resume Fit'}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleOptimizeCoverLetter} 
                                            disabled={isOptimizing || !formData.coverLetter}
                                            className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-wait"
                                        >
                                            <SparklesIcon className="h-4 w-4" /> 
                                            {isOptimizing ? 'Optimizing...' : 'Optimize Cover Letter'}
                                        </button>
                                    </div>
                                     <div aria-live="polite">
                                        {analyzeError && <p className="text-xs text-red-500 dark:text-red-400">{analyzeError}</p>}
                                        {resumeScore && (
                                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-500/20 flex items-start gap-4">
                                                <div className="flex-shrink-0">
                                                    <ScoreDonut score={resumeScore.match_score} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-blue-800 dark:text-blue-200">Resume Analysis</h5>
                                                    <p className="text-xs text-blue-700 dark:text-blue-300/90">{resumeScore.explanation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {coverLetterSuggestions && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-500/20">
                                            <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200">AI Cover Letter Suggestions:</h5>
                                            <ul className="mt-1 space-y-3">
                                                {coverLetterSuggestions.map((suggestion, index) => (
                                                    <li key={index} className="text-xs text-blue-700 dark:text-blue-300/90 border-t border-blue-200 dark:border-blue-500/20 first:border-t-0 pt-2 first:pt-0">
                                                        <strong className="block font-semibold text-blue-800 dark:text-blue-200">{suggestion.suggestion}</strong>
                                                        <p className="mt-1"><strong className="italic">Why it matters:</strong> {suggestion.why}</p>
                                                        <p className="mt-1 p-2 bg-blue-100 dark:bg-blue-800/30 rounded"><strong className="italic">Example:</strong> "{suggestion.example}"</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting...
                                            </>
                                        ) : "Submit Application"}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-10" role="alert">
                            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 id="application-modal-title" className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Application Submitted!</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Thank you for applying for the {job.title} position. We'll be in touch soon.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeInScale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in-scale {
                    animation: fadeInScale 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default ApplicationModal;