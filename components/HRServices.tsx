import React, { useState, useEffect } from 'react';
import { HRService } from '../types';
import { getHRServices } from '../api';
import { View } from '../App';
import { DocumentPlusIcon } from './icons/Icons';

const ServiceCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800/30 p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 animate-pulse">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex-grow">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mt-1"></div>
            </div>
        </div>
    </div>
);

const ServiceCard: React.FC<{ service: HRService }> = ({ service }) => {
  const Icon = service.icon;
  return (
    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-lg dark:shadow-none">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{service.title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{service.description}</p>
        </div>
      </div>
    </div>
  );
};

interface HRServicesProps {
    setActiveView: (view: View) => void;
}

const HRServices: React.FC<HRServicesProps> = ({ setActiveView }) => {
    const [services, setServices] = useState<HRService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchServices = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getHRServices();
            setServices(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return Array.from({ length: 4 }).map((_, i) => <ServiceCardSkeleton key={i} />);
        }
        if (error) {
            return (
                 <div role="alert" className="col-span-full text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
                    <h3 className="font-bold">An Error Occurred</h3>
                    <p>{error}</p>
                    <button onClick={fetchServices} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500">
                        Try Again
                    </button>
                </div>
            );
        }
        return services.map(service => <ServiceCard key={service.id} service={service} />);
    };


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

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8" aria-live="polite" aria-busy={isLoading}>
                    <button
                        onClick={() => setActiveView(View.PostJob)}
                        className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-blue-500 dark:border-blue-400 hover:border-blue-600 transition-all duration-300 shadow-lg dark:shadow-none text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a2a1a] transform hover:-translate-y-1"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                                <DocumentPlusIcon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Post a Job</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Create a new job listing with our AI-powered assistant to find the perfect candidate.</p>
                            </div>
                        </div>
                    </button>
                    {renderContent()}
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