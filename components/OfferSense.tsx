import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { OfferAnalysis } from '../types';
import { SparklesIcon, DocumentTextIcon, CloudArrowUpIcon, XMarkIcon, ScaleIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/Icons';
import { parseFile } from '../utils/fileParser';

const OfferSense: React.FC = () => {
    const [offerText, setOfferText] = useState('');
    const [analysis, setAnalysis] = useState<OfferAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [isParsingFile, setIsParsingFile] = useState(false);
    const [fileError, setFileError] = useState('');
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const offerInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = async (file: File) => {
        if (!file) return;

        if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
            setFileError('Unsupported file type. Please upload a .docx or .pdf file.');
            return;
        }

        setIsParsingFile(true);
        setFileError('');
        setFileName(file.name);
        setOfferText('');
        setAnalysis(null);
        setError('');

        try {
            const text = await parseFile(file);
            setOfferText(text);
        } catch (err: any) {
            setFileError(err.toString());
        } finally {
            setIsParsingFile(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
        if (event.target) event.target.value = '';
    };

    const handleClearFile = () => {
        setFileName('');
        setOfferText('');
        setFileError('');
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const analysisSchema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER, description: 'Score from 0-100 indicating offer quality.' },
            salaryAssessment: { type: Type.STRING, description: 'Evaluation of salary competitiveness.' },
            benefitsSummary: { type: Type.STRING, description: 'Summary of key perks.' },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Potential issues in the contract.' },
            pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Strong points of the offer.' },
            negotiationStrategy: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Step-by-step tips to negotiate better terms.' },
            counterOfferDraft: { type: Type.STRING, description: 'A polite, professional counter-offer email draft.' }
        },
        required: ['score', 'salaryAssessment', 'benefitsSummary', 'redFlags', 'pros', 'negotiationStrategy', 'counterOfferDraft']
    };

    const handleAnalyze = async () => {
        if (!offerText.trim()) {
            setError('Please provide the offer text or upload a document.');
            return;
        }

        setIsLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a senior HR consultant and negotiation coach. Analyze the following job offer letter/contract text.
                Identify the salary competitiveness (assume general market standards), benefits, and any restrictive clauses (like non-competes).
                Provide a "Negotiation Power Score" (0-100) based on how favorable the terms are.
                Generate a strategy to improve the offer and a draft email for the candidate to send.

                **Offer Text:**
                ${offerText}
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: analysisSchema
                }
            });
            
            setAnalysis(JSON.parse(response.text));

        } catch (e: any) {
            console.error(e);
            setError('Analysis failed. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isBusy = isParsingFile || isLoading;

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">OfferSense: AI Offer Analyzer</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Decode your job offer, spot red flags, and negotiate with confidence.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-gray-800/30 p-6 rounded-xl border border-gray-200 dark:border-blue-500/20 shadow-sm">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                                Upload Offer Letter or Paste Text
                            </label>
                            
                            {!fileName && (
                                <div className="mb-4">
                                    <input
                                        type="file"
                                        id="offer-upload"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf,.docx,application/pdf"
                                        onChange={handleFileChange}
                                        disabled={isBusy}
                                    />
                                    <label
                                        htmlFor="offer-upload"
                                        className="cursor-pointer w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/20"
                                    >
                                        <CloudArrowUpIcon className="h-10 w-10 mb-2 opacity-50" />
                                        <span className="font-semibold">Click to upload (PDF/DOCX)</span>
                                    </label>
                                </div>
                            )}

                            {fileName && (
                                <div className="flex items-center justify-between p-3 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300 truncate">{fileName}</span>
                                    <button onClick={handleClearFile} className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors">
                                        <XMarkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </button>
                                </div>
                            )}

                            <div className="relative">
                                <textarea
                                    ref={offerInputRef}
                                    rows={12}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                    placeholder="Or paste the contract text here..."
                                    value={offerText}
                                    onChange={(e) => setOfferText(e.target.value)}
                                    disabled={isBusy}
                                />
                            </div>

                            <div className="mt-4 text-center">
                                {fileError && <p className="text-red-500 text-sm mb-2">{fileError}</p>}
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isBusy || !offerText}
                                    className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-lg hover:bg-blue-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:scale-100"
                                >
                                    {isBusy ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Analyzing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <ScaleIcon className="h-5 w-5" />
                                            Analyze Offer
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {analysis ? (
                            <div className="space-y-6 animate-scale-in">
                                {/* Score Card */}
                                <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-xl border border-gray-200 dark:border-blue-500/20 shadow-lg flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Offer Quality Score</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Based on market standards</p>
                                    </div>
                                    <div className="relative w-24 h-24 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                                strokeDasharray={251.2} 
                                                strokeDashoffset={251.2 - (251.2 * analysis.score) / 100} 
                                                className={analysis.score > 70 ? "text-green-500" : analysis.score > 40 ? "text-yellow-500" : "text-red-500"} 
                                            />
                                        </svg>
                                        <span className="absolute text-2xl font-bold dark:text-white">{analysis.score}</span>
                                    </div>
                                </div>

                                {/* Salary & Benefits */}
                                <div className="bg-white dark:bg-gray-800/30 p-6 rounded-xl border border-gray-200 dark:border-blue-500/20">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><SparklesIcon className="h-5 w-5 text-blue-500"/> Assessment</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong>Salary:</strong> {analysis.salaryAssessment}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Benefits:</strong> {analysis.benefitsSummary}</p>
                                </div>

                                {/* Red Flags */}
                                {analysis.redFlags.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                                        <h4 className="font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2"><ExclamationTriangleIcon className="h-5 w-5"/> Attention Required</h4>
                                        <ul className="space-y-2">
                                            {analysis.redFlags.map((flag, i) => (
                                                <li key={i} className="text-sm text-red-700 dark:text-red-200 flex items-start gap-2">
                                                    <span className="mt-1">•</span> {flag}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Negotiation Strategy */}
                                <div className="bg-white dark:bg-gray-800/30 p-6 rounded-xl border border-gray-200 dark:border-blue-500/20">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">Negotiation Strategy</h4>
                                    <ul className="space-y-2 mb-6">
                                        {analysis.negotiationStrategy.map((tip, i) => (
                                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex gap-2">
                                                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <h5 className="font-semibold text-sm mb-2 dark:text-gray-200">Draft Counter-Offer Email</h5>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {analysis.counterOfferDraft}
                                        </div>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(analysis.counterOfferDraft)}
                                            className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                                        >
                                            Copy to Clipboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <ScaleIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Your offer analysis will appear here.</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">We process data securely and do not store your documents.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferSense;