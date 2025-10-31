import React from 'react';
import { ProfitLoss } from '../../types';

interface ProfitLossChartProps {
  data: ProfitLoss[];
}

const formatCurrencyShort = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
};

const ProfitLossChart: React.FC<ProfitLossChartProps> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.revenue));
    const yScale = (value: number) => 100 - (value / maxValue) * 100;

    const colors = {
        revenue: 'fill-sky-500',
        operatingCosts: 'fill-amber-500',
        netProfit: 'fill-emerald-500',
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
                    const barWidth = (320 / data.length) / 4;
                    return (
                        <g key={item.year}>
                             {/* X-axis label */}
                            <text x={x + barWidth * 1.5} y="195" textAnchor="middle" className="text-[10px] fill-gray-400 font-medium">{item.year}</text>

                            {/* Revenue Bar */}
                            <g className="cursor-pointer group">
                                <rect x={x} y={`${yScale(item.revenue)}%`} width={barWidth} height={`${100 - yScale(item.revenue)}%`} className={`${colors.revenue} transition-opacity duration-200 group-hover:opacity-75`} />
                                <title>Revenue: ${item.revenue.toLocaleString()}</title>
                            </g>
                             {/* Operating Costs Bar */}
                             <g className="cursor-pointer group">
                                <rect x={x + barWidth} y={`${yScale(item.operatingCosts)}%`} width={barWidth} height={`${100 - yScale(item.operatingCosts)}%`} className={`${colors.operatingCosts} transition-opacity duration-200 group-hover:opacity-75`} />
                                <title>Operating Costs: ${item.operatingCosts.toLocaleString()}</title>
                            </g>
                             {/* Net Profit Bar */}
                            <g className="cursor-pointer group">
                                <rect x={x + barWidth * 2} y={`${yScale(item.netProfit)}%`} width={barWidth} height={`${100 - yScale(item.netProfit)}%`} className={`${colors.netProfit} transition-opacity duration-200 group-hover:opacity-75`} />
                                <title>Net Profit: ${item.netProfit.toLocaleString()}</title>
                            </g>
                        </g>
                    )
                })}
                <line x1="20" y1="185" x2="350" y2="185" stroke="currentColor" className="text-gray-700" strokeWidth="1" />
            </svg>
            <div className="flex justify-center space-x-4 text-xs mt-2 text-slate-300">
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-sky-500 mr-2"></span>Revenue</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>Op. Costs</div>
                <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>Net Profit</div>
            </div>
        </div>
    );
};

export default ProfitLossChart;