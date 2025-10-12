import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SparklesIcon, ClipboardIcon, LightbulbIcon, EnvelopeIcon, VideoCameraIcon, XMarkIcon } from './icons/Icons';
import { parseFile } from '../utils/fileParser';
import { AIResumeData } from '../types';

type Template = 'Modern' | 'Classic' | 'Compact';
type Tone = 'Professional' | 'Creative' | 'Bold';
type ActiveTool = 'resume' | 'coverLetter' | 'videoPitch';

const videoLoadingMessages = [
    "Initializing video generation...",
    "Analyzing your prompt and image...",
    "Storyboarding the scene...",
    "Rendering initial frames (this can take a moment)...",
    "Adding details and motion...",
    "Finalizing the video stream...",
    "Almost there, preparing your video..."
];


const ResumePreview: React.FC<{
    data: AIResumeData;
    template: Template;
    onRegenerateSkills: () => void;
    isRegeneratingSkills: boolean;
}> = ({ data, template, onRegenerateSkills, isRegeneratingSkills }) => {
    // Define base styles (which are the 'Modern' styles)
    const baseClasses = {
        container: 'p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-md shadow-inner font-sans text-sm',
        headline: 'text-center text-xl sm:text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100',
        sectionTitle: 'text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200',
        hr: 'my-4 border-t border-gray-200 dark:border-gray-700',
        ul: 'list-disc list-inside space-y-1 pl-2',
        li: 'text-gray-600 dark:text-gray-400',
        p: 'text-gray-600 dark:text-gray-400'
    };

    // Define overrides for other templates
    const templateStyles: Record<Template, Partial<typeof baseClasses>> = {
        Modern: {},
        Classic: {
            headline: 'text-center text-lg sm:text-xl font-bold tracking-wider uppercase mb-2 text-gray-800 dark:text-gray-200',
            sectionTitle: 'text-xs sm:text-sm font-bold tracking-widest uppercase mb-2 text-gray-700 dark:text-gray-300 border-b-2 pb-1 border-gray-300 dark:border-gray-600',
            hr: 'my-3 border-t border-gray-300 dark:border-gray-600',
        },
        Compact: {
            headline: 'text-center text-lg sm:text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100',
            sectionTitle: 'text-base sm:text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200',
            hr: 'my-2 border-t border-gray-200 dark:border-gray-700',
            ul: 'list-disc list-inside space-y-0.5 pl-2', // Keep list styles, just reduce spacing
        }
    };

    // Combine base styles with template-specific overrides
    const templateClasses = { ...baseClasses, ...templateStyles[template] };


    return (
        <div className={templateClasses.container}>
            <h2 className={templateClasses.headline}>{data.headline}</h2>
            <hr className={templateClasses.hr} />
            
            <section>
                <h3 className={templateClasses.sectionTitle}>Summary</h3>
                <p className={templateClasses.p}>{data.summary}</p>
            </section>
            
            <section>
                <div className="flex justify-between items-center mt-4 mb-2">
                    <h3 className={templateClasses.sectionTitle}>Key Skills</h3>
                    <button
                        type="button"
                        onClick={onRegenerateSkills}
                        disabled={isRegeneratingSkills}
                        className="p-1 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:text-gray-400 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                        aria-label="Regenerate key skills with AI"
                    >
                        {isRegeneratingSkills ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <SparklesIcon className="h-4 w-4" />
                        )}
                    </button>
                </div>
                <ul className={templateClasses.ul}>
                    {data.keySkills.map((skill, i) => <li key={i} className={templateClasses.li}>{skill}</li>)}
                </ul>
            </section>
            
            <section>
                <h3 className={`${templateClasses.sectionTitle} mt-4 mb-2`}>Experience Highlights</h3>
                 <ul className={templateClasses.ul}>
                    {data.experienceHighlights.map((highlight, i) => <li key={i} className={templateClasses.li}>{highlight}</li>)}
                </ul>
            </section>
        </div>
    );
};

const CoverLetterPreview: React.FC<{ text: string }> = ({ text }) => (
    <div className="p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-md shadow-inner font-sans text-sm">
        <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
            {text}
        </pre>
    </div>
);

const AIResumeBuilder: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [userExperience, setUserExperience] = useState('');
    const [keyAchievements, setKeyAchievements] = useState('');
    const [error, setError] = useState('');
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [fileError, setFileError] = useState('');
    const [fileName, setFileName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<Template>('Modern');
    const [selectedTone, setSelectedTone] = useState<Tone>('Professional');
    const [activeTool, setActiveTool] = useState<ActiveTool>('resume');

    // Resume-specific state
    const [generatedResume, setGeneratedResume] = useState<AIResumeData | null>(null);
    const [isLoadingResume, setIsLoadingResume] = useState(false);
    const [isRegeneratingSkills, setIsRegeneratingSkills] = useState(false);
    const [resumeCopied, setResumeCopied] = useState(false);

    // Cover letter-specific state
    const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
    const [isLoadingCoverLetter, setIsLoadingCoverLetter] = useState(false);
    const [coverLetterCopied, setCoverLetterCopied] = useState(false);
    
    // Video-specific state
    const [videoPrompt, setVideoPrompt] = useState('');
    const [videoImage, setVideoImage] = useState<{ base64: string; mimeType: string; name: string; } | null>(null);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [videoLoadingMessage, setVideoLoadingMessage] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [videoError, setVideoError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoFileInputRef = useRef<HTMLInputElement>(null);
    const jobDescriptionRef = useRef<HTMLTextAreaElement>(null);

    const templates: Template[] = ['Modern', 'Classic', 'Compact'];
    const tones: Tone[] = ['Professional', 'Creative', 'Bold'];
    
    useEffect(() => {
        if (fileError && fileInputRef.current) {
            fileInputRef.current.focus();
        }
    }, [fileError]);

    useEffect(() => {
        jobDescriptionRef.current?.focus();
    }, []);
    
     const handleMainAction = () => {
        switch (activeTool) {
            case 'resume':
                handleGenerateResume();
                break;
            case 'coverLetter':
                handleGenerateCoverLetter();
                break;
            case 'videoPitch':
                handleGenerateVideoPitch();
                break;
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsingFile(true);
        setFileError('');
        setFileName(file.name);
        setUserExperience('');

        try {
            const text = await parseFile(file);
            setUserExperience(text);
        } catch (err: any) {
            setFileError(err);
        } finally {
            setIsParsingFile(false);
        }
        event.target.value = '';
    };

    const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setVideoError('Please upload a valid image file (JPEG, PNG, WEBP).');
            return;
        }
        
        setVideoError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            setVideoImage({ base64, mimeType: file.type, name: file.name });
        };
        reader.onerror = () => setVideoError('Failed to read the image file.');
        reader.readAsDataURL(file);
    };

    const removeVideoImage = () => {
        setVideoImage(null);
        if (videoFileInputRef.current) {
            videoFileInputRef.current.value = '';
        }
    };

    const resumeSchema = {
      type: Type.OBJECT,
      properties: {
        headline: {
          type: Type.STRING,
          description: 'A compelling professional headline or title for the resume (e.g., "Senior Product Manager | Agile & SaaS Expert").'
        },
        summary: {
          type: Type.STRING,
          description: 'A powerful, 3-4 sentence professional summary tailored to the job.'
        },
        keySkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'A list of 8-10 of the most relevant key skills.'
        },
        experienceHighlights: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Up to 5 rewritten, achievement-oriented bullet points from the user\'s experience.'
        },
      },
      required: ['headline', 'summary', 'keySkills', 'experienceHighlights']
    };

    const handleGenerateResume = async () => {
        if (!jobDescription || !userExperience) {
            setError('Please fill in both the job description and your experience.');
            return;
        }
        setIsLoadingResume(true);
        setError('');
        setGeneratedResume(null);
        setResumeCopied(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const prompt = `
                Act as a top-tier executive resume writer from a Fortune 500 company.
                Your task is to create professional, tailored resume content based on the provided job description and user's experience.
                The final output must be in a JSON format that adheres to the provided schema.

                **Tone to adopt:** ${selectedTone}
                - Professional: Formal, corporate, and achievement-oriented.
                - Creative: More expressive, using dynamic language, suitable for marketing or design roles.
                - Bold: Confident, direct, and impactful, using strong action verbs.

                **Job Description:**
                ${jobDescription}

                **User's Experience / Current Resume:**
                ${userExperience}
                
                ${keyAchievements ? `**User's Key Achievements (Incorporate these prominently):**\n${keyAchievements}` : ''}

                **Instructions:**
                1.  **Headline:** Create a compelling professional headline that summarizes the candidate's expertise.
                2.  **Summary:** Write a powerful summary that highlights the user's most relevant skills and experiences as they relate to the job description, weaving in key achievements.
                3.  **Key Skills:** Generate a list of 8-10 key skills most relevant to the job.
                4.  **Experience Highlights:** Rewrite up to 5 bullet points from the user's experience to align with the job description. Use the specified tone, incorporate achievements, and quantify results where possible.
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: resumeSchema,
                }
            });
            
            const text = response.text.trim();

            if (text) {
                const parsedJson = JSON.parse(text);
                setGeneratedResume(parsedJson);
            } else {
                setError('The AI could not generate a resume. Please try again.');
            }
        } catch (e: any) {
            console.error(e);
            setError('An error occurred while generating the resume. Please check your API key and try again.');
        } finally {
            setIsLoadingResume(false);
        }
    };
    
    const handleGenerateCoverLetter = async () => {
        if (!jobDescription || !userExperience) {
            setError('Please fill in both the job description and your experience.');
            return;
        }
        setIsLoadingCoverLetter(true);
        setError('');
        setGeneratedCoverLetter(null);
        setCoverLetterCopied(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a world-class professional resume writer and career coach. Your task is to write a compelling and professional cover letter.

                **Tone to adopt:** ${selectedTone}
                - Professional: Formal, corporate, and achievement-oriented.
                - Creative: More expressive, using dynamic language, suitable for marketing or design roles.
                - Bold: Confident, direct, and impactful, using strong action verbs.

                **Job Description:**
                ${jobDescription}

                **Candidate's Resume/Experience:**
                ${userExperience}

                ${keyAchievements ? `**Candidate's Key Achievements (Incorporate these prominently):**\n${keyAchievements}` : ''}

                **Instructions:**
                Write a concise but powerful cover letter based on the provided information. The letter should:
                1.  Have a strong opening that clearly states the role being applied for and captures the reader's interest.
                2.  Connect the candidate's most relevant skills and experiences directly to the key requirements listed in the job description. Quantify achievements where possible.
                3.  Convey enthusiasm for the role and the company.
                4.  End with a confident closing and a clear call to action (e.g., expressing eagerness for an interview).

                **IMPORTANT:**
                - Do NOT use placeholders like "[Your Name]", "[Your Address]", "[Hiring Manager Name]", or "[Company Name]". The user will fill these in themselves.
                - The output should be only the body of the cover letter, starting from "Dear Hiring Manager," to the closing "Sincerely,".
                - Ensure the final text is well-formatted and ready to be copied and pasted.
            `;
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setGeneratedCoverLetter(response.text);
        } catch (e: any) {
            console.error(e);
            setError('An error occurred while generating the cover letter. Please try again.');
        } finally {
            setIsLoadingCoverLetter(false);
        }
    };

    const handleGenerateVideoPitch = async () => {
        if (!videoPrompt) {
            setVideoError('Please enter a prompt to generate a video.');
            return;
        }

        setIsLoadingVideo(true);
        setVideoError('');
        setGeneratedVideoUrl(null);

        let messageIndex = 0;
        setVideoLoadingMessage(videoLoadingMessages[messageIndex]);
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % videoLoadingMessages.length;
            setVideoLoadingMessage(videoLoadingMessages[messageIndex]);
        }, 8000);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const requestPayload: any = {
                model: 'veo-2.0-generate-001',
                prompt: videoPrompt,
                config: { numberOfVideos: 1 }
            };

            if (videoImage) {
                requestPayload.image = {
                    imageBytes: videoImage.base64,
                    mimeType: videoImage.mimeType
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
            setVideoError(`An error occurred during video generation: ${e.message}. Please try again.`);
        } finally {
            setIsLoadingVideo(false);
            clearInterval(messageInterval);
        }
    };
    
    const handleRegenerateSkills = async () => {
        if (!jobDescription || !userExperience) {
            setError('Job description and experience are required to generate skills.');
            return;
        }
        setIsRegeneratingSkills(true);
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const skillsSchema = {
                type: Type.OBJECT,
                properties: {
                    keySkills: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'A list of 8-10 of the most relevant key skills.'
                    }
                },
                required: ['keySkills']
            };
            const prompt = `
                Act as a professional resume writer. Based on the following job description and user's experience, identify and list the 8-10 most relevant and impactful key skills.

                **Job Description:**
                ${jobDescription}

                **User's Experience / Current Resume:**
                ${userExperience}

                Return only a JSON object containing the key "keySkills" with an array of strings.
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: skillsSchema,
                }
            });
            
            const text = response.text.trim();
            if (text) {
                const parsedJson = JSON.parse(text);
                if (parsedJson.keySkills && generatedResume) {
                    setGeneratedResume(prev => prev ? { ...prev, keySkills: parsedJson.keySkills } : null);
                } else {
                    throw new Error("AI response did not contain keySkills.");
                }
            } else {
                throw new Error("AI returned an empty response.");
            }
        } catch (e: any) {
            console.error(e);
            setError('An error occurred while regenerating skills. Please try again.');
        } finally {
            setIsRegeneratingSkills(false);
        }
    };

    const handleCopyResume = () => {
        if (!generatedResume) return;
        const { headline, summary, keySkills, experienceHighlights } = generatedResume;
        const textToCopy = `
${headline}

**Summary**
${summary}

**Key Skills**
${keySkills.map(s => `• ${s}`).join('\n')}

**Experience Highlights**
${experienceHighlights.map(h => `• ${h}`).join('\n')}
        `.trim();
        navigator.clipboard.writeText(textToCopy);
        setResumeCopied(true);
        setTimeout(() => setResumeCopied(false), 2000);
    };

    const handleCopyCoverLetter = () => {
        if (!generatedCoverLetter) return;
        navigator.clipboard.writeText(generatedCoverLetter);
        setCoverLetterCopied(true);
        setTimeout(() => setCoverLetterCopied(false), 2000);
    };

    const isLoading = isLoadingResume || isLoadingCoverLetter || isLoadingVideo;

    const RadioButtonGroup = ({ label, items, selectedItem, onSelect, disabled }: {label: string, items: string[], selectedItem: string, onSelect: (item: string) => void, disabled: boolean}) => (
        <div>
            <label className={`block text-sm font-medium mb-2 ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                {label}
            </label>
            <div
                role="radiogroup"
                className={`flex space-x-2 rounded-lg p-1 border-2 ${disabled ? 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700' : 'bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700'}`}
            >
                {items.map((item) => (
                    <button
                        key={item}
                        role="radio"
                        aria-checked={selectedItem === item}
                        tabIndex={selectedItem === item ? 0 : -1}
                        onClick={() => onSelect(item)}
                        disabled={disabled}
                        className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 ${
                            selectedItem === item
                                ? 'bg-blue-600 text-white shadow'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                        } ${disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent' : ''}`}
                    >
                        {item}
                    </button>
                ))}
            </div>
        </div>
    );
    
    const renderActiveToolInputs = () => {
        if (activeTool === 'videoPitch') {
            return (
                 <div className="space-y-6">
                    <div>
                        <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            1. Describe your video pitch
                        </label>
                        <textarea
                            id="video-prompt"
                            rows={6}
                            className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., A 3D animation of my professional logo, with sparkling particle effects"
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            2. Add a starting image (Optional)
                        </span>
                         <input
                            type="file"
                            ref={videoFileInputRef}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleVideoFileChange}
                            disabled={isLoading}
                        />
                        {videoImage ? (
                            <div className="mt-2 relative">
                                <img src={`data:${videoImage.mimeType};base64,${videoImage.base64}`} alt="Preview" className="rounded-lg w-full max-h-40 object-cover border border-gray-300 dark:border-gray-600" />
                                 <button onClick={removeVideoImage} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/75" aria-label="Remove image">
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => videoFileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                disabled={isLoading}
                            >
                                Click to upload image
                            </button>
                        )}
                        {videoError && <p className="text-red-500 text-sm mt-2">{videoError}</p>}
                    </div>
                </div>
            );
        }

        // Resume and Cover Letter Inputs
        return (
            <div className="space-y-6">
                <div>
                    <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        1. Paste Job Description
                    </label>
                    <textarea
                        id="job-description"
                        ref={jobDescriptionRef}
                        rows={6}
                        className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Paste the full job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        disabled={isLoading || isParsingFile}
                    />
                </div>
                <div>
                     <label htmlFor="user-experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        2. Upload or Paste Your Experience
                    </label>
                    <div className="flex flex-col items-start mb-2">
                        <input
                            type="file"
                            id="resume-upload"
                            className="hidden"
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                            disabled={isLoading || isParsingFile}
                            aria-describedby="file-upload-status"
                        />
                        <label
                            htmlFor="resume-upload"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-400 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-900"
                        >
                            {isParsingFile ? 'Processing...' : 'Upload .docx or .pdf'}
                        </label>
                        <div id="file-upload-status" className="mt-2 text-sm" aria-live="polite">
                            {fileName && !isParsingFile && !fileError && <p className="text-gray-500 dark:text-gray-400">File selected: {fileName}</p>}
                            {fileError && <p ref={fileInputRef} className="text-red-500 dark:text-red-400" tabIndex={-1} role="alert">{fileError}</p>}
                        </div>
                    </div>
                    <textarea
                        id="user-experience"
                        rows={6}
                        className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="...or paste your relevant experience here."
                        value={userExperience}
                        onChange={(e) => setUserExperience(e.target.value)}
                        disabled={isLoading || isParsingFile}
                    />
                </div>
                 <div>
                     <label htmlFor="key-achievements" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        3. List Key Achievements (Optional)
                    </label>
                    <textarea
                        id="key-achievements"
                        rows={4}
                        className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., Increased sales by 30% in Q4 2023..."
                        value={keyAchievements}
                        onChange={(e) => setKeyAchievements(e.target.value)}
                        disabled={isLoading || isParsingFile}
                    />
                </div>
                <RadioButtonGroup label="4. Select a Tone" items={tones} selectedItem={selectedTone} onSelect={(item) => setSelectedTone(item as Tone)} disabled={isLoading || isParsingFile} />
                <RadioButtonGroup label="5. Select a Resume Template" items={templates} selectedItem={selectedTemplate} onSelect={(item) => setSelectedTemplate(item as Template)} disabled={isLoading || isParsingFile || activeTool !== 'resume'} />
            </div>
        );
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Application Assistant</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Craft a resume, cover letter, or video pitch that stands out. Tailor your application in seconds.</p>
                </div>

                <div className="mt-8 border-b border-gray-300 dark:border-gray-700 flex justify-center">
                    <div role="tablist" className="flex space-x-1">
                         <button
                            role="tab"
                            aria-selected={activeTool === 'resume'}
                            onClick={() => setActiveTool('resume')}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 ${
                                activeTool === 'resume'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            Resume Builder
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTool === 'coverLetter'}
                            onClick={() => setActiveTool('coverLetter')}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 ${
                                activeTool === 'coverLetter'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            Cover Letter Writer
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTool === 'videoPitch'}
                            onClick={() => setActiveTool('videoPitch')}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10 ${
                                activeTool === 'videoPitch'
                                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            Video Pitch
                        </button>
                    </div>
                </div>


                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {renderActiveToolInputs()}

                    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 sticky top-24 shadow-md dark:shadow-none">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {activeTool === 'resume' && <SparklesIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
                                {activeTool === 'coverLetter' && <EnvelopeIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
                                {activeTool === 'videoPitch' && <VideoCameraIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
                                Generated Preview
                            </h3>
                             {activeTool === 'resume' && generatedResume && !isLoading && (
                                <button onClick={handleCopyResume} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500">
                                    <ClipboardIcon className="h-5 w-5" /> {resumeCopied ? 'Copied!' : 'Copy Text'}
                                </button>
                            )}
                            {activeTool === 'coverLetter' && generatedCoverLetter && !isLoading && (
                                <button onClick={handleCopyCoverLetter} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500">
                                    <ClipboardIcon className="h-5 w-5" /> {coverLetterCopied ? 'Copied!' : 'Copy Text'}
                                </button>
                            )}
                        </div>
                        <div className="mt-4 aspect-video overflow-y-auto bg-gray-100 dark:bg-gray-900/50 rounded-lg p-1 flex items-center justify-center" aria-live="polite">
                             {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
                                    {activeTool === 'videoPitch' && <p className="mt-4 text-gray-600 dark:text-gray-300 font-semibold">{videoLoadingMessage}</p>}
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-full p-4">
                                    <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
                                </div>
                            ) : videoError ? (
                                <div className="flex items-center justify-center h-full p-4">
                                    <p className="text-red-500 dark:text-red-400 text-center">{videoError}</p>
                                </div>
                            ) : activeTool === 'resume' ? (
                                generatedResume ? (
                                    <ResumePreview 
                                        data={generatedResume} 
                                        template={selectedTemplate} 
                                        onRegenerateSkills={handleRegenerateSkills}
                                        isRegeneratingSkills={isRegeneratingSkills}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full select-none p-4">
                                        <p className="text-gray-400 dark:text-gray-500 text-center">Your AI-tailored resume content will appear here.</p>
                                    </div>
                                )
                            ) : activeTool === 'coverLetter' ? (
                                generatedCoverLetter ? (
                                    <CoverLetterPreview text={generatedCoverLetter} />
                                ) : (
                                    <div className="flex items-center justify-center h-full select-none p-4">
                                        <p className="text-gray-400 dark:text-gray-500 text-center">Your AI-generated cover letter will appear here.</p>
                                    </div>
                                )
                            ) : ( // Video View
                                generatedVideoUrl ? (
                                     <div className="w-full animate-scale-in">
                                        <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-md" />
                                        <div className="mt-4 text-center">
                                            <a
                                                href={generatedVideoUrl}
                                                download={`alpha-video-pitch.mp4`}
                                                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                                            >
                                                Download Video
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full select-none p-4">
                                        <VideoCameraIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                                        <p className="text-gray-400 dark:text-gray-500 text-center mt-2">Your AI-generated video pitch will appear here.</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12 max-w-4xl mx-auto space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 backdrop-blur-sm p-4 rounded-lg border border-blue-200 dark:border-blue-500/20 flex items-start gap-3">
                        <LightbulbIcon className="h-6 w-6 text-blue-500 dark:text-blue-300 flex-shrink-0 mt-1" aria-hidden="true" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">Pro Tip:</h4>
                            <p className="text-blue-700 dark:text-blue-300/90 text-sm">
                                {activeTool === 'videoPitch' 
                                    ? "Be descriptive in your video prompt! Mention style (e.g., 'cinematic', 'minimalist'), colors, and action to guide the AI. Video generation can take a few minutes."
                                    : "The more detail you provide, the better the AI's suggestions will be. Use the 'Key Achievements' section to highlight your best work and quantify your results with numbers (e.g., 'Increased sales by 20%') for the strongest impact."
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={handleMainAction}
                        disabled={isLoading || isParsingFile || (activeTool !== 'videoPitch' && (!jobDescription || !userExperience)) || (activeTool === 'videoPitch' && !videoPrompt)}
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : activeTool === 'resume' ? (
                             <>
                                <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                Generate Resume
                            </>
                        ) : activeTool === 'coverLetter' ? (
                            <>
                                <EnvelopeIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                Generate Cover Letter
                            </>
                        ) : (
                             <>
                                <VideoCameraIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                Generate Video Pitch
                            </>
                        )}
                    </button>
                </div>
                 {error && !isLoading && (
                    <div role="alert" className="mt-4 max-w-2xl mx-auto text-center text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 p-3 rounded-md">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIResumeBuilder;