import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SparklesIcon, DocumentTextIcon } from './icons/Icons';

const CandidateSummarizer: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const resumeInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        resumeInputRef.current?.focus();
    }, []);

    const handleGenerateSummary = async () => {
        if (!resumeText.trim()) {
            setError('Please paste the candidate\'s resume text.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSummary('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as an expert recruiter and hiring manager. Your task is to provide a concise, insightful summary of a candidate's profile based on their resume. The summary should be easy for a busy recruiter to scan quickly.

                **Candidate's Resume:**
                ${resumeText}

                **Instructions:**
                -   Summarize the candidate's key strengths, years of experience, and core competencies.
                -   Mention their most recent role and key achievements if available.
                -   Highlight if they seem like a good fit for a particular type of role (e.g., "This candidate appears to be a strong fit for senior sales roles.").
                -   Keep the summary to a short paragraph (3-5 sentences).
                -   The tone should be professional and objective.
                -   Output only the summary text.`;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setSummary(response.text);

        } catch (e: any) {
            console.error(e);
            setError('An error occurred while generating the summary. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Candidate Summarizer</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Get a quick, AI-generated summary of a candidate's profile to streamline your screening process.</p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Input Section */}
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="resume-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Paste Candidate's Resume
                            </label>
                            <textarea
                                id="resume-text"
                                ref={resumeInputRef}
                                rows={15}
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="Paste the full resume text here..."
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleGenerateSummary}
                                disabled={isLoading || !resumeText}
                                className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating Summary...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                        Generate Summary
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 sticky top-24 shadow-md dark:shadow-none min-h-[300px]">
                        <div className="flex items-center gap-3 mb-3">
                            <DocumentTextIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI-Generated Summary</h3>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg min-h-[200px] flex items-center justify-center" aria-live="polite">
                            {isLoading ? (
                                <div className="animate-pulse text-center text-gray-500 dark:text-gray-400">
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mx-auto mb-2"></div>
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mx-auto mb-2"></div>
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/5 mx-auto"></div>
                                </div>
                            ) : error ? (
                                <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                            ) : summary ? (
                                <p className="text-gray-700 dark:text-gray-300 text-sm animate-scale-in">{summary}</p>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-center text-sm">The candidate summary will appear here.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CandidateSummarizer;