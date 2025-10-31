import React from 'react';
import { BalanceSheet } from '../../types';

interface BalanceSheetChartProps {
  data: BalanceSheet[];
}

const formatCurrencyShort = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
};

const BalanceSheetChart: React.FC<BalanceSheetChartProps> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.assets));
    const yScale = (value: number) => 100 - (value / maxValue) * 100;

    const colors = {
        liabilities: 'fill-rose-500',
        equity: 'fill-indigo-500',
    };

    return (
        <div className="w-full h-full flex flex-col">
            <svg width="100%" height="90%" viewBox="0 0 350 200" preserveAspectRatio="xMidYMid meet">
                 {/* Y-axis lines */}
                {[0.25, 0.5, 0.75, 1].map(v => (
                     <g key={v} className="text-gray-600">
                        <line x1="20" y1={yScale(maxValue * (1-v))} x2="350" y2={yScale(maxValue * (1-v))} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                        <text x="18" y={yScale(maxValue * (1-v)) + 3} textAnchor="end" className="text-[8px] fill-gray-400">{formatCurrencyShort(maxValue * v)}</text>
                    </g>
                ))}

                {data.map((item, index) => {
                    const x = 25 + index * (320 / data.length);
                    const barWidth = (320 / data.length) * 0.5;
                    const liabilitiesHeight = 100 - yScale(item.liabilities);
                    const equityHeight = 100 - yScale(item.equity);
                    
                    return (
                        <g key={item.year}>
                            {/* X-axis label */}
                            <text x={x + barWidth / 2} y="195" textAnchor="middle" className="text-[10px] fill-gray-400 font-medium">{item.year}</text>

                            {/* Equity Bar */}
                            <g className="cursor-pointer group">
                                <rect x={x} y={`${yScale(item.equity)}%`} width={barWidth} height={`${equityHeight}%`} className={`${colors.equity} transition-opacity duration-200 group-hover:opacity-75`} />
                                <title>Equity: ${item.equity.toLocaleString()}</title>
                            </g>
                             {/* Liabilities Bar */}
                             <g className="cursor-pointer group">
                                <rect x={x} y={`${yScale(item.equity) - liabilitiesHeight}%`} width={barWidth} height={`${liabilitiesHeight}%`} className={`${colors.liabilities} transition-opacity duration-200 group-hover:opacity-75`} />
                                <title>Liabilities: ${item.liabilities.toLocaleString()}</title>
                            </g>
                        </g>
                    )
                })}
                <line x1="20" y1="185" x2="350" y2="185" stroke="currentColor" className="text-gray-700" strokeWidth="1" />
            </svg>
            <div className="flex justify-center space-x-4 text-xs mt-2 text-slate-300">
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-500 mr-2"></span>Liabilities</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>Equity</div>
                 <div className="flex items-center text-gray-500">(Total bar height represents Assets)</div>
            </div>
        </div>
    );
};

export default BalanceSheetChart;