
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useTheme } from '../contexts/ThemeContext';
import { 
    VideoCameraIcon, 
    SparklesIcon, 
    XMarkIcon, 
    ChevronDownIcon, 
    ArrowPathIcon,
    CpuChipIcon,
    RocketLaunchIcon,
    MapPinIcon,
    CommandLineIcon,
    ScissorsIcon,
    TypeIcon,
    MagicWandIcon
} from './icons/Icons';

const loadingMessages = [
    "Connecting to Alpha Nexus compute nodes...",
    "Analyzing industrial aesthetics...",
    "Drafting cinematic storyboard...",
    "Simulating motion vectors (this takes a moment)...",
    "Applying regional atmospheric filters...",
    "Finalizing high-fidelity video stream...",
    "Ready for deployment. Preparing your video."
];

const STYLE_PRESETS = [
    { id: 'cinematic', name: 'Alpha Cinematic', description: 'Deep shadows, warm industrial lighting, professional film look.' },
    { id: 'blueprint', name: 'Technical Blueprint', description: 'High contrast, technical overlays, blueprint aesthetic.' },
    { id: 'vibrant', name: 'Balkan Sunrise', description: 'Bright, saturated colors, optimistic regional atmosphere.' },
    { id: 'minimal', name: 'Minimalist Corporate', description: 'Clean, white-space focused, modern logistics look.' }
];

const VideoGenerator: React.FC = () => {
    const { theme } = useTheme();
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
    const [image, setImage] = useState<{ base64: string; mimeType: string; name: string; } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [previousOperation, setPreviousOperation] = useState<any>(null);
    const [error, setError] = useState('');
    const [isKeySelected, setIsKeySelected] = useState(false);
    
    // Editor State
    const [isEditorMode, setIsEditorMode] = useState(false);
    const [editInstruction, setEditInstruction] = useState('');
    const [trimRange, setTrimRange] = useState({ start: 0, end: 100 });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setIsKeySelected(true);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Incompatible asset. Please upload an image file (JPEG/PNG).');
            return;
        }
        setError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            setImage({ base64, mimeType: file.type, name: file.name });
        };
        reader.readAsDataURL(file);
    };

    const handleEnhancePrompt = async () => {
        if (!prompt) return;
        setIsEnhancing(true);
        try {
             const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
             const response = await ai.models.generateContent({
                 model: 'gemini-3-flash-preview',
                 contents: `Expand this video prompt for an industrial recruitment agency. Style: ${selectedStyle.name}. Original: "${prompt}". Output only 2 highly descriptive sentences.`,
             });
             setPrompt(response.text.trim());
        } catch (e) {
            console.error("Enhance failed", e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const runGenerationOperation = async (ai: any, requestPayload: any) => {
        let operation = await ai.models.generateVideos(requestPayload);
        
        // Start Progress Simulation
        let simulatedProgress = 5;
        setProgress(simulatedProgress);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            
            // Advance progress with each poll, capping at 98% until actually done
            simulatedProgress = Math.min(98, simulatedProgress + Math.floor(Math.random() * 8) + 2);
            setProgress(simulatedProgress);
            
            // Cycle through messages based on progress thresholds
            const msgIdx = Math.min(loadingMessages.length - 1, Math.floor((simulatedProgress / 100) * loadingMessages.length));
            setLoadingMessage(loadingMessages[msgIdx]);
        }
        
        setProgress(100);
        setPreviousOperation(operation);
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!videoResponse.ok) throw new Error("Terminal Link Unstable.");
            const videoBlob = await videoResponse.blob();
            return URL.createObjectURL(videoBlob);
        }
        throw new Error("Generation complete, but Nexus stream was interrupted.");
    };

    const handleGenerateVideo = async () => {
        if (!prompt) {
            setError('Required: Vision Statement (Prompt).');
            return;
        }
        setIsLoading(true);
        setProgress(0);
        setError('');
        setGeneratedVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const requestPayload: any = {
                model: 'veo-3.1-fast-generate-preview',
                prompt: `Style: ${selectedStyle.name}. ${prompt}`,
                config: { numberOfVideos: 1, resolution, aspectRatio }
            };
            if (image) {
                requestPayload.image = { imageBytes: image.base64, mimeType: image.mimeType };
            }
            const videoUrl = await runGenerationOperation(ai, requestPayload);
            setGeneratedVideoUrl(videoUrl);
        } catch (e: any) {
            setError(e.message?.includes("Requested entity") ? "Re-select API Key." : `Anomaly: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExtendVideo = async () => {
        if (!previousOperation || resolution !== '720p') {
            setError('Extension requires 720p base footage.');
            return;
        }
        setIsLoading(true);
        setProgress(0);
        setLoadingMessage("Adding 7s of AI-interpolated footage...");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const requestPayload = {
                model: 'veo-3.1-generate-preview',
                prompt: editInstruction || "The scene continues smoothly with more detail.",
                video: previousOperation.response?.generatedVideos?.[0]?.video,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio }
            };
            const videoUrl = await runGenerationOperation(ai, requestPayload);
            setGeneratedVideoUrl(videoUrl);
            setEditInstruction('');
        } catch (e: any) {
            setError(`Extension Anomaly: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAIEmit = async () => {
        if (!editInstruction) return;
        setIsLoading(true);
        setProgress(0);
        setLoadingMessage(`Applying Edit: ${editInstruction}...`);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const requestPayload = {
                model: 'veo-3.1-fast-generate-preview',
                prompt: `Edit instruction: ${editInstruction}. Maintain original style. Base scene: ${prompt}`,
                config: { numberOfVideos: 1, resolution, aspectRatio }
            };
            const videoUrl = await runGenerationOperation(ai, requestPayload);
            setGeneratedVideoUrl(videoUrl);
            setEditInstruction('');
        } catch (e: any) {
            setError(`Edit Anomaly: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isKeySelected) {
        return (
            <div className="py-24 px-6 flex items-center justify-center min-h-[70vh]">
                <div className="max-w-xl w-full text-center bg-white dark:bg-[#0c0c14] p-10 rounded-3xl border border-blue-500/20 shadow-2xl space-y-6">
                    <CpuChipIcon className="h-12 w-12 text-blue-600 mx-auto" />
                    <h2 className="text-2xl font-black font-orbitron uppercase tracking-tighter">Secure Link Required</h2>
                    <button onClick={handleSelectKey} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all shadow-lg shadow-blue-500/20">Initialize Connection</button>
                    <p className="text-[10px] text-gray-400">Refer to <a href="https://ai.google.dev/gemini-api/docs/billing" className="text-blue-500">Billing Protocol</a>.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#05050a] min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-4 bg-blue-600/5 px-4 py-1 rounded-full border border-blue-600/20">
                        Veo Visual Studio v3.1
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white font-orbitron uppercase">
                        Industrial <span className="text-blue-600">Storyboarder</span>
                    </h2>
                    <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: theme === 'dark' ? '#d1d5db' : '#4b5563', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto', fontWeight: 500 }}>
                        Craft cinematic visualizations or edit existing clips using high-velocity Gemini Veo intelligence.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-5 space-y-6">
                        {!isEditorMode ? (
                            <div className="bg-white dark:bg-[#0c0c14] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl space-y-6 animate-slide-up">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">1. Visualization Vision</label>
                                        <button onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt} className="text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1 hover:text-blue-500">
                                            {isEnhancing ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : <SparklesIcon className="h-3 w-3" />}
                                            Neural Refine
                                        </button>
                                    </div>
                                    <textarea rows={4} className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm outline-none font-medium" placeholder="Describe your scene..." value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">2. Select Aesthetic</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {STYLE_PRESETS.map((style) => (
                                            <button key={style.id} onClick={() => setSelectedStyle(style)} className={`p-4 rounded-2xl border text-left transition-all ${selectedStyle.id === style.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-gray-50 dark:bg-black/40 border-gray-100 dark:border-gray-800 text-gray-500'}`}>
                                                <div className="text-[10px] font-black uppercase tracking-widest">{style.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest outline-none">
                                        <option value="16:9">16:9 Landscape</option>
                                        <option value="9:16">9:16 Portrait</option>
                                    </select>
                                    <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest outline-none">
                                        <option value="720p">720p (Extendable)</option>
                                        <option value="1080p">1080p (Fidelity)</option>
                                    </select>
                                </div>
                                <button onClick={handleGenerateVideo} disabled={isLoading || !prompt} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3">
                                    {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <RocketLaunchIcon className="h-4 w-4" />}
                                    {isLoading ? "Generating..." : "Initialize Stream"}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#0c0c14] p-8 rounded-3xl border border-blue-500/20 shadow-2xl space-y-6 animate-scale-in">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-500">Editor Terminal</h3>
                                    <button onClick={() => setIsEditorMode(false)} className="text-gray-400 hover:text-white transition-colors"><XMarkIcon className="h-5 w-5"/></button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <MagicWandIcon className="h-3 w-3 text-blue-500" /> Instructional Edit
                                        </div>
                                        <textarea rows={3} className="w-full bg-transparent border-none p-0 text-sm outline-none text-white placeholder-gray-600" placeholder="e.g., 'Add a title overlay saying PROLOGUE', 'Fade in from black'..." value={editInstruction} onChange={(e) => setEditInstruction(e.target.value)} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={handleAIEmit} disabled={isLoading || !editInstruction} className="flex items-center justify-center gap-2 py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-all disabled:opacity-50">
                                            <TypeIcon className="h-4 w-4" /> Apply Overlay
                                        </button>
                                        <button onClick={handleExtendVideo} disabled={isLoading || resolution !== '720p'} className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white hover:border-blue-500 border border-transparent transition-all disabled:opacity-50">
                                            <ArrowPathIcon className="h-4 w-4" /> AI Extend (+7s)
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <span>Virtual Trim</span>
                                            <span>{trimRange.start}% - {trimRange.end}%</span>
                                        </div>
                                        <div className="relative h-6 bg-gray-200 dark:bg-gray-900 rounded-lg overflow-hidden">
                                            <div className="absolute top-0 left-0 h-full bg-blue-600/40" style={{ left: `${trimRange.start}%`, width: `${trimRange.end - trimRange.start}%` }}></div>
                                            <input type="range" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                                
                                <button onClick={() => {}} className="w-full py-4 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all">
                                    Finalize Clip
                                </button>
                            </div>
                        )}
                        {error && <p className="text-[10px] font-bold text-red-500 text-center animate-pulse">{error}</p>}
                    </div>

                    <div className="lg:col-span-7">
                        <div className="bg-white dark:bg-[#0c0c14] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden aspect-video relative flex items-center justify-center sticky top-24">
                            {isLoading ? (
                                <div className="text-center p-8 md:p-12 space-y-6 w-full">
                                    <div className="relative w-20 h-20 mx-auto">
                                        <div className="absolute inset-0 border-4 border-blue-600/10 rounded-full animate-pulse"></div>
                                        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <CpuChipIcon className="absolute inset-0 m-auto h-8 w-8 text-blue-600 animate-pulse" />
                                    </div>
                                    <div className="space-y-3 max-w-sm mx-auto">
                                        <p className="text-sm font-black font-orbitron uppercase tracking-widest animate-pulse">{loadingMessage}</p>
                                        
                                        {/* Dynamic Progress Bar */}
                                        <div className="relative h-2 bg-blue-600/10 rounded-full overflow-hidden">
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-700 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Nexus Compute</span>
                                            <span>{progress}%</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Estimated throughput: 2.4 GB/s</p>
                                </div>
                            ) : generatedVideoUrl ? (
                                <div className="w-full h-full relative group">
                                    <video key={generatedVideoUrl} src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                                    <div className="absolute top-6 right-6 flex gap-2">
                                        {!isEditorMode && (
                                            <button onClick={() => setIsEditorMode(true)} className="px-4 py-2 bg-blue-600 text-white font-black uppercase tracking-widest text-[9px] rounded-full shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                                                <ScissorsIcon className="h-3 w-3" /> Open AI Editor
                                            </button>
                                        )}
                                        <a href={generatedVideoUrl} download="alpha-vision.mp4" className="px-4 py-2 bg-white text-gray-900 font-black uppercase tracking-widest text-[9px] rounded-full shadow-xl hover:scale-105 transition-all">Download</a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-6 opacity-30 select-none">
                                    <VideoCameraIcon className="h-20 w-20 mx-auto" />
                                    <p className="text-sm font-black font-orbitron uppercase tracking-widest">Awaiting Visualization</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoGenerator;
