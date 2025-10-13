import React, { useState, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { UserProfile, CareerPathData, Course } from '../types';
import { RocketLaunchIcon, SparklesIcon, BriefcaseIcon, LightbulbIcon, CheckCircleIcon, AcademicCapIcon } from './icons/Icons';
import { MOCK_COURSES } from '../constants';
import { View } from '../types';

const ResultCard: React.FC<{
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

interface CareerPathProps {
    setActiveView: (view: View) => void;
}

const CareerPath: React.FC<CareerPathProps> = ({ setActiveView }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [careerGoals, setCareerGoals] = useState('');
    const [careerPathData, setCareerPathData] = useState<CareerPathData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [skillCourseMap, setSkillCourseMap] = useState<Record<string, Course | null>>({});

    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                setUserProfile(JSON.parse(savedProfile));
            } else {
                setError("Please create a profile in 'My Dashboard' first to use the Career Path tool.");
            }
        } catch (error) {
            console.error("Failed to load user profile from localStorage", error);
            setError("Could not load your profile. Please save it in the Dashboard first.");
        }
    }, []);

    useEffect(() => {
        if (careerPathData?.skillGaps) {
            const newMap: Record<string, Course | null> = {};
            for (const skill of careerPathData.skillGaps) {
                const skillLower = skill.toLowerCase().replace(/[^a-z0-9\s]/gi, ''); // Clean the skill for better matching
                const foundCourse = MOCK_COURSES.find(course =>
                    course.title.toLowerCase().includes(skillLower) ||
                    course.description.toLowerCase().includes(skillLower)
                );
                newMap[skill] = foundCourse || null;
            }
            setSkillCourseMap(newMap);
        }
    }, [careerPathData]);

    const careerPathSchema = {
        type: Type.OBJECT,
        properties: {
            suggestedPath: {
                type: Type.ARRAY,
                description: "A chronological career path with 3-5 distinct roles.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        role: { type: Type.STRING, description: "The job title for this step in the path." },
                        description: { type: Type.STRING, description: "A 1-2 sentence description of the responsibilities and focus of this role." }
                    },
                    required: ['role', 'description']
                }
            },
            skillGaps: {
                type: Type.ARRAY,
                description: "A list of 4-6 key skills the user needs to develop to achieve their career goals, based on their resume.",
                items: { type: Type.STRING }
            },
            actionableSteps: {
                type: Type.ARRAY,
                description: "A list of 3-5 concrete, actionable steps the user can take in the next 6-12 months (e.g., 'Obtain a certification in X', 'Lead a small project').",
                items: { type: Type.STRING }
            },
            recommendedRolesNow: {
                type: Type.ARRAY,
                description: "A list of 2-3 specific job titles the user could apply for right now that align with their goals and current experience.",
                items: { type: Type.STRING }
            }
        },
        required: ['suggestedPath', 'skillGaps', 'actionableSteps', 'recommendedRolesNow']
    };

    const handleGeneratePath = async () => {
        if (!userProfile?.masterResume) {
            setError("Please add your master resume in the Dashboard before generating a career path.");
            return;
        }
        if (!careerGoals) {
            setError("Please describe your career goals.");
            return;
        }

        setIsLoading(true);
        setError('');
        setCareerPathData(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a world-class career strategist and executive coach.
                Your task is to analyze the user's resume and career goals to create a strategic, long-term career roadmap.

                **User's Master Resume:**
                ${userProfile.masterResume}

                **User's Stated Career Goals:**
                ${careerGoals}

                **Instructions:**
                1.  **Suggested Path:** Outline a realistic, chronological career path with 3-5 distinct roles that logically lead toward the user's goals.
                2.  **Skill Gaps:** Identify the 4-6 most critical skills the user is currently missing to progress along this path.
                3.  **Actionable Steps:** Provide 3-5 concrete actions the user can take in the next 6-12 months to start closing these skill gaps (e.g., certifications, project types, networking).
                4.  **Recommended Roles Now:** Suggest 2-3 specific job titles the user could apply for immediately that would be a good step on this path.

                Return the entire analysis as a single JSON object that matches the provided schema.
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: careerPathSchema,
                }
            });

            const text = response.text.trim();
            if (text) {
                const parsedJson = JSON.parse(text);
                setCareerPathData(parsedJson);
            } else {
                setError('The AI could not generate a career path. The response was empty.');
            }

        } catch (e: any) {
            console.error(e);
            setError('An error occurred while generating the career path. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Career Path Strategist</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Get a personalized roadmap to your dream career, based on your unique experience and goals.</p>
                </div>

                <div className="mt-12 max-w-2xl mx-auto">
                    <div>
                        <label htmlFor="career-goals" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            What are your long-term career goals?
                        </label>
                        <textarea
                            id="career-goals"
                            rows={4}
                            className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="e.g., 'I want to become a Head of Marketing for a tech startup within 5 years.' or 'I want to transition from sales into a product management role.'"
                            value={careerGoals}
                            onChange={(e) => setCareerGoals(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <div className="mt-6 text-center">
                        <button
                            onClick={handleGeneratePath}
                            disabled={isLoading || !userProfile?.masterResume || !careerGoals}
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                        >
                             {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating Your Roadmap...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                    Generate My Career Path
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
                            <h3 className="font-bold">Generation Failed</h3>
                            <p>{error}</p>
                        </div>
                    ) : careerPathData ? (
                        <div className="space-y-6 animate-scale-in">
                            <ResultCard icon={RocketLaunchIcon} title="Your Suggested Career Path">
                                <ol className="relative border-l border-gray-300 dark:border-gray-600 ml-2">
                                    {careerPathData.suggestedPath.map((step, index) => (
                                        <li key={index} className="mb-6 ml-6 last:mb-0">
                                            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-800 dark:bg-blue-900">
                                                <BriefcaseIcon className="w-3 h-3 text-blue-800 dark:text-blue-300" />
                                            </span>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{step.role}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                                        </li>
                                    ))}
                                </ol>
                            </ResultCard>
                             <ResultCard icon={LightbulbIcon} title="Identified Skill Gaps">
                                 <ul className="space-y-1">
                                    {careerPathData.skillGaps.map((skill, index) => {
                                        const matchedCourse = skillCourseMap[skill];
                                        return (
                                            <li key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 rounded-md transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/20">
                                                <span>{skill}</span>
                                                {matchedCourse && (
                                                    <button
                                                        onClick={() => setActiveView(View.Academy)}
                                                        className="mt-2 sm:mt-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                                                        aria-label={`View course for ${skill}: ${matchedCourse.title}`}
                                                    >
                                                        <AcademicCapIcon className="h-4 w-4" />
                                                        Course available: {matchedCourse.title}
                                                    </button>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </ResultCard>
                             <ResultCard icon={CheckCircleIcon} title="Immediate Actionable Steps">
                                <ul className="list-disc list-inside space-y-1">
                                    {careerPathData.actionableSteps.map((step, index) => <li key={index}>{step}</li>)}
                                </ul>
                            </ResultCard>
                             <ResultCard icon={BriefcaseIcon} title="Recommended Roles to Apply For Now">
                                <ul className="list-disc list-inside space-y-1">
                                    {careerPathData.recommendedRolesNow.map((role, index) => <li key={index}>{role}</li>)}
                                </ul>
                            </ResultCard>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 pt-8">
                            <p>Your personalized career roadmap will appear here.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CareerPath;