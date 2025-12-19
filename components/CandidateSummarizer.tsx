import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SparklesIcon, DocumentTextIcon, CloudArrowUpIcon, XMarkIcon } from './icons/Icons';
import { parseFile } from '../utils/fileParser';

const CandidateSummarizer: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [isParsingFile, setIsParsingFile] = useState(false);
    const [fileError, setFileError] = useState('');
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const resumeInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!fileName && !resumeText) {
            resumeInputRef.current?.focus();
        }
    }, [fileName, resumeText]);

    const processFile = async (file: File) => {
        if (!file) return;

        if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
            setFileError('Unsupported file type. Please upload a .docx or .pdf file.');
            return;
        }

        setIsParsingFile(true);
        setFileError('');
        setFileName(file.name);
        setResumeText('');
        setSummary('');
        setError('');

        try {
            const text = await parseFile(file);
            setResumeText(text);
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
        if (event.target) event.target.value = ''; // Reset file input
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleClearFile = () => {
        setFileName('');
        setResumeText('');
        setFileError('');
        if(fileInputRef.current) fileInputRef.current.value = '';
    };


    const handleGenerateSummary = async () => {
        if (!resumeText.trim()) {
            setError('Please paste the candidate\'s resume text.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSummary('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as an expert recruiter and hiring manager. Your task is to provide a concise, insightful summary of a candidate's profile based on their resume. The summary should be easy for a busy recruiter to scan quickly.

                **Candidate's Resume:**
                ${resumeText}

                **Instructions:**
                -   Summarize the candidate's key strengths, years of experience, and core competencies.
                -   Mention their most recent role and key achievements if available.
                -   Highlight if they seem like a good fit for a particular type of role (e.g., "This candidate appears to be a strong fit for senior sales roles.").
                -   Keep the summary to a short paragraph (3-5 sentences).
                -   The tone should be professional and objective.
                -   Output only the summary text.`;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setSummary(response.text);

        } catch (e: any) {
            console.error(e);
            setError('An error occurred while generating the summary. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const isBusy = isParsingFile || isLoading;
    const loaderText = isParsingFile ? 'Parsing Document...' : 'Generating Summary...';

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Candidate Summarizer</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Get a quick, AI-generated summary of a candidate's profile to streamline your screening process.</p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Input Section */}
                    <div className="space-y-6">
                         <div>
                            <label htmlFor="resume-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                1. Upload or Paste a Resume
                            </label>
                            <input
                                type="file"
                                id="resume-upload"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                                disabled={isBusy}
                            />
                            {fileName && !isParsingFile ? (
                                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600">
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 overflow-hidden">
                                        <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                                        <span className="font-medium truncate" title={fileName}>{fileName}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleClearFile}
                                        className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
                                        aria-label="Clear file"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <label
                                    htmlFor="resume-upload"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`cursor-pointer w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex flex-col items-center justify-center
                                    ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                >
                                    <CloudArrowUpIcon className="h-8 w-8 mx-auto mb-2" />
                                    <span className="text-sm">Drag & drop a file or <span className="text-blue-600 dark:text-blue-400 font-semibold">click to upload</span></span>
                                    <span className="text-xs mt-1 text-gray-400 dark:text-gray-500">.docx or .pdf supported</span>
                                </label>
                            )}
                            <div className="mt-2 text-center" aria-live="polite">
                                {fileError && <p role="alert" className="text-red-500 dark:text-red-400 text-sm">{fileError}</p>}
                            </div>
                        </div>
                        <div>
                            <textarea
                                id="resume-text"
                                ref={resumeInputRef}
                                rows={10}
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="...or paste the resume text here."
                                value={resumeText}
                                onChange={(e) => {
                                    setResumeText(e.target.value);
                                    if(fileName) handleClearFile();
                                }}
                                disabled={isBusy}
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleGenerateSummary}
                                disabled={isBusy || !resumeText}
                                className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                            >
                                {isBusy ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {loaderText}
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                        Generate Summary
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 sticky top-24 shadow-md dark:shadow-none min-h-[300px]">
                        <div className="flex items-center gap-3 mb-3">
                            <DocumentTextIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI-Generated Summary</h3>
                        </div>
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg min-h-[200px] flex items-center justify-center" aria-live="polite">
                            {isLoading ? (
                                <div className="animate-pulse text-center text-gray-500 dark:text-gray-400">
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mx-auto mb-2"></div>
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mx-auto mb-2"></div>
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/5 mx-auto"></div>
                                </div>
                            ) : error ? (
                                <p role="alert" className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                            ) : summary ? (
                                <p className="text-gray-700 dark:text-gray-300 text-sm animate-scale-in">{summary}</p>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-center text-sm">The candidate summary will appear here.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CandidateSummarizer;
