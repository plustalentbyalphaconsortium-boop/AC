
import React, { useState, useEffect, useRef } from 'react';
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
import OfferSense from './components/OfferSense';
import SalaryBridge from './components/SalaryBridge';
import CulturalSimulator from './components/CulturalSimulator';
import Pulse from './components/Pulse';
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
    HeartIcon,
    BriefcaseIcon,
    MapPinIcon,
    ScaleIcon,
    CurrencyDollarIcon,
    CpuChipIcon
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
    return () => window.removeEventListener('keydown', handleKeyDown);
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 400); 
    }
  };

  const startTutorial = async (view: View) => {
    if (!tutorialElementMap[view]) {
        setTutorialError("Sorry, no guided tour is ready for this sector yet.");
        setTutorialSteps([{
            elementId: 'body',
            title: 'Nexus Intelligence Offline',
            text: "This sector's intelligence map is currently being updated. Check back shortly.",
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
        const prompt = `Create a professional guide for ALPHA CONSORTIUM's ${view} feature. 3 steps. JSON format only.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { title: { type: Type.STRING }, text: { type: Type.STRING } },
                        required: ['title', 'text']
                    }
                }
            }
        });
        const generatedSteps = JSON.parse(response.text.trim());
        const elementIds = tutorialElementMap[view]!;
        setTutorialSteps(generatedSteps.map((step: any, idx: number) => ({ ...step, elementId: elementIds[idx] })));
    } catch (e) {
        setTutorialError("AI Tutorial Link Interrupted.");
    } finally {
        setIsTutorialLoading(false);
    }
  };

  const handleExecuteCommand = (command: AICommand) => {
    if (command.action === 'NAVIGATE' && command.params?.view in View) handleSetView(command.params.view as View);
    else if (command.action === 'SEARCH_JOBS') {
        setInitialJobSearchState({ searchTerm: command.params?.searchTerm || '', category: command.params?.category || 'All' });
        handleSetView(View.Jobs);
    } else if (command.action === 'TUTORIAL') startTutorial(activeView);
    setIsCommandBarOpen(false);
  };
  
  const features: Feature[] = [
      { view: View.Pulse, title: 'Consortium Pulse', description: 'Real-time alliance hiring velocity and market impact analytics.', icon: CpuChipIcon },
      { view: View.Jobs, title: 'Neural Matchmaking', description: 'AI-driven semantic job search across the Balkan alliance.', icon: MagnifyingGlassIcon },
      { view: View.SalaryBridge, title: 'Salary Bridge', description: 'AI purchasing power comparison between South Asia and Balkans.', icon: CurrencyDollarIcon },
      { view: View.CulturalSimulator, title: 'Balkan Fit', description: 'Psychological simulation with regional hiring managers.', icon: HeartIcon },
      { view: View.VisaTrack, title: 'Balkan Bridge', description: 'AI-powered visa and relocation tracking for global careers.', icon: MapPinIcon },
      { view: View.AIAssistant, title: 'Nexus Assistant', description: 'Real-time voice intelligence for your career scaling.', icon: MicrophoneIcon },
      { view: View.AIResume, title: 'Resume Architect', description: 'Craft industry-standard portfolios for European markets.', icon: SparklesIcon },
      { view: View.InterviewPrep, title: 'Interview Forge', description: 'Practice with tailored questions and feedback loop.', icon: ChatBubbleOvalLeftEllipsisIcon },
      { view: View.MarketTrends, title: 'Market Intelligence', description: 'Deep data analysis on job demand and regional scaling.', icon: ChartBarIcon },
      { view: View.Academy, title: 'Alpha Academy', description: 'Industrial certifications for South Asian excellence.', icon: AcademicCapIcon },
      { view: View.OfferSense, title: 'OfferSense', description: 'Analyze job offers and get negotiation strategies.', icon: ScaleIcon },
      { view: View.HRServices, title: 'Employer Suite', description: 'Industrial-grade recruitment solutions for the alliance.', icon: BriefcaseIcon },
  ];

  const renderContent = () => {
    switch (activeView) {
      case View.Jobs: return <JobSearch initialSearchTerm={initialJobSearchState?.searchTerm} initialCategory={initialJobSearchState?.category} />;
      case View.AIResume: return <AIResumeBuilder />;
      case View.InterviewPrep: return <InterviewPrep />;
      case View.CareerPath: return <CareerPath setActiveView={handleSetView} />;
      case View.AIAssistant: return <AIAssistant />;
      case View.Academy: return <Academy />;
      case View.PostJob: return <PostJob setActiveView={handleSetView} />;
      case View.CandidateSummarizer: return <CandidateSummarizer />;
      case View.Dashboard: return <Dashboard setActiveView={handleSetView} />;
      case View.MarketTrends: return <MarketTrends />;
      case View.SkillCoach: return <SkillCoach setActiveView={handleSetView} />;
      case View.VideoGenerator: return <VideoGenerator />;
      case View.CloudSync: return <CloudSync />;
      case View.VibeCheck: return <VibeCheck />;
      case View.OfferSense: return <OfferSense />;
      case View.HRServices: return <HRServices setActiveView={handleSetView} />;
      case View.VisaTrack: return <VisaTrack />;
      case View.SalaryBridge: return <SalaryBridge />;
      case View.CulturalSimulator: return <CulturalSimulator />;
      case View.Pulse: return <Pulse />;
      case View.Hero:
      default:
        if (initialJobSearchState) setInitialJobSearchState(null);
        return <Hero features={features} setActiveView={handleSetView} />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#05050a] min-h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <SEOManager activeView={activeView} />
      <Header activeView={activeView} setActiveView={handleSetView} onOpenCommandBar={() => setIsCommandBarOpen(true)} onStartTutorial={() => startTutorial(activeView)} />
      {isCommandBarOpen && <CommandBar onClose={() => setIsCommandBarOpen(false)} onExecuteCommand={handleExecuteCommand} />}
      {isTutorialActive && <AITutorialAssistant steps={tutorialSteps} isLoading={isTutorialLoading} error={tutorialError} onClose={() => setIsTutorialActive(false)} />}
      <div className="relative">
        {isTransitioning && (
          <div className="absolute top-0 left-0 w-full z-50 h-1 overflow-hidden">
            <div className="h-full bg-blue-600 animate-loading-bar origin-left shadow-[0_0_12px_rgba(37,99,235,0.9)]"></div>
          </div>
        )}
        <main id="main-content" className={isTransitioning ? 'opacity-0 scale-95 transition-all duration-300' : 'animate-scale-in'} tabIndex={-1}>
          {renderContent()}
        </main>
      </div>
      <Footer />
      <style>{`
        @keyframes loading-bar { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        .animate-loading-bar { animation: loading-bar 0.4s linear forwards; }
      `}</style>
    </div>
  );
};

export default App;
