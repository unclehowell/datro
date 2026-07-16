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
    <div className="fixed inset-0 z-50 bg-black transition-opacity duration-1000 flex flex-col overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pt-8 pb-4 sm:px-8 sm:pt-12 sm:pb-6">
        <div className="w-full max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-special text-amber-500 mb-2 sm:mb-3 tracking-wider animate-fade-in-up">
            {title}
          </h1>
          <h2 className="text-sm sm:text-lg md:text-xl text-slate-400 mb-6 sm:mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {subtitle}
          </h2>
          <div className="text-left space-y-2 sm:space-y-3 mb-6 sm:mb-10">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-slate-300 animate-fade-in-up leading-snug sm:leading-relaxed" style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
                <span className="text-amber-500 mt-0.5 shrink-0">{'\u2022'}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enter button — always pinned at bottom, never scrolls away */}
      <div className="shrink-0 bg-black border-t border-slate-900 px-5 py-4 sm:py-6 flex justify-center safe-bottom">
        <button
          onClick={onEnter}
          className="px-10 py-3 sm:py-4 bg-amber-500 text-black font-bold text-lg rounded hover:bg-amber-400 transition-colors animate-fade-in-up cursor-pointer"
          style={{ animationDelay: '1.4s' }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
