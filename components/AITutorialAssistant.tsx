import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TutorialStep } from '../types';
import { XMarkIcon, LightbulbIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface AITutorialAssistantProps {
    steps: TutorialStep[];
    isLoading: boolean;
    error: string;
    onClose: () => void;
}

const AITutorialAssistant: React.FC<AITutorialAssistantProps> = ({ steps, isLoading, error, onClose }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
    const [highlightStyle, setHighlightStyle] = useState({});
    const popoverRef = useRef<HTMLDivElement>(null);
    const step = steps[currentStepIndex];

    useEffect(() => {
        if (!step || !step.elementId) {
            setHighlightedElement(null);
            return;
        }

        const updateHighlight = () => {
            const element = document.querySelector(`[data-tutorial-id="${step.elementId}"]`) as HTMLElement;
            setHighlightedElement(element);
            if (element) {
                const rect = element.getBoundingClientRect();
                setHighlightStyle({
                    position: 'fixed',
                    left: `${rect.left - 8}px`,
                    top: `${rect.top - 8}px`,
                    width: `${rect.width + 16}px`,
                    height: `${rect.height + 16}px`,
                });
            }
        };

        updateHighlight();
        window.addEventListener('resize', updateHighlight);
        return () => window.removeEventListener('resize', updateHighlight);
    }, [currentStepIndex, steps]);

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    if (steps.length === 0 && !isLoading && !error) {
        return null; // Don't render until there's something to show
    }

    const popoverContent = (
        <div ref={popoverRef} className="z-[1001] fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-80 p-5 transition-all duration-300 animate-scale-in" style={{
            left: '50%',
            bottom: '50px',
            transform: 'translateX(-50%)',
        }}>
            {isLoading ? (
                <div className="flex flex-col items-center text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">AI Guide is preparing your tour...</p>
                </div>
            ) : error ? (
                 <div className="text-center">
                    <h3 className="text-md font-bold text-red-700 dark:text-red-400">Oops!</h3>
                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">{error}</p>
                </div>
            ) : (
                <>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold">
                            {currentStepIndex + 1}
                        </div>
                        <div>
                            <h3 className="text-md font-bold text-gray-900 dark:text-white">{step.title}</h3>
                            <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">{step.text}</p>
                        </div>
                    </div>
                    <div className="mt-5 flex justify-between items-center">
                        <button onClick={onClose} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">Exit Guide</button>
                        <div className="flex items-center gap-2">
                             <button onClick={handlePrev} disabled={currentStepIndex === 0} className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{currentStepIndex + 1} / {steps.length}</span>
                            <button onClick={handleNext} className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
    
    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-[999] animate-fade-in" onClick={onClose}></div>
            {highlightedElement && (
                <div
                    className="fixed rounded-lg border-2 border-blue-500 z-[1000] animate-orbital-glow transition-all duration-300 pointer-events-none"
                    style={highlightStyle}
                ></div>
            )}
            {popoverContent}
        </>,
        document.body
    );
};

export default AITutorialAssistant;