import React, { useState, useEffect, useRef } from 'react';
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
            <Icon className="h-6 w-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="text-gray-600 dark:text-gray-300 text-sm space-y-2">
            {children}
        </div>
    </div>
);

const BarChart: React.FC<{ data: { name: string; value: number }[]; barColor: string }> = ({ data, barColor }) => {
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const chartHeight = data.length * 36; // 36px per bar

    return (
        <div className="w-full">
            <svg
                width="100%"
                height={chartHeight}
                viewBox={`0 0 300 ${chartHeight}`}
                preserveAspectRatio="xMinYMin meet"
                aria-label="Bar chart"
                role="graphics-document"
            >
                <g>
                    {data.map((d, i) => {
                        const y = i * 36;
                        const barWidth = maxValue > 0 ? (d.value / maxValue) * 200 : 0; // Bar area width is 200
                        return (
                            <g key={d.name} transform={`translate(0, ${y})`}>
                                <title id={`bar-title-${i}`}>{`${d.name}: ${d.value}`}</title>
                                <text
                                    x="0"
                                    y="16"
                                    className="text-xs font-medium fill-current text-gray-700 dark:text-gray-300"
                                    aria-labelledby={`bar-title-${i}`}
                                >
                                    {d.name}
                                </text>
                                <rect
                                    x="0"
                                    y="22"
                                    height="8"
                                    rx="4"
                                    ry="4"
                                    className="fill-current text-gray-200 dark:text-gray-700"
                                    width="300"
                                />
                                <rect
                                    x="0"
                                    y="22"
                                    height="8"
                                    rx="4"
                                    ry="4"
                                    className={`fill-current ${barColor}`}
                                    aria-labelledby={`bar-title-${i}`}
                                >
                                     <animate attributeName="width" from="0" to={barWidth + 100} dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.1 0.8 0.2 1" />
                                </rect>
                                 <text
                                    x={barWidth + 105}
                                    y="16"
                                    className="text-xs font-bold fill-current text-gray-800 dark:text-gray-200"
                                    textAnchor="start"
                                    aria-labelledby={`bar-title-${i}`}
                                >
                                    {d.value}
                                     <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0.5s" fill="freeze" />
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};


const MarketTrends: React.FC = () => {
    const [query, setQuery] = useState('');
    const [analysis, setAnalysis] = useState<MarketTrendAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastAnalyzedQuery, setLastAnalyzedQuery] = useState('');
    const resultsRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (analysis && resultsRef.current) {
            resultsRef.current.focus();
        }
    }, [analysis]);

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
                description: 'A list of the top 5-7 most in-demand skills. For each skill, provide a relative demand score from 1 to 100.',
                items: { 
                    type: Type.OBJECT,
                    properties: {
                        skill: { type: Type.STRING },
                        demandScore: { type: Type.INTEGER }
                    },
                    required: ['skill', 'demandScore']
                }
            },
            emergingTrends: {
                type: Type.STRING,
                description: 'A 2-3 sentence summary of new technologies, methodologies, or future trends affecting this field.'
            },
            geographicHotspots: {
                type: Type.ARRAY,
                description: 'A list of 3-5 cities or regions with the highest demand. For each location, provide a relative demand index from 1 to 100.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        location: { type: Type.STRING },
                        demandIndex: { type: Type.INTEGER }
                    },
                    required: ['location', 'demandIndex']
                }
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
                3.  **Key Skills in Demand:** What are the most crucial skills? For each, assign a relative "demandScore" from 1 to 100 representing its importance.
                4.  **Emerging Trends:** What new technologies or trends are shaping this field?
                5.  **Geographic Hotspots:** Which cities or regions have the highest demand? For each, assign a relative "demandIndex" from 1 to 100.

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
                    setLastAnalyzedQuery(query);
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
                    <div className="space-y-2">
                         <label htmlFor="trend-query-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Title or Industry</label>
                         <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                id="trend-query-input"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g., 'Data Scientist'"
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
                                        <ChartBarIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                        Analyze Trends
                                    </>
                                )}
                            </button>
                        </div>
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
                        <section
                            ref={resultsRef}
                            tabIndex={-1}
                            aria-labelledby="analysis-results-heading"
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-md"
                        >
                            <h2 id="analysis-results-heading" className="sr-only">
                                Market trend analysis for {lastAnalyzedQuery}
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AnalysisCard icon={TrendingUpIcon} title="Demand Outlook">
                                    <p>{analysis.demandOutlook}</p>
                                </AnalysisCard>
                                <AnalysisCard icon={CurrencyDollarIcon} title="Salary Insights">
                                    <p>{analysis.salaryInsights}</p>
                                </AnalysisCard>
                                <AnalysisCard icon={WrenchScrewdriverIcon} title="Key Skills in Demand">
                                    {analysis.keySkills && analysis.keySkills.length > 0 ? (
                                        <BarChart 
                                            data={analysis.keySkills.map(s => ({ name: s.skill, value: s.demandScore }))} 
                                            barColor="text-blue-500"
                                        />
                                    ) : (
                                        <p>No specific skills data available.</p>
                                    )}
                                </AnalysisCard>
                                <AnalysisCard icon={SparklesIcon} title="Emerging Trends">
                                    <p>{analysis.emergingTrends}</p>
                                </AnalysisCard>
                                <AnalysisCard icon={MapPinIcon} title="Geographic Hotspots">
                                    {analysis.geographicHotspots && analysis.geographicHotspots.length > 0 ? (
                                        <BarChart 
                                            data={analysis.geographicHotspots.map(h => ({ name: h.location, value: h.demandIndex }))}
                                            barColor="text-green-500"
                                        />
                                    ) : (
                                        <p>No specific location data available.</p>
                                    )}
                                </AnalysisCard>
                            </div>
                        </section>
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