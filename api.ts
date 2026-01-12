
import { MOCK_JOBS, MOCK_COURSES, MOCK_HR_SERVICES } from './constants';
import { Job, Course, HRService, GroundingChunk } from './types';
import { GoogleGenAI } from "@google/genai";

const SIMULATED_DELAY = 800; // ms

/**
 * A custom error class for API-related errors.
 */
export class ApiError extends Error {
    constructor(public status: number, public message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

const simulateApiCall = <T>(data: T, resourceName: string): Promise<T> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(JSON.parse(JSON.stringify(data)));
        }, SIMULATED_DELAY);
    });
};

export const getJobs = (): Promise<Job[]> => {
    const postedJobsData = localStorage.getItem('postedJobs');
    const postedJobs: Job[] = postedJobsData ? JSON.parse(postedJobsData) : [];
    const allJobs = [...postedJobs, ...MOCK_JOBS];
    return simulateApiCall(allJobs, 'job listings');
};

export const getCourses = (): Promise<Course[]> => {
    return simulateApiCall(MOCK_COURSES, 'courses');
};

export const getHRServices = (): Promise<HRService[]> => {
    return simulateApiCall(MOCK_HR_SERVICES, 'HR services');
};

/**
 * Fetches live job data from the web using Gemini Search Grounding.
 * Returns both the structured job data and the grounding source URLs.
 */
export const searchWebJobs = async (query: string, category: string): Promise<{ jobs: Job[], sources: GroundingChunk[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const prompt = `
        Find 6-8 recent, real-world job listings for candidates from Bangladesh or Nepal looking to work in the Balkan region (Romania, Croatia, etc.) or remotely.
        Search for: "${query}" in category "${category}".
        
        For each job, extract:
        - Job Title
        - Company Name
        - Location
        - A short description (25 words max)
        - Job Type (Full-time/Part-time/Contract)
        - A valid URL to the job posting or the company's career page.

        Return a JSON array of objects with keys: title, company, location, type, description, applyUrl.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json'
            }
        });

        const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];
        const text = response.text.replace(/^```json\s*|```$/g, '');
        const jobsData = JSON.parse(text);
        
        const jobs = jobsData.map((j: any, index: number) => ({
            id: 20000 + index + Date.now(),
            title: j.title || 'Global Role',
            company: j.company || 'International Corp',
            location: j.location || 'Balkan Region',
            type: j.type || 'Full-time',
            category: category,
            description: j.description || 'Verified international opportunity.',
            applyUrl: j.applyUrl || `https://www.google.com/search?q=${encodeURIComponent(j.title + ' ' + j.company)}`,
            isExternal: true
        }));

        return { jobs, sources: groundingChunks };
    } catch (error) {
        console.error("Web API fetch failed:", error);
        return { jobs: [], sources: [] };
    }
};
