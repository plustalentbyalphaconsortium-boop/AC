import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Job, VibeJobAnalysis } from '../types';
import { MOCK_JOBS } from '../constants';
import { HeartIcon, SparklesIcon } from './icons/Icons';
import ResonanceReportModal from './ResonanceReportModal';

// --- VibeJobCard Component ---
interface VibeJobCardProps {
    job: Job;
    analysis: VibeJobAnalysis | null;
    isLoading: boolean;
    onViewReport: () => void;
}

const VibeJobCard: React.FC<VibeJobCardProps> = ({ job, analysis, isLoading, onViewReport }) => {
    const score = analysis?.resonanceScore ?? 0;
    const scoreColor = score > 75 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400';
    const ringColor = score > 75 ? 'border-green-500/50' : score > 50 ? 'border-yellow-500/50' : 'border-red-500/50';

    return (
        <li className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 hover:border-blue-400 transition-all duration-300 flex flex-col shadow-sm hover:shadow-lg dark:shadow-none animate-scale-in">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full animate-pulse">
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Analyzing Vibe...</p>
                </div>
            ) : analysis ? (
                <>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h3>
                            <p className="text-sm text-blue-600 dark:text-blue-300">{job.company}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{job.location}</p>
                        </div>
                        <div className={`relative flex-shrink-0 w-20 h-20 rounded-full border-4 ${ringColor} flex items-center justify-center`}>
                            <span className={`font-bold text-2xl font-orbitron ${scoreColor}`}>{score}</span>
                            <span className="absolute -bottom-2 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300 px-2 py-0.5 rounded-full">Resonance</span>
                        </div>
                    </div>
                    <blockquote className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 text-center italic text-gray-600 dark:text-gray-400 flex-grow">
                        "{analysis.poeticSummary}"
                    </blockquote>
                    <div className="mt-4">
                        <button onClick={onViewReport} className="w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors duration-300">
                            View Resonance Report
                        </button>
                    </div>
                </>
            ) : (
                 <div className="text-center text-red-500 dark:text-red-400">
                    <p>Failed to analyze this job.</p>
                </div>
            )}
        </li>
    );
};


// --- VibeCheck Main Component ---
const VibeCheck: React.FC = () => {
    const [userVibe, setUserVibe] = useState('');
    const [jobKeyword, setJobKeyword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchedJobs, setSearchedJobs] = useState<(Job & { analysis: VibeJobAnalysis | null, isLoading: boolean })[]>([]);
    const [modalData, setModalData] = useState<{ job: Job; analysis: VibeJobAnalysis } | null>(null);
    const vibeInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        vibeInputRef.current?.focus();
    }, []);

    const vibeAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            poeticSummary: {
                type: Type.STRING,
                description: "A short, poetic, one-sentence summary of the job's emotional essence or 'vibe'. For example: 'Seeks a soul fluent in quiet precision'."
            },
            resonanceScore: {
                type: Type.NUMBER,
                description: 'An integer score from 0 to 100 representing how well the user\'s vibe aligns with the job\'s vibe. 100 is a perfect match.'
            },
            resonanceReport: {
                type: Type.STRING,
                description: 'A detailed, 2-3 paragraph analysis explaining the reasoning behind the score. Compare the user\'s self-description with the job description, highlighting areas of strong alignment (e.g., values, work style, environment) and potential friction.'
            }
        },
        required: ['poeticSummary', 'resonanceScore', 'resonanceReport']
    };

    const handleSearch = async () => {
        if (!userVibe) {
            setError("Please describe your work vibe to find resonant jobs.");
            return;
        }
        setIsLoading(true);
        setError('');
        setSearchedJobs([]);

        const filteredJobs = MOCK_JOBS.filter(job =>
            job.title.toLowerCase().includes(jobKeyword.toLowerCase()) ||
            job.description.toLowerCase().includes(jobKeyword.toLowerCase()) ||
            job.company.toLowerCase().includes(jobKeyword.toLowerCase())
        );

        if (filteredJobs.length === 0) {
            setError("No jobs found with that keyword.");
            setIsLoading(false);
            return;
        }

        setSearchedJobs(filteredJobs.map(job => ({ ...job, analysis: null, isLoading: true })));
        setIsLoading(false); // Main loading is done, now individual cards load

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        for (const job of filteredJobs) {
            try {
                const prompt = `
                    You are a career counselor who specializes in emotional intelligence and workplace culture. Your task is to analyze the alignment between a person's self-described work style and a job description.

                    **User's Vibe (Their self-description):**
                    "${userVibe}"

                    **Job Description:**
                    Title: ${job.title}
                    Company: ${job.company}
                    Description: ${job.description}

                    **Analysis Task:**
                    Based on the two texts, perform the following analysis and return it as a single JSON object matching the provided schema.
                    1.  **Poetic Summary:** Write a single, creative, poetic sentence that captures the emotional essence of the job role.
                    2.  **Resonance Score:** Calculate a score from 0-100 indicating the strength of the match between the user's vibe and the job's implied culture and demands.
                    3.  **Resonance Report:** Write a detailed analysis explaining the score. Highlight specific words or phrases from both texts to justify your reasoning. Discuss alignment in terms of pace, collaboration vs. independence, creativity vs. structure, and overall values.
                `;
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: vibeAnalysisSchema,
                    }
                });
                
                const text = response.text.trim();
                const analysisResult: VibeJobAnalysis = JSON.parse(text);
                
                setSearchedJobs(prevJobs => prevJobs.map(prevJob =>
                    prevJob.id === job.id ? { ...prevJob, analysis: analysisResult, isLoading: false } : prevJob
                ));

            } catch (e) {
                console.error(`Failed to analyze job ${job.id}:`, e);
                setSearchedJobs(prevJobs => prevJobs.map(prevJob =>
                    prevJob.id === job.id ? { ...prevJob, analysis: null, isLoading: false } : prevJob
                ));
            }
        }
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Career Vibe Check</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Discover jobs that resonate with your personality and work style, not just your skills.</p>
                </div>
                
                <div className="mt-12 max-w-4xl mx-auto space-y-6">
                    <div>
                        <label htmlFor="user-vibe" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            1. Describe your work vibe & personality
                        </label>
                        <textarea
                            id="user-vibe"
                            ref={vibeInputRef}
                            rows={5}
                            className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 'I thrive in fast-paced, collaborative teams where I can be creative and take initiative. I value open communication and a culture of learning.'"
                            value={userVibe}
                            onChange={(e) => setUserVibe(e.target.value)}
                        />
                    </div>
                    <div>
                         <label htmlFor="job-keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            2. Enter a job title or keyword (optional)
                        </label>
                         <input
                            id="job-keyword"
                            type="text"
                            placeholder="e.g., 'Marketing', 'Designer', 'Remote'"
                            value={jobKeyword}
                            onChange={(e) => setJobKeyword(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="text-center pt-2">
                         <button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                             {isLoading ? (
                                'Searching...'
                            ) : (
                                <>
                                    <SparklesIcon className="h-5 w-5 mr-2" />
                                    Find Resonant Jobs
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-16" aria-live="polite">
                    {error && (
                         <div role="alert" className="mt-4 max-w-2xl mx-auto text-center text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 p-4 rounded-md">
                            <p>{error}</p>
                        </div>
                    )}
                    {searchedJobs.length > 0 && (
                         <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {searchedJobs.map(job => (
                                <VibeJobCard 
                                    key={job.id} 
                                    job={job} 
                                    analysis={job.analysis} 
                                    isLoading={job.isLoading}
                                    onViewReport={() => job.analysis && setModalData({ job, analysis: job.analysis })}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {modalData && (
                <ResonanceReportModal
                    job={modalData.job}
                    report={modalData.analysis.resonanceReport}
                    score={modalData.analysis.resonanceScore}
                    onClose={() => setModalData(null)}
                />
            )}
        </div>
    );
};

export default VibeCheck;
