import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import Header from './components/Header';
import Hero from './components/Hero';
import JobSearch from './components/JobSearch';
import Footer from './components/Footer';
import AIResumeBuilder from './components/AIResumeBuilder';
import InterviewPrep from './components/InterviewPrep';
import CareerPath from './components/CareerPath';
import CommandBar from './components/CommandBar';
import AIAssistant from './components/AIAssistant';
import Academy from './components/Academy';
import CandidateSummarizer from './components/CandidateSummarizer';
import PostJob from './components/PostJob';
import Dashboard from './components/Dashboard';
import MarketTrends from './components/MarketTrends';
import SkillCoach from './components/SkillCoach';
import VideoGenerator from './components/VideoGenerator';
import CloudSync from './components/CloudSync';
import VibeCheck from './components/VibeCheck';
import HRServices from './components/HRServices';
import VisaTrack from './components/VisaTrack';
import AITutorialAssistant from './components/AITutorialAssistant';
import SEOManager from './components/SEOManager';
import { View, Feature, AICommand, TutorialStep } from './types';
import { 
    SparklesIcon, 
    ChatBubbleOvalLeftEllipsisIcon, 
    RocketLaunchIcon, 
    MagnifyingGlassIcon, 
    MicrophoneIcon, 
    AcademicCapIcon,
    UserCircleIcon,
    ChartBarIcon,
    CpuChipIcon,
    HeartIcon,
    VideoCameraIcon,
    BriefcaseIcon,
    MapPinIcon
} from './components/icons/Icons';


interface JobSearchState {
    searchTerm: string;
    category: string;
}

const tutorialElementMap: Partial<Record<View, string[]>> = {
  [View.AIResume]: ['resume-job-description', 'resume-experience', 'resume-generate-button'],
  [View.Jobs]: ['job-search-input', 'job-category-filter', 'job-status-filter', 'job-results-list'],
  [View.InterviewPrep]: ['prep-job-description', 'prep-experience', 'prep-generate-button'],
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Hero);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [initialJobSearchState, setInitialJobSearchState] = useState<JobSearchState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // AI Tutorial State
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState<TutorialStep[]>([]);
  const [isTutorialLoading, setIsTutorialLoading] = useState(false);
  const [tutorialError, setTutorialError] = useState('');

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
    if (isTransitioning) return;

    if (activeView !== view) {
        setIsTransitioning(true);
        setTimeout(() => {
            setActiveView(view);
            setIsTransitioning(false);
            if (isTutorialActive) {
                setIsTutorialActive(false);
                setTutorialSteps([]);
            }
        }, 400); 
    }
  };

  const startTutorial = async (view: View) => {
    if (!tutorialElementMap[view]) {
        setTutorialError("Sorry, there's no tutorial available for this page yet.");
        setTutorialSteps([{
            elementId: 'body',
            title: 'No Tutorial Available',
            text: "Sorry, a guided tour isn't ready for this page yet. More are being added all the time!",
        }]);
        setIsTutorialActive(true);
        return;
    }

    setIsTutorialLoading(true);
    setIsTutorialActive(true);
    setTutorialError('');
    setTutorialSteps([]);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const tutorialSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                },
                required: ['title', 'text']
            }
        };

        const prompt = `
            You are a helpful and friendly UI tour guide for a web application called Alpha Consortium.
            The feature is: **${view}**
            Number of steps to generate: ${tutorialElementMap[view]!.length}
            Generate a JSON array of tutorial steps.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: tutorialSchema,
            }
        });
        
        const generatedSteps = JSON.parse(response.text.trim());
        const elementIds = tutorialElementMap[view]!;

        const combinedSteps = generatedSteps.map((step: any, index: number) => ({
            ...step,
            elementId: elementIds[index],
        }));

        setTutorialSteps(combinedSteps);

    } catch (e) {
        console.error("Tutorial generation failed:", e);
        setTutorialError("Sorry, the AI Guide couldn't create a tour right now.");
    } finally {
        setIsTutorialLoading(false);
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
      case 'TUTORIAL':
        startTutorial(activeView);
        break;
    }
    setIsCommandBarOpen(false);
  };
  
  const features: Feature[] = [
      { view: View.Jobs, title: 'Find a Job', description: 'Browse verified job listings and apply with your profile.', icon: MagnifyingGlassIcon },
      { view: View.VisaTrack, title: 'Balkan Bridge', description: 'AI-powered visa and relocation tracking for international careers.', icon: MapPinIcon },
      { view: View.AIAssistant, title: 'AI Assistant', description: 'Have a real-time voice conversation with our career assistant.', icon: MicrophoneIcon },
      { view: View.AIResume, title: 'AI Resume Builder', description: 'Craft a tailored, professional resume in seconds.', icon: SparklesIcon },
      { view: View.CareerPath, title: 'AI Career Path', description: 'Get a personalized career roadmap based on your goals.', icon: RocketLaunchIcon },
      { view: View.InterviewPrep, title: 'AI Interview Prep', description: 'Practice with tailored questions and get feedback.', icon: ChatBubbleOvalLeftEllipsisIcon },
      { view: View.Academy, title: 'Alpha Academy', description: 'Elevate your skills with our expert-designed courses.', icon: AcademicCapIcon },
      { view: View.Dashboard, title: 'My Dashboard', description: 'Manage your profile and tracked applications.', icon: UserCircleIcon },
      { view: View.MarketTrends, title: 'Market Trends', description: 'Analyze job demand and salaries with AI.', icon: ChartBarIcon },
      { view: View.SkillCoach, title: 'AI Skill Coach', description: 'Get a personalized roadmap to master any new skill.', icon: CpuChipIcon },
      { view: View.VibeCheck, title: 'Career Vibe Check', description: 'Discover jobs that match your personality.', icon: HeartIcon },
      { view: View.VideoGenerator, title: 'AI Video Generator', description: 'Create stunning short videos from text prompts.', icon: VideoCameraIcon },
      { view: View.HRServices, title: 'For Employers', description: 'Access our full suite of HR and recruitment solutions.', icon: BriefcaseIcon },
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
      case View.Academy:
        return <Academy />;
      case View.PostJob:
        return <PostJob setActiveView={handleSetView} />;
      case View.CandidateSummarizer:
        return <CandidateSummarizer />;
      case View.Dashboard:
        return <Dashboard setActiveView={handleSetView} />;
      case View.MarketTrends:
        return <MarketTrends />;
      case View.SkillCoach:
        return <SkillCoach setActiveView={handleSetView} />;
      case View.VideoGenerator:
        return <VideoGenerator />;
      case View.CloudSync:
        return <CloudSync />;
      case View.VibeCheck:
        return <VibeCheck />;
      case View.HRServices:
        return <HRServices setActiveView={handleSetView} />;
      case View.VisaTrack:
        return <VisaTrack />;
      case View.Hero:
      default:
        if (initialJobSearchState) setInitialJobSearchState(null);
        return <Hero features={features} setActiveView={handleSetView} />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0c0a18] min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <SEOManager activeView={activeView} />
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md shadow-lg"
      >
        Skip to main content
      </a>
      <Header 
        activeView={activeView} 
        setActiveView={handleSetView} 
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
        onStartTutorial={() => startTutorial(activeView)}
      />
      {isCommandBarOpen && (
          <CommandBar 
              onClose={() => setIsCommandBarOpen(false)} 
              onExecuteCommand={handleExecuteCommand}
          />
      )}
       {isTutorialActive && (
          <AITutorialAssistant
            steps={tutorialSteps}
            isLoading={isTutorialLoading}
            error={tutorialError}
            onClose={() => setIsTutorialActive(false)}
          />
        )}
      <main id="main-content" className={isTransitioning ? 'animate-zoom-out-view' : 'animate-scale-in'} tabIndex={-1}>
        {renderContent()}
      </main>
      <Footer />
      <Analytics />
    </div>
  );
};

export default App;