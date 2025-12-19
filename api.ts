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
            // Always succeed to prevent simulated errors during development/showcase.
            resolve(JSON.parse(JSON.stringify(data))); // Deep copy to prevent mutation
        }, SIMULATED_DELAY);
    });
};

export const getJobs = (): Promise<Job[]> => {
    const postedJobsData = localStorage.getItem('postedJobs');
    const postedJobs: Job[] = postedJobsData ? JSON.parse(postedJobsData) : [];
    const allJobs = [...postedJobs, ...MOCK_JOBS];
    return simulateApiCall(allJobs, 'job listings');
};

// FIX: Add missing API functions
export const getCourses = (): Promise<Course[]> => {
    return simulateApiCall(MOCK_COURSES, 'courses');
};

export const getHRServices = (): Promise<HRService[]> => {
    return simulateApiCall(MOCK_HR_SERVICES, 'HR services');
};