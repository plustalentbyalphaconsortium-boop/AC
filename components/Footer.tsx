
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
        </div>
        <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Alliance Hubs</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Romania</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Bangladesh</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Croatia</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Nepal</a></li>
            </ul>
        </div>
        <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Protocol</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Shield</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Ethics Charter</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
            </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-gray-100 dark:border-gray-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span>&copy; {currentYear} ALPHA CONSORTIUM ALLIANCE.</span>
        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> NEXUS LINK STABLE</span>
      </div>
    </footer>
  );
};
export default Footer;
