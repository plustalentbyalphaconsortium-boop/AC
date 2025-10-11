

import React, { useState } from 'react';
import { MOCK_COURSES } from '../constants';
import { Course } from '../types';

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'enrolling' | 'enrolled'>('idle');

  const handleEnroll = () => {
    if (enrollmentStatus !== 'idle') return;

    setEnrollmentStatus('enrolling');
    // Simulate API call for enrollment
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
    <div className={`group backdrop-blur-sm p-6 rounded-lg border transition-all duration-300 text-center transform hover:-translate-y-1 shadow-sm hover:shadow-lg dark:shadow-none ${
      enrollmentStatus === 'enrolled' 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500/40' 
        : 'bg-white dark:bg-gray-800/30 border-gray-200 dark:border-blue-500/20 hover:border-blue-400'
    } ${
      enrollmentStatus === 'enrolling' ? 'animate-pulse-border scale-[0.98]' : ''
    }`}>
      <div className={`mb-4 inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 transition-transform duration-300 group-hover:scale-110 ${enrollmentStatus === 'enrolled' ? 'animate-celebratory-bounce' : ''}`}>
        <course.icon className="h-6 w-6" />
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
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Alpha Academy</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Elevate your skills with our expert-designed courses and certifications.</p>
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {MOCK_COURSES.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Academy;