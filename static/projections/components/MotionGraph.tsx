import React, { useState } from 'react';
import { battleshipData } from '../motionGraphData';
import { QuadrantFinancials, NominalCode } from '../types';

// Abbreviated currency formatting for main display
const formatCurrency = (value: number) => {
    if (value === 0) return '$0';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1_000_000) return `${sign}$${(absValue / 1_000_000).toFixed(1)}M`;
    if (absValue >= 1_000) return `${sign}$${(absValue / 1_000).toFixed(0)}K`;
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
};

// Exact currency formatting for tooltips
const formatCurrencyExact = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);

type QuadrantType = 'Lenders / Income (Interest payments)' | 'Assets (Owned Value)' | 'Liabilities (Owed Value)' | 'Expenses (Operational & Financing)';

const PinGrid: React.FC<{ value: number; }> = ({ value }) => {
    const PIN_VALUE = 10000;
    const pinCount = Math.floor(Math.abs(value) / PIN_VALUE);
    const pinColor = value >= 0 ? 'bg-white' : 'bg-red-500';

    if (pinCount === 0) return null;

    // Cap at a reasonable number for performance/display
    const displayCount = Math.min(pinCount, 200);

    return (
        <div className="flex flex-wrap gap-1 p-1 rounded-sm min-h-[1rem]">
            {Array.from({ length: displayCount }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full border border-slate-600/50 flex items-center justify-center" title="$10,000">
                    <div className={`w-full h-full rounded-full ${pinColor} shadow-inner`}></div>
                </div>
            ))}
            {pinCount > displayCount && (
                 <div className="text-[10px] text-slate-400 self-center ml-1">+{pinCount - displayCount} more</div>
            )}
        </div>
    );
};

const Ship: React.FC<{ nominal: NominalCode; }> = ({ nominal }) => {
    const { code, description, value } = nominal;
    
    if (value === 0) {
        return null; // Don't render empty ships
    }

    return (
        <div className="relative group bg-slate-700/50 rounded p-2 my-1 shadow-md ring-1 ring-black/20 animate-fade-in">
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-slate-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <p className="font-bold border-b border-slate-600 pb-1 mb-1">{code} - {description}</p>
                 <p className="font-bold">Value: <span className="font-mono">{formatCurrencyExact(value)}</span></p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
            </div>

            <div className="flex justify-between items-start gap-2">
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white uppercase tracking-tighter">{description}</p>
                        <InfoIcon />
                    </div>
                    <p className="text-sm font-semibold text-amber-300">{formatCurrency(value)}</p>
                </div>
            </div>
            
            <div className="mt-1 bg-slate-800/50 rounded">
                <PinGrid value={value} />
            </div>
        </div>
    );
};

const Quadrant: React.FC<{ title: QuadrantType; data: QuadrantFinancials; colorClass: string; }> = ({ title, data, colorClass }) => {
    return (
        <div className={`relative p-3 rounded-lg flex flex-col ${colorClass} overflow-hidden`}>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-50"></div>
            
            <div className="relative z-10 flex-grow flex flex-col min-h-0">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-1 mb-2 flex-shrink-0">
                    <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">{title}</h4>
                    <p className={`text-lg sm:text-xl font-extrabold text-white`}>{formatCurrency(data.total)}</p>
                </div>
                <div className="flex-grow overflow-y-auto pr-1">
                    {data.nominals.some(n => n.value !== 0) ? data.nominals.map(nominal => (
                        <Ship key={nominal.code + nominal.description} nominal={nominal} />
                    )) : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">No Activity</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MotionGraph: React.FC = () => {
    const [yearIndex, setYearIndex] = useState(0);

    const currentFrame = battleshipData[yearIndex];
    const startYear = 2024;
    const endYear = startYear + battleshipData.length - 1;

    return (
        <div className="bg-slate-800 p-2 sm:p-4 rounded-lg shadow-lg ring-1 ring-white/10 flex gap-4 w-full max-w-7xl h-[90vh]">
            
            {/* Vertical Slider */}
            <div className="flex flex-col items-center justify-center w-16 py-4">
                <span className="text-xs text-slate-400 font-semibold transform -rotate-90 origin-center whitespace-nowrap">{endYear}</span>
                <input
                    type="range"
                    min="0"
                    max={battleshipData.length - 1}
                    step="1"
                    value={yearIndex}
                    onChange={(e) => setYearIndex(Number(e.target.value))}
                    className="flex-grow w-2 h-full bg-slate-700 rounded-lg appearance-none cursor-pointer my-4"
                    style={{ writingMode: 'vertical-lr' }}
                    aria-orientation="vertical"
                    aria-label="Financial Year Slider"
                    aria-valuetext={currentFrame.label}
                />
                <span className="text-xs text-slate-400 font-semibold transform -rotate-90 origin-center whitespace-nowrap">{startYear}</span>
            </div>

            {/* Main Content */}
            <div className="flex-grow min-w-0 flex flex-col">
                <div className="text-center mb-2">
                     <h3 className="text-lg font-bold text-amber-400">{currentFrame.label}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 flex-grow">
                    <Quadrant title="Lenders / Income (Interest payments)" data={currentFrame.income} colorClass="bg-emerald-900/70" />
                    <Quadrant title="Assets (Owned Value)" data={currentFrame.assets} colorClass="bg-sky-900/70" />
                    <Quadrant title="Liabilities (Owed Value)" data={currentFrame.liabilities} colorClass="bg-indigo-900/70" />
                    <Quadrant title="Expenses (Operational & Financing)" data={currentFrame.expenses} colorClass="bg-rose-900/70" />
                </div>
            </div>
        </div>
    );
};

export default MotionGraph;