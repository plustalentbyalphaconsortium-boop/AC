
import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white dark:bg-[#05050a] border-t border-gray-100 dark:border-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
            <h2 className="font-orbitron text-2xl font-black tracking-widest text-gray-900 dark:text-white">ALPHA<span className="text-blue-600">CONSORTIUM</span></h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm font-medium leading-relaxed">
                The leading industrial alliance connecting emerging talent from South Asia with the core industrial hubs of the Balkan region. We prioritize ethical scaling, transparency, and technological excellence.
            </p>
            <div className="flex gap-4 pt-4">
                <div className="p-2 border border-gray-200 dark:border-gray-800 rounded flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Romania Hub Active</span>
                </div>
                <div className="p-2 border border-gray-200 dark:border-gray-800 rounded flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">South Asia Hub Active</span>
                </div>
            </div>
        </div>
        <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Talent Corridors</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Find Balkan Jobs</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Visa & Relocation AI</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Salary Bridge Simulator</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Alpha Academy Certs</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Resume Architect</a></li>
            </ul>
        </div>
        <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Corporate Hub</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Employer Solutions</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Compliance Shield</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy & GDPR</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Ethics Charter</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Alliance API</a></li>
            </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span>&copy; {currentYear} ALPHA CONSORTIUM ALLIANCE. ALL RIGHTS RESERVED.</span>
        <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> NEXUS LINK STABLE</span>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="hover:text-blue-600 cursor-pointer">System Status</span>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
