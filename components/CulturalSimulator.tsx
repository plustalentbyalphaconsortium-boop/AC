import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SparklesIcon, ChatBubbleOvalLeftEllipsisIcon, MapPinIcon, RocketLaunchIcon, HeartIcon } from './icons/Icons';

type Message = { role: 'user' | 'model'; text: string };

const CulturalSimulator: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [alignmentScore, setAlignmentScore] = useState(50);
    const [isSimStarted, setIsSimStarted] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const startSim = async () => {
        setIsSimStarted(true);
        setIsLoading(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const prompt = "You are 'Radu', a blunt but fair technical manager from Romania. Start a mock interview for a South Asian candidate. Ask a challenging cultural question about teamwork or hierarchy.";
        
        try {
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setMessages([{ role: 'model', text: response.text }]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;
        const newMsg: Message = { role: 'user', text: userInput };
        setMessages(prev => [...prev, newMsg]);
        setUserInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const chatPrompt = `
                Roleplay: You are Radu from Romania.
                Candidate Response: "${userInput}"
                
                Task:
                1. Respond as Radu (stay in character).
                2. Calculate "Cultural Alignment Score" (0-100) based on Romanian work norms (valuing directness, skepticism of vague answers).
                
                Return JSON: { "reply": "string", "scoreChange": number }
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: chatPrompt,
                config: { responseMimeType: "application/json" }
            });

            const result = JSON.parse(response.text);
            setMessages(prev => [...prev, { role: 'model', text: result.reply }]);
            setAlignmentScore(prev => Math.min(100, Math.max(0, prev + result.scoreChange)));

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text uppercase">Balkan Fit Simulator</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Roleplay with a Balkan hiring manager to test your regional cultural readiness.</p>
                </div>

                {!isSimStarted ? (
                    <div className="bg-white dark:bg-gray-800/30 p-12 rounded-3xl border border-blue-500/20 shadow-2xl text-center space-y-6">
                        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                            <RocketLaunchIcon className="h-10 w-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold font-orbitron">Ready to meet 'Radu'?</h3>
                        <p className="text-gray-500 max-w-md mx-auto">This simulation uses real psychological profiles of Balkan managers to help you prepare for the direct and honest communication style of the region.</p>
                        <button onClick={startSim} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all transform hover:scale-105">Initialize Simulation</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col h-[600px] shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">R</div>
                                    <div>
                                        <p className="text-sm font-bold dark:text-white">Radu (Bucharest, RO)</p>
                                        <p className="text-[10px] text-green-500 font-bold animate-pulse uppercase">Live Simulation Active</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white font-medium' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'}`}>
                                            {m.text}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl animate-pulse">
                                            <div className="w-12 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Speak your mind..."
                                        className="flex-grow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button onClick={handleSend} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500"><SparklesIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800/30 p-6 rounded-3xl border border-blue-500/20 shadow-lg text-center">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Cultural Match</h4>
                                <div className="relative w-32 h-32 mx-auto">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                            strokeDasharray={351.8} 
                                            strokeDashoffset={351.8 - (351.8 * alignmentScore) / 100} 
                                            className="text-blue-500 transition-all duration-1000" 
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-orbitron font-black text-2xl dark:text-white">
                                        {alignmentScore}%
                                    </div>
                                </div>
                                <p className="mt-4 text-[10px] font-bold text-gray-500 leading-tight">Lower scores aren't bad; they signal areas where you should be more direct.</p>
                            </div>
                            
                            <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl">
                                <h4 className="font-bold flex items-center gap-2 mb-2"><HeartIcon className="h-4 w-4"/> Pro Tip</h4>
                                <p className="text-xs opacity-90 leading-relaxed">Radu values honesty over politeness. If you don't know an answer, say so directly rather than circling around it.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CulturalSimulator;