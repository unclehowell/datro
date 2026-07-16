import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onEnter: () => void;
  data: any;
}

export function SplashScreen({ onEnter, data }: SplashScreenProps) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  const title = data?.content?.[0]?.props?.title || 'Great House Farm Story';
  const subtitle = data?.content?.[0]?.props?.subtitle || '';
  const items = data?.content?.[0]?.props?.items || [];

  return (
    <div className="flex flex-col w-full bg-black text-center transition-opacity duration-1000 splash-height">
      {/* Title — fixed at top */}
      <div className="shrink-0 px-4 pt-6 pb-2 sm:px-6 sm:pt-10 sm:pb-3">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-special text-amber-500 mb-2 tracking-wider animate-fade-in-up text-center">
          {title}
        </h1>
        <h2 className="text-sm sm:text-lg md:text-xl text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {subtitle}
        </h2>
      </div>

      {/* Bullet list — scrollable middle */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-2 no-scrollbar">
        <div className="w-full max-w-3xl mx-auto text-left space-y-2">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-slate-300 animate-fade-in-up leading-snug sm:leading-relaxed" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
              <span className="text-amber-500 mt-0.5 shrink-0">{'\u2022'}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enter button — pinned at bottom, always visible */}
      <div className="shrink-0 px-4 py-4 sm:py-6 flex justify-center">
        <button
          onClick={onEnter}
          className="px-10 py-3 sm:py-4 bg-amber-500 text-black font-bold text-lg rounded hover:bg-amber-400 transition-colors animate-fade-in-up cursor-pointer"
          style={{ animationDelay: '1.6s' }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
