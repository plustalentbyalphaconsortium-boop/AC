import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { VideoCameraIcon, SparklesIcon, XMarkIcon, ChevronDownIcon, ArrowPathIcon } from './icons/Icons';

const loadingMessages = [
    "Initializing video generation...",
    "Analyzing your prompt and image...",
    "Storyboarding the scene...",
    "Rendering initial frames (this can take a moment)...",
    "Adding details and motion...",
    "Finalizing the video stream...",
    "Almost there, preparing your video..."
];

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<{ base64: string; mimeType: string; name: string; } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [lastUsedPrompt, setLastUsedPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isKeySelected, setIsKeySelected] = useState(false);

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
            // Assume key selection is successful to avoid race conditions.
            setIsKeySelected(true);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (JPEG, PNG, WEBP).');
            return;
        }
        
        setError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            setImage({ base64, mimeType: file.type, name: file.name });
        };
        reader.onerror = () => setError('Failed to read the image file.');
        reader.readAsDataURL(file);
    };

    const handleEnhancePrompt = async () => {
        if (!prompt) return;
        setIsEnhancing(true);
        try {
             const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
             const response = await ai.models.generateContent({
                 model: 'gemini-3-flash-preview',
                 contents: `Rewrite this video prompt to be more descriptive, cinematic, and detailed for an AI video generator. Keep it under 3 sentences. Prompt: "${prompt}"`,
             });
             setPrompt(response.text.trim());
        } catch (e) {
            console.error("Enhance failed", e);
            // Fail silently or show subtle indication
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!prompt) {
            setError('Please enter a prompt to generate a video.');
            return;
        }

        setIsLoading(true);
        setError('');
        setGeneratedVideoUrl(null);
        setLastUsedPrompt(prompt);
        let messageIndex = 0;
        setLoadingMessage(loadingMessages[messageIndex]);
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 8000);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const requestPayload: any = {
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: { 
                    numberOfVideos: 1,
                    resolution: resolution,
                    aspectRatio: aspectRatio
                }
            };

            if (image) {
                requestPayload.image = {
                    imageBytes: image.base64,
                    mimeType: image.mimeType
                };
            }

            let operation = await ai.models.generateVideos(requestPayload);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

            if (downloadLink) {
                const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                if (!videoResponse.ok) {
                    throw new Error(`Failed to download video: ${videoResponse.statusText}`);
                }
                const videoBlob = await videoResponse.blob();
                const videoUrl = URL.createObjectURL(videoBlob);
                setGeneratedVideoUrl(videoUrl);
            } else {
                throw new Error("Video generation completed, but no download link was provided.");
            }

        } catch (e: any) {
            console.error(e);
            if (e.message?.includes("Requested entity was not found.")) {
                setError("Your API key is invalid or not selected. Please select a valid key and try again.");
                setIsKeySelected(false);
            } else {
                setError(`An error occurred during video generation: ${e.message}.`);
            }
        } finally {
            setIsLoading(false);
            clearInterval(messageInterval);
        }
    };
    
    const triggerFileSelect = () => fileInputRef.current?.click();
    
    const removeImage = () => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    if (!isKeySelected) {
        return (
            <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <div className="max-w-xl mx-auto text-center bg-white dark:bg-gray-800/30 backdrop-blur-sm p-8 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-lg">
                    <VideoCameraIcon className="h-12 w-12 mx-auto text-blue-500" />
                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl font-orbitron">API Key Required</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                        To use the AI Video Generator (Veo), you need to select a paid API key. This feature generates high-quality video content.
                        Please refer to the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">billing documentation</a> for more details.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={handleSelectKey}
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500"
                        >
                            Select API Key
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Video Generator</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Bring your ideas to life. Generate short videos from text or an image using Gemini Veo.</p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    1. Describe your video
                                </label>
                                <button 
                                    onClick={handleEnhancePrompt}
                                    disabled={isEnhancing || !prompt}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 disabled:opacity-50"
                                >
                                    {isEnhancing ? <ArrowPathIcon className="h-3 w-3 animate-spin" /> : <SparklesIcon className="h-3 w-3" />}
                                    {isEnhancing ? 'Enhancing...' : 'Magic Enhance'}
                                </button>
                            </div>
                            <textarea
                                id="video-prompt"
                                rows={4}
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="e.g., A cinematic drone shot of a futuristic city in the Balkans at sunset..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Aspect Ratio</label>
                                <div className="relative">
                                    <select 
                                        id="aspect-ratio"
                                        value={aspectRatio} 
                                        onChange={(e) => setAspectRatio(e.target.value as any)}
                                        className="w-full appearance-none bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                    >
                                        <option value="16:9">Landscape (16:9)</option>
                                        <option value="9:16">Portrait (9:16)</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution</label>
                                <div className="relative">
                                    <select 
                                        id="resolution"
                                        value={resolution} 
                                        onChange={(e) => setResolution(e.target.value as any)}
                                        className="w-full appearance-none bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                    >
                                        <option value="720p">720p HD</option>
                                        <option value="1080p">1080p Full HD</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                3. Add a starting image (Optional)
                            </span>
                             <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleFileChange}
                                disabled={isLoading}
                            />
                            {image ? (
                                <div className="mt-2 relative group">
                                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt="Image preview" className="rounded-lg w-full max-h-48 object-cover border border-gray-300 dark:border-gray-600 transition-opacity group-hover:opacity-90" />
                                     <button onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors" aria-label="Remove image">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={triggerFileSelect}
                                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-gray-50/50 dark:bg-gray-900/20"
                                    disabled={isLoading}
                                >
                                    Click to upload a reference frame
                                </button>
                            )}
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleGenerateVideo}
                                disabled={isLoading || !prompt}
                                className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-[1.02] active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                            >
                                {isLoading ? (
                                    <>
                                        <VideoCameraIcon className="h-5 w-5 mr-2 animate-pulse" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                        Generate Video
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-blue-500/20 aspect-video flex items-center justify-center flex-col sticky top-24 shadow-md dark:shadow-none overflow-hidden">
                        {isLoading ? (
                            <div className="text-center w-full px-4" aria-live="polite">
                                <div className="relative w-16 h-16 mx-auto mb-6">
                                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
                                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 font-bold text-lg animate-pulse">{loadingMessage}</p>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This usually takes about 1-2 minutes.</p>
                            </div>
                        ) : error ? (
                             <div role="alert" className="text-center text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30 p-6 rounded-lg max-w-sm">
                                <h3 className="font-bold mb-2">Generation Failed</h3>
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : generatedVideoUrl ? (
                            <div className="w-full h-full flex flex-col animate-scale-in">
                                <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain rounded-md bg-black" />
                                <div className="mt-4 text-center">
                                    <a
                                        href={generatedVideoUrl}
                                        download={`alpha-consortium-video-${lastUsedPrompt.slice(0, 20).replace(/\s/g, '_')}.mp4`}
                                        className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-colors"
                                    >
                                        Download MP4
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 dark:text-gray-600 select-none">
                                <VideoCameraIcon className="h-16 w-16 mx-auto opacity-50" />
                                <p className="mt-4 font-medium">Your video masterpiece will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VideoGenerator;