import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { InterviewQuestionData } from '../types';
import { SparklesIcon, LightbulbIcon, ChatBubbleOvalLeftEllipsisIcon } from './icons/Icons';
import { parseFile } from '../utils/fileParser';

const InterviewPrep: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [userExperience, setUserExperience] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [fileError, setFileError] = useState('');
    const [fileName, setFileName] = useState('');
    
    const [generatedData, setGeneratedData] = useState<InterviewQuestionData | null>(null);
    const allQuestions = generatedData ? [...generatedData.behavioralQuestions, ...generatedData.technicalQuestions, ...generatedData.situationalQuestions] : [];
    
    // Mock Interview State
    const [isMockInterviewActive, setIsMockInterviewActive] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    
    const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        jobDescriptionRef.current?.focus();
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsingFile(true);
        setFileError('');
        setFileName(file.name);
        setUserExperience('');

        try {
            const text = await parseFile(file);
            setUserExperience(text);
        } catch (err: any) {
            setFileError(err);
        } finally {
            setIsParsingFile(false);
        }
        event.target.value = '';
    };

    const questionsSchema = {
        type: Type.OBJECT,
        properties: {
            behavioralQuestions: {
                type: Type.ARRAY,
                description: '3-5 behavioral questions based on the role and resume.',
                items: { type: Type.STRING }
            },
            technicalQuestions: {
                type: Type.ARRAY,
                description: '3-5 technical or skill-based questions.',
                items: { type: Type.STRING }
            },
            situationalQuestions: {
                type: Type.ARRAY,
                description: '2-3 situational or scenario-based questions.',
                items: { type: Type.STRING }
            },
            answeringTips: {
                type: Type.STRING,
                description: 'A paragraph (3-4 sentences) of general advice for answering interview questions, such as mentioning the STAR method.'
            }
        },
        required: ['behavioralQuestions', 'technicalQuestions', 'situationalQuestions', 'answeringTips']
    };

    const handleGenerateQuestions = async () => {
        if (!jobDescription || !userExperience) {
            setError('Please provide both a job description and your experience.');
            return;
        }
        setIsGenerating(true);
        setError('');
        setGeneratedData(null);
        setFeedback('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as an expert hiring manager and interview coach.
                Based on the provided job description and candidate's resume, generate a list of tailored interview questions and general answering tips.
                
                **Job Description:**
                ${jobDescription}

                **Candidate's Resume/Experience:**
                ${userExperience}

                **Instructions:**
                1.  Generate 3-5 behavioral questions that probe into the candidate's past experiences and soft skills relevant to the role.
                2.  Generate 3-5 technical questions that assess the candidate's specific knowledge and hard skills mentioned in the job description.
                3.  Generate 2-3 situational questions that present a hypothetical work scenario to evaluate the candidate's problem-solving and decision-making abilities.
                4.  Write a brief paragraph of general tips for answering questions effectively, including a mention of the STAR (Situation, Task, Action, Result) method.

                Return the entire output as a single JSON object matching the provided schema.
            `;
            
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: questionsSchema
                }
            });

            const text = response.text.trim();
            if (text) {
                const parsedJson = JSON.parse(text);
                setGeneratedData(parsedJson);
            } else {
                setError('The AI could not generate questions. Please try again.');
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred while generating questions. Please check your API key and try again.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGetFeedback = async () => {
        if (!userAnswer) return;
        setIsGettingFeedback(true);
        setFeedback('');
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                You are an expert interview coach providing feedback.
                The user was asked the following interview question:
                **Question:** "${allQuestions[currentQuestionIndex]}"

                Here is their answer:
                **Answer:** "${userAnswer}"

                Please provide constructive, actionable feedback on their answer. Focus on:
                - Clarity and conciseness.
                - Structure (e.g., Does it follow the STAR method? Is it logical?).
                - Relevance to the question.
                - Impact and use of specific examples.

                Keep the feedback encouraging and formatted into 2-3 bullet points. Start with a positive reinforcement if possible.
            `;
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setFeedback(response.text);
        } catch (e) {
            console.error(e);
            setError('Failed to get feedback. Please try again.');
        } finally {
            setIsGettingFeedback(false);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < allQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setUserAnswer('');
            setFeedback('');
        }
    };
    
    const startInterview = () => {
        setIsMockInterviewActive(true);
        setCurrentQuestionIndex(0);
        setUserAnswer('');
        setFeedback('');
    };

    const endInterview = () => {
        setIsMockInterviewActive(false);
    };

    const renderMockInterview = () => (
        <div className="mt-12">
            <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-md dark:shadow-none">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mock Interview</h3>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Question {currentQuestionIndex + 1} of {allQuestions.length}</p>
                </div>
                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%` }}
                        role="progressbar"
                        aria-valuenow={currentQuestionIndex + 1}
                        aria-valuemin={1}
                        aria-valuemax={allQuestions.length}
                        aria-label={`Progress: question ${currentQuestionIndex + 1} of ${allQuestions.length}`}
                    ></div>
                </div>
                
                <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{allQuestions[currentQuestionIndex]}</p>
                </div>

                <div className="mt-4">
                    <label htmlFor="user-answer" className="sr-only">Your Answer</label>
                    <textarea
                        id="user-answer"
                        rows={6}
                        className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your answer here..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={isGettingFeedback}
                    />
                </div>
                
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button onClick={endInterview} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500">
                        End Interview
                    </button>
                    <div className="flex gap-2">
                         <button
                            onClick={handleGetFeedback}
                            disabled={isGettingFeedback || !userAnswer}
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-500"
                        >
                            {isGettingFeedback ? 'Getting Feedback...' : 'Get Feedback'}
                        </button>
                        <button
                            onClick={handleNextQuestion}
                            disabled={currentQuestionIndex >= allQuestions.length - 1}
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 disabled:bg-gray-400 dark:disabled:bg-gray-500"
                        >
                            Next Question
                        </button>
                    </div>
                </div>

                <div aria-live="polite" className="mt-6">
                    {isGettingFeedback && <p className="text-center text-gray-500 dark:text-gray-400">Analyzing your answer...</p>}
                    {feedback && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-500/20 animate-scale-in">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                <LightbulbIcon className="h-5 w-5" aria-hidden="true" />
                                Coach's Feedback
                            </h4>
                            <div className="mt-2 whitespace-pre-wrap text-sm text-blue-700 dark:text-blue-300/90 font-sans pl-4 border-l-2 border-blue-200 dark:border-blue-500/40 ml-2.5">
                                {feedback}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderGeneratedQuestions = () => (
        <div className="mt-12 space-y-8 animate-scale-in">
            <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Tailored Interview Plan</h3>
                 <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-500/20 flex items-start gap-3">
                    <LightbulbIcon className="h-6 w-6 text-blue-500 dark:text-blue-300 flex-shrink-0 mt-1" aria-hidden="true" />
                    <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">Answering Tips:</h4>
                        <p className="text-blue-700 dark:text-blue-300/90 text-sm">{generatedData!.answeringTips}</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QuestionCategory title="Behavioral Questions" questions={generatedData!.behavioralQuestions} />
                <QuestionCategory title="Technical Questions" questions={generatedData!.technicalQuestions} />
                <QuestionCategory title="Situational Questions" questions={generatedData!.situationalQuestions} />
            </div>
             <div className="text-center pt-6">
                <button
                    onClick={startInterview}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform transform hover:scale-105"
                >
                    <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Start Mock Interview
                </button>
            </div>
        </div>
    );
    
    const QuestionCategory: React.FC<{title: string; questions: string[]}> = ({ title, questions }) => (
        <div className="bg-white dark:bg-gray-800/30 p-5 rounded-lg border border-gray-200 dark:border-blue-500/20">
            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3">{title}</h4>
            <ul className="space-y-2">
                {questions.map((q, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-blue-500 mr-2">▪</span>{q}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Interview Prep</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Ace your next interview with AI-generated questions and real-time feedback.</p>
                </div>

                {!generatedData && !isGenerating ? (
                    <div className="mt-12 space-y-6">
                         <div>
                            <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                1. Paste Job Description
                            </label>
                            <textarea
                                id="job-description"
                                ref={jobDescriptionRef}
                                rows={8}
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="Paste the full job description here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                            />
                        </div>
                        <div>
                             <label htmlFor="user-experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                2. Upload or Paste Your Resume/Experience
                            </label>
                            <div className="flex flex-col items-start mb-2">
                                <input type="file" id="resume-upload" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} disabled={isParsingFile} aria-describedby="file-upload-status" />
                                <label htmlFor="resume-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-400 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                                    {isParsingFile ? 'Processing...' : 'Upload .docx or .pdf'}
                                </label>
                                <div id="file-upload-status" className="mt-2 text-sm" aria-live="polite">
                                    {fileName && !isParsingFile && !fileError && <p className="text-gray-500 dark:text-gray-400">File: {fileName}</p>}
                                    {fileError && <p role="alert" className="text-red-500 dark:text-red-400">{fileError}</p>}
                                </div>
                            </div>
                            <textarea
                                id="user-experience"
                                rows={8}
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="...or paste your relevant experience here."
                                value={userExperience}
                                onChange={(e) => setUserExperience(e.target.value)}
                            />
                        </div>
                        <div className="text-center pt-4">
                            <button
                                onClick={handleGenerateQuestions}
                                disabled={isGenerating || isParsingFile || !jobDescription || !userExperience}
                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                Generate Questions
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="mt-12" aria-live="polite">
                    {isGenerating ? (
                         <div className="flex flex-col items-center justify-center text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300">Our AI is analyzing your info and crafting the perfect interview questions...</p>
                        </div>
                    ) : error ? (
                        <div role="alert" className="mt-4 max-w-2xl mx-auto text-center text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 p-4 rounded-md">
                            <h3 className="font-bold">Generation Failed</h3>
                            <p>{error}</p>
                        </div>
                    ) : generatedData ? (
                        isMockInterviewActive ? renderMockInterview() : renderGeneratedQuestions()
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default InterviewPrep;