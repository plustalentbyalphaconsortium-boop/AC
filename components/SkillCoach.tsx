import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LearningPlanData, UserProfile } from '../types';
import { MOCK_COURSES } from '../constants';
import { CpuChipIcon, AcademicCapIcon, LightbulbIcon, SparklesIcon, BriefcaseIcon, ChevronDownIcon } from './icons/Icons';

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
    item: { step: string; description: string; };
    index: number;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ item, index, isOpen, onToggle }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <h2>
                <button
                    type="button"
                    className="flex justify-between items-center w-full p-4 font-semibold text-left text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-controls={`accordion-content-${index}`}
                >
                    <span>{item.step}</span>
                    <ChevronDownIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>
            </h2>
            <div
                ref={contentRef}
                id={`accordion-content-${index}`}
                style={{ maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : '0px' }}
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            >
                <div className="p-4 pt-0">
                    <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
            </div>
        </div>
    );
};


const RecommendedCourseCard: React.FC<{ course: { title: string; reason: string } }> = ({ course }) => (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-300 dark:border-gray-700 h-full flex flex-col transition-all duration-300 hover:border-blue-400 hover:shadow-md">
        <h4 className="font-bold text-gray-900 dark:text-white">{course.title}</h4>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400 flex-grow">"{course.reason}"</p>
        <div className="mt-3 text-right">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 cursor-pointer">
                Explore in Academy &rarr;
            </span>
        </div>
    </div>
);


const SkillCoach: React.FC = () => {
    const [skillQuery, setSkillQuery] = useState('');
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
                if (!parsedProfile.masterResume) {
                     setError("Please complete your Master Resume in 'My Dashboard' to get a personalized learning plan.");
                } else {
                     setError('');
                }
            } else {
                setError("Please create a profile in 'My Dashboard' first to get a personalized learning plan.");
            }
        } catch (err) {
            console.error("Failed to load user profile from localStorage", err);
            setError("Could not load your profile. Please save it in the Dashboard first.");
        }
    }, []);


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

        // Reset state for the practice session
        setExerciseSubmission('');
        setExerciseFeedback('');
        setOpenAccordionIndex(0); // Reset accordion to open the first item
        
        setIsLoading(true);
        setError('');
        setLearningPlan(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const availableCourses = MOCK_COURSES.map(c => `- ${c.title}: ${c.description}`).join('\n');
            
            const prompt = `
                Act as an expert learning and development coach.
                Your task is to create a structured, personalized learning plan for the skill: "${skillQuery}".
                
                **Crucially, you must tailor this plan based on the user's existing experience provided in their resume.** For example, if they are already a senior developer, the plan should be more advanced than for a complete beginner.

                **User's Background (from their master resume):**
                ${userProfile.masterResume}

                **Available Alpha Academy Courses:**
                ${availableCourses}

                **Instructions:**
                1.  **Learning Path:** Break down the learning process into 3-5 logical steps or weekly goals, tailored to the user's experience level.
                2.  **Key Concepts:** List 4-6 fundamental concepts the user must understand. Adjust the complexity based on their background.
                3.  **Recommended Courses:** From the provided list of Alpha Academy courses, identify and recommend up to two that are most relevant to learning this skill. For each recommendation, provide a brief reason why it's a good fit for this user specifically. If no courses are relevant, return an empty array.
                4.  **Practice Exercise:** Create a simple, actionable practice exercise appropriate for the user's likely starting point.

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
                    setLearningPlan(parsedJson);
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
                Act as a patient and encouraging tutor. The user is learning the skill: "${skillQuery}".
                Their background is: ${userProfile?.masterResume ? `based on this resume: ${userProfile.masterResume}` : 'that of a beginner.'}
                
                They were given the following practice exercise:
                **Exercise:** "${learningPlan.practiceExercise}"

                Here is their submission for the exercise:
                **Submission:** "${exerciseSubmission}"

                Please provide constructive feedback tailored to their likely experience level. Your feedback must be easy to read and follow.
                Structure your feedback using bullet points for maximum clarity, as follows:

                Start with a positive and encouraging sentence about their effort.

                **What you did well:**
                * (List one or two positive points here, using bullet points.)
                * (Another positive point.)

                **Suggestions for improvement:**
                * (Provide one clear, actionable piece of advice here, as a bullet point.)
                * (Provide a concrete example of how to apply the advice. For example: "Instead of writing [...], you could try [...]. Here's how that might look: [...]")

                Keep the language simple and the tone supportive.
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


    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Skill Coach</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Get a personalized roadmap to master any skill, complete with course recommendations from Alpha Academy.</p>
                </div>

                <div className="mt-12 max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-4">
                         <label htmlFor="skill-query-input" className="sr-only">Skill to Learn</label>
                         <input
                            id="skill-query-input"
                            type="text"
                            value={skillQuery}
                            onChange={(e) => setSkillQuery(e.target.value)}
                            placeholder="e.g., 'Public Speaking', 'Data Analysis with Python'"
                            className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            disabled={isLoading}
                         />
                         <button
                            onClick={handleGeneratePlan}
                            disabled={isLoading || !skillQuery || !userProfile?.masterResume}
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                         >
                             {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                 <>
                                    <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                    Generate Plan
                                </>
                            )}
                         </button>
                    </div>
                </div>
                
                <div className="mt-16" aria-live="polite">
                    {isLoading ? (
                         <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
                        </div>
                    ) : error ? (
                        <div role="alert" className="mt-4 max-w-2xl mx-auto text-center text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 p-4 rounded-md">
                            <h3 className="font-bold">Action Required</h3>
                            <p>{error}</p>
                        </div>
                    ) : learningPlan ? (
                        <div className="space-y-6">
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 -mb-2">
                                Here is a learning plan tailored to your profile.
                            </p>
                            <AnalysisCard icon={BriefcaseIcon} title="Your Learning Path">
                                 <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    {learningPlan.learningPath.map((item, index) => (
                                        <AccordionItem
                                            key={index}
                                            index={index}
                                            item={item}
                                            isOpen={openAccordionIndex === index}
                                            onToggle={() => setOpenAccordionIndex(openAccordionIndex === index ? null : index)}
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
                                            <RecommendedCourseCard key={index} course={course} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <AnalysisCard icon={LightbulbIcon} title="Key Concepts to Master">
                                <ul className="list-disc list-inside space-y-1">
                                    {learningPlan.keyConcepts.map((concept, index) => <li key={index}>{concept}</li>)}
                                </ul>
                            </AnalysisCard>

                             <AnalysisCard icon={SparklesIcon} title="Your First Practice Exercise">
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
                                        className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500"
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
                    ) : (
                         <div className="text-center text-gray-500 dark:text-gray-400 pt-8">
                            <p>Enter a skill above to generate your personalized learning plan.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SkillCoach;