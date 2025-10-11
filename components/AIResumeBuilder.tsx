import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SparklesIcon, ClipboardIcon, LightbulbIcon } from './icons/Icons';

// Declare libraries loaded via CDN in index.html to satisfy TypeScript
declare const mammoth: any;
declare const pdfjsLib: any;

type Template = 'Modern' | 'Classic' | 'Compact';

const AIResumeBuilder: React.FC = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [userExperience, setUserExperience] = useState('');
    const [generatedResume, setGeneratedResume] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [fileError, setFileError] = useState('');
    const [fileName, setFileName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<Template>('Modern');
    const fileErrorRef = useRef<HTMLParagraphElement>(null);
    const templateButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const templates: Template[] = ['Modern', 'Classic', 'Compact'];


    // Effect to move focus to the error message when it appears
    useEffect(() => {
        if (fileError && fileErrorRef.current) {
            fileErrorRef.current.focus();
        }
    }, [fileError]);

     useEffect(() => {
        templateButtonRefs.current = templateButtonRefs.current.slice(0, templates.length);
    }, [templates]);


    // Configure the PDF.js worker from CDN
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsingFile(true);
        setFileError('');
        setFileName(file.name);
        setUserExperience(''); // Clear previous text

        try {
            const extension = file.name.split('.').pop()?.toLowerCase();
            if (extension === 'pdf') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        let text = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map((item: any) => item.str).join(' ') + '\n';
                        }
                        setUserExperience(text);
                    } catch (pdfError) {
                        console.error('Error parsing PDF:', pdfError);
                        setFileError('Failed to parse the PDF file.');
                    } finally {
                        setIsParsingFile(false);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else if (extension === 'docx') {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target?.result as ArrayBuffer;
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        setUserExperience(result.value);
                    } catch (docxError) {
                        console.error('Error parsing DOCX:', docxError);
                        setFileError('Failed to parse the DOCX file.');
                    } finally {
                         setIsParsingFile(false);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                 setFileError('Unsupported file type. Please upload a .docx or .pdf file.');
                 setIsParsingFile(false);
            }
        } catch (e) {
            console.error(e);
            setFileError('An unexpected error occurred while processing the file.');
            setIsParsingFile(false);
        }
        event.target.value = ''; // Reset file input
    };

    const getTemplateInstructions = (template: Template): string => {
        switch (template) {
            case 'Classic':
                return `
                    **Formatting Style: Classic**
                    - Use traditional headings (e.g., "PROFESSIONAL SUMMARY", "KEY SKILLS").
                    - Use simple bullet points (*) for lists.
                    - Maintain a formal and conservative tone.
                    - Separate major sections with a '---' horizontal rule.
                `;
            case 'Compact':
                return `
                    **Formatting Style: Compact**
                    - Use concise headings (e.g., "Summary", "Skills").
                    - For the Key Skills section, try to create a comma-separated list to save vertical space.
                    - Keep bullet points for experience short and to the point.
                    - Minimize whitespace between sections.
                `;
            case 'Modern':
            default:
                return `
                    **Formatting Style: Modern**
                    - Use clean, simple headings (e.g., "Summary", "Key Skills").
                    - Use modern bullet points (•) for lists.
                    - Ensure there is ample whitespace for readability.
                    - The tone should be professional yet dynamic.
                `;
        }
    };

    const handleTemplateKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const activeIndex = templates.findIndex(t => t === selectedTemplate);
        if (activeIndex === -1) return;

        let nextIndex = activeIndex;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            nextIndex = (activeIndex + 1) % templates.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            nextIndex = (activeIndex - 1 + templates.length) % templates.length;
        } else {
            return;
        }

        const nextButton = templateButtonRefs.current[nextIndex];
        if (nextButton) {
            nextButton.focus();
            setSelectedTemplate(templates[nextIndex]);
        }
    };


    const handleGenerateResume = async () => {
        if (!jobDescription || !userExperience) {
            setError('Please fill in both the job description and your experience.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedResume('');
        setCopied(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const templateInstructions = getTemplateInstructions(selectedTemplate);
            
            const prompt = `
                Act as an expert resume writer and career coach.
                Your task is to create a professional, tailored resume summary, a list of key skills, and experience highlights based on the provided job description and the user's experience.
                The tone should be professional, confident, and achievement-oriented.

                **Job Description:**
                ${jobDescription}

                **User's Experience / Current Resume:**
                ${userExperience}

                **Instructions:**
                1.  **Resume Summary:** Write a powerful, 3-4 sentence summary that highlights the user's most relevant skills and experiences as they relate to the job description. Start with a strong, professional title.
                2.  **Key Skills:** Generate a list of 8-10 key skills that are most relevant to the job, drawing from both the job description and the user's experience.
                3.  **Experience Highlights:** Rewrite up to 5 bullet points from the user's experience to better align with the language and requirements of the job description. Use action verbs and quantify achievements where possible. If the user provided a full resume, focus on the most recent or relevant role. If they just provided notes, turn them into professional bullet points.
                
                **Formatting:**
                Format the entire output according to the following style guide. DO NOT include the style guide name (e.g., "Formatting Style: Modern") in the output.
                ${templateInstructions}
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const text = response.text;

            if (text) {
                setGeneratedResume(text);
            } else {
                setError('The AI could not generate a resume. Please try again.');
            }
        } catch (e: any) {
            console.error(e);
            setError('An error occurred while generating the resume. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!generatedResume) return;
        navigator.clipboard.writeText(generatedResume);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Resume Builder</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Craft a resume that stands out. Tailor your experience to any job description in seconds.</p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                1. Paste Job Description
                            </label>
                            <textarea
                                id="job-description"
                                rows={8}
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
                                    {fileError && (
                                        <p
                                            ref={fileErrorRef}
                                            className="text-red-500 dark:text-red-400"
                                            tabIndex={-1}
                                            role="alert"
                                        >
                                            {fileError}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <textarea
                                id="user-experience"
                                rows={8}
                                className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="...or paste your relevant experience here."
                                value={userExperience}
                                onChange={(e) => setUserExperience(e.target.value)}
                                disabled={isLoading || isParsingFile}
                            />
                        </div>
                         <div>
                            <label id="template-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                3. Select a Template
                            </label>
                            <div
                                role="radiogroup"
                                aria-labelledby="template-label"
                                onKeyDown={handleTemplateKeyDown}
                                className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-900/50 p-1 border-2 border-gray-300 dark:border-gray-700"
                            >
                                {templates.map((template, index) => (
                                    <button
                                        key={template}
                                        ref={el => { templateButtonRefs.current[index] = el; }}
                                        role="radio"
                                        aria-checked={selectedTemplate === template}
                                        tabIndex={selectedTemplate === template ? 0 : -1}
                                        onClick={() => setSelectedTemplate(template)}
                                        disabled={isLoading || isParsingFile}
                                        className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 ${
                                            selectedTemplate === template
                                                ? 'bg-blue-600 text-white shadow'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                                        }`}
                                    >
                                        {template}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 sticky top-24 shadow-md dark:shadow-none">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <SparklesIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                Generated Resume Suggestions
                            </h3>
                             {generatedResume && !isLoading && (
                                <button
                                    onClick={handleCopy}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors duration-300"
                                >
                                    <ClipboardIcon className="h-5 w-5" />
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            )}
                        </div>
                        <div className="mt-4 h-[27rem] overflow-y-auto bg-gray-100 dark:bg-gray-900/50 rounded-lg p-1" aria-live="polite">
                             {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
                                </div>
                            ) : generatedResume ? (
                                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans p-6 bg-white dark:bg-gray-900 rounded-md shadow-inner">{generatedResume}</pre>
                            ) : (
                                <div className="flex items-center justify-center h-full select-none">
                                    <p className="text-gray-400 dark:text-gray-500 text-center">Your AI-tailored resume content will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                 <div className="mt-12 max-w-4xl mx-auto space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">Tips for Best Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-blue-500/10 shadow-sm dark:shadow-none">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Good Job Description Example:</h4>
                            <pre className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans text-xs">
                                {`Seeking a Digital Marketing Manager with 5+ years of experience in SEO, PPC, and content strategy. Responsibilities include leading our digital campaigns, optimizing our website for conversions, and analyzing performance metrics using Google Analytics. Strong analytical skills and experience with HubSpot are required.`}
                            </pre>
                        </div>
                        <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-4 rounded-lg border border-gray-200 dark:border-blue-500/10 shadow-sm dark:shadow-none">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Good Experience Example:</h4>
                            <pre className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans text-xs">
                                {`- Managed a $50k/month PPC budget across Google Ads and Facebook, increasing lead generation by 35% YoY.\n- Grew organic site traffic by 150% in 18 months through a comprehensive SEO and content strategy.\n- Utilized HubSpot and Google Analytics to deliver monthly performance reports to stakeholders.`}
                            </pre>
                        </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 backdrop-blur-sm p-4 rounded-lg border border-blue-200 dark:border-blue-500/20 flex items-start gap-3">
                        <LightbulbIcon className="h-6 w-6 text-blue-500 dark:text-blue-300 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200">Pro Tip:</h4>
                            <p className="text-blue-700 dark:text-blue-300/90 text-sm">The more detail you provide, the better the AI's suggestions will be. Include specific achievements and quantify your results with numbers (e.g., "Increased sales by 20%") for the strongest impact.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={handleGenerateResume}
                        disabled={isLoading || isParsingFile || !jobDescription || !userExperience}
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
                        ) : (
                             <>
                                <SparklesIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                Generate Resume
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