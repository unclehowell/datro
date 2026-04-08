
import React from 'react';
import { CharacterScene, IconType } from '../types';

interface CharacterProps {
  data: CharacterScene;
  active: boolean; // Character is on stage
  showBubble: boolean; // This character's turn to speak (used for highlighting now)
}

const getIcon = (type: IconType) => {
  switch (type) {
    case 'farmer': return '🧑‍🌾';
    case 'noble': return '🤴';
    case 'judge': return '👨‍⚖️';
    case 'guard': return '💂';
    case 'builder': return '👷';
    case 'ghost': return '👻';
    case 'lawyer': return '👨‍💼';
    case 'worker': return '⛏️';
    case 'ruins': return '🏚️';
    case 'narrator': return '🎙️';
    case 'cleric': return '✝️';
    default: return '👤';
  }
};

const Character: React.FC<CharacterProps> = ({ data, active, showBubble }) => {
  const isRight = data.side === 'right';
  const isCenter = data.side === 'center';

  // Position calculation for the container
  // Left: 0%, Center: 25% (centers a 50% width div), Right: 50%
  const leftPosition = isCenter ? '25%' : (isRight ? '50%' : '0%');
  
  // Translation for enter/exit animation
  const transformStyle = active 
    ? 'translateX(0)' 
    : (isCenter ? 'translateY(0)' : `translateX(${isRight ? '100%' : '-100%'})`);

  const opacityStyle = active ? 1 : 0;
  
  // Center specific entrance: slide up slightly
  const centerTransform = isCenter && !active ? 'translateY(100%)' : 'translateY(0)';

  return (
    <div 
      className={`absolute top-0 h-full w-1/2 transition-all duration-700 ease-out pointer-events-none`}
      style={{ 
        left: leftPosition, 
        opacity: opacityStyle,
        transform: isCenter ? centerTransform : transformStyle,
      }}
    >
        {/* Character Icon & Title Container */}
        <div 
            className={`absolute bottom-2 flex items-end gap-4 transition-all duration-500 z-20 
            ${isCenter 
                ? 'left-1/2 -translate-x-1/2 flex-col items-center gap-2' 
                : (isRight ? 'flex-row-reverse right-6' : 'flex-row left-6')
            } 
            ${showBubble ? 'scale-110 opacity-100 filter-none' : 'scale-100 opacity-60 grayscale-[0.5]'}`}
        >
          {/* Icon */}
          <div 
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-[0_0_40px_rgba(0,0,0,0.6)] border-4 bg-slate-950 shrink-0 transition-all duration-300 ${showBubble ? 'shadow-[0_0_30px_rgba(245,158,11,0.5)] border-amber-500' : 'border-slate-700'}`}
            style={{ borderColor: showBubble ? '#f59e0b' : data.color }}
          >
            {getIcon(data.icon)}
          </div>
          
          {/* Title Label */}
          <div 
            className={`px-6 py-3 rounded-xl text-sm md:text-base font-black uppercase tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.8)] bg-slate-900 border min-w-[140px] text-center whitespace-nowrap overflow-hidden text-ellipsis
            ${isCenter ? '' : 'mb-2'}`}
            style={{ borderColor: showBubble ? '#f59e0b' : data.color, color: '#f8fafc' }}
          >
            {data.character}
          </div>
        </div>
    </div>
  );
};

export default Character;
