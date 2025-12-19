import React, { useState, useEffect } from 'react';
import { UserProfile, Job, ApplicationStatus, View } from '../types';
import { UserCircleIcon, BriefcaseIcon, PencilIcon, CloudArrowUpIcon, SparklesIcon, ChartBarIcon } from './icons/Icons';
import { MOCK_JOBS } from '../constants'; // For fetching full job details
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const STATUS_STYLES: { [key in ApplicationStatus]: string } = {
    'Applied': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    'Interviewing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    'Offer Received': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

interface DashboardProps {
    setActiveView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        email: '',
        masterResume: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [trackedJobs, setTrackedJobs] = useState<Job[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        // Load profile from localStorage
        try {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                setProfile(JSON.parse(savedProfile));
            } else {
                setIsEditing(true); // If no profile, start in edit mode
            }
        } catch (error) {
            console.error("Failed to load user profile from localStorage", error);
        }

        // Load tracked jobs
        try {
            const trackedJobsData = localStorage.getItem('trackedJobs');
            if (trackedJobsData) {
                const trackedUpdates: { [key: number]: Partial<Pick<Job, 'applicationStatus' | 'notes'>> } = JSON.parse(trackedJobsData);
                const trackedJobDetails = MOCK_JOBS.filter(job => trackedUpdates[job.id]).map(job => ({
                    ...job,
                    ...trackedUpdates[job.id],
                }));
                setTrackedJobs(trackedJobDetails);
            }
        } catch (error) {
            console.error("Failed to load tracked jobs from localStorage", error);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = () => {
        setSaveStatus('saving');
        try {
            // Read existing profile to preserve un-edited fields like lastAIResume
            const savedProfileJSON = localStorage.getItem('userProfile');
            const existingProfile = savedProfileJSON ? JSON.parse(savedProfileJSON) : {};
            const updatedProfile = { ...existingProfile, ...profile };

            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            setTimeout(() => {
                setSaveStatus('saved');
                // Wait for the 'Saved!' message to be visible before closing the form
                setTimeout(() => {
                    setIsEditing(false);
                    setSaveStatus('idle');
                }, 1500);
            }, 1000);
        } catch (error) {
            console.error("Failed to save user profile to localStorage", error);
            setSaveStatus('idle');
        }
    };

    const getSaveButtonContent = () => {
        switch (saveStatus) {
            case 'saving':
                return 'Saving...';
            case 'saved':
                return 'Saved!';
            default:
                return 'Save Profile';
        }
    };

    const statusData = [
        { name: 'Applied', value: trackedJobs.filter(j => j.applicationStatus === 'Applied').length, color: '#f97316' },
        { name: 'Interviewing', value: trackedJobs.filter(j => j.applicationStatus === 'Interviewing').length, color: '#eab308' },
        { name: 'Offer Received', value: trackedJobs.filter(j => j.applicationStatus === 'Offer Received').length, color: '#22c55e' },
        { name: 'Rejected', value: trackedJobs.filter(j => j.applicationStatus === 'Rejected').length, color: '#ef4444' },
    ].filter(d => d.value > 0);


    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">My Dashboard</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Your personal career command center.</p>
                </div>

                <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Profile Section */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-sm dark:shadow-none">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserCircleIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                    My Profile
                                </h3>
                                {!isEditing && (
                                     <button onClick={() => setIsEditing(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                         <PencilIcon className="h-4 w-4" /> Edit
                                     </button>
                                )}
                            </div>
                            
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                        <input type="text" name="name" id="name" value={profile.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                        <input type="email" name="email" id="email" value={profile.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label htmlFor="masterResume" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Master Resume</label>
                                        <textarea name="masterResume" id="masterResume" rows={8} value={profile.masterResume} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white" placeholder="Paste your full resume here to pre-fill future AI tools..."></textarea>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                         <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">Cancel</button>
                                         <button onClick={handleSaveProfile} disabled={saveStatus === 'saving' || saveStatus === 'saved'} className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
                                            {getSaveButtonContent()}
                                         </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{profile.name || 'No Name Provided'}</p>
                                        <p className="text-gray-500 dark:text-gray-400">{profile.email || 'No Email Provided'}</p>
                                    </div>
                                     <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">Master Resume:</p>
                                        <p className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap font-mono text-xs max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                                            {profile.masterResume || 'No resume saved.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {profile.lastAIResume && (
                             <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-sm dark:shadow-none animate-scale-in">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                    <SparklesIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                    Last AI Resume
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{profile.lastAIResume.headline}</p>
                                        <p className="text-gray-500 dark:text-gray-400 italic mt-1">"{profile.lastAIResume.summary}"</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">Key Skills:</p>
                                        <ul className="list-disc list-inside text-gray-500 dark:text-gray-400 pl-2">
                                            {profile.lastAIResume.keySkills.slice(0, 5).map(skill => <li key={skill}>{skill}</li>)}
                                            {profile.lastAIResume.keySkills.length > 5 && <li>...and more</li>}
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => setActiveView(View.AIResume)}
                                        className="w-full text-center mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 transition-colors"
                                    >
                                        Edit or Generate New Resume
                                    </button>
                                </div>
                            </div>
                        )}
                         <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-sm dark:shadow-none">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                <CloudArrowUpIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                Data Sync
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Securely back up your profile and application data, and restore it anytime.
                            </p>
                            <button
                                onClick={() => setActiveView(View.CloudSync)}
                                className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                            >
                                Go to Cloud Sync
                            </button>
                        </div>
                    </div>
                    
                    {/* Tracked Jobs Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {statusData.length > 0 && (
                            <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-sm dark:shadow-none animate-scale-in">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <ChartBarIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                    Application Insights
                                </h3>
                                {/* Hidden Table for Accessibility */}
                                <table className="sr-only">
                                    <caption>Application Status Summary</caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Status</th>
                                            <th scope="col">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {statusData.map(d => (
                                            <tr key={d.name}>
                                                <td>{d.name}</td>
                                                <td>{d.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="h-64 w-full" aria-hidden="true">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <BriefcaseIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                                Tracked Job Applications
                            </h3>
                            <div className="space-y-4">
                                {trackedJobs.length > 0 ? (
                                    trackedJobs.map(job => (
                                        <div key={job.id} className="bg-white dark:bg-gray-800/30 p-4 rounded-lg border border-gray-200 dark:border-blue-500/20 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{job.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{job.company}</p>
                                            </div>
                                            {job.applicationStatus && (
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[job.applicationStatus]}`}>
                                                    {job.applicationStatus}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white dark:bg-gray-800/30 p-8 rounded-lg border border-gray-200 dark:border-blue-500/20 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">You haven't tracked any jobs yet. Start by applying for a job in the 'Find a Job' section!</p>
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

export default Dashboard;