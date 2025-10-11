
import { Job, Course, HRService } from './types';
import { BriefcaseIcon, AcademicCapIcon, UserGroupIcon, BuildingOffice2Icon, CreditCardIcon, ChartBarIcon } from './components/icons/Icons';

export const JOB_CATEGORIES: string[] = [
    'All',
    'Sales', 
    'Call Center', 
    'Marketing', 
    'Customer Service',
    'Graphic Design', 
    'Video Editing', 
    'Receptionist', 
    'Computer Operator'
];

export const MOCK_JOBS: Job[] = [
  { id: 1, title: 'Senior Sales Executive', company: 'Innovate Inc.', location: 'New York, NY', type: 'Full-time', category: 'Sales', description: 'Drive sales growth and build strong customer relationships.' },
  { id: 2, title: 'Marketing Manager', company: 'Creative Solutions', location: 'San Francisco, CA', type: 'Full-time', category: 'Marketing', description: 'Develop and execute innovative marketing campaigns.' },
  { id: 3, title: 'Customer Support Specialist', company: 'SupportFirst', location: 'Remote', type: 'Full-time', category: 'Customer Service', description: 'Provide top-notch support to our growing user base.' },
  { id: 4, title: 'Lead Graphic Designer', company: 'Pixel Perfect', location: 'Austin, TX', type: 'Full-time', category: 'Graphic Design', description: 'Lead our design team to create stunning visuals.' },
  { id: 5, title: 'Video Editor & Motion Graphics', company: 'VidMakers', location: 'Los Angeles, CA', type: 'Contract', category: 'Video Editing', description: 'Create compelling video content for social media channels.' },
  { id: 6, title: 'Data Entry Operator', company: 'DataFlow LLC', location: 'Chicago, IL', type: 'Part-time', category: 'Computer Operator', description: 'Ensure accuracy and efficiency in data management.' },
  { id: 7, title: 'Inbound Call Center Agent', company: 'ConnectWell', location: 'Remote', type: 'Full-time', category: 'Call Center', description: 'Handle customer inquiries and resolve issues professionally.' },
  { id: 8, title: 'Front Desk Receptionist', company: 'Global Ventures', location: 'Miami, FL', type: 'Full-time', category: 'Receptionist', description: 'Be the first point of contact for our visitors and clients.' },
];

export const MOCK_COURSES: Course[] = [
  { id: 1, title: 'Advanced Sales Techniques', description: 'Master the art of closing deals and exceeding targets.', duration: '6 Weeks', icon: BriefcaseIcon },
  { id: 2, title: 'Digital Marketing Fundamentals', description: 'Learn SEO, SEM, and social media marketing from scratch.', duration: '8 Weeks', icon: ChartBarIcon },
  { id: 3, title: 'Customer Service Excellence', description: 'Develop skills to provide outstanding customer support.', duration: '4 Weeks', icon: UserGroupIcon },
  { id: 4, title: 'Adobe Creative Suite Mastery', description: 'Become proficient in Photoshop, Illustrator, and Premiere Pro.', duration: '12 Weeks', icon: AcademicCapIcon },
];

export const MOCK_HR_SERVICES: HRService[] = [
  { id: 1, title: 'Job Posting', description: 'Reach thousands of qualified candidates by posting on our platform.', icon: BriefcaseIcon },
  { id: 2, title: 'Recruitment Process Outsourcing (RPO)', description: 'Let our experts handle your entire recruitment lifecycle.', icon: UserGroupIcon },
  { id: 3, title: 'Staffing & Payroll Solutions', description: 'Flexible staffing and streamlined payroll services for your business.', icon: CreditCardIcon },
  { id: 4, title: 'Workforce Training & Development', description: 'Customized training programs to upskill your employees.', icon: BuildingOffice2Icon },
];
