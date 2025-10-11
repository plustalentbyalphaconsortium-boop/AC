
import React from 'react';
import { View } from '../App';

interface HeroProps {
  setActiveView: (view: View) => void;
}

const Hero: React.FC<HeroProps> = ({ setActiveView }) => {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8 text-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56">
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full border border-blue-500/30 px-3 py-1 text-sm leading-6 text-gray-300 ring-1 ring-inset ring-blue-500/20">
            Global Disruptive Innovation Consultants
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-orbitron neon-text">
          Innovating the Future of Work
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-300">
          Connect with premier opportunities, enhance your skills with elite training, and access top-tier HR solutions. Alpha Consortium is your gateway to career and business excellence.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button
            onClick={() => setActiveView(View.Jobs)}
            className="rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform transform hover:scale-105"
          >
            Find Your Next Job
          </button>
          <a href="#features" className="text-base font-semibold leading-6 text-white group">
            Learn more <span aria-hidden="true" className="group-hover:translate-x-1 inline-block transition-transform">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Hero;
