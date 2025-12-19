import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { View } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon, CommandLineIcon, ChevronDownIcon, QuestionMarkCircleIcon } from './icons/Icons';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onOpenCommandBar: () => void;
  onStartTutorial: () => void;
}

const AlphaLogo: React.FC = () => (
    <div className="flex items-center gap-3 cursor-pointer">
        <svg width="40" height="35" viewBox="0 0 140 121" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_101_2)">
                <path d="M70 0L0 121.25H140L70 0Z" className="fill-white dark:fill-[#1a2a1a]"/>
                <path d="M70 0L35 60.625L0 121.25H35L70 60.625L105 121.25H140L105 60.625L70 0Z" stroke="#ea580c" strokeWidth="4"/>
                <path d="M35 60.625L70 121.25L105 60.625L70 0L35 60.625Z" className="fill-gray-600 dark:fill-gray-200"/>
                <path d="M35 60.625L70 121.25L105 60.625L70 0L35 60.625Z" stroke="#ea580c" strokeWidth="2"/>
                <path d="M35 60.625H105" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 4"/>
            </g>
            <defs>
                <filter id="filter0_d_101_2" x="-4" y="0" width="148" height="129.25" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feMorphology radius="1" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_101_2"/>
                <feOffset dy="4"/>
                <feGaussianBlur stdDeviation="2"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.98 0 0 0 0 0.45 0 0 0 0 0.05 0 0 0 0.7 0"/>
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_101_2"/>
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_101_2" result="shape"/>
                </filter>
            </defs>
        </svg>
        <span className="font-orbitron text-2xl font-bold tracking-wider neon-text">
            ALPHA CONSORTIUM
        </span>
    </div>
);

const NavItem: React.FC<{ title: string; view: View, activeView: View; onClick: () => void; isMobile?: boolean; isDropdown?: boolean }> = ({ title, view, activeView, onClick, isMobile, isDropdown }) => {
    const active = activeView === view;

    if (isDropdown) {
        return (
             <button
                onClick={onClick}
                aria-pressed={active}
                aria-current={active ? 'page' : undefined}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                    active 
                    ? 'font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                role="menuitem"
            >
                {title}
            </button>
        )
    }

    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            aria-current={active ? 'page' : undefined}
            className={`px-3 py-2 rounded-md transition-all duration-300 w-full text-left ${
            isMobile ? 'text-lg' : 'text-sm'
            } ${
            active
                ? 'font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 shadow-inner'
                : 'font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            {title}
        </button>
    );
};

const NavDropdown: React.FC<{ title: string; children: ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
        }, 200);
    };

    return (
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                {title}
                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 origin-top rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30 animate-scale-in">
                <div className="py-1" role="menu" aria-orientation="vertical">
                    {children}
                </div>
                </div>
            )}
        </div>
    );
};

const MobileDropdown: React.FC<{ title: string; children: ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700/50">
            <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full px-3 py-3 text-lg font-medium text-gray-600 dark:text-gray-300">
                <span>{title}</span>
                <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pl-4 py-2 space-y-1">
                    {children}
                </div>
            )}
        </div>
    )
}

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors duration-200"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <MoonIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
                <SunIcon className="h-5 w-5" aria-hidden="true" />
            )}
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, onOpenCommandBar, onStartTutorial }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);
  
  const navStructure = {
      links: [
          { title: 'Home', view: View.Hero },
          { title: 'Find a Job', view: View.Jobs },
      ],
      dropdowns: [
          {
              title: 'Relocation',
              items: [
                { title: 'Balkan Bridge', view: View.VisaTrack },
              ]
          },
          {
              title: 'AI Tools',
              items: [
                  { title: 'AI Assistant', view: View.AIAssistant },
                  { title: 'AI Resume Builder', view: View.AIResume },
                  { title: 'AI Interview Prep', view: View.InterviewPrep },
                  { title: 'AI Career Path', view: View.CareerPath },
                  { title: 'AI Skill Coach', view: View.SkillCoach },
                  { title: 'Career Vibe Check', view: View.VibeCheck },
                  { title: 'AI Video Generator', view: View.VideoGenerator },
              ]
          },
          {
              title: 'For Employers',
              items: [
                  { title: 'HR Services', view: View.HRServices },
                  { title: 'Post a Job', view: View.PostJob },
                  { title: 'Candidate Summarizer', view: View.CandidateSummarizer },
              ]
          },
          {
              title: 'Resources',
              items: [
                  { title: 'Alpha Academy', view: View.Academy },
                  { title: 'Market Trends', view: View.MarketTrends },
                  { title: 'Cloud Sync', view: View.CloudSync },
              ]
          }
      ],
      tailLinks: [
          { title: 'My Dashboard', view: View.Dashboard }
      ]
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0c0a09]/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => handleNavClick(View.Hero)} aria-label="Alpha Consortium, go to homepage" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md p-1 -ml-1">
            <AlphaLogo />
          </button>
          
          <nav className="hidden lg:flex items-center" aria-label="Main navigation">
            <div className="flex items-center space-x-1">
              {navStructure.links.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} />)}
              {navStructure.dropdowns.map(dropdown => (
                  <NavDropdown key={dropdown.title} title={dropdown.title}>
                      {dropdown.items.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} isDropdown />)}
                  </NavDropdown>
              ))}
              {navStructure.tailLinks.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} />)}
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-2 ml-6">
            <button
                onClick={onStartTutorial}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors duration-200"
                aria-label="Start AI Guide"
            >
                <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
            <button
                onClick={onOpenCommandBar}
                className="flex items-center gap-2 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition-colors duration-200"
                aria-label="Open AI Command Bar"
            >
                <CommandLineIcon className="h-5 w-5" />
                <kbd className="font-sans text-xs font-semibold text-gray-400 dark:text-gray-500">
                    {isMac ? '⌘K' : 'Ctrl+K'}
                </kbd>
            </button>
            <ThemeToggle />
            <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700 transition-colors duration-300">
                Login
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <XMarkIcon className="block h-6 w-6" /> : <Bars3Icon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div id="mobile-menu" className="lg:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] bg-white dark:bg-[#1a2a1a] z-40 overflow-y-auto">
          <div className="pt-2 pb-8 px-2 space-y-1">
              {navStructure.links.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} isMobile />)}
              {navStructure.dropdowns.map(dropdown => (
                  <MobileDropdown key={dropdown.title} title={dropdown.title}>
                      {dropdown.items.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} isMobile />)}
                  </MobileDropdown>
              ))}
              {navStructure.tailLinks.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} isMobile />)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;