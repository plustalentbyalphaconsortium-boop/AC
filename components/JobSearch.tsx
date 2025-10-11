
import React, { useState } from 'react';
import { MOCK_JOBS, JOB_CATEGORIES } from '../constants';
import { Job } from '../types';

const JobCard: React.FC<{ job: Job }> = ({ job }) => (
  <div className="bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-blue-500/20 hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex justify-between items-start">
        <div>
            <h3 className="text-lg font-bold text-white">{job.title}</h3>
            <p className="text-sm text-blue-300">{job.company}</p>
            <p className="text-sm text-gray-400 mt-1">{job.location}</p>
        </div>
        <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">{job.type}</span>
    </div>
    <p className="mt-4 text-gray-300 text-sm">{job.description}</p>
    <button className="mt-4 w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors duration-300">
      Apply Now
    </button>
  </div>
);

const JobSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredJobs = MOCK_JOBS.filter(job => {
    const matchesCategory = activeCategory === 'All' || job.category === activeCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-orbitron neon-text">Find Your Opportunity</h2>
          <p className="mt-4 text-lg text-gray-300">Browse thousands of jobs from top companies.</p>
        </div>
        
        <div className="mt-12 max-w-3xl mx-auto">
            <div className="relative">
                 <input
                    type="text"
                    placeholder="Search for jobs or companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-900/50 border-2 border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
                {JOB_CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                            activeCategory === category 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => <JobCard key={job.id} job={job} />)
          ) : (
            <p className="text-gray-400 col-span-full text-center">No jobs found matching your criteria.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
