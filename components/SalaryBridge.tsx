import React, { useState } from 'react';
import { CurrencyDollarIcon, ArrowPathIcon, ChartBarIcon } from './icons/Icons';

const BalkanData = {
    'Romania': { rent: 450, food: 300, util: 120, avgSalary: 1200, multiplier: 1.1 },
    'Croatia': { rent: 600, food: 400, util: 150, avgSalary: 1500, multiplier: 1.0 },
    'Bulgaria': { rent: 350, food: 250, util: 100, avgSalary: 1000, multiplier: 1.2 },
};

const SalaryBridge: React.FC = () => {
    const [salary, setSalary] = useState<number>(1000);
    const [country, setCountry] = useState<keyof typeof BalkanData>('Romania');
    
    const data = BalkanData[country];
    const savings = salary - (data.rent + data.food + data.util);
    const savingsPercent = (savings / salary) * 100;

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-orbitron neon-text">Balkan Salary Bridge</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Understand your real savings potential before you relocate.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800/30 p-8 rounded-2xl border border-gray-200 dark:border-blue-500/20 shadow-xl">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-6 w-6 text-blue-500" />
                            Relocation Parameters
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Target Monthly Salary (EUR)</label>
                                <input 
                                    type="range" 
                                    min="600" 
                                    max="5000" 
                                    step="50"
                                    value={salary}
                                    onChange={(e) => setSalary(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="text-2xl font-bold text-blue-600 mt-2">€{salary}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Destination Country</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.keys(BalkanData).map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setCountry(c as any)}
                                            className={`px-3 py-2 text-xs font-bold rounded-md border transition-all ${
                                                country === c ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-bold mb-4 opacity-90">Estimated Monthly Savings</h3>
                            <div className="text-5xl font-black font-orbitron tracking-tighter">
                                €{savings > 0 ? savings : 0}
                            </div>
                            <p className="mt-2 opacity-80 text-sm">After estimated rent, food, and utilities.</p>
                        </div>
                        
                        <div className="mt-8 space-y-4">
                            <div className="flex justify-between text-sm border-b border-white/20 pb-2">
                                <span>Rent (Average 1BR)</span>
                                <span className="font-bold">€{data.rent}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-white/20 pb-2">
                                <span>Groceries & Dining</span>
                                <span className="font-bold">€{data.food}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Savings Potential</span>
                                <span className="font-bold">{savingsPercent.toFixed(1)}%</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="w-full bg-white/20 rounded-full h-2.5">
                                <div 
                                    className="bg-white h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(Math.max(savingsPercent, 0), 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800 flex items-start gap-4">
                    <ChartBarIcon className="h-6 w-6 text-blue-500 mt-1" />
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">AI Insights</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            A monthly salary of €{salary} in {country} is considered <span className="text-blue-600 dark:text-blue-400 font-bold">{salary > data.avgSalary ? 'Above Average' : 'Moderate'}</span>. 
                            In this region, €1,000 has roughly the same purchasing power as ৳110,000 in Dhaka.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalaryBridge;