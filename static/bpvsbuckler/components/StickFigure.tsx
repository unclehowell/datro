
import React from 'react';
import { CharacterScene } from '../types';

interface StickFigureProps {
  data: CharacterScene;
  active: boolean;
}

const StickFigure: React.FC<StickFigureProps> = ({ data, active }) => {
  return (
    <div 
      className={`absolute flex flex-col items-center transition-all duration-700 ease-out transform ${
        active ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'
      }`}
      style={{ left: `${data.position.x}%`, top: `${data.position.y}%`, color: data.color }}
    >
      <div className="relative bg-white text-slate-800 p-2 rounded-lg max-w-[160px] text-xs leading-tight shadow-xl mb-2 border border-slate-300">
        {data.text}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
      </div>
      
      <div className={`flex flex-col items-center mb-1 ${active ? 'animate-bounce' : ''}`}>
        <div className="w-5 h-5 rounded-full border-2 bg-slate-800/20" style={{ borderColor: data.color }}></div>
        <div className="w-0.5 h-6 bg-current relative">
          <div className="absolute w-8 h-0.5 bg-current top-1.5 left-1/2 -translate-x-1/2"></div>
        </div>
        <div className="flex gap-2 -mt-0.5">
          <div className="w-0.5 h-5 bg-current -rotate-[20deg] origin-top"></div>
          <div className="w-0.5 h-5 bg-current rotate-[20deg] origin-top"></div>
        </div>
      </div>
      
      <div className="text-[10px] font-bold uppercase tracking-wider text-center max-w-[120px]">
        {data.character}
      </div>
    </div>
  );
};

export default StickFigure;
