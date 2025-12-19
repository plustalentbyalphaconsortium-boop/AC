import React, { useState, useEffect } from 'react';
import { CloudArrowUpIcon, CloudArrowDownIcon, CheckCircleIcon, UserCircleIcon, BriefcaseIcon, BellIcon, DocumentTextIcon, ChartBarIcon, TrashIcon } from './icons/Icons';
import { UserProfile, Job, JobAlertSubscription } from '../types';

interface DataStats {
    hasProfile: boolean;
    trackedJobsCount: number;
    postedJobsCount: number;
    alertsCount: number;
    timestamp?: string;
    size?: string;
}

const StatRow: React.FC<{ 
    icon: React.ComponentType<{ className?: string }>; 
    label: string; 
    localValue: string | number | boolean; 
    cloudValue: string | number | boolean; 
    highlight?: 'local' | 'cloud' | 'equal';
}> = ({ icon: Icon, label, localValue, cloudValue, highlight }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-8">
            <span className={`text-sm font-semibold w-20 text-right ${highlight === 'local' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {typeof localValue === 'boolean' ? (localValue ? 'Yes' : 'No') : localValue}
            </span>
            <span className={`text-sm font-semibold w-20 text-right ${highlight === 'cloud' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {typeof cloudValue === 'boolean' ? (cloudValue ? 'Yes' : 'No') : cloudValue}
            </span>
        </div>
    </div>
);

const CloudSync: React.FC = () => {
    const [localStats, setLocalStats] = useState<DataStats | null>(null);
    const [cloudStats, setCloudStats] = useState<DataStats | null>(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const getLocalStats = (): DataStats => {
        const userProfileStr = localStorage.getItem('userProfile');
        const trackedJobsStr = localStorage.getItem('trackedJobs');
        const postedJobsStr = localStorage.getItem('postedJobs');
        const alertsStr = localStorage.getItem('jobAlertSubscriptions');

        const userProfile: UserProfile | null = userProfileStr ? JSON.parse(userProfileStr) : null;
        const trackedJobs = trackedJobsStr ? Object.keys(JSON.parse(trackedJobsStr)).length : 0;
        const postedJobs: Job[] = postedJobsStr ? JSON.parse(postedJobsStr) : [];
        const alerts: JobAlertSubscription[] = alertsStr ? JSON.parse(alertsStr) : [];

        // Calculate roughly size in KB
        const totalSize = (
            (userProfileStr?.length || 0) + 
            (trackedJobsStr?.length || 0) + 
            (postedJobsStr?.length || 0) + 
            (alertsStr?.length || 0)
        ) / 1024;

        return {
            hasProfile: !!userProfile?.name,
            trackedJobsCount: trackedJobs,
            postedJobsCount: postedJobs.length,
            alertsCount: alerts.length,
            size: totalSize.toFixed(2) + ' KB'
        };
    };

    const getCloudStats = (): DataStats | null => {
        const backupStr = localStorage.getItem('cloudStorageBackup');
        if (!backupStr) return null;

        const backup = JSON.parse(backupStr);
        const userProfile: UserProfile | null = backup.userProfile ? JSON.parse(backup.userProfile) : null;
        const trackedJobs = backup.trackedJobs ? Object.keys(JSON.parse(backup.trackedJobs)).length : 0;
        const postedJobs: Job[] = backup.postedJobs ? JSON.parse(backup.postedJobs) : [];
        const alerts: JobAlertSubscription[] = backup.jobAlertSubscriptions ? JSON.parse(backup.jobAlertSubscriptions) : [];
        
        const timestamp = localStorage.getItem('lastSyncTimestamp');

        const totalSize = backupStr.length / 1024;

        return {
            hasProfile: !!userProfile?.name,
            trackedJobsCount: trackedJobs,
            postedJobsCount: postedJobs.length,
            alertsCount: alerts.length,
            timestamp: timestamp ? new Date(timestamp).toLocaleString() : 'Unknown',
            size: totalSize.toFixed(2) + ' KB'
        };
    };

    const refreshStats = () => {
        setLocalStats(getLocalStats());
        setCloudStats(getCloudStats());
    };

    useEffect(() => {
        refreshStats();
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
                
                refreshStats();
                setStatusMessage({ type: 'success', text: 'Backup successful! Your data is safe.' });
            } catch (error) {
                console.error("Backup failed:", error);
                setStatusMessage({ type: 'error', text: 'Backup failed. Storage might be full.' });
            } finally {
                setIsBackingUp(false);
            }
        }, 1500);
    };

    const handleRestore = () => {
        if (!cloudStats) return;
        if (!window.confirm("This will overwrite your current local data with the cloud backup. Are you sure?")) return;

        setIsRestoring(true);
        setStatusMessage(null);

        setTimeout(() => {
            try {
                const backupDataString = localStorage.getItem('cloudStorageBackup');
                if (!backupDataString) throw new Error("No backup found.");
                
                const backupData = JSON.parse(backupDataString);
                
                if (backupData.userProfile) localStorage.setItem('userProfile', backupData.userProfile);
                else localStorage.removeItem('userProfile');

                if (backupData.trackedJobs) localStorage.setItem('trackedJobs', backupData.trackedJobs);
                else localStorage.removeItem('trackedJobs');

                if (backupData.postedJobs) localStorage.setItem('postedJobs', backupData.postedJobs);
                else localStorage.removeItem('postedJobs');

                if (backupData.jobAlertSubscriptions) localStorage.setItem('jobAlertSubscriptions', backupData.jobAlertSubscriptions);
                else localStorage.removeItem('jobAlertSubscriptions');

                refreshStats();
                setStatusMessage({ type: 'success', text: 'Restore successful! Your app is up to date.' });
            } catch (error: any) {
                console.error("Restore failed:", error);
                setStatusMessage({ type: 'error', text: 'Restore failed. Data may be corrupted.' });
            } finally {
                setIsRestoring(false);
            }
        }, 1500);
    };

    const handleClearCloud = () => {
        if (!cloudStats) return;
        if (!window.confirm("Are you sure you want to delete the cloud backup? This action cannot be undone.")) return;

        setIsClearing(true);
        setStatusMessage(null);

        setTimeout(() => {
            try {
                localStorage.removeItem('cloudStorageBackup');
                localStorage.removeItem('lastSyncTimestamp');
                
                refreshStats();
                setStatusMessage({ type: 'success', text: 'Cloud backup deleted successfully.' });
            } catch (error) {
                console.error("Clear failed:", error);
                setStatusMessage({ type: 'error', text: 'Failed to delete backup.' });
            } finally {
                setIsClearing(false);
            }
        }, 1000);
    };
    
    const isLoading = isBackingUp || isRestoring || isClearing;

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Cloud Data Sync</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Synchronize your career data across devices securely.</p>
                </div>

                <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-blue-500/20 shadow-xl overflow-hidden">
                    {/* Header Row */}
                    <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700/50">
                        <div className="col-span-1"></div>
                        <div className="text-center">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                On This Device
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{localStats?.size || '0 KB'}</p>
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                In Cloud
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cloudStats?.timestamp || 'Never Backed Up'}</p>
                        </div>
                    </div>

                    {/* Stats List */}
                    <div className="p-6 space-y-2">
                        <StatRow 
                            icon={UserCircleIcon} 
                            label="User Profile" 
                            localValue={localStats?.hasProfile || false} 
                            cloudValue={cloudStats?.hasProfile || false}
                            highlight={localStats?.hasProfile === cloudStats?.hasProfile ? 'equal' : localStats?.hasProfile ? 'local' : 'cloud'} 
                        />
                        <StatRow 
                            icon={BriefcaseIcon} 
                            label="Tracked Applications" 
                            localValue={localStats?.trackedJobsCount || 0} 
                            cloudValue={cloudStats?.trackedJobsCount || 0}
                            highlight={localStats?.trackedJobsCount === cloudStats?.trackedJobsCount ? 'equal' : (localStats?.trackedJobsCount || 0) > (cloudStats?.trackedJobsCount || 0) ? 'local' : 'cloud'}
                        />
                        <StatRow 
                            icon={DocumentTextIcon} 
                            label="Posted Jobs" 
                            localValue={localStats?.postedJobsCount || 0} 
                            cloudValue={cloudStats?.postedJobsCount || 0}
                            highlight={localStats?.postedJobsCount === cloudStats?.postedJobsCount ? 'equal' : (localStats?.postedJobsCount || 0) > (cloudStats?.postedJobsCount || 0) ? 'local' : 'cloud'}
                        />
                        <StatRow 
                            icon={BellIcon} 
                            label="Active Alerts" 
                            localValue={localStats?.alertsCount || 0} 
                            cloudValue={cloudStats?.alertsCount || 0}
                            highlight={localStats?.alertsCount === cloudStats?.alertsCount ? 'equal' : (localStats?.alertsCount || 0) > (cloudStats?.alertsCount || 0) ? 'local' : 'cloud'}
                        />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-gray-200 dark:border-gray-700/50">
                        <button
                            onClick={handleBackup}
                            disabled={isLoading}
                            className="p-6 flex flex-col items-center justify-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700/50 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/10 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isBackingUp ? (
                                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <CloudArrowUpIcon className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                            )}
                            <div className="text-center">
                                <span className="block font-bold text-gray-900 dark:text-white">Push to Cloud</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Overwrite backup with device data</span>
                            </div>
                        </button>

                        <button
                            onClick={handleRestore}
                            disabled={isLoading || !cloudStats?.timestamp}
                            className="p-6 flex flex-col items-center justify-center gap-3 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors focus:outline-none focus:bg-green-50 dark:focus:bg-green-900/10 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRestoring ? (
                                <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <CloudArrowDownIcon className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform" />
                            )}
                            <div className="text-center">
                                <span className="block font-bold text-gray-900 dark:text-white">Pull from Cloud</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Overwrite device with backup data</span>
                            </div>
                        </button>
                    </div>
                </div>

                {cloudStats?.timestamp && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleClearCloud}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors focus:outline-none rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            {isClearing ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <TrashIcon className="h-4 w-4" />
                            )}
                            Delete Cloud Backup
                        </button>
                    </div>
                )}

                <div className="mt-4 text-center h-8" aria-live="polite">
                    {statusMessage && (
                        <p className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium animate-scale-in ${
                            statusMessage.type === 'success' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                            {statusMessage.type === 'success' && <CheckCircleIcon className="h-4 w-4" />}
                            {statusMessage.text}
                        </p>
                    )}
                </div>

                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-lg">
                    <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-1 flex items-center gap-2">
                        <ChartBarIcon className="h-4 w-4" />
                        How Sync Works
                    </h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300/80">
                        Alpha Consortium uses a secure local storage mechanism to simulate cloud syncing. Backing up saves a snapshot of your current state. Restoring retrieves that snapshot. This enables you to undo major changes or reset your session, but data does not persist across different browsers or devices in this demo environment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CloudSync;