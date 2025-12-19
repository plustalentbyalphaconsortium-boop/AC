import React from 'react';
import { View, Feature } from '../types';

interface HeroProps {
    features: Feature[];
    setActiveView: (view: View) => void;
}

const FeatureCard: React.FC<{ feature: Feature; setActiveView: (view: View) => void; }> = ({ feature, setActiveView }) => {
    const { icon: Icon, title, description, view } = feature;
    return (
        <button
            onClick={() => setActiveView(view)}
            className="bg-white/60 dark:bg-gray-800/30 backdrop-blur-md rounded-xl border border-orange-500/20 p-6 text-left transition-all duration-300 ease-in-out group hover:border-orange-400 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 transform hover:-translate-y-1"
            aria-label={`Go to ${title}`}
        >
            <div className="flex items-center gap-4 mb-3">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-md font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
        </button>
    );
};

const Hero: React.FC<HeroProps> = ({ features, setActiveView }) => {

    const jobSeekerFeatures = features.filter(f => ![View.HRServices, View.PostJob, View.CandidateSummarizer].includes(f.view));
    const employerFeatures = features.filter(f => [View.HRServices, View.PostJob, View.CandidateSummarizer].includes(f.view));


    return (
        <div className="relative isolate px-6 pt-14 lg:px-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
             <div className="absolute inset-0 bg-grid-black/[0.05] dark:bg-grid-white/[0.05]"></div>
             <div className="absolute inset-0 dark:bg-black/30"></div>
             <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#fb923c] to-[#ea580c] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>
            <div className="mx-auto max-w-7xl py-12 sm:py-24 lg:py-32">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl font-orbitron neon-text">
                        Innovating the Future of Work
                    </h1>
                    <p className="mt-6 text-lg max-w-2xl mx-auto leading-8 text-gray-600 dark:text-gray-300">
                        Our mission is to create a seamless, transparent, and technology-driven ecosystem connecting skilled talent with international opportunities. We empower careers and build businesses by eliminating intermediaries and fostering growth.
                    </p>
                </div>
                 <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white font-orbitron">For Job Seekers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {jobSeekerFeatures.map(feature => (
                                <FeatureCard key={feature.view} feature={feature} setActiveView={setActiveView} />
                            ))}
                        </div>
                    </div>
                     <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white font-orbitron">For Employers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {employerFeatures.map(feature => (
                                <FeatureCard key={feature.view} feature={feature} setActiveView={setActiveView} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;