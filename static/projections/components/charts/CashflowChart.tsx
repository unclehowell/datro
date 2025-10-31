import React from 'react';
import { MonthlyCashflow } from '../../types';

interface CashflowChartProps {
  data: MonthlyCashflow[];
}

const formatCurrencyShort = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1_000_000) return `${sign}${(absValue / 1_000_000).toFixed(1)}M`;
    if (absValue >= 1_000) return `${sign}${(absValue / 1_000).toFixed(0)}K`;
    return `${sign}${value.toString()}`;
};

const CashflowChart: React.FC<CashflowChartProps> = ({ data }) => {
    const values = data.map(d => d.closingCash);
    const minValue = Math.min(0, ...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    const width = 500;
    const height = 200;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };

    const yScale = (value: number) => {
        return height - padding.bottom - ((value - minValue) / range) * (height - padding.top - padding.bottom);
    };

    const xScale = (index: number) => {
        return padding.left + index * ((width - padding.left - padding.right) / (data.length - 1));
    };

    const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.closingCash)}`).join(' ');

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            {/* Y-axis lines & labels */}
            {[...Array(5)].map((_, i) => {
                const value = minValue + (range / 4) * i;
                const y = yScale(value);
                return (
                     <g key={i} className="text-gray-600">
                        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                        <text x={padding.left - 4} y={y+3} textAnchor="end" className="text-[8px] fill-gray-400">{formatCurrencyShort(value)}</text>
                    </g>
                );
            })}
            
            {/* X-axis labels */}
            {data.map((d, i) => (
                <text key={d.month} x={xScale(i)} y={height - 5} textAnchor="middle" className="text-[8px] fill-gray-400 font-medium">
                    {d.month.substring(0, 3)}
                </text>
            ))}

             {/* Zero line */}
            <line 
                x1={padding.left} y1={yScale(0)} 
                x2={width - padding.right} y2={yScale(0)} 
                stroke="currentColor" className="text-gray-500" strokeWidth="1" 
            />
            
            {/* Line path */}
            <path d={pathData} fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="2" />

             {/* Data points */}
            {data.map((d, i) => (
                 <g key={i} className="group cursor-pointer">
                    <circle cx={xScale(i)} cy={yScale(d.closingCash)} r="3" className="fill-emerald-500 transition-all duration-200 group-hover:r-4" />
                     <title>{d.month}: ${d.closingCash.toLocaleString()}</title>
                </g>
            ))}
        </svg>
    );
};

export default CashflowChart;