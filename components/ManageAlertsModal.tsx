import React from 'react';
import { JobAlertSubscription } from '../types';
import { XMarkIcon, BellIcon, TrashIcon } from './icons/Icons';
import { useModalFocus } from '../hooks/useModalFocus';

interface ManageAlertsModalProps {
    onClose: () => void;
    subscriptions: JobAlertSubscription[];
    onDelete: (subscriptionId: string) => void;
}

const ManageAlertsModal: React.FC<ManageAlertsModalProps> = ({ onClose, subscriptions, onDelete }) => {
    const modalRef = useModalFocus(onClose, true);

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-labelledby="manage-alerts-modal-title"
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
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
                    
                    <div className="flex items-center gap-3 mb-4">
                        <BellIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                        <div>
                            <h2 id="manage-alerts-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Manage Your Job Alerts</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">View and remove your active subscriptions.</p>
                        </div>
                    </div>

                    <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2">
                        {subscriptions.length > 0 ? (
                            <ul className="space-y-3">
                                {subscriptions.map(sub => (
                                    <li key={sub.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{sub.email}</p>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                                <span>Category: <span className="font-medium text-gray-700 dark:text-gray-300">{sub.category}</span></span>
                                                {sub.keywords && <span>Keywords: <span className="font-medium text-gray-700 dark:text-gray-300">"{sub.keywords}"</span></span>}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onDelete(sub.id)}
                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors"
                                            aria-label={`Delete alert for ${sub.email}`}
                                        >
                                            <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500 dark:text-gray-400">You have no active job alerts.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">Done</button>
                    </div>
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

export default ManageAlertsModal;