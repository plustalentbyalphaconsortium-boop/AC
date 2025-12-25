import React, { useState, useEffect, useMemo, useRef } from 'react';
import { JOB_CATEGORIES } from '../constants';
import { Job, ApplicationStatus, JobAlertSubscription, UserProfile } from '../types';
import { getJobs } from '../api';
import { PencilIcon, TrashIcon, BellIcon, SparklesIcon, MagnifyingGlassIcon, BriefcaseIcon, CheckCircleIcon, ChartBarIcon } from './icons/Icons';
import ApplicationModal from './ApplicationModal';
import AlertSubscriptionModal from './AlertSubscriptionModal';
import ManageAlertsModal from './ManageAlertsModal';
import { GoogleGenAI, Type } from "@google/genai";

const STATUS_STYLES: { [key in ApplicationStatus]: string } = {
    'Applied': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'Interviewing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Offer Received': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const APPLICATION_STATUSES: ApplicationStatus[] = ['Applied', 'Interviewing', 'Offer Received', 'Rejected'];
const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract'];

const highlightMatches = (text: string, searchTerm: string | undefined): React.ReactNode => {
    if (!text) return text;
    if (!searchTerm?.trim()) {
        return text;
    }

    const searchWords = searchTerm.trim().split(/\s+/).filter(Boolean).map(word =>
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );

    if (searchWords.length === 0) {
        return text;
    }

    const regex = new RegExp(`(${searchWords.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) => {
                const isMatch = searchWords.some(word => new RegExp(`^${word}$`, 'i').test(part));

                if (isMatch) {
                    return (
                        <mark key={index} className="bg-yellow-200 dark:bg-yellow-700/50 rounded-sm px-0.5 text-inherit dark:text-inherit">
                            {part}
                        </mark>
                    );
                }
                return part;
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
    const updateButtonRef = useRef<HTMLButtonElement>(null);
    const applyButtonRef = useRef<HTMLButtonElement>(null);
    const statusSelectRef = useRef<HTMLSelectElement>(null);
    const isInitialRender = useRef(true);

    // AI Match State
    const [matchAnalysis, setMatchAnalysis] = useState<{ score: number; reason: string } | null>(null);
    const [isAnalyzingMatch, setIsAnalyzingMatch] = useState(false);

    const isTracked = job.applicationStatus !== undefined;
    const [wasTracked, setWasTracked] = useState(isTracked);

    useEffect(() => {
        setNotes(job.notes || '');
        setStatus(job.applicationStatus);
    }, [job]);

    useEffect(() => {
        if (wasTracked && !isTracked) {
            applyButtonRef.current?.focus();
        }
        setWasTracked(isTracked);
    }, [isTracked, wasTracked]);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        if (isEditing) {
            statusSelectRef.current?.focus();
        } else if (isTracked) {
            updateButtonRef.current?.focus();
        }
    }, [isEditing, isTracked]);

    const handleSave = () => {
        onUpdate(job.id, { applicationStatus: status, notes });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setNotes(job.notes || '');
        setStatus(job.applicationStatus);
        setIsEditing(false);
    };
    
    const handleClear = () => {
        onClear(job.id);
        setIsEditing(false);
    }

    const handleAnalyzeMatch = async () => {
        if (!userProfile?.masterResume) return;
        setIsAnalyzingMatch(true);
        setMatchAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a career matching expert. Compare the following Candidate Profile with the Job Description.
                
                **Candidate Resume:**
                ${userProfile.masterResume.substring(0, 3000)}... (truncated for brevity if too long)

                **Job Description:**
                Title: ${job.title}
                Company: ${job.company}
                Description: ${job.description}
                Qualifications: ${job.qualifications || ''}

                **Task:**
                1. Calculate a compatibility score from 0 to 100 based on skills, experience, and role alignment.
                2. Provide a concise, 1-sentence reason explaining the score (e.g., "Strong skill match but lacks leadership experience.").

                Return JSON: { "score": number, "reason": "string" }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            score: { type: Type.NUMBER },
                            reason: { type: Type.STRING }
                        },
                        required: ['score', 'reason']
                    }
                }
            });

            const result = JSON.parse(response.text);
            setMatchAnalysis(result);

        } catch (error) {
            console.error("Match analysis failed:", error);
        } finally {
            setIsAnalyzingMatch(false);
        }
    };
    
    const highlightedTitle = useMemo(() => highlightMatches(job.title, searchTerm), [job.title, searchTerm]);
    const highlightedCompany = useMemo(() => highlightMatches(job.company, searchTerm), [job.company, searchTerm]);
    const highlightedDescription = useMemo(() => highlightMatches(job.description, searchTerm), [job.description, searchTerm]);

    const getMatchColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
        return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    };

    return (
        <li className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 hover:border-blue-400 transition-all duration-300 flex flex-col shadow-sm hover:shadow-lg dark:shadow-none animate-scale-in relative">
            <div className="flex justify-between items-start">
                <div className="pr-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{highlightedTitle}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300">{highlightedCompany}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {job.location}
                        {job.salaryMin && job.salaryMax && (
                            <span className="font-semibold text-gray-600 dark:text-gray-300">
                                {' | '}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(job.salaryMin)} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(job.salaryMax)}
                            </span>
                        )}
                    </p>
                </div>
                 <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300 px-2 py-1 rounded-full">{job.type}</span>
                    {isTracked && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[job.applicationStatus!]}`}>
                            {job.applicationStatus}
                        </span>
                    )}
                </div>
            </div>

            {/* AI Match Section */}
            <div className="mt-3 min-h-[2rem]">
                {matchAnalysis ? (
                    <div className={`p-2 rounded-md border flex items-start gap-2 ${getMatchColor(matchAnalysis.score)} animate-scale-in`}>
                        <div className="flex-shrink-0 font-bold text-lg">{matchAnalysis.score}%</div>
                        <div className="text-xs leading-snug">{matchAnalysis.reason}</div>
                    </div>
                ) : userProfile?.masterResume ? (
                    <button 
                        onClick={handleAnalyzeMatch}
                        disabled={isAnalyzingMatch}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 transition-colors disabled:opacity-50"
                    >
                        {isAnalyzingMatch ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <SparklesIcon className="h-3 w-3" />
                        )}
                        {isAnalyzingMatch ? 'Analyzing Fit...' : 'Analyze Match'}
                    </button>
                ) : null}
            </div>

            {job.qualifications && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Qualifications</h4>
                    <p className="mt-1 text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap font-mono text-xs">{job.qualifications}</p>
                </div>
            )}
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm flex-grow">{highlightedDescription}</p>
            
            {isEditing && isTracked && (
                <div className="mt-4 space-y-3">
                    <div>
                        <label htmlFor={`status-${job.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                        <select
                            ref={statusSelectRef}
                            id={`status-${job.id}`}
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 sm:text-sm rounded-md"
                        >
                            {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                         <label htmlFor={`notes-${job.id}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400">Notes</label>
                         <textarea
                            id={`notes-${job.id}`}
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                            placeholder="e.g., Interview scheduled for Friday at 10 AM with Jane Doe."
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={handleClear} 
                            aria-label={`Clear tracking for ${job.title} at ${job.company}`}
                            className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 p-1"
                        >
                            <TrashIcon className="h-3 w-3" aria-hidden="true" /> Clear Tracking
                        </button>
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800">Cancel</button>
                            <button onClick={handleSave} className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800">Save</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4">
                {!isTracked ? (
                     <button ref={applyButtonRef} onClick={() => onApplyNow(job)} aria-label={`Apply now for ${job.title} at ${job.company}`} className="w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800">
                        Apply Now
                    </button>
                ) : !isEditing && (
                    <button 
                        ref={updateButtonRef}
                        onClick={() => setIsEditing(true)} 
                        aria-label={`Update application status for ${job.title} at ${job.company}`}
                        className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-200 dark:bg-gray-700 px-3.5 py-2.5 text-sm font-semibold text-gray-800 dark:text-white shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
                    >
                        <PencilIcon className="h-4 w-4" aria-hidden="true" />
                        Update Status
                    </button>
                )}
            </div>
        </li>
    );
};

const JobCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800/30 p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 animate-pulse">
      <div className="flex justify-between items-start">
        <div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded-full w-20"></div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
      <div className="mt-6 h-10 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
    </div>
);


interface FilterButtonGroupProps {
  legend: string;
  items: string[];
  activeItem: string;
  onItemSelect: (item: string) => void;
  tutorialId?: string;
}

const FilterButtonGroup: React.FC<FilterButtonGroupProps> = ({ legend, items, activeItem, onItemSelect, tutorialId }) => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const legendId = `filter-legend-${legend.replace(/\s+/g, '-').toLowerCase()}`;

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, items.length);
  }, [items]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const activeIndex = items.findIndex(item => item === activeItem);
    if (activeIndex === -1) return;

    let nextIndex = activeIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = (activeIndex + 1) % items.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        nextIndex = (activeIndex - 1 + items.length) % items.length;
    }
    
    const nextButton = buttonRefs.current[nextIndex];
    if (nextButton) {
        nextButton.focus();
        onItemSelect(items[nextIndex]);
    }
  };

  return (
    <fieldset data-tutorial-id={tutorialId}>
      <legend id={legendId} className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">{legend}</legend>
      <div
        role="radiogroup"
        aria-labelledby={legendId}
        onKeyDown={handleKeyDown}
        className="flex flex-wrap justify-center gap-2"
      >
        {items.map((item, index) => {
          const isActive = activeItem === item;
          return (
            <button
              key={item}
              ref={el => { buttonRefs.current[index] = el; }}
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onItemSelect(item)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-600/50'
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};

interface JobSearchProps {
    initialSearchTerm?: string;
    initialCategory?: string;
}

const JobSearch: React.FC<JobSearchProps> = ({ initialSearchTerm = '', initialCategory = 'All' }) => {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const [activeStatusFilter, setActiveStatusFilter] = useState('All');
    const [activeTypeFilter, setActiveTypeFilter] = useState('All');
    const [minSalaryFilter, setMinSalaryFilter] = useState<number | null>(null);
    const [applyingForJob, setApplyingForJob] = useState<Job | null>(null);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [isManageAlertsModalOpen, setIsManageAlertsModalOpen] = useState(false);
    
    // User Profile for matching
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    
    // AI Magic Search State
    const [aiQuery, setAiQuery] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState('');

    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [subscriptions, setSubscriptions] = useState<JobAlertSubscription[]>(() => {
        try {
            const savedSubs = localStorage.getItem('jobAlertSubscriptions');
            return savedSubs ? JSON.parse(savedSubs) : [];
        } catch {
            return [];
        }
    });
    
    const fetchAndMergeJobs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const baseJobs = await getJobs();
            const trackedJobsData = localStorage.getItem('trackedJobs');
            const trackedUpdates: { [key: number]: Partial<Pick<Job, 'applicationStatus' | 'notes'>> } = trackedJobsData ? JSON.parse(trackedJobsData) : {};
            
            const mergedJobs = baseJobs.map(job => ({
                ...job,
                ...(trackedUpdates[job.id] || {}),
            }));
            
            setAllJobs(mergedJobs);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAndMergeJobs();
        try {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                setUserProfile(JSON.parse(savedProfile));
            }
        } catch (e) {
            console.error("Failed to load user profile", e);
        }
    }, []);

    useEffect(() => {
        setSearchTerm(initialSearchTerm);
        setActiveCategory(initialCategory);
    }, [initialSearchTerm, initialCategory]);
    
    useEffect(() => {
        try {
            localStorage.setItem('jobAlertSubscriptions', JSON.stringify(subscriptions));
        } catch (error) {
            console.error("Failed to save subscriptions to localStorage", error);
        }
    }, [subscriptions]);

    const handleAiSearch = async () => {
        if (!aiQuery.trim()) return;
        setIsAiLoading(true);
        setAiFeedback('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                You are a smart job search assistant for the "Alpha Consortium" platform. 
                Your task is to parse a natural language job search query into structured filters.
                
                Available categories: ${JOB_CATEGORIES.join(', ')}.
                Available types: ${JOB_TYPES.slice(1).join(', ')}.
                
                Query: "${aiQuery}"

                Instructions:
                - searchTerm: Keywords for title or location (e.g., "Europe", "Manager").
                - category: Must exactly match one from the list. Default to "All".
                - minSalary: Numeric minimum (e.g., "$90k" -> 90000). Use null if not mentioned.
                - jobType: Must exactly match one of [Full-time, Part-time, Contract]. Default to "All".

                Output only a valid JSON object.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            searchTerm: { type: Type.STRING },
                            category: { type: Type.STRING },
                            minSalary: { type: Type.NUMBER, nullable: true },
                            jobType: { type: Type.STRING }
                        },
                        required: ["searchTerm", "category", "minSalary", "jobType"]
                    }
                }
            });

            const result = JSON.parse(response.text);
            setSearchTerm(result.searchTerm);
            setActiveCategory(result.category);
            setMinSalaryFilter(result.minSalary);
            setActiveTypeFilter(result.jobType);
            
            const feedbackText = `Applied filters: "${result.searchTerm}" in ${result.category} (${result.jobType})${result.minSalary ? ` > $${result.minSalary.toLocaleString()}` : ''}`;
            setAiFeedback(feedbackText);
            setAiQuery('');
        } catch (err) {
            console.error("AI Search Failed:", err);
            setAiFeedback("Sorry, I couldn't process that query. Try standard filters!");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAddSubscription = (newSub: Omit<JobAlertSubscription, 'id'>) => {
        const subWithId = { ...newSub, id: self.crypto.randomUUID() };
        setSubscriptions(prev => [...prev, subWithId]);
    };

    const handleDeleteSubscription = (subId: string) => {
        setSubscriptions(prev => prev.filter(sub => sub.id !== subId));
    };

    const currentAlert = useMemo(() => {
        return subscriptions.find(sub => 
            sub.keywords.toLowerCase() === searchTerm.toLowerCase().trim() &&
            sub.category === activeCategory
        );
    }, [subscriptions, searchTerm, activeCategory]);

    const updateLocalStorage = (updatedJobs: Job[]) => {
        const trackedUpdates = updatedJobs.reduce((acc, job) => {
            if (job.applicationStatus) {
                acc[job.id] = {
                    applicationStatus: job.applicationStatus,
                    notes: job.notes,
                };
            }
            return acc;
        }, {} as { [key: number]: Partial<Pick<Job, 'applicationStatus' | 'notes'>> });

        if (Object.keys(trackedUpdates).length > 0) {
            localStorage.setItem('trackedJobs', JSON.stringify(trackedUpdates));
        } else {
            localStorage.removeItem('trackedJobs');
        }
    };

    const handleUpdateJob = (jobId: number, updates: Partial<Pick<Job, 'applicationStatus' | 'notes'>>) => {
        const updatedJobs = allJobs.map(job =>
            job.id === jobId ? { ...job, ...updates } : job
        );
        setAllJobs(updatedJobs);
        updateLocalStorage(updatedJobs);
    };
    
    const handleApplicationSubmit = (jobId: number) => {
        handleUpdateJob(jobId, {
            applicationStatus: 'Applied',
            notes: `Applied via platform on ${new Date().toLocaleDateString()}`
        });
    };

    const handleClearTracking = (jobId: number) => {
        const updatedJobs = allJobs.map(job => {
            if (job.id === jobId) {
                const { applicationStatus, notes, ...rest } = job;
                return rest;
            }
            return job;
        });
        setAllJobs(updatedJobs);
        updateLocalStorage(updatedJobs);
    };
    
    const STATUS_FILTERS = ['All', 'Tracked', ...APPLICATION_STATUSES];

    const getNGrams = (str: string, size = 2): Set<string> => {
        const ngrams = new Set<string>();
        if (!str || str.length < size) {
            return ngrams;
        }
        const cleanStr = str.replace(/\s+/g, ' ');
        for (let i = 0; i <= cleanStr.length - size; i++) {
            ngrams.add(cleanStr.substring(i, i + size));
        }
        return ngrams;
    };

    const jaccardSimilarity = (setA: Set<string>, setB: Set<string>): number => {
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        if (union.size === 0) return 0;
        return intersection.size / union.size;
    };

    const calculateRelevance = (job: Job, query: string): number => {
        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) return 0;

        const weights = {
            title: 5,
            company: 3,
            category: 2,
            location: 1.5,
            qualifications: 1,
            description: 0.5,
        };

        let totalScore = 0;
        const queryNgrams = getNGrams(normalizedQuery);

        for (const key in weights) {
            const field = key as keyof typeof weights;
            const jobFieldValue = (job[field as keyof Job] as string | undefined)?.toLowerCase() || '';
            if (!jobFieldValue) continue;

            let fieldScore = 0;
            if (jobFieldValue.includes(normalizedQuery)) {
                fieldScore += 10;
            }

            const queryWords = new Set(normalizedQuery.split(/\s+/));
            const fieldWords = new Set(jobFieldValue.split(/\s+/));
            let matchedWords = 0;
            queryWords.forEach(word => {
                if (fieldWords.has(word)) {
                    matchedWords++;
                }
            });
            if (queryWords.size > 0) {
                fieldScore += (matchedWords / queryWords.size) * 5;
            }

            const fieldNgrams = getNGrams(jobFieldValue);
            const similarity = jaccardSimilarity(queryNgrams, fieldNgrams);
            fieldScore += similarity * 2;

            totalScore += fieldScore * weights[field];
        }
        return totalScore;
    };


    const filteredJobs = useMemo(() => {
        const preFilteredJobs = allJobs.filter(job => {
            const matchesCategory = activeCategory === 'All' || job.category === activeCategory;
            const matchesType = activeTypeFilter === 'All' || job.type === activeTypeFilter;
            const matchesStatus = (() => {
                if (activeStatusFilter === 'All') return true;
                if (activeStatusFilter === 'Tracked') return job.applicationStatus !== undefined;
                return job.applicationStatus === activeStatusFilter;
            })();
            const matchesSalary = minSalaryFilter ? (job.salaryMax || 0) >= minSalaryFilter : true;
            return matchesCategory && matchesType && matchesStatus && matchesSalary;
        });

        if (!searchTerm.trim()) {
            return preFilteredJobs;
        }

        const scoredJobs = preFilteredJobs
            .map(job => ({
                job,
                score: calculateRelevance(job, searchTerm),
            }))
            .filter(item => item.score > 0.1)
            .sort((a, b) => b.score - a.score);
            
        return scoredJobs.map(item => item.job);
    }, [allJobs, activeCategory, activeTypeFilter, searchTerm, activeStatusFilter, minSalaryFilter]);
    
    const resultsCount = filteredJobs.length;
    const resultsText = `${resultsCount} job${resultsCount !== 1 ? 's' : ''} found.`;

    const renderContent = () => {
        if (isLoading) {
            return (
                 <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => <li key={i}><JobCardSkeleton /></li>)}
                </ul>
            );
        }

        if (error) {
            return (
                <div role="alert" className="text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                    <h3 className="font-bold">An Error Occurred</h3>
                    <p>{error}</p>
                    <button onClick={fetchAndMergeJobs} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500">
                        Try Again
                    </button>
                </div>
            );
        }

        return (
            <>
                <h3 id="job-results-heading" className="sr-only">Job Search Results</h3>
                <ul data-tutorial-id="job-results-list" aria-labelledby="job-results-heading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map(job => <JobCard key={job.id} job={job} onUpdate={handleUpdateJob} onClear={handleClearTracking} onApplyNow={setApplyingForJob} searchTerm={searchTerm} userProfile={userProfile} />)
                    ) : (
                        <li className="text-gray-500 dark:text-gray-400 col-span-full text-center py-10">
                            <p>No jobs found matching your criteria.</p>
                        </li>
                    )}
                </ul>
            </>
        );
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Find Your Opportunity</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Browse thousands of jobs from top companies and track your applications.</p>
                </div>

                {/* AI-Powered Magic Search */}
                <div className="mt-12 max-w-4xl mx-auto">
                    <div className={`relative p-1 rounded-xl transition-all duration-500 ${isAiLoading ? 'animate-pulse-border bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' : 'bg-gray-200 dark:bg-gray-700/50 shadow-sm'}`}>
                        <div className="bg-white dark:bg-gray-900 rounded-lg flex items-center p-2 gap-2">
                            <div className="flex-shrink-0 pl-3">
                                <SparklesIcon className={`h-6 w-6 ${isAiLoading ? 'text-purple-500 animate-bounce' : 'text-blue-500'}`} />
                            </div>
                            <input
                                type="text"
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                                placeholder="Magic Search: 'find remote marketing jobs in Europe above $90k'..."
                                className="flex-grow bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm py-3 px-2"
                                disabled={isAiLoading}
                            />
                            <button
                                onClick={handleAiSearch}
                                disabled={isAiLoading || !aiQuery.trim()}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                            >
                                {isAiLoading ? 'Analyzing...' : 'Magic Search'}
                            </button>
                        </div>
                    </div>
                    {aiFeedback && (
                        <div className="mt-3 flex justify-center">
                            <p className={`text-xs font-medium px-4 py-1.5 rounded-full animate-scale-in border ${aiFeedback.includes('Applied') ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-500'}`}>
                                {aiFeedback}
                                {aiFeedback.includes('Applied') && (
                                    <button onClick={() => { setSearchTerm(''); setActiveCategory('All'); setMinSalaryFilter(null); setActiveTypeFilter('All'); setAiFeedback(''); }} className="ml-2 underline opacity-70 hover:opacity-100">Reset</button>
                                )}
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="mt-12 max-w-4xl mx-auto space-y-8">
                    {/* Standard Keyword Search */}
                    <div className="relative" data-tutorial-id="job-search-input">
                         <label htmlFor="job-search-input" className="sr-only">Search keywords, titles, or locations</label>
                         <input
                            id="job-search-input"
                            type="text"
                            placeholder="Standard search keywords..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setAiFeedback(''); }}
                            className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        />
                         <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                    
                    {/* Filter Section */}
                    <div className="space-y-6">
                        <FilterButtonGroup 
                            legend="Job Category"
                            items={JOB_CATEGORIES}
                            activeItem={activeCategory}
                            onItemSelect={setActiveCategory}
                            tutorialId="job-category-filter"
                        />

                        <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
                            <FilterButtonGroup
                                legend="Job Type"
                                items={JOB_TYPES}
                                activeItem={activeTypeFilter}
                                onItemSelect={setActiveTypeFilter}
                            />
                            <FilterButtonGroup
                                legend="Application Tracking"
                                items={STATUS_FILTERS}
                                activeItem={activeStatusFilter}
                                onItemSelect={setActiveStatusFilter}
                                tutorialId="job-status-filter"
                            />
                        </div>

                        {minSalaryFilter !== null && (
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => setMinSalaryFilter(null)}
                                    className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-red-100 transition-colors group border border-green-200 dark:border-green-800"
                                >
                                    Min Salary: ${minSalaryFilter.toLocaleString()}+ 
                                    <TrashIcon className="h-3 w-3 group-hover:text-red-500" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Job Alerts Section */}
                <div className="mt-12 max-w-4xl mx-auto">
                    <div className={`bg-blue-50 dark:bg-blue-900/30 backdrop-blur-sm p-4 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm transition-all duration-500 ${currentAlert ? 'border-green-400 dark:border-green-500 shadow-green-500/20' : 'border-blue-200 dark:border-blue-500/20'}`}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <BellIcon className={`h-6 w-6 flex-shrink-0 ${currentAlert ? 'text-green-500 dark:text-green-400 animate-bounce' : 'text-blue-500 dark:text-blue-300'}`} aria-hidden="true" />
                                {currentAlert && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                )}
                            </div>
                            <div>
                                <h4 className={`font-semibold ${currentAlert ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                                    {currentAlert ? 'Active Search Alert' : 'Job Search Alerts'}
                                </h4>
                                <p className={`${currentAlert ? 'text-green-700 dark:text-green-300/90' : 'text-blue-700 dark:text-blue-300/90'} text-sm`}>
                                    {currentAlert 
                                        ? `You're tracking "${searchTerm || 'All'}" in ${activeCategory}.`
                                        : `Get notified when new jobs match your criteria.`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex gap-2">
                             {currentAlert ? (
                                <button 
                                    onClick={() => setIsManageAlertsModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-green-700 dark:text-green-200 bg-white dark:bg-green-800/20 rounded-md hover:bg-green-50 dark:hover:bg-green-800/40 border border-green-300 dark:border-green-500/50 flex items-center gap-1.5"
                                >
                                    <CheckCircleIcon className="h-4 w-4" /> Manage Alert
                                </button>
                             ) : (
                                <button
                                    onClick={() => setIsAlertModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors duration-200 shadow-sm flex items-center gap-1.5"
                                >
                                    <BellIcon className="h-4 w-4" /> Create Alert
                                </button>
                             )}
                              {subscriptions.length > 0 && !currentAlert && (
                                <button 
                                    onClick={() => setIsManageAlertsModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-700/50 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600/50 border border-blue-300 dark:border-blue-500/50"
                                >
                                    All Alerts ({subscriptions.length})
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-16">
                    <div className="sr-only" aria-live="polite" aria-atomic="true">
                        {!isLoading && resultsText}
                    </div>
                     {!isLoading && !error && (
                        <div className="text-center mb-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300" aria-hidden="true">
                                {resultsText}
                            </p>
                            {searchTerm && !currentAlert && (
                                <button 
                                    onClick={() => setIsAlertModalOpen(true)}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800"
                                >
                                    <BellIcon className="h-3 w-3" /> Save this search
                                </button>
                            )}
                        </div>
                    )}
                    {renderContent()}
                </div>
            </div>

            {applyingForJob && (
                <ApplicationModal
                    job={applyingForJob}
                    onClose={() => setApplyingForJob(null)}
                    onSubmit={handleApplicationSubmit}
                />
            )}

            {isAlertModalOpen && (
                <AlertSubscriptionModal
                    onClose={() => setIsAlertModalOpen(false)}
                    onSubmit={handleAddSubscription}
                    initialCategory={activeCategory}
                    initialKeywords={searchTerm}
                />
            )}

            {isManageAlertsModalOpen && (
                <ManageAlertsModal
                    onClose={() => setIsManageAlertsModalOpen(false)}
                    subscriptions={subscriptions}
                    onDelete={handleDeleteSubscription}
                />
            )}
        </div>
    );
};

export default JobSearch;