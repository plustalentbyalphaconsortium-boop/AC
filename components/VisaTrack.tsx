import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { VisaRoadmapData } from '../types';
import { RocketLaunchIcon, SparklesIcon, MapPinIcon, CheckBadgeIcon, ClipboardIcon } from './icons/Icons';

const BALKAN_COUNTRIES = ['Romania', 'Croatia', 'Bulgaria', 'Serbia', 'Albania', 'Montenegro'];

const VisaTrack: React.FC = () => {
    const [selectedCountry, setSelectedCountry] = useState('');
    const [roadmap, setRoadmap] = useState<VisaRoadmapData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const roadmapSchema = {
        type: Type.OBJECT,
        properties: {
            country: { type: Type.STRING },
            steps: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        documentsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['title', 'description', 'documentsNeeded']
                }
            },
            culturalTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            interviewPrep: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['country', 'steps', 'culturalTips', 'interviewPrep']
    };

    const handleGenerateRoadmap = async (country: string) => {
        setSelectedCountry(country);
        setIsLoading(true);
        setError('');
        setRoadmap(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as an expert international relocation consultant specializing in Balkan work visas for candidates from South Asia (Bangladesh and Nepal).
                Generate a comprehensive relocation roadmap for: ${country}.
                
                Include:
                1. 4-5 major steps (e.g. Work Permit, Embassy Interview, Visa Collection).
                2. Specific documents needed for a South Asian applicant.
                3. Top 3 cultural integration tips for workers moving to ${country}.
                4. 3 specific sample interview questions for the embassy interview.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: roadmapSchema
                }
            });

            setRoadmap(JSON.parse(response.text));
        } catch (err) {
            console.error(err);
            setError("Failed to generate your roadmap. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Balkan Bridge: AI Visa Track</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Navigate your international career move with AI-powered relocation intelligence.</p>
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-4">
                    {BALKAN_COUNTRIES.map(country => (
                        <button
                            key={country}
                            onClick={() => handleGenerateRoadmap(country)}
                            disabled={isLoading}
                            className={`px-6 py-2 rounded-full border-2 transition-all ${
                                selectedCountry === country 
                                ? 'bg-orange-600 border-orange-600 text-white shadow-lg' 
                                : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-500'
                            } disabled:opacity-50`}
                            aria-pressed={selectedCountry === country}
                        >
                            {country}
                        </button>
                    ))}
                </div>

                <div className="mt-16" aria-live="polite">
                    {isLoading && (
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                            <p className="mt-4 text-gray-500">Consulting relocation experts...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-400 text-center">
                            {error}
                        </div>
                    )}

                    {roadmap && (
                        <div className="space-y-8 animate-scale-in">
                            <section className="bg-white dark:bg-gray-800/30 p-8 rounded-xl border border-orange-500/20 shadow-xl">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                                    <RocketLaunchIcon className="h-6 w-6 text-orange-500" />
                                    Your {roadmap.country} Relocation Roadmap
                                </h3>
                                
                                <div className="space-y-12">
                                    {roadmap.steps.map((step, idx) => (
                                        <div key={idx} className="relative pl-8 border-l-2 border-orange-500/30 last:border-l-0">
                                            <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-orange-600 border-4 border-white dark:border-[#0c0a18]"></div>
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-white">{step.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{step.description}</p>
                                            <div className="mt-3">
                                                <h5 className="text-xs font-bold uppercase text-orange-500 mb-2">Documents Needed:</h5>
                                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {step.documentsNeeded.map((doc, dIdx) => (
                                                        <li key={dIdx} className="text-sm flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                            <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                                                            {doc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-800/30 p-6 rounded-xl border border-orange-500/20">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                        <MapPinIcon className="h-5 w-5 text-orange-500" />
                                        Cultural Integration
                                    </h4>
                                    <ul className="space-y-3">
                                        {roadmap.culturalTips.map((tip, i) => (
                                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {tip}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white dark:bg-gray-800/30 p-6 rounded-xl border border-orange-500/20">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                                        <ClipboardIcon className="h-5 w-5 text-orange-500" />
                                        Visa Interview Prep
                                    </h4>
                                    <ul className="space-y-3">
                                        {roadmap.interviewPrep.map((q, i) => (
                                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400 italic">"{q}"</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!roadmap && !isLoading && (
                        <div className="text-center text-gray-400 mt-12 py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                            Select a country to start your AI Relocation Roadmap.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VisaTrack;