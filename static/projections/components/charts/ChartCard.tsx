import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-lg shadow-md mb-8 ring-1 ring-white/10">
      <h4 className="text-lg font-bold text-slate-100 mb-4 text-center">{title}</h4>
      <div className="h-80 w-full text-xs">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;