import React, { useState, useEffect, useMemo, useRef } from 'react';
import { JOB_CATEGORIES } from '../constants';
import { Job, ApplicationStatus, JobAlertSubscription } from '../types';
import { getJobs } from '../api';
import { PencilIcon, TrashIcon, BellIcon } from './icons/Icons';
import ApplicationModal from './ApplicationModal';
import AlertSubscriptionModal from './AlertSubscriptionModal';
import ManageAlertsModal from './ManageAlertsModal';

const STATUS_STYLES: { [key in ApplicationStatus]: string } = {
    'Applied': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'Interviewing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Offer Received': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const APPLICATION_STATUSES: ApplicationStatus[] = ['Applied', 'Interviewing', 'Offer Received', 'Rejected'];


const JobCard: React.FC<{
    job: Job;
    onUpdate: (id: number, updates: Partial<Pick<Job, 'applicationStatus' | 'notes'>>) => void;
    onClear: (id: number) => void;
    onApplyNow: (job: Job) => void;
}> = ({ job, onUpdate, onClear, onApplyNow }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [notes, setNotes] = useState(job.notes || '');
    const [status, setStatus] = useState(job.applicationStatus);
    const updateButtonRef = useRef<HTMLButtonElement>(null);
    const applyButtonRef = useRef<HTMLButtonElement>(null);
    const statusSelectRef = useRef<HTMLSelectElement>(null);
    const isInitialRender = useRef(true);

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

    return (
        <li className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 hover:border-blue-400 transition-all duration-300 flex flex-col shadow-sm hover:shadow-lg dark:shadow-none">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300">{job.company}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {job.location}
                        {job.salaryMin && job.salaryMax && (
                            <span className="font-semibold text-gray-600 dark:text-gray-300">
                                {' | '}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(job.salaryMin)} - {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(job.salaryMax)}
                            </span>
                        )}
                    </p>
                </div>
                 <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300 px-2 py-1 rounded-full">{job.type}</span>
                    {isTracked && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[job.applicationStatus!]}`}>
                            {job.applicationStatus}
                        </span>
                    )}
                </div>
            </div>
            {job.qualifications && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Qualifications</h4>
                    <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap font-mono text-xs">{job.qualifications}</p>
                </div>
            )}
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm flex-grow">{job.description}</p>
            
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
                     <button ref={applyButtonRef} onClick={() => onApplyNow(job)} className="w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800">
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
}

const FilterButtonGroup: React.FC<FilterButtonGroupProps> = ({ legend, items, activeItem, onItemSelect }) => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
    <fieldset>
      <legend className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">{legend}</legend>
      <div
        role="radiogroup"
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
    const [applyingForJob, setApplyingForJob] = useState<Job | null>(null);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [isManageAlertsModalOpen, setIsManageAlertsModalOpen] = useState(false);
    
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
    }, []);

    // Effect to handle initial search parameters from props (e.g., command bar)
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

    const handleAddSubscription = (newSub: Omit<JobAlertSubscription, 'id'>) => {
        const subWithId = { ...newSub, id: self.crypto.randomUUID() };
        setSubscriptions(prev => [...prev, subWithId]);
    };

    const handleDeleteSubscription = (subId: string) => {
        setSubscriptions(prev => prev.filter(sub => sub.id !== subId));
    };

    const currentAlert = useMemo(() => {
        return subscriptions.find(sub => 
            sub.keywords.toLowerCase() === searchTerm.toLowerCase() &&
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

    const filteredJobs = useMemo(() => allJobs.filter(job => {
        const matchesCategory = activeCategory === 'All' || job.category === activeCategory;
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) 
            || job.company.toLowerCase().includes(searchTerm.toLowerCase())
            || job.location.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = (() => {
            if (activeStatusFilter === 'All') return true;
            if (activeStatusFilter === 'Tracked') return job.applicationStatus !== undefined;
            return job.applicationStatus === activeStatusFilter;
        })();

        return matchesCategory && matchesSearch && matchesStatus;
    }), [allJobs, activeCategory, searchTerm, activeStatusFilter]);
    
    const resultsCount = filteredJobs.length;
    const resultsText = `${resultsCount} job${resultsCount !== 1 ? 's' : ''} found.`;

    const renderContent = () => {
        if (isLoading) {
            return (
                 <ul className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => <li key={i}><JobCardSkeleton /></li>)}
                </ul>
            );
        }

        if (error) {
            return (
                <div role="alert" className="mt-16 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
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
                <ul aria-labelledby="job-results-heading" className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredJobs.length > 0 ? (
                        filteredJobs.map(job => <JobCard key={job.id} job={job} onUpdate={handleUpdateJob} onClear={handleClearTracking} onApplyNow={setApplyingForJob} />)
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 col-span-full text-center">No jobs found matching your criteria.</p>
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
                
                <div className="mt-12 max-w-4xl mx-auto space-y-6">
                    <div className="relative">
                         <label htmlFor="job-search-input" className="sr-only">Search keywords, job titles, companies, or locations</label>
                         <input
                            id="job-search-input"
                            type="text"
                            placeholder="Search keywords, job titles, companies, or locations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>
                    
                    <FilterButtonGroup 
                        legend="Filter by Category"
                        items={JOB_CATEGORIES}
                        activeItem={activeCategory}
                        onItemSelect={setActiveCategory}
                    />

                    <FilterButtonGroup
                        legend="Filter by Application Status"
                        items={STATUS_FILTERS}
                        activeItem={activeStatusFilter}
                        onItemSelect={setActiveStatusFilter}
                    />
                </div>

                <div className="mt-12 max-w-4xl mx-auto">
                    <div className="bg-blue-50 dark:bg-blue-900/30 backdrop-blur-sm p-4 rounded-lg border border-blue-200 dark:border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <BellIcon className="h-6 w-6 text-blue-500 dark:text-blue-300 flex-shrink-0" aria-hidden="true" />
                            <div>
                                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Job Alerts</h4>
                                <p className="text-blue-700 dark:text-blue-300/90 text-sm">
                                    {currentAlert 
                                        ? `You have an active alert for this search.`
                                        : `Get notified when new jobs match your criteria.`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex gap-2">
                             {currentAlert ? (
                                <button 
                                    onClick={() => setIsManageAlertsModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-700/50 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600/50 border border-blue-300 dark:border-blue-500/50"
                                >
                                    Manage Alerts
                                </button>
                             ) : (
                                <button
                                    onClick={() => setIsAlertModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors duration-200"
                                >
                                    Create Alert
                                </button>
                             )}
                              {subscriptions.length > 0 && !currentAlert && (
                                <button 
                                    onClick={() => setIsManageAlertsModalOpen(true)}
                                    className="px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-200 bg-white dark:bg-gray-700/50 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600/50 border border-blue-300 dark:border-blue-500/50"
                                >
                                    Manage Alerts ({subscriptions.length})
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <div className="sr-only" aria-live="polite" aria-atomic="true">
                        {!isLoading && resultsText}
                    </div>
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