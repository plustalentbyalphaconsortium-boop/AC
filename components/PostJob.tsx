import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { View } from '../types';
import { Job } from '../types';
import { JOB_CATEGORIES } from '../constants';
import { DocumentPlusIcon, SparklesIcon, CheckCircleIcon } from './icons/Icons';

interface PostJobProps {
    setActiveView: (view: View) => void;
}

const PostJob: React.FC<PostJobProps> = ({ setActiveView }) => {
    const [jobData, setJobData] = useState({
        title: '',
        company: '',
        location: '',
        type: 'Full-time' as 'Full-time' | 'Part-time' | 'Contract',
        category: JOB_CATEGORIES[1], // Default to 'Sales'
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
                Act as an expert recruitment copywriter. Rewrite the following job description to be more engaging, professional, and appealing to top candidates.
                The tone should be professional yet inviting. The description should be well-structured with clear sections for responsibilities, qualifications, and benefits/company culture.
                Incorporate the provided qualifications and salary information naturally into the description where appropriate.
                Use inclusive language and strong, action-oriented verbs. Do not add any placeholder text like "[Company Name]".
                Output only the enhanced description text.

                **Job Title:** ${jobData.title}
                **Salary Range:** ${jobData.salaryMin && jobData.salaryMax ? `$${jobData.salaryMin} - $${jobData.salaryMax}` : 'Not specified'}
                **Required Qualifications:**
                ${jobData.qualifications || 'Not specified'}
                **Draft Description to Enhance:**
                ${jobData.description}
            `;
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setJobData(prev => ({ ...prev, description: response.text }));
        } catch (e) {
            console.error(e);
            setError("Failed to get AI suggestions. Please check your API key and try again.");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const requiredFields: (keyof typeof jobData)[] = ['title', 'company', 'location', 'description'];
        for (const field of requiredFields) {
            if (!jobData[field]) {
                setError("Please fill out all required fields.");
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
                    id: Date.now(), // Simple unique ID
                    salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
                    salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
                };

                const savedJobsData = localStorage.getItem('postedJobs');
                const postedJobs: Job[] = savedJobsData ? JSON.parse(savedJobsData) : [];
                postedJobs.unshift(newJob); // Add to the beginning of the list
                localStorage.setItem('postedJobs', JSON.stringify(postedJobs));

                setSuccess(`Success! Your job "${newJob.title}" has been posted. Redirecting...`);
                setTimeout(() => {
                    setActiveView(View.Jobs);
                }, 2500);

            } catch (storageError) {
                console.error("Failed to save job to localStorage", storageError);
                setError("Could not save the job posting. Please ensure your browser supports localStorage.");
                setIsPosting(false);
            }
        }, 1500);
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Post a New Job</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Fill out the details below to find your next great hire.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-12 max-w-2xl mx-auto bg-white dark:bg-gray-800/30 backdrop-blur-sm p-8 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-md dark:shadow-none space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
                            <input ref={firstInputRef} type="text" name="title" id="title" required value={jobData.title} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                            <input type="text" name="company" id="company" required value={jobData.company} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                        <input type="text" name="location" id="location" required value={jobData.location} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., New York, NY or Remote" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Salary (USD)</label>
                            <input type="number" name="salaryMin" id="salaryMin" value={jobData.salaryMin} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., 80000" />
                        </div>
                        <div>
                            <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Salary (USD)</label>
                            <input type="number" name="salaryMax" id="salaryMax" value={jobData.salaryMax} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., 120000" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                            <select id="category" name="category" value={jobData.category} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                {JOB_CATEGORIES.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Type</span>
                            <div className="mt-2 flex space-x-4">
                                {(['Full-time', 'Part-time', 'Contract'] as const).map(type => (
                                     <label key={type} className="flex items-center">
                                        <input type="radio" name="type" value={type} checked={jobData.type === type} onChange={handleInputChange} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:bg-gray-700 dark:border-gray-600"/>
                                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Required Qualifications</label>
                        <textarea name="qualifications" id="qualifications" rows={5} value={jobData.qualifications} onChange={handleInputChange} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="List key qualifications, one per line..."></textarea>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Description</label>
                            <button type="button" onClick={handleEnhanceDescription} disabled={isEnhancing} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-wait">
                                <SparklesIcon className="h-4 w-4" />
                                {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                            </button>
                        </div>
                        <textarea name="description" id="description" rows={8} required value={jobData.description} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Provide a summary of the role, responsibilities, and qualifications..."></textarea>
                    </div>

                    <div className="text-center pt-4">
                         <button type="submit" disabled={isPosting || !!success} className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
                            {isPosting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Posting Job...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                    Job Posted!
                                </>
                            ) : (
                                <>
                                    <DocumentPlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                    Post Job
                                </>
                            )}
                        </button>
                    </div>
                </form>

                 <div className="mt-6 max-w-2xl mx-auto text-center" aria-live="polite">
                    {error && (
                        <p role="alert" className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{error}</p>
                    )}
                    {success && (
                        <p role="alert" className="text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-3 rounded-md animate-scale-in">{success}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostJob;