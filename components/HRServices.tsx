

import React from 'react';
import { MOCK_HR_SERVICES } from '../constants';
import { HRService } from '../types';

const ServiceCard: React.FC<{ service: HRService }> = ({ service }) => (
  <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-lg dark:shadow-none">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
        <service.icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{service.title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{service.description}</p>
      </div>
    </div>
  </div>
);

const HRServices: React.FC = () => {
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="lg:text-center">
          <h2 className="text-base font-semibold tracking-wide uppercase text-blue-500 dark:text-blue-400">For Employers</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">
            Disruptive HR & Recruitment Solutions
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-600 dark:text-gray-300 lg:mx-auto">
            Streamline your hiring process, manage your workforce, and empower your teams with our innovative suite of HR services.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {MOCK_HR_SERVICES.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

         <div className="mt-16 text-center">
            <button className="rounded-md bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform transform hover:scale-105">
                Request a Consultation
            </button>
        </div>
      </div>
    </div>
  );
};

export default HRServices;