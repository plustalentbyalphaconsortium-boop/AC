import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MarketTrendAnalysis, GroundingChunk } from '../types';
import { ChartBarIcon, TrendingUpIcon, CurrencyDollarIcon, WrenchScrewdriverIcon, SparklesIcon, MapPinIcon } from './icons/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg z-10">
        <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-blue-600 dark:text-blue-400 font-semibold">
            Score: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const TrendBarChart: React.FC<{ data: { name: string; value: number }[]; color: string }> = ({ data, color }) => {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 500 }} 
                        interval={0}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1000}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

const SalaryChart: React.FC<{ data: { name: string; value: number }[]; currency: string }> = ({ data, currency }) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, maximumSignificantDigits: 3 }).format(value);
    };

    return (
        <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis 
                        tickFormatter={(value) => formatCurrency(value)} 
                        tick={{ fill: '#6B7280', fontSize: 11 }} 
                        axisLine={false} 
                        tickLine={false}
                        width={60}
                    />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        formatter={(value: number) => [formatCurrency(value), 'Average Salary']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#1f2937' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1500}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#60a5fa' : index === 1 ? '#3b82f6' : '#1d4ed8'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const MarketTrends: React.FC = () => {
    const [query, setQuery] = useState('');
    const [analysis, setAnalysis] = useState<MarketTrendAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastAnalyzedQuery, setLastAnalyzedQuery] = useState('');
    const [sources, setSources] = useState<GroundingChunk[] | null>(null);
    const resultsRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (analysis && resultsRef.current) {
            resultsRef.current.focus();
        }
    }, [analysis]);

    const handleAnalyze = async () => {
        if (!query) {
            setError('Please enter a job title or industry.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis(null);
        setSources(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
                Act as a senior market research analyst for the recruitment industry.
                Your task is to provide a comprehensive market trend analysis for the following job title or industry: "${query}".
                Use Google Search to find the most up-to-date, real-world data.

                Provide insights on the following five key areas:
                1.  **Demand Outlook:** Is the demand for this role growing, stable, or declining?
                2.  **Salary Insights:** What are the typical annual salaries for Entry-Level, Mid-Level, and Senior-Level positions in the US (or relevant global market)? Provide a general range text summary, AND specific estimated averages for the data structure.
                3.  **Key Skills in Demand:** What are the top 5-7 most crucial skills? For each, assign a relative "demandScore" from 1 to 100 representing its importance.
                4.  **Emerging Trends:** What new technologies or trends are shaping this field?
                5.  **Geographic Hotspots:** Which 3-5 cities or regions have the highest demand? For each, assign a relative "demandIndex" from 1 to 100.

                Please provide concise, data-driven summaries for each area. The analysis should be based on current market data.
                Return the entire analysis as a single, valid JSON object in your text response. The JSON object must conform to this structure:
                {
                  "demandOutlook": "string",
                  "salaryInsights": "string",
                  "salaryData": { "entryLevel": number, "midLevel": number, "seniorLevel": number, "currency": "string" },
                  "keySkills": [{ "skill": "string", "demandScore": number }],
                  "emergingTrends": "string",
                  "geographicHotspots": [{ "location": "string", "demandIndex": number }]
                }
                Do not include any other text or markdown formatting outside of the JSON object.
            `;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{googleSearch: {}}],
                }
            });
            
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingMetadata) {
                setSources(groundingMetadata as GroundingChunk[]);
            }

            const text = response.text.trim();
            // The model might wrap the JSON in markdown backticks, so we clean it up.
            const cleanedText = text.replace(/^```json\s*|```$/g, '');

            if (cleanedText) {
                try {
                    const parsedJson = JSON.parse(cleanedText);
                    setAnalysis(parsedJson);
                    setLastAnalyzedQuery(query);
                } catch (jsonError) {
                    console.error("Failed to parse JSON response:", jsonError);
                    console.error("Raw response text:", text);
                    setError("Received an invalid analysis format from the server. The AI may have provided a conversational response instead of data. Please try again with a more specific query.");
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
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Get AI-powered insights into job demand, salaries, and required skills, grounded in real-time data from Google Search.</p>
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
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
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
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-md animate-scale-in"
                        >
                            <h2 id="analysis-results-heading" className="sr-only">
                                Market trend analysis for {lastAnalyzedQuery}
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <AnalysisCard icon={TrendingUpIcon} title="Demand Outlook">
                                    <p>{analysis.demandOutlook}</p>
                                </AnalysisCard>
                                <AnalysisCard icon={CurrencyDollarIcon} title="Salary Insights">
                                    <p className="mb-4">{analysis.salaryInsights}</p>
                                    {analysis.salaryData && (
                                        <SalaryChart 
                                            data={[
                                                { name: 'Entry', value: analysis.salaryData.entryLevel },
                                                { name: 'Mid', value: analysis.salaryData.midLevel },
                                                { name: 'Senior', value: analysis.salaryData.seniorLevel },
                                            ]}
                                            currency={analysis.salaryData.currency}
                                        />
                                    )}
                                </AnalysisCard>
                                <AnalysisCard icon={WrenchScrewdriverIcon} title="Key Skills in Demand">
                                    {analysis.keySkills && analysis.keySkills.length > 0 ? (
                                        <TrendBarChart 
                                            data={analysis.keySkills.map(s => ({ name: s.skill, value: s.demandScore }))} 
                                            color="#3b82f6"
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
                                        <TrendBarChart 
                                            data={analysis.geographicHotspots.map(h => ({ name: h.location, value: h.demandIndex }))}
                                            color="#10b981"
                                        />
                                    ) : (
                                        <p>No specific location data available.</p>
                                    )}
                                </AnalysisCard>
                            </div>

                             {sources && sources.length > 0 && (
                                <div className="mt-8 animate-scale-in">
                                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-2">
                                        Data Sources from Google Search
                                    </h3>
                                    <div className="bg-white dark:bg-gray-800/30 p-4 rounded-lg border border-gray-200 dark:border-blue-500/20">
                                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                                            {sources.map((source, index) => (
                                                <li key={index} className="truncate">
                                                    <a 
                                                        href={source.web.uri} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                                        title={source.web.title || source.web.uri}
                                                    >
                                                    {index + 1}. {source.web.title || source.web.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

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