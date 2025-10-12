import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, CloudArrowDownIcon, CheckCircleIcon } from './icons/Icons';

const CloudSync: React.FC = () => {
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        try {
            const timestamp = localStorage.getItem('lastSyncTimestamp');
            if (timestamp) {
                setLastSync(new Date(timestamp).toLocaleString());
            }
        } catch (error) {
            console.error("Failed to load last sync timestamp from localStorage", error);
        }
    }, []);

    const handleBackup = () => {
        setIsBackingUp(true);
        setStatusMessage(null);

        setTimeout(() => {
            try {
                const userProfile = localStorage.getItem('userProfile');
                const trackedJobs = localStorage.getItem('trackedJobs');
                const postedJobs = localStorage.getItem('postedJobs');
                const jobAlertSubscriptions = localStorage.getItem('jobAlertSubscriptions');
                
                const backupData = {
                    userProfile,
                    trackedJobs,
                    postedJobs,
                    jobAlertSubscriptions,
                };
                
                localStorage.setItem('cloudStorageBackup', JSON.stringify(backupData));
                
                const now = new Date().toISOString();
                localStorage.setItem('lastSyncTimestamp', now);
                setLastSync(new Date(now).toLocaleString());
                
                setStatusMessage({ type: 'success', text: 'Your data has been securely backed up.' });
            } catch (error) {
                console.error("Backup failed:", error);
                setStatusMessage({ type: 'error', text: 'Backup failed. Please try again.' });
            } finally {
                setIsBackingUp(false);
            }
        }, 1500); // Simulate network latency
    };

    const handleRestore = () => {
        setIsRestoring(true);
        setStatusMessage(null);

        setTimeout(() => {
            try {
                const backupDataString = localStorage.getItem('cloudStorageBackup');
                if (!backupDataString) {
                    throw new Error("No backup found in your cloud storage.");
                }
                
                const backupData = JSON.parse(backupDataString);
                
                // Restore each piece of data if it exists in the backup
                if (backupData.userProfile) localStorage.setItem('userProfile', backupData.userProfile);
                if (backupData.trackedJobs) localStorage.setItem('trackedJobs', backupData.trackedJobs);
                if (backupData.postedJobs) localStorage.setItem('postedJobs', backupData.postedJobs);
                if (backupData.jobAlertSubscriptions) localStorage.setItem('jobAlertSubscriptions', backupData.jobAlertSubscriptions);

                setStatusMessage({ type: 'success', text: 'Data restored successfully! Refresh the page to see all changes.' });
            } catch (error: any) {
                console.error("Restore failed:", error);
                setStatusMessage({ type: 'error', text: `Restore failed: ${error.message}` });
            } finally {
                setIsRestoring(false);
            }
        }, 1500); // Simulate network latency
    };
    
    const isLoading = isBackingUp || isRestoring;

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Cloud Sync & Backup</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Securely save your profile and application data, and restore it anytime.</p>
                </div>

                <div className="mt-12 bg-white dark:bg-gray-800/30 backdrop-blur-sm p-8 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-lg dark:shadow-none space-y-8">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Synced:</p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{lastSync || 'Never'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <button
                            onClick={handleBackup}
                            disabled={isLoading}
                            className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                        >
                            {isBackingUp ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Backing Up...
                                </>
                            ) : (
                                <>
                                    <CloudArrowUpIcon className="h-6 w-6 mr-2" aria-hidden="true" />
                                    Backup Data to Cloud
                                </>
                            )}
                        </button>
                         <button
                            onClick={handleRestore}
                            disabled={isLoading}
                            className="w-full inline-flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 px-6 py-4 text-base font-semibold text-gray-800 dark:text-white shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                        >
                             {isRestoring ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <CloudArrowDownIcon className="h-6 w-6 mr-2" aria-hidden="true" />
                                    Restore Data from Cloud
                                </>
                            )}
                        </button>
                    </div>

                    <div className="pt-4 text-center min-h-[4rem]" aria-live="polite">
                        {statusMessage && (
                            <div className={`p-4 rounded-md animate-scale-in flex items-center justify-center gap-2 ${statusMessage.type === 'success' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                                {statusMessage.type === 'success' && <CheckCircleIcon className="h-5 w-5" />}
                                <p>{statusMessage.text}</p>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center border-t border-gray-200 dark:border-gray-700 pt-6">
                        <p><strong>How it works:</strong> Your application data (profile, job tracking, etc.) is bundled and saved securely in your browser's local storage, simulating a cloud backup. You can restore this data to repopulate the app at any time. This does not upload any data to an external server.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloudSync;