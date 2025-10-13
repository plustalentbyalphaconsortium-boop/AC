import React from 'react';

export enum View {
  Home = 'Home',
  Jobs = 'Jobs',
  AIResume = 'AIResume',
  InterviewPrep = 'InterviewPrep',
  CareerPath = 'CareerPath',
  AIAssistant = 'AIAssistant',
  Academy = 'Academy',
  PostJob = 'PostJob',
  CandidateSummarizer = 'CandidateSummarizer',
}

export interface Feature {
    view: View;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

export type ApplicationStatus = 'Applied' | 'Interviewing' | 'Offer Received' | 'Rejected';

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  category: string;
  description: string;
  applicationStatus?: ApplicationStatus;
  notes?: string;
  salaryMin?: number;
  salaryMax?: number;
  qualifications?: string;
}

export interface JobAlertSubscription {
  id: string;
  email: string;
  keywords: string;
  category: string;
}

export interface InterviewQuestionData {
  behavioralQuestions: string[];
  technicalQuestions: string[];
  situationalQuestions: string[];
  answeringTips: string;
}

export interface UserProfile {
    name: string;
    email: string;
    masterResume: string;
}

export interface AIResumeData {
    headline: string;
    summary: string;
    keySkills: string[];
    experienceHighlights: string[];
}

export interface AICoverLetterSuggestions {
    suggestions: {
        suggestion: string;
        why: string;
        example: string;
    }[];
}

export interface CareerPathData {
    suggestedPath: {
        role: string;
        description: string;
    }[];
    skillGaps: string[];
    actionableSteps: string[];
    recommendedRolesNow: string[];
}

export type AICommand = {
  action: 'NAVIGATE' | 'SEARCH_JOBS';
  params?: {
    view?: string; // Should match a View enum key
    searchTerm?: string;
    category?: string;
  };
};

export type TranscriptionTurn = {
  speaker: 'user' | 'model';
  text: string;
};

export interface ResumeScore {
    match_score: number;
    explanation: string;
}

// FIX: Added missing type definitions.
export interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface HRService {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface MarketTrendAnalysis {
    demandOutlook: string;
    salaryInsights: string;
    keySkills: { skill: string; demandScore: number }[];
    emergingTrends: string;
    geographicHotspots: { location: string; demandIndex: number }[];
}

export interface GroundingChunk {
    web: {
        uri: string;
        title: string;
    };
}

export interface LearningPlanData {
    learningPath: {
        step: string;
        description: string;
    }[];
    keyConcepts: string[];
    recommendedCourses: {
        title: string;
        reason: string;
    }[];
    practiceExercise: string;
}

export interface VibeJobAnalysis {
    poeticSummary: string;
    resonanceScore: number;
    resonanceReport: string;
}