import { MOCK_JOBS, MOCK_COURSES, MOCK_HR_SERVICES } from './constants';
import { Job, Course, HRService } from './types';

const SIMULATED_DELAY = 800; // ms

/**
 * A custom error class for API-related errors.
 * This allows components to check the type of error and react accordingly.
 */
export class ApiError extends Error {
    constructor(public status: number, public message: string) {
        super(message);
        this.name = 'ApiError';
    }
}


const simulateApiCall = <T>(data: T, resourceName: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const random = Math.random();

            // 70% chance of success
            if (random < 0.7) {
                resolve(JSON.parse(JSON.stringify(data))); // Deep copy to prevent mutation
                return;
            } 
            
            // 15% chance of a server error
            if (random < 0.85) {
                reject(new ApiError(500, `We're having trouble fetching the ${resourceName}. Our servers might be down. Please try again in a moment.`));
                return;
            }

            // 15% chance of a network/unknown error
            reject(new Error("A network error occurred. Please check your internet connection and try again."));
            
        }, SIMULATED_DELAY);
    });
};

export const getJobs = (): Promise<Job[]> => {
    return new Promise((resolve, reject) => {
        try {
            const savedJobsData = localStorage.getItem('postedJobs');
            const postedJobs: Job[] = savedJobsData ? JSON.parse(savedJobsData) : [];
            
            // Prepend posted jobs so they appear first
            const allJobs = [...postedJobs, ...MOCK_JOBS];

            // Now, simulate the API call with the combined data
            simulateApiCall(allJobs, 'job listings')
                .then(resolve)
                .catch(reject);

        } catch (error) {
            console.error("Failed to read posted jobs from localStorage", error);
            // Fallback to just mock jobs if localStorage is corrupt
            simulateApiCall(MOCK_JOBS, 'job listings')
                .then(resolve)
                .catch(reject);
        }
    });
};

export const getCourses = (): Promise<Course[]> => {
    return simulateApiCall(MOCK_COURSES, 'courses');
};

export const getHRServices = (): Promise<HRService[]> => {
    return simulateApiCall(MOCK_HR_SERVICES, 'HR services');
};