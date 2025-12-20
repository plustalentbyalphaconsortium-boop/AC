import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { View } from '../types';
import { Job } from '../types';
import { JOB_CATEGORIES } from '../constants';
import { DocumentPlusIcon, SparklesIcon, CheckCircleIcon, MagnifyingGlassIcon } from './icons/Icons';

interface PostJobProps {
    setActiveView: (view: View) => void;
}

const GoogleSnippetPreview: React.FC<{ job: any }> = ({ job }) => (
  <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm font-sans max-w-xl">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">A</div>
      <div className="text-xs text-gray-800 dark:text-gray-300">alphaconsortium.com › jobs › {job.category.toLowerCase()}</div>
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
                Ensure keywords related to "${jobData.title}" and "${jobData.location}" are naturally integrated for Google Search optimization.
                The description should be well-structured with clear sections for responsibilities, qualifications, and benefits/company culture.
                Incorporate the provided qualifications and salary information naturally into the description where appropriate.
                Output only the enhanced description text.

                **Job Title:** ${jobData.title}
                **Salary Range:** ${jobData.salaryMin && jobData.salaryMax ? `$${jobData.salaryMin} - $${jobData.salaryMax}` : 'Not specified'}
                **Required Qualifications:**
                ${jobData.qualifications || 'Not specified'}
                **Draft Description to Enhance:**
                ${jobData.description}
            `;
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
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
                    id: Date.now(),
                    postedDate: new Date().toISOString().split('T')[0],
                    salaryMin: salaryMin ? parseInt(salaryMin, 10) : undefined,
                    salaryMax: salaryMax ? parseInt(salaryMax, 10) : undefined,
                };

                const savedJobsData = localStorage.getItem('postedJobs');
                const postedJobs: Job[] = savedJobsData ? JSON.parse(savedJobsData) : [];
                postedJobs.unshift(newJob);
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
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Employer Talent Hub</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Create visible, optimized job listings for the global market.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-blue-500/20 shadow-xl space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                                    <input ref={firstInputRef} type="text" name="title" id="title" required value={jobData.title} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3" />
                                </div>
                                <div>
                                    <label htmlFor="company" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                    <input type="text" name="company" id="company" required value={jobData.company} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="location" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                    <input type="text" name="location" id="location" required value={jobData.location} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3" placeholder="e.g., Romania or Remote" />
                                </div>
                                <div>
                                    <label htmlFor="category" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select id="category" name="category" value={jobData.category} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3">
                                        {JOB_CATEGORIES.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="qualifications" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Key Qualifications</label>
                                <textarea name="qualifications" id="qualifications" rows={3} value={jobData.qualifications} onChange={handleInputChange} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3" placeholder="Core skills required..."></textarea>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="description" className="block text-sm font-bold text-gray-700 dark:text-gray-300">Job Description</label>
                                    <button type="button" onClick={handleEnhanceDescription} disabled={isEnhancing} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-400">
                                        <SparklesIcon className="h-3 w-3" />
                                        {isEnhancing ? 'Optimizing...' : 'SEO Optimize'}
                                    </button>
                                </div>
                                <textarea name="description" id="description" rows={6} required value={jobData.description} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3" placeholder="Detailed role description..."></textarea>
                            </div>
                             <div className="text-center pt-4">
                                <button type="submit" disabled={isPosting || !!success} className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-blue-500 transition-all transform hover:scale-[1.02] disabled:opacity-50">
                                    {isPosting ? 'Publishing...' : success ? 'Published!' : 'Post to Alpha Consortium'}
                                </button>
                                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                                {success && <p className="mt-2 text-green-500 text-sm">{success}</p>}
                            </div>
                        </form>
                    </div>

                    {/* SEO Preview Sidebar */}
                    <div className="lg:col-span-1 space-y-8 sticky top-24">
                        <div>
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MagnifyingGlassIcon className="h-5 w-5 text-blue-500" />
                                Google Search Preview
                            </h3>
                            <GoogleSnippetPreview job={jobData} />
                            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                Your job listing is automatically enhanced with <strong>JobPosting JSON-LD</strong> structured data to appear in Google Job Search results.
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                            <h3 className="text-md font-bold text-blue-800 dark:text-blue-300 mb-2">SEO Pro Tip</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-400/90 leading-relaxed">
                                Including a <strong>salary range</strong> and specific <strong>city locations</strong> increases your visibility on Google Job Search by up to 40%. Use our "SEO Optimize" tool to naturally weave these into your description.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostJob;