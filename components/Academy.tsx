
import React from 'react';
import { MOCK_COURSES } from '../constants';
import { Course } from '../types';

const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
  <div className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-blue-500/20 hover:border-blue-400 transition-all duration-300 text-center transform hover:-translate-y-1">
    <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-500/20 text-blue-300">
      <course.icon className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-bold text-white">{course.title}</h3>
    <p className="mt-2 text-sm text-gray-300">{course.description}</p>
    <div className="mt-4 text-xs font-semibold text-blue-300 tracking-wider uppercase">{course.duration}</div>
    <button className="mt-6 w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors duration-300">
      Learn More
    </button>
  </div>
);

const Academy: React.FC = () => {
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-orbitron neon-text">Alpha Academy</h2>
          <p className="mt-4 text-lg text-gray-300">Elevate your skills with our expert-designed courses and certifications.</p>
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
