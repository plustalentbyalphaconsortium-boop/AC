
// Fix: Removed self-referential import of 'ApplicationStatus'.
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
}

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

export interface JobAlertSubscription {
  id: string;
  email: string;
  keywords: string;
  category: string;
}

export interface MarketTrendAnalysis {
  demandOutlook: string;
  salaryInsights: string;
  keySkills: string[];
  emergingTrends: string;
  geographicHotspots: string[];
}
