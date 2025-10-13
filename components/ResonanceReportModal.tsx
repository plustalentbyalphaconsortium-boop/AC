import React from 'react';
import { Job } from '../types';
import { XMarkIcon, HeartIcon } from './icons/Icons';
import { useModalFocus } from '../hooks/useModalFocus';

interface ResonanceReportModalProps {
    job: Job;
    report: string;
    score: number;
    onClose: () => void;
}

const ResonanceReportModal: React.FC<ResonanceReportModalProps> = ({ job, report, score, onClose }) => {
    const modalRef = useModalFocus(onClose, true);

    return (
        <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-labelledby="resonance-report-title"
        >
            <div
                ref={modalRef}
                tabIndex={-1}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-auto transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
                style={{ animationFillMode: 'forwards' }}
            >
                <div className="p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Close"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-full border-4 border-blue-500/50 flex items-center justify-center text-blue-500 font-bold text-2xl font-orbitron">
                            {score}%
                        </div>
                        <div>
                            <h2 id="resonance-report-title" className="text-xl font-bold text-gray-900 dark:text-white">Resonance Report</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">For {job.title} at {job.company}</p>
                        </div>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto pr-4">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
                            <HeartIcon className="h-5 w-5 text-red-500" />
                            Vibe Alignment Analysis
                        </h3>
                        <p className="whitespace-pre-wrap font-sans">{report}</p>
                    </div>
                     <div className="flex justify-end pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">Close</button>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
            `}</style>
        </div>
    );
};

export default ResonanceReportModal;
