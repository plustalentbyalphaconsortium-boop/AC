import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import JobSearch from './components/JobSearch';
import Footer from './components/Footer';
import AIResumeBuilder from './components/AIResumeBuilder';
import InterviewPrep from './components/InterviewPrep';
import CareerPath from './components/CareerPath';
import CommandBar from './components/CommandBar';
import OrbitalNexus from './components/OrbitalNexus';
import AIAssistant from './components/AIAssistant';
// FIX: Import new components
import Academy from './components/Academy';
import CandidateSummarizer from './components/CandidateSummarizer';
import PostJob from './components/PostJob';
import { View, Feature, AICommand } from './types';
// FIX: Import AcademicCapIcon
import { SparklesIcon, ChatBubbleOvalLeftEllipsisIcon, RocketLaunchIcon, MagnifyingGlassIcon, MicrophoneIcon, AcademicCapIcon } from './components/icons/Icons';

interface JobSearchState {
    searchTerm: string;
    category: string;
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Home);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [initialJobSearchState, setInitialJobSearchState] = useState<JobSearchState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            setIsCommandBarOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const handleSetView = (view: View) => {
    if (activeView === View.Home) {
        setIsTransitioning(true);
        setTimeout(() => {
            setActiveView(view);
            setIsTransitioning(false);
        }, 400);
    } else {
        setActiveView(view);
    }
  };

  const handleExecuteCommand = (command: AICommand) => {
    switch (command.action) {
      case 'NAVIGATE':
        if (command.params?.view && command.params.view in View) {
            handleSetView(command.params.view as View);
        }
        break;
      case 'SEARCH_JOBS':
        setInitialJobSearchState({
            searchTerm: command.params?.searchTerm || '',
            category: command.params?.category || 'All',
        });
        handleSetView(View.Jobs);
        break;
    }
    setIsCommandBarOpen(false);
  };
  
  const features: Feature[] = [
      { view: View.Jobs, title: 'Find a Job', description: 'Browse verified job listings and apply with your profile.', icon: MagnifyingGlassIcon },
      { view: View.AIAssistant, title: 'AI Assistant', description: 'Have a real-time voice conversation with our career assistant.', icon: MicrophoneIcon },
      { view: View.AIResume, title: 'AI Resume Builder', description: 'Craft a tailored, professional resume in seconds with our AI assistant.', icon: SparklesIcon },
      { view: View.CareerPath, title: 'AI Career Path', description: 'Get a personalized career roadmap based on your goals and experience.', icon: RocketLaunchIcon },
      { view: View.InterviewPrep, title: 'AI Interview Prep', description: 'Practice with tailored questions and get instant feedback on your answers.', icon: ChatBubbleOvalLeftEllipsisIcon },
      // FIX: Add Academy to features
      { view: View.Academy, title: 'Alpha Academy', description: 'Elevate your skills with our expert-designed courses.', icon: AcademicCapIcon },
  ];

  const renderContent = () => {
    switch (activeView) {
      case View.Jobs:
        return <JobSearch initialSearchTerm={initialJobSearchState?.searchTerm} initialCategory={initialJobSearchState?.category} />;
      case View.AIResume:
        return <AIResumeBuilder />;
      case View.InterviewPrep:
        return <InterviewPrep />;
      case View.CareerPath:
        return <CareerPath setActiveView={handleSetView} />;
      case View.AIAssistant:
        return <AIAssistant />;
      // FIX: Add cases for new views
      case View.Academy:
        return <Academy />;
      case View.PostJob:
        return <PostJob setActiveView={handleSetView} />;
      case View.CandidateSummarizer:
        return <CandidateSummarizer />;
      case View.Home:
      default:
        // Reset initial search state when returning home
        if (initialJobSearchState) setInitialJobSearchState(null);
        return <OrbitalNexus features={features} setActiveView={handleSetView} />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0c0a18] min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <Header 
        activeView={activeView} 
        setActiveView={handleSetView} 
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
      />
      {isCommandBarOpen && (
          <CommandBar 
              onClose={() => setIsCommandBarOpen(false)} 
              onExecuteCommand={handleExecuteCommand}
          />
      )}
      <main className={isTransitioning ? 'animate-zoom-out-view' : ''}>
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;