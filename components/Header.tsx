import React, { useState, useEffect } from 'react';
import { View } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon, CommandLineIcon } from './icons/Icons';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onOpenCommandBar: () => void;
}

const AlphaLogo: React.FC = () => (
    <div className="flex items-center gap-3 cursor-pointer">
        <svg width="40" height="35" viewBox="0 0 140 121" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_101_2)">
                <path d="M70 0L0 121.25H140L70 0Z" className="fill-white dark:fill-[#1a2a1a]"/>
                <path d="M70 0L35 60.625L0 121.25H35L70 60.625L105 121.25H140L105 60.625L70 0Z" stroke="#4169E1" strokeWidth="4"/>
                <path d="M35 60.625L70 121.25L105 60.625L70 0L35 60.625Z" className="fill-gray-600 dark:fill-gray-200"/>
                <path d="M35 60.625L70 121.25L105 60.625L70 0L35 60.625Z" stroke="#4169E1" strokeWidth="2"/>
                <path d="M35 60.625H105" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 4"/>
                <path d="M35 60.625L70 0" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 4"/>
                <path d="M105 60.625L70 0" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 4"/>
                <path d="M70 60.625L35 121.25" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 4"/>
                <path d="M70 60.625L105 121.25" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 4"/>
            </g>
            <defs>
                <filter id="filter0_d_101_2" x="-4" y="0" width="148" height="129.25" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                <feMorphology radius="1" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_101_2"/>
                <feOffset dy="4"/>
                <feGaussianBlur stdDeviation="2"/>
                <feComposite in2="hardAlpha" operator="out"/>
                <feColorMatrix type="matrix" values="0 0 0 0 0.254902 0 0 0 0 0.411765 0 0 0 0 0.882353 0 0 0 0.7 0"/>
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


const NavItem: React.FC<{ title: string; active: boolean; onClick: () => void; isMobile?: boolean }> = ({ title, active, onClick, isMobile }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`px-3 py-2 font-medium rounded-md transition-all duration-300 w-full text-left ${
      isMobile ? 'text-lg' : 'text-sm'
    } ${
      active
        ? 'text-white bg-blue-600 dark:bg-blue-500/20'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {title}
  </button>
);

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


const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, onOpenCommandBar }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const navItems: { view: View; title: string }[] = [
    { view: View.Home, title: 'Home' },
    { view: View.Dashboard, title: 'My Dashboard' },
    { view: View.CloudSync, title: 'Cloud Sync' },
    { view: View.Jobs, title: 'Find a Job' },
    { view: View.AIResume, title: 'AI Resume' },
    { view: View.CareerPath, title: 'Career Path' },
    { view: View.SkillCoach, title: 'Skill Coach' },
    { view: View.InterviewPrep, title: 'Interview Prep' },
    { view: View.VideoGenerator, title: 'AI Video Gen' },
    { view: View.MarketTrends, title: 'Market Trends' },
    { view: View.Academy, title: 'Alpha Academy' },
    { view: View.Employers, title: 'For Employers' },
  ];

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

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a2a1a]/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => handleNavClick(View.Home)} aria-label="Alpha Consortium, go to homepage" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md p-1 -ml-1">
            <AlphaLogo />
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center" aria-label="Main navigation">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.view}
                  title={item.title}
                  active={activeView === item.view}
                  onClick={() => handleNavClick(item.view)}
                />
              ))}
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-2 ml-6">
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
            <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900">
                Login / Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
                onClick={onOpenCommandBar}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Open AI Command Bar"
            >
                <CommandLineIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <XMarkIcon className="block h-6 w-6" /> : <Bars3Icon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div id="mobile-menu" className="lg:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] bg-white dark:bg-[#1a2a1a] z-40">
          <div className="pt-2 pb-3 px-2 space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.view}
                title={item.title}
                active={activeView === item.view}
                onClick={() => handleNavClick(item.view)}
                isMobile
              />
            ))}
             <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
             <div className="flex items-center justify-between px-3">
                 <span className="text-gray-600 dark:text-gray-300 text-lg">Switch Theme</span>
                 <ThemeToggle />
             </div>
             <div className="px-3 pt-4">
                 <button className="w-full px-4 py-3 text-lg font-semibold text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700 transition-colors duration-300">
                     Login / Sign Up
                 </button>
             </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;