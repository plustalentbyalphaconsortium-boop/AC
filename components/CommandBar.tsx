import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AICommand } from '../types';
import { CommandLineIcon, MagnifyingGlassIcon } from './icons/Icons';
import { View } from '../types';
import { JOB_CATEGORIES } from '../constants';

interface CommandBarProps {
    onClose: () => void;
    onExecuteCommand: (command: AICommand) => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ onClose, onExecuteCommand }) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    
    // Handle Esc key to close
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Handle clicks outside the modal to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);


    const commandSchema = {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: "The action to perform. Must be one of: 'NAVIGATE', 'SEARCH_JOBS'.",
        },
        params: {
          type: Type.OBJECT,
          description: 'Parameters for the action.',
          properties: {
            view: { type: Type.STRING, description: `The view to navigate to. Must be a key from the View enum: ${Object.keys(View).join(', ')}` },
            searchTerm: { type: Type.STRING, description: 'The search query for jobs.' },
            category: { type: Type.STRING, description: `The job category. Must be one of: ${JOB_CATEGORIES.join(', ')}` },
          }
        }
      },
      required: ['action']
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                You are a smart assistant integrated into a web application. Your job is to understand a user's natural language command and translate it into a structured JSON command that the application can execute.

                Here are the available views in the application: ${Object.keys(View).join(', ')}.
                Here are the available job categories: ${JOB_CATEGORIES.join(', ')}.

                Analyze the user's request and determine the correct action and parameters.
                - For simple navigation requests (e.g., "go to the dashboard", "show me the academy"), use the "NAVIGATE" action and provide the correct "view".
                - For job search requests (e.g., "find me sales jobs", "look for remote marketing positions"), use the "SEARCH_JOBS" action. Extract the search term and a relevant category. The view for this is always 'Jobs'.

                User's command: "${inputValue}"

                Return a JSON object matching the provided schema.
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: commandSchema,
                }
            });
            
            const text = response.text.trim();
            if (text) {
                const parsedCommand: AICommand = JSON.parse(text);
                onExecuteCommand(parsedCommand);
            } else {
                throw new Error("AI returned an empty response.");
            }

        } catch (err) {
            console.error(err);
            setError("Sorry, I couldn't understand that. Please try rephrasing your command.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestions = [
        "Go to my dashboard",
        "Find marketing jobs in Remote",
        "Show me the Alpha Academy",
        "Take me to the AI Resume Builder",
    ];

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-start justify-center z-50 p-4 pt-[20vh] transition-opacity duration-300 animate-fade-in">
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl mx-auto transform transition-all duration-300 scale-95 opacity-0 animate-scale-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="command-bar-title"
            >
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            )}
                        </div>
                        <input
                            ref={inputRef}
                            id="command-bar-title"
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full bg-transparent border-0 rounded-t-xl py-4 pl-11 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 sm:text-sm"
                            placeholder="Tell me what you want to do..."
                            disabled={isLoading}
                        />
                    </div>
                </form>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Suggestions</p>
                    <ul className="space-y-1">
                        {suggestions.map((suggestion, i) => (
                             <li key={i}>
                                <button
                                    onClick={() => setInputValue(suggestion)}
                                    className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300"
                                >
                                    <CommandLineIcon className="h-4 w-4 text-gray-400"/>
                                    {suggestion}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                {(error || !isLoading) && (
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl text-xs text-center min-h-[2rem]">
                         {error ? (
                            <p className="text-red-500 dark:text-red-400">{error}</p>
                         ) : (
                            <p className="text-gray-400 dark:text-gray-500">
                                Press <kbd className="font-sans font-semibold">Enter</kbd> to run command, <kbd className="font-sans font-semibold">Esc</kbd> to close.
                            </p>
                         )}
                    </div>
                )}
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

export default CommandBar;