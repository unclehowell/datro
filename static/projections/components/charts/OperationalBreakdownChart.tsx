import React from 'react';
import { OperationalBreakdownItem } from '../../types';

interface OperationalBreakdownChartProps {
  data: OperationalBreakdownItem[];
}

const OperationalBreakdownChart: React.FC<OperationalBreakdownChartProps> = ({ data }) => {
    const colors = ['#38bdf8', '#fbbf24', '#34d399', '#f472b6', '#818cf8', '#a78bfa'];
    const totalCost = data.reduce((acc, item) => acc + item.monthlyCost, 0);

    const radius = 85;
    const circumference = 2 * Math.PI * radius;

    let accumulatedOffset = 0;

    return (
        <div className="w-full h-full flex items-center justify-center sm:space-x-8 flex-col sm:flex-row">
            <svg width="200" height="200" viewBox="0 0 200 200" className="flex-shrink-0">
                <g transform="rotate(-90 100 100)">
                    {data.map((item, index) => {
                        const percentage = (item.monthlyCost / totalCost) * 100;
                        const strokeDashoffset = accumulatedOffset;
                        accumulatedOffset += (percentage / 100) * circumference;
                        
                        return (
                            <circle
                                key={item.category}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="transparent"
                                stroke={colors[index % colors.length]}
                                strokeWidth="30"
                                strokeDasharray={circumference}
                                strokeDashoffset={-strokeDashoffset}
                                className="transition-all duration-500 ease-in-out"
                            >
                                <title>{`${item.category}: ${percentage.toFixed(1)}% ($${item.monthlyCost.toLocaleString()})`}</title>
                            </circle>
                        );
                    })}
                </g>
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="text-2xl font-bold fill-slate-100">
                    ${totalCost.toLocaleString()}
                </text>
                 <text x="50%" y="62%" textAnchor="middle" className="text-xs fill-gray-400">
                    Total Monthly
                </text>
            </svg>
             <div className="flex flex-col justify-center text-xs space-y-2 mt-4 sm:mt-0 text-slate-300">
                {data.map((item, index) => (
                    <div key={item.category} className="flex items-center">
                        <span style={{ backgroundColor: colors[index % colors.length] }} className="w-3 h-3 rounded-full mr-2"></span>
                        <span className="font-semibold mr-1">{item.category}:</span>
                        <span>{((item.monthlyCost / totalCost) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OperationalBreakdownChart;