
import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import JobSearch from './components/JobSearch';
import Academy from './components/Academy';
import HRServices from './components/HRServices';
import Footer from './components/Footer';
import AIResumeBuilder from './components/AIResumeBuilder';
import MarketTrends from './components/MarketTrends';
import { SparklesIcon, ChartBarIcon } from './components/icons/Icons';


export enum View {
  Home = 'Home',
  Jobs = 'Jobs',
  Academy = 'Academy',
  Employers = 'Employers',
  AIResume = 'AIResume',
  MarketTrends = 'MarketTrends',
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Home);

  const renderContent = () => {
    switch (activeView) {
      case View.Jobs:
        return <JobSearch />;
      case View.Academy:
        return <Academy />;
      case View.Employers:
        return <HRServices />;
      case View.AIResume:
        return <AIResumeBuilder />;
      case View.MarketTrends:
        return <MarketTrends />;
      case View.Home:
      default:
        return (
          <>
            <Hero setActiveView={setActiveView} />
            <div id="features" className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-12">Our Core Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                            title="Job Search & Application"
                            description="Browse verified job listings and apply instantly with your profile."
                            onClick={() => setActiveView(View.Jobs)}
                        />
                         <FeatureCard 
                            title="AI Resume Builder"
                            description="Craft a tailored, professional resume in seconds with our AI assistant."
                            onClick={() => setActiveView(View.AIResume)}
                            icon={SparklesIcon}
                        />
                        <FeatureCard 
                            title="Market Trend Analysis"
                            description="Get real-time insights on job demand, salaries, and key skills."
                            onClick={() => setActiveView(View.MarketTrends)}
                            icon={ChartBarIcon}
                        />
                        <FeatureCard 
                            title="Alpha Academy"
                            description="Upskill with expert-designed courses and earn certifications."
                            onClick={() => setActiveView(View.Academy)}
                        />
                        <FeatureCard 
                            title="Recruitment & HR"
                            description="Comprehensive HR solutions, from staffing to payroll for businesses."
                            onClick={() => setActiveView(View.Employers)}
                        />
                    </div>
                </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#1a2a1a] min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-black/[0.05] dark:bg-grid-white/[0.05] -z-1"></div>
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main>{renderContent()}</main>
      <Footer />
    </div>
  );
};

interface FeatureCardProps {
    title: string;
    description: string;
    onClick: () => void;
    icon?: React.ComponentType<{className?: string}>;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, onClick, icon: Icon }) => (
    <button
        className="bg-white dark:bg-gray-800/20 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-1 flex flex-col shadow-sm hover:shadow-lg dark:shadow-none text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a2a1a]"
        onClick={onClick}
    >
        <div className="flex items-center mb-3">
             {Icon && <Icon className="h-6 w-6 mr-3 text-blue-500 dark:text-blue-400" aria-hidden="true" />}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 flex-grow">{description}</p>
    </button>
);


export default App;
