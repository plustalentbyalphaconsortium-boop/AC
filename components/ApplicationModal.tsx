import React, { useState, useEffect, useRef } from 'react';
import { Job } from '../types';
import { XMarkIcon, BriefcaseIcon } from './icons/Icons';

interface ApplicationModalProps {
    job: Job;
    onClose: () => void;
    onSubmit: (jobId: number) => void;
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ job, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        coverLetter: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const triggerElementRef = useRef<HTMLElement | null>(null);

    // Capture the trigger element on mount and restore focus on unmount
    useEffect(() => {
        triggerElementRef.current = document.activeElement as HTMLElement;

        return () => {
            triggerElementRef.current?.focus();
        };
    }, []);

    // Handle focus trapping, initial focus, and body overflow
    useEffect(() => {
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = Array.from(
            modalNode.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        ).filter(el => !el.hasAttribute('disabled'));

        // Set initial focus
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            // If no interactive elements, focus the modal itself to trap focus.
            modalNode.focus();
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            if (event.key === 'Tab') {
                if (focusableElements.length === 0) {
                    event.preventDefault(); // Prevent tabbing out of the modal
                    return;
                }

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) { // Shift+Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [onClose, isSubmitted]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || isSubmitted) return;
        
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            onSubmit(job.id);
            setIsSubmitting(false);
            setIsSubmitted(true);
            
            // Wait for success message to show before closing
            setTimeout(() => {
                onClose();
            }, 2000);
        }, 1500);
    };

    return (
        <div 
            ref={modalRef}
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
            aria-labelledby="application-modal-title"
            tabIndex={-1}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
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
                    
                    {!isSubmitted ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <BriefcaseIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                                <div>
                                    <h2 id="application-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">Apply for {job.title}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">at {job.company}</p>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                    <input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                    <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cover Letter</label>
                                    <textarea name="coverLetter" id="coverLetter" rows={4} required value={formData.coverLetter} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="Briefly explain why you're a good fit for this role..."></textarea>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">Cancel</button>
                                    <button type="submit" disabled={isSubmitting} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting...
                                            </>
                                        ) : "Submit Application"}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-10" role="alert">
                            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 id="application-modal-title" className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Application Submitted!</h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Thank you for applying for the {job.title} position. We'll be in touch soon.
                            </p>
                        </div>
                    )}
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

export default ApplicationModal;