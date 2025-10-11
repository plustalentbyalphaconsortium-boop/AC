
export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  category: string;
  description: string;
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
