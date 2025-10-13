// FIX: Import missing types and constants
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
    // The functionality to post jobs has been removed, so we no longer merge
    // jobs from localStorage. We directly return the mock jobs.
    return simulateApiCall(MOCK_JOBS, 'job listings');
};

// FIX: Add missing API functions
export const getCourses = (): Promise<Course[]> => {
    return simulateApiCall(MOCK_COURSES, 'courses');
};

export const getHRServices = (): Promise<HRService[]> => {
    return simulateApiCall(MOCK_HR_SERVICES, 'HR services');
};
