

import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { MarketTrendAnalysis } from '../types';
import { ChartBarIcon, TrendingUpIcon, CurrencyDollarIcon, WrenchScrewdriverIcon, SparklesIcon, MapPinIcon } from './icons/Icons';

const AnalysisCard: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
}> = ({ icon: Icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3 mb-3">
            <Icon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
            {children}
        </div>
    </div>
);

const MarketTrends: React.FC = () => {
    const [query, setQuery] = useState('');
    const [analysis, setAnalysis] = useState<MarketTrendAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const analysisSchema = {
        type: Type.OBJECT,
        properties: {
            demandOutlook: {
                type: Type.STRING,
                description: 'A brief, 2-3 sentence summary of the current job market demand for this role or industry. Mention if it\'s growing, stable, or declining.'
            },
            salaryInsights: {
                type: Type.STRING,
                description: 'A 2-3 sentence overview of the typical salary range (e.g., entry-level, senior). Provide a general range in USD, like "$60,000 - $90,000".'
            },
            keySkills: {
                type: Type.ARRAY,
                description: 'A list of the top 5-7 most in-demand hard and soft skills for this role.',
                items: { type: Type.STRING }
            },
            emergingTrends: {
                type: Type.STRING,
                description: 'A 2-3 sentence summary of new technologies, methodologies, or future trends affecting this field.'
            },
            geographicHotspots: {
                type: Type.ARRAY,
                description: 'A list of 3-5 cities or regions where demand for this role is highest.',
                items: { type: Type.STRING }
            }
        },
        required: ['demandOutlook', 'salaryInsights', 'keySkills', 'emergingTrends', 'geographicHotspots']
    };

    const handleAnalyze = async () => {
        if (!query) {
            setError('Please enter a job title or industry.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a senior market research analyst for the recruitment industry.
                Your task is to provide a comprehensive market trend analysis for the following job title or industry: "${query}".

                Provide insights on the following five key areas:
                1.  **Demand Outlook:** Is the demand for this role growing, stable, or declining?
                2.  **Salary Insights:** What are the typical salary ranges for entry-level and senior positions in the US?
                3.  **Key Skills in Demand:** What are the most crucial technical and soft skills required?
                4.  **Emerging Trends:** What new technologies or trends are shaping this field?
                5.  **Geographic Hotspots:** Which cities or regions have the highest concentration of job openings for this role?

                Please provide concise, data-driven summaries for each area. The analysis should be based on current market data.
                Return the entire analysis as a single JSON object matching the provided schema.
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: analysisSchema,
                }
            });

            const text = response.text.trim();
            if (text) {
                try {
                    const parsedJson = JSON.parse(text);
                    setAnalysis(parsedJson);
                } catch (jsonError) {
                    console.error("Failed to parse JSON response:", jsonError);
                    setError("Received an invalid analysis format from the server. Please try again.");
                }
            } else {
                setError('The AI could not generate an analysis. The response was empty.');
            }

        } catch (e: any) {
            console.error(e);
            setError('An error occurred while fetching market trends. Please check your API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">Real-Time Market Trend Analysis</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Get AI-powered insights into job demand, salaries, and required skills for any industry.</p>
                </div>

                <div className="mt-12 max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-4">
                         <label htmlFor="trend-query-input" className="sr-only">Job Title or Industry</label>
                         <input
                            id="trend-query-input"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter a Job Title or Industry (e.g., 'Data Scientist')"
                            className="w-full bg-white dark:bg-gray-900/50 border-2 border-gray-300 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            disabled={isLoading}
                         />
                         <button
                            onClick={handleAnalyze}
                            disabled={isLoading || !query}
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                         >
                             {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                 <>
                                    <ChartBarIcon className="h-5 w-5 mr-2" />
                                    Analyze Trends
                                </>
                            )}
                         </button>
                    </div>
                </div>
                
                <div className="mt-16" aria-live="polite">
                    {isLoading ? (
                         <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
                        </div>
                    ) : error ? (
                        <div role="alert" className="mt-4 max-w-2xl mx-auto text-center text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 p-4 rounded-md">
                            <h3 className="font-bold">Analysis Failed</h3>
                            <p>{error}</p>
                        </div>
                    ) : analysis ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AnalysisCard icon={TrendingUpIcon} title="Demand Outlook">
                                <p>{analysis.demandOutlook}</p>
                            </AnalysisCard>
                             <AnalysisCard icon={CurrencyDollarIcon} title="Salary Insights">
                                <p>{analysis.salaryInsights}</p>
                            </AnalysisCard>
                             <AnalysisCard icon={WrenchScrewdriverIcon} title="Key Skills in Demand">
                                <ul className="list-disc list-inside space-y-1">
                                    {analysis.keySkills.map((skill, index) => <li key={index}>{skill}</li>)}
                                </ul>
                            </AnalysisCard>
                             <AnalysisCard icon={SparklesIcon} title="Emerging Trends">
                                <p>{analysis.emergingTrends}</p>
                            </AnalysisCard>
                             <AnalysisCard icon={MapPinIcon} title="Geographic Hotspots">
                                 <ul className="list-disc list-inside space-y-1">
                                    {analysis.geographicHotspots.map((spot, index) => <li key={index}>{spot}</li>)}
                                </ul>
                            </AnalysisCard>
                        </div>
                    ) : (
                         <div className="text-center text-gray-500 dark:text-gray-400 pt-8">
                            <p>Enter a job title or industry above to see your analysis.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MarketTrends;