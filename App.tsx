
import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import JobSearch from './components/JobSearch';
import Academy from './components/Academy';
import HRServices from './components/HRServices';
import Footer from './components/Footer';

export enum View {
  Home = 'Home',
  Jobs = 'Jobs',
  Academy = 'Academy',
  Employers = 'Employers',
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
      case View.Home:
      default:
        return (
          <>
            <Hero setActiveView={setActiveView} />
            <div id="features" className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-white text-center mb-12">Our Core Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            title="Job Search & Application"
                            description="Browse verified job listings and apply instantly with your profile."
                            onClick={() => setActiveView(View.Jobs)}
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
    <div className="bg-[#1a2a1a] min-h-screen text-gray-200">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] -z-1"></div>
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
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, onClick }) => (
    <div 
        className="bg-gray-800/20 backdrop-blur-sm p-6 rounded-lg border border-blue-500/20 hover:border-blue-400 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        onClick={onClick}
    >
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{description}</p>
    </div>
);


export default App;
