import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CommandLineIcon, ArrowPathIcon, SparklesIcon, BriefcaseIcon } from './icons/Icons';

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'bn', name: 'Bengali' },
    { code: 'ne', name: 'Nepali' },
    { code: 'ro', name: 'Romanian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'bg', name: 'Bulgarian' },
];

const IndustrialTranslator: React.FC = () => {
    const [text, setText] = useState('');
    const [fromLang, setFromLang] = useState('en');
    const [toLang, setToLang] = useState('ro');
    const [translatedText, setTranslatedText] = useState('');
    const [context, setContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleTranslate = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a specialized technical translator for the industrial sector (manufacturing, construction, engineering).
                Translate the following text from ${LANGUAGES.find(l => l.code === fromLang)?.name} to ${LANGUAGES.find(l => l.code === toLang)?.name}.
                
                Text: "${text}"
                Context: "${context || 'General industrial work'}"
                
                Ensure the translation uses correct professional and technical terminology used on factory floors or construction sites.
                If there are multiple ways to say it, provide the most common professional version.
                Output ONLY the translated text.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            setTranslatedText(response.text.trim());
        } catch (e) {
            console.error(e);
            setTranslatedText("Translation failed. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const swapLanguages = () => {
        setFromLang(toLang);
        setToLang(fromLang);
        setText(translatedText);
        setTranslatedText('');
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-orbitron neon-text uppercase tracking-tighter">Nexus Translator</h2>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Bridge the technical language gap between South Asia and the Balkans.</p>
                </div>

                <div className="bg-white dark:bg-gray-800/30 p-8 rounded-3xl border border-blue-500/20 shadow-2xl space-y-8">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <select 
                            value={fromLang} 
                            onChange={(e) => setFromLang(e.target.value)}
                            className="w-full md:w-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                        
                        <button onClick={swapLanguages} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <ArrowPathIcon className="h-6 w-6 text-blue-500" />
                        </button>

                        <select 
                            value={toLang} 
                            onChange={(e) => setToLang(e.target.value)}
                            className="w-full md:w-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Technical Term / Phrase</label>
                            <textarea 
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Enter industrial term (e.g., 'Hydraulic Press', 'Safety Goggles')..."
                                className="w-full h-40 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Technical Translation</label>
                            <div className="w-full h-40 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm relative group">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
                                    </div>
                                ) : (
                                    <p className="text-gray-900 dark:text-white font-medium">{translatedText || 'Translation will appear here...'}</p>
                                )}
                                {translatedText && (
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(translatedText)}
                                        className="absolute bottom-3 right-3 p-1.5 bg-white dark:bg-gray-800 rounded-lg text-[9px] font-bold uppercase tracking-widest text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity border border-blue-200"
                                    >
                                        Copy
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Context (Optional)</label>
                        <div className="relative">
                            <BriefcaseIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text"
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                placeholder="e.g., 'Automotive factory floor', 'Construction safety briefing'"
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleTranslate}
                        disabled={isLoading || !text}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Translating...' : <><SparklesIcon className="h-5 w-5" /> Bridge Terminal</>}
                    </button>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg"><SparklesIcon className="h-4 w-4 text-green-500" /></div>
                        <p className="text-[10px] font-bold text-gray-500">AI Context-Aware</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg"><CommandLineIcon className="h-4 w-4 text-blue-500" /></div>
                        <p className="text-[10px] font-bold text-gray-500">Technical Dictionary</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg"><BriefcaseIcon className="h-4 w-4 text-violet-500" /></div>
                        <p className="text-[10px] font-bold text-gray-500">Regional Dialects</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndustrialTranslator;