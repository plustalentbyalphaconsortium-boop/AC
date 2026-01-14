
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
    <div className="flex items-center gap-3 cursor-pointer group">
        <div className="relative w-9 h-9 flex items-center justify-center">
            {/* Logo Backdrop Glow */}
            <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-md group-hover:bg-blue-600/20 transition-all duration-500"></div>
            
            {/* Reconstructed Logo from Image */}
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                {/* Main Triangle Structure */}
                <path d="M50 5L95 85H5L50 5Z" stroke="#4169e1" strokeWidth="6" strokeLinejoin="round" fill="rgba(5, 5, 10, 0.8)"/>
                
                {/* Inner Cutouts / Secondary Triangles */}
                <path d="M50 35L75 80H25L50 35Z" stroke="#4169e1" strokeWidth="2" fill="rgba(65, 105, 225, 0.1)"/>
                
                {/* Center Diamond / Core */}
                <path d="M50 20L65 50L50 80L35 50L50 20Z" fill="#e2e8f0" className="dark:fill-white opacity-90"/>
                
                {/* Decorative Horizontal Lines in Diamond */}
                <line x1="42" y1="45" x2="58" y2="45" stroke="#4169e1" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="40" y1="50" x2="60" y2="50" stroke="#4169e1" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="42" y1="55" x2="58" y2="55" stroke="#4169e1" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
        </div>
        <span className="font-orbitron text-base font-black tracking-[0.1em] text-gray-900 dark:text-white uppercase transition-colors group-hover:text-blue-600">
            ALPHA<span className="text-blue-600 dark:text-blue-400">CONSORTIUM</span>
        </span>
    </div>
);

const NavItem: React.FC<{ title: string; view: View, activeView: View; onClick: () => void; isMobile?: boolean; isDropdown?: boolean }> = ({ title, view, activeView, onClick, isMobile, isDropdown }) => {
    const active = activeView === view;
    if (isDropdown) {
        return (
             <button onClick={onClick} className={`block w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 ${active ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                {title}
            </button>
        )
    }
    return (
        <button onClick={onClick} className={`px-3 py-1.5 rounded transition-all duration-300 ${isMobile ? 'text-base w-full text-left font-bold' : 'text-[9px] font-black uppercase tracking-[0.1em]'} ${active ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            {title}
        </button>
    );
};

const NavDropdown: React.FC<{ title: string; children: ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<number | null>(null);
    const handleMouseEnter = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setIsOpen(true); };
    const handleMouseLeave = () => { timeoutRef.current = window.setTimeout(() => setIsOpen(false), 200); };
    return (
        <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors duration-300">
                {title}
                <ChevronDownIcon className={`h-2.5 w-2.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 origin-top rounded bg-white dark:bg-[#0c0c14] shadow-2xl border border-gray-100 dark:border-gray-800 z-50 animate-scale-in overflow-hidden">
                    <div className="py-1">{children}</div>
                </div>
            )}
        </div>
    );
};

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Toggle theme">
            {theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView, onOpenCommandBar, onStartTutorial }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleNavClick = (view: View) => { setActiveView(view); setIsMenuOpen(false); };
  
  const navStructure = {
      links: [
          { title: 'Home', view: View.Hero },
          { title: 'Intelligence', view: View.Pulse },
          { title: 'Match', view: View.Jobs },
      ],
      dropdowns: [
          { title: 'Relocation', items: [{ title: 'Visa Track', view: View.VisaTrack }, { title: 'Salary Logic', view: View.SalaryBridge }, { title: 'Vibe Check', view: View.VibeCheck }] },
          { title: 'Forge', items: [{ title: 'Resume Architect', view: View.AIResume }, { title: 'Interview Forge', view: View.InterviewPrep }, { title: 'Strategy', view: View.CareerPath }] },
          { title: 'Employer', items: [{ title: 'Suite', view: View.HRServices }, { title: 'Post Role', view: View.PostJob }, { title: 'Scan', view: View.CandidateSummarizer }] }
      ]
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#05050a]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <button onClick={() => handleNavClick(View.Hero)} className="focus:outline-none">
            <AlphaLogo />
          </button>
          
          <nav className="hidden lg:flex items-center" aria-label="Main navigation">
            <div className="flex items-center space-x-0.5">
              {navStructure.links.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} />)}
              {navStructure.dropdowns.map(dropdown => (
                  <NavDropdown key={dropdown.title} title={dropdown.title}>
                      {dropdown.items.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} isDropdown />)}
                  </NavDropdown>
              ))}
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded text-gray-600 dark:text-gray-400">
              {isMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden absolute top-14 left-0 w-full bg-white dark:bg-[#0c0c14] border-b border-gray-200 dark:border-gray-800 z-40 p-4 space-y-2 max-h-[80vh] overflow-y-auto">
              {navStructure.links.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} isMobile />)}
              {navStructure.dropdowns.map(dropdown => (
                  <div key={dropdown.title} className="space-y-1">
                      <p className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-gray-400">{dropdown.title}</p>
                      {dropdown.items.map(item => <NavItem key={item.view} {...item} activeView={activeView} onClick={() => handleNavClick(item.view)} isMobile />)}
                  </div>
              ))}
        </div>
      )}
    </header>
  );
};

export default Header;
