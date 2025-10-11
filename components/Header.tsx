
import React from 'react';
import { View } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from './icons/Icons';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const AlphaLogo: React.FC = () => (
    <div className="flex items-center gap-3 cursor-pointer">
        <svg width="40" height="35" viewBox="0 0 140 121" fill="none" xmlns="http://www.w.org/2000/svg">
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


const NavItem: React.FC<{ title: string; active: boolean; onClick: () => void }> = ({ title, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
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
                <MoonIcon className="h-5 w-5" />
            ) : (
                <SunIcon className="h-5 w-5" />
            )}
        </button>
    );
};


const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const navItems: { view: View; title: string }[] = [
    { view: View.Home, title: 'Home' },
    { view: View.Jobs, title: 'Find a Job' },
    { view: View.AIResume, title: 'AI Resume' },
    { view: View.MarketTrends, title: 'Market Trends' },
    { view: View.Academy, title: 'Alpha Academy' },
    { view: View.Employers, title: 'For Employers' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a2a1a]/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button onClick={() => setActiveView(View.Home)} aria-label="Alpha Consortium, go to homepage" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md p-1 -ml-1">
            <AlphaLogo />
          </button>
          <nav className="hidden md:flex items-center" aria-label="Main navigation">
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <NavItem
                  key={item.view}
                  title={item.title}
                  active={activeView === item.view}
                  onClick={() => setActiveView(item.view)}
                />
              ))}
            </div>
             <div className="flex items-center gap-4 ml-6">
              <ThemeToggle />
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900">
                  Login / Sign Up
              </button>
            </div>
          </nav>
          {/* Mobile menu button could be added here */}
        </div>
      </div>
    </header>
  );
};

export default Header;
