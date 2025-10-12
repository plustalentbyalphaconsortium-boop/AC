import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { VideoCameraIcon, SparklesIcon, XMarkIcon } from './icons/Icons';

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
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [lastUsedPrompt, setLastUsedPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                model: 'veo-2.0-generate-001',
                prompt: prompt,
                config: { numberOfVideos: 1 }
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
            setError(`An error occurred during video generation: ${e.message}. Please check your API key and try again.`);
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


    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Video Generator</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Bring your ideas to life. Generate short videos from text or an image.</p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                1. Describe your video
                            </label>
                            <textarea
                                id="video-prompt"
                                rows={5}
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="e.g., A majestic eagle soaring over a mountain range at sunrise"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                2. Add a starting image (Optional)
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
                                <div className="mt-2 relative">
                                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt="Image preview" className="rounded-lg w-full max-h-48 object-cover border border-gray-300 dark:border-gray-600" />
                                     <button onClick={removeImage} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/75" aria-label="Remove image">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={triggerFileSelect}
                                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    disabled={isLoading}
                                >
                                    Click to upload image
                                </button>
                            )}
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleGenerateVideo}
                                disabled={isLoading || !prompt}
                                className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                            >
                                <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                Generate Video
                            </button>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-blue-500/20 aspect-video flex items-center justify-center flex-col sticky top-24 shadow-md dark:shadow-none">
                        {isLoading ? (
                            <div className="text-center" aria-live="polite">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
                                <p className="mt-4 text-gray-600 dark:text-gray-300 font-semibold">{loadingMessage}</p>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Video generation can take a few minutes. Please stay on this page.</p>
                            </div>
                        ) : error ? (
                             <div role="alert" className="text-center text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 p-4 rounded-md">
                                <h3 className="font-bold">Generation Failed</h3>
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : generatedVideoUrl ? (
                            <div className="w-full animate-scale-in">
                                <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-md" />
                                <div className="mt-4 text-center">
                                    <a
                                        href={generatedVideoUrl}
                                        download={`alpha-consortium-video-${lastUsedPrompt.slice(0, 20).replace(/\s/g, '_')}.mp4`}
                                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                                    >
                                        Download Video
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 select-none">
                                <VideoCameraIcon className="h-12 w-12 mx-auto" />
                                <p className="mt-2">Your generated video will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VideoGenerator;