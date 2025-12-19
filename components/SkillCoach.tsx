import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LearningPlanData, UserProfile, View } from '../types';
import { MOCK_COURSES } from '../constants';
import { CpuChipIcon, AcademicCapIcon, LightbulbIcon, SparklesIcon, BriefcaseIcon, ChevronDownIcon, CheckCircleIcon, TrashIcon } from './icons/Icons';

const AnalysisCard: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
}> = ({ icon: Icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3 mb-3">
            <Icon className="h-6 w-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
            {children}
        </div>
    </div>
);

const AccordionItem: React.FC<{
    item: { step: string; description: string; isCompleted?: boolean };
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    onToggleComplete: () => void;
}> = ({ item, index, isOpen, onToggle, onToggleComplete }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors duration-300 ${item.isCompleted ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
            <h2>
                <div className="flex w-full items-center">
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={!!item.isCompleted}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete();
                        }}
                        className={`ml-4 flex-shrink-0 w-6 h-6 rounded border cursor-pointer flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 ${item.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-400 dark:border-gray-500 hover:border-blue-500'}`}
                        aria-label={`Mark step ${index + 1} as completed`}
                    >
                        {item.isCompleted && <CheckCircleIcon className="w-4 h-4 text-white" aria-hidden="true" />}
                    </button>
                    
                    <button
                        type="button"
                        className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                        onClick={onToggle}
                        aria-expanded={isOpen}
                        aria-controls={`accordion-content-${index}`}
                    >
                        <span className={`ml-2 ${item.isCompleted ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>{item.step}</span>
                        <ChevronDownIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                </div>
            </h2>
            <div
                ref={contentRef}
                id={`accordion-content-${index}`}
                style={{ maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : '0px' }}
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            >
                <div className="p-4 pt-0 pl-16">
                    <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
            </div>
        </div>
    );
};


const RecommendedCourseCard: React.FC<{ course: { title: string; reason: string }; onExplore: () => void }> = ({ course, onExplore }) => (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-300 dark:border-gray-700 h-full flex flex-col transition-all duration-300 hover:border-blue-400 hover:shadow-md">
        <h4 className="font-bold text-gray-900 dark:text-white">{course.title}</h4>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400 flex-grow">"{course.reason}"</p>
        <div className="mt-3 text-right">
            <button 
                onClick={onExplore}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline bg-transparent border-none p-0 inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
                Explore in Academy &rarr;
            </button>
        </div>
    </div>
);

interface SkillCoachProps {
    setActiveView: (view: View) => void;
}

const SkillCoach: React.FC<SkillCoachProps> = ({ setActiveView }) => {
    const [skillQuery, setSkillQuery] = useState('');
    const [careerGoal, setCareerGoal] = useState('');
    const [learningPlan, setLearningPlan] = useState<LearningPlanData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    
    // State for interactive practice session
    const [exerciseSubmission, setExerciseSubmission] = useState('');
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    const [exerciseFeedback, setExerciseFeedback] = useState('');
    
    const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(0);
    
    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                const parsedProfile = JSON.parse(savedProfile);
                setUserProfile(parsedProfile);
            } else {
                setError("Please create a profile in 'My Dashboard' first to get a personalized learning plan.");
            }

            const savedPlan = localStorage.getItem('activeLearningPlan');
            if (savedPlan) {
                setLearningPlan(JSON.parse(savedPlan));
            }
        } catch (err) {
            console.error("Failed to load data from localStorage", err);
        }
    }, []);

    useEffect(() => {
        if (learningPlan) {
            localStorage.setItem('activeLearningPlan', JSON.stringify(learningPlan));
        }
    }, [learningPlan]);


    const learningPlanSchema = {
      type: Type.OBJECT,
      properties: {
        learningPath: {
          type: Type.ARRAY,
          description: 'A step-by-step learning path with 3-5 logical steps or weekly goals.',
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.STRING, description: "The title of the step (e.g., 'Week 1: Fundamentals')." },
              description: { type: Type.STRING, description: 'A brief, 1-2 sentence description of what to learn in this step.' }
            },
            required: ['step', 'description']
          }
        },
        keyConcepts: {
          type: Type.ARRAY,
          description: 'A list of 4-6 fundamental concepts the user must understand for this skill.',
          items: { type: Type.STRING }
        },
        recommendedCourses: {
          type: Type.ARRAY,
          description: 'A list of 1-2 relevant courses from the provided Alpha Academy list.',
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'The exact title of the recommended course from the provided list.' },
              reason: { type: Type.STRING, description: 'A brief, 1-sentence reason why this course is a good fit.' }
            },
            required: ['title', 'reason']
          }
        },
        practiceExercise: {
          type: Type.STRING,
          description: 'A simple, actionable practice exercise a beginner can do to get started.'
        }
      },
      required: ['learningPath', 'keyConcepts', 'recommendedCourses', 'practiceExercise']
    };


    const handleGeneratePlan = async () => {
        if (!skillQuery) {
            setError('Please enter a skill you want to learn.');
            return;
        }
        if (!userProfile?.masterResume) {
            setError("Please complete your Master Resume in 'My Dashboard' before generating a plan.");
            return;
        }

        // Reset state
        setExerciseSubmission('');
        setExerciseFeedback('');
        setOpenAccordionIndex(0); 
        
        setIsLoading(true);
        setError('');
        setLearningPlan(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const availableCourses = MOCK_COURSES.map(c => `- ${c.title}: ${c.description}`).join('\n');
            
            const prompt = `
                Act as an expert learning and development coach.
                Your task is to create a structured, personalized learning plan for the skill: "${skillQuery}".
                
                **User Context:**
                - **Career Goal:** ${careerGoal || "General upskilling"}
                - **Current Background (Resume):** ${userProfile.masterResume}

                **Available Alpha Academy Courses:**
                ${availableCourses}

                **Instructions:**
                1.  **Learning Path:** Break down the learning process into 3-5 logical steps or weekly goals. Tailor the difficulty and focus to bridge the gap between their current background and their career goal.
                2.  **Key Concepts:** List 4-6 fundamental concepts the user must understand.
                3.  **Recommended Courses:** From the provided list of Alpha Academy courses, identify and recommend up to two that are most relevant. For each, provide a reason linked to their goal.
                4.  **Practice Exercise:** Create a specific, actionable practice exercise.

                Return the entire plan as a single JSON object that matches the provided schema.
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: learningPlanSchema,
                }
            });

            const text = response.text.trim();
             if (text) {
                try {
                    const parsedJson = JSON.parse(text);
                    const planWithMetadata = {
                        ...parsedJson,
                        skillName: skillQuery,
                        careerGoal: careerGoal,
                        learningPath: parsedJson.learningPath.map((item: any) => ({ ...item, isCompleted: false }))
                    };
                    setLearningPlan(planWithMetadata);
                } catch (jsonError) {
                    console.error("Failed to parse JSON response:", jsonError);
                    setError("Received an invalid learning plan format from the AI. Please try again.");
                }
            } else {
                setError('The AI could not generate a learning plan. The response was empty.');
            }

        } catch (e: any) {
            console.error(e);
            setError('An error occurred while generating the plan. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGetExerciseFeedback = async () => {
        if (!exerciseSubmission || !learningPlan) return;

        setIsGettingFeedback(true);
        setExerciseFeedback('');
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a patient and encouraging tutor. The user is learning the skill: "${learningPlan.skillName}".
                Their goal is: "${learningPlan.careerGoal || 'upskilling'}".
                
                They were given the following practice exercise:
                **Exercise:** "${learningPlan.practiceExercise}"

                Here is their submission for the exercise:
                **Submission:** "${exerciseSubmission}"

                Please provide constructive feedback tailored to their likely experience level. Your feedback must be easy to read and follow.
                Structure your feedback using bullet points.
            `;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });
            setExerciseFeedback(response.text);
        } catch (e) {
            console.error(e);
            setError('Failed to get feedback from the coach. Please try again.');
        } finally {
            setIsGettingFeedback(false);
        }
    };

    const toggleStepCompletion = (index: number) => {
        if (!learningPlan) return;
        const updatedPath = [...learningPlan.learningPath];
        updatedPath[index].isCompleted = !updatedPath[index].isCompleted;
        setLearningPlan({ ...learningPlan, learningPath: updatedPath });
    };

    const handleDeletePlan = () => {
        if (window.confirm("Are you sure you want to delete this learning plan?")) {
            setLearningPlan(null);
            localStorage.removeItem('activeLearningPlan');
            setSkillQuery('');
            setCareerGoal('');
            setError('');
        }
    };

    const completionPercentage = learningPlan 
        ? Math.round((learningPlan.learningPath.filter(s => s.isCompleted).length / learningPlan.learningPath.length) * 100) 
        : 0;

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Skill Coach</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Get a personalized roadmap to master any skill, complete with course recommendations from Alpha Academy.</p>
                </div>

                {!learningPlan ? (
                    <div className="mt-12 max-w-2xl mx-auto space-y-6">
                        <div>
                            <label htmlFor="skill-query-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                What skill do you want to learn?
                            </label>
                            <input
                                id="skill-query-input"
                                type="text"
                                value={skillQuery}
                                onChange={(e) => setSkillQuery(e.target.value)}
                                placeholder="e.g., 'Public Speaking', 'Data Analysis with Python', 'Negotiation'"
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="career-goal-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                What is your career goal with this skill? (Optional)
                            </label>
                            <textarea
                                id="career-goal-input"
                                rows={2}
                                value={careerGoal}
                                onChange={(e) => setCareerGoal(e.target.value)}
                                placeholder="e.g., 'I want to transition into a Project Management role' or 'I need this for a promotion'."
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="text-center pt-2">
                            <button
                                onClick={handleGeneratePlan}
                                disabled={isLoading || !skillQuery || !userProfile?.masterResume}
                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing & Planning...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                        Generate My Plan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-12 space-y-8 animate-scale-in">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Plan: {learningPlan.skillName}</h3>
                                {learningPlan.careerGoal && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Goal: {learningPlan.careerGoal}</p>}
                            </div>
                            <button 
                                onClick={handleDeletePlan} 
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                                <TrashIcon className="h-4 w-4" /> Start Over
                            </button>
                        </div>

                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 dark:text-blue-300 dark:bg-blue-900/60">
                                        Progress
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                                        {completionPercentage}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200 dark:bg-gray-700">
                                <div style={{ width: `${completionPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500 ease-out"></div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <AnalysisCard icon={BriefcaseIcon} title="Your Learning Path">
                                 <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    {learningPlan.learningPath.map((item, index) => (
                                        <AccordionItem
                                            key={index}
                                            index={index}
                                            item={item}
                                            isOpen={openAccordionIndex === index}
                                            onToggle={() => setOpenAccordionIndex(openAccordionIndex === index ? null : index)}
                                            onToggleComplete={() => {
                                                toggleStepCompletion(index);
                                            }}
                                        />
                                    ))}
                                </div>
                            </AnalysisCard>
                            
                            {learningPlan.recommendedCourses.length > 0 && (
                                <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-sm dark:shadow-none">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AcademicCapIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recommended Alpha Academy Courses</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {learningPlan.recommendedCourses.map((course, index) => (
                                            <RecommendedCourseCard 
                                                key={index} 
                                                course={course} 
                                                onExplore={() => setActiveView(View.Academy)} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <AnalysisCard icon={LightbulbIcon} title="Key Concepts to Master">
                                <ul className="list-disc list-inside space-y-1">
                                    {learningPlan.keyConcepts.map((concept, index) => <li key={index}>{concept}</li>)}
                                </ul>
                            </AnalysisCard>

                             <AnalysisCard icon={SparklesIcon} title="Practice Exercise">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{learningPlan.practiceExercise}</p>
                                
                                <div className="mt-4">
                                    <label htmlFor="exercise-submission" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Submit your work for AI feedback:
                                    </label>
                                    <textarea
                                        id="exercise-submission"
                                        rows={5}
                                        value={exerciseSubmission}
                                        onChange={(e) => setExerciseSubmission(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Paste your code, write your paragraph, or describe your results here..."
                                        disabled={isGettingFeedback}
                                    />
                                </div>

                                <div className="mt-2 text-right">
                                    <button
                                        onClick={handleGetExerciseFeedback}
                                        disabled={!exerciseSubmission || isGettingFeedback}
                                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-500"
                                    >
                                        {isGettingFeedback ? 'Getting Feedback...' : 'Get Feedback'}
                                    </button>
                                </div>

                                <div aria-live="polite" className="mt-4">
                                    {isGettingFeedback && <p className="text-center text-sm text-gray-500 dark:text-gray-400">Your coach is reviewing your work...</p>}
                                    {exerciseFeedback && (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-500/20">
                                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Coach's Feedback:</h4>
                                            <pre className="mt-1 whitespace-pre-wrap text-xs text-blue-700 dark:text-blue-300/90 font-sans">{exerciseFeedback}</pre>
                                        </div>
                                    )}
                                </div>
                            </AnalysisCard>
                        </div>
                    </div>
                )}
                
                <div className="mt-16" aria-live="polite">
                    {isLoading && (
                         <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
                        </div>
                    )}
                    {error && (
                        <div role="alert" className="mt-4 max-w-2xl mx-auto text-center text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 p-4 rounded-md">
                            <h3 className="font-bold">Action Required</h3>
                            <p>{error}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SkillCoach;