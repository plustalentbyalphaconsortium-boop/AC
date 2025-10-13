import React, { useState, useEffect, useRef } from 'react';
import { View, Feature } from '../types';

interface OrbitalNexusProps {
    features: Feature[];
    setActiveView: (view: View) => void;
}

interface OrbState {
    id: View;
    angle: number;
    speed: number;
    radiusX: number;
    radiusY: number;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

const AlphaLogo: React.FC = () => (
    <svg width="100" height="88" viewBox="0 0 140 121" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
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
);


const OrbitalNexus: React.FC<OrbitalNexusProps> = ({ features, setActiveView }) => {
    const [orbs, setOrbs] = useState<OrbState[]>([]);
    const [hoveredOrb, setHoveredOrb] = useState<View | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        const initialOrbs = features.map((feature, index) => {
            const angle = (index / features.length) * 2 * Math.PI;
            const speed = (Math.random() * 0.001) + 0.0005;
            
            // Create different orbital rings
            const ring = index % (isMobile ? 2 : 3);
            let radiusX, radiusY;

            if (isMobile) {
                radiusX = ring === 0 ? 100 : 150;
                radiusY = ring === 0 ? 120 : 180;
            } else {
                if (ring === 0) {
                    radiusX = 200; radiusY = 120;
                } else if (ring === 1) {
                    radiusX = 300; radiusY = 200;
                } else {
                    radiusX = 400; radiusY = 280;
                }
            }

            return {
                id: feature.view,
                angle,
                speed: (index % 2 === 0 ? speed : -speed) * (isMobile ? 1.5 : 1), // alternate directions
                radiusX,
                radiusY,
                icon: feature.icon,
                title: feature.title,
                description: feature.description,
            };
        });
        setOrbs(initialOrbs);

        const animate = () => {
            setOrbs(prevOrbs =>
                prevOrbs.map(orb => ({
                    ...orb,
                    angle: orb.angle + orb.speed,
                }))
            );
            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [features]);

    return (
        <div 
            ref={containerRef}
            className="relative flex items-center justify-center w-full overflow-hidden" 
            style={{ minHeight: 'calc(100vh - 80px)' }}
            aria-label="Interactive feature nexus"
        >
             <div className="absolute inset-0 bg-grid-black/[0.05] dark:bg-grid-white/[0.05]"></div>
             <div className="absolute inset-0 dark:bg-black/30"></div>
             
            <div className="relative flex flex-col items-center justify-center text-center z-10 p-4">
                 <AlphaLogo />
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl font-orbitron neon-text mt-4">
                  Innovating the Future of Work
                </h1>
                <p className="mt-6 text-lg max-w-2xl leading-8 text-gray-600 dark:text-gray-300">
                  Welcome to your career and business excellence gateway. Hover over an orb to explore our services.
                </p>
            </div>
            
            {orbs.map(orb => {
                const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
                const containerHeight = containerRef.current?.offsetHeight || window.innerHeight;
                
                const x = orb.radiusX * Math.cos(orb.angle) * (containerWidth / 1000);
                const y = orb.radiusY * Math.sin(orb.angle) * (containerHeight / 1000);
                
                const isHovered = hoveredOrb === orb.id;

                return (
                    <div 
                        key={orb.id}
                        className="absolute z-20"
                        style={{
                            transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                            top: '50%',
                            left: '50%',
                        }}
                    >
                        <button
                            onClick={() => setActiveView(orb.id)}
                            onMouseEnter={() => setHoveredOrb(orb.id)}
                            onMouseLeave={() => setHoveredOrb(null)}
                            onFocus={() => setHoveredOrb(orb.id)}
                            onBlur={() => setHoveredOrb(null)}
                            className="relative flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-white/80 dark:bg-gray-800/50 backdrop-blur-md rounded-full border border-blue-500/30 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 animate-orbital-glow"
                            style={{
                                transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                                transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                            aria-label={`Go to ${orb.title}`}
                        >
                            <orb.icon className="h-7 w-7 md:h-8 md:h-8 text-blue-500 dark:text-blue-300" />
                        </button>
                         <div 
                             className="absolute top-1/2 left-1/2 p-4 w-48 text-center bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-blue-500/20 pointer-events-none transition-all duration-300 ease-out"
                             style={{
                                 opacity: isHovered ? 1 : 0,
                                 transform: `translate(-50%, -130%) scale(${isHovered ? 1 : 0.8})`,
                                 visibility: isHovered ? 'visible' : 'hidden'
                             }}
                             aria-hidden={!isHovered}
                         >
                             <h3 className="font-bold text-gray-900 dark:text-white">{orb.title}</h3>
                             <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{orb.description}</p>
                         </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OrbitalNexus;