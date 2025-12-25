import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { getCourses } from '../api';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const CourseCardSkeleton: React.FC = () => (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 text-center animate-pulse">
        <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mx-auto mb-1"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mx-auto mb-4"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mx-auto mb-6"></div>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
    </div>
);

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'enrolling' | 'enrolled'>('idle');
  const Icon = course.icon;

  const handleEnroll = () => {
    if (enrollmentStatus !== 'idle') return;

    setEnrollmentStatus('enrolling');
    setTimeout(() => {
      setEnrollmentStatus('enrolled');
    }, 1500);
  };

  const getButtonContent = () => {
    switch (enrollmentStatus) {
      case 'enrolling':
        return (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enrolling...
          </>
        );
      case 'enrolled':
        return <>Enrolled <span className="inline-block animate-scale-in">✔</span></>;
      case 'idle':
      default:
        return 'Enroll Now';
    }
  };

  return (
    <div className={`group backdrop-blur-sm p-6 rounded-lg border transition-all duration-300 text-center transform hover:-translate-y-1 shadow-sm hover:shadow-lg dark:shadow-none flex flex-col ${
      enrollmentStatus === 'enrolled' 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500/40' 
        : 'bg-white dark:bg-gray-800/30 border-gray-200 dark:border-blue-500/20 hover:border-blue-400'
    } ${
      enrollmentStatus === 'enrolling' ? 'animate-pulse-border scale-[0.98]' : ''
    }`}>
      <div className={`mb-4 inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 transition-transform duration-300 group-hover:scale-110 ${enrollmentStatus === 'enrolled' ? 'animate-celebratory-bounce' : ''}`}>
        {Icon ? <Icon className="h-6 w-6" aria-hidden="true" /> : <span className="h-6 w-6 block bg-gray-200 rounded-full"></span>}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{course.title}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 flex-grow">{course.description}</p>
      <div className="mt-4 text-xs font-semibold text-blue-600 dark:text-blue-300 tracking-wider uppercase">{course.duration}</div>
      <button 
        onClick={handleEnroll}
        disabled={enrollmentStatus !== 'idle'}
        className={`mt-6 w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-300 flex items-center justify-center ${
            enrollmentStatus === 'idle' ? 'bg-blue-600 hover:bg-blue-500' : 
            enrollmentStatus === 'enrolling' ? 'bg-blue-400 dark:bg-blue-800 cursor-not-allowed' : 
            'bg-green-600 cursor-not-allowed'
        }`}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};

const Academy: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAndEnhanceCourses = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // 1. Get basic course data
            const initialCourses = await getCourses();

            // 2. Check Cache
            const cachedData = localStorage.getItem('academyCoursesCache');
            if (cachedData) {
                const { timestamp, courses: cachedCourses } = JSON.parse(cachedData);
                const isRecent = (Date.now() - timestamp) < 24 * 60 * 60 * 1000; // 24 hours cache
                
                if (isRecent && cachedCourses.length === initialCourses.length) {
                    // Restore icons since they can't be JSON serialized
                    const hydratedCourses = cachedCourses.map((c: any, index: number) => ({
                        ...c,
                        icon: initialCourses[index].icon 
                    }));
                    setCourses(hydratedCourses);
                    setIsLoading(false);
                    return;
                }
            }
            
            // 3. If no cache or stale, call AI API (Batched)
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const prompt = `
                Act as a professional course catalog copywriter.
                I have a list of courses. For each course, write a new, engaging description (3-4 sentences).
                The tone should be motivational, highlighting benefits and career impact.
                
                Input Courses:
                ${JSON.stringify(initialCourses.map(c => ({ id: c.id, title: c.title, originalDescription: c.description })))}

                Output a JSON array where each object has 'id' and 'newDescription'.
            `;

            try {
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER },
                                    newDescription: { type: Type.STRING }
                                },
                                required: ['id', 'newDescription']
                            }
                        }
                    }
                });

                const enhancedData = JSON.parse(response.text);
                const enhancedMap = new Map(enhancedData.map((item: any) => [item.id, item.newDescription]));

                const enhancedCourses = initialCourses.map(course => ({
                    ...course,
                    description: enhancedMap.get(course.id) || course.description
                }));

                setCourses(enhancedCourses);

                // Save to cache (exclude icon components from JSON)
                const cachePayload = {
                    timestamp: Date.now(),
                    courses: enhancedCourses.map(({ icon, ...rest }) => rest)
                };
                localStorage.setItem('academyCoursesCache', JSON.stringify(cachePayload));

            } catch (aiError) {
                console.warn("AI enhancement failed, falling back to original descriptions:", aiError);
                // Fallback to original content
                setCourses(initialCourses);
            }

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAndEnhanceCourses();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />);
        }
        if (error) {
            return (
                <div role="alert" className="col-span-full text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                    <h3 className="font-bold">An Error Occurred</h3>
                    <p>{error}</p>
                    <button onClick={fetchAndEnhanceCourses} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500">
                        Try Again
                    </button>
                </div>
            );
        }
        return courses.map(course => <CourseCard key={course.id} course={course} />);
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Alpha Academy</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Elevate your skills with our expert-designed courses and certifications.</p>
                </div>
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" aria-live="polite" aria-busy={isLoading}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Academy;