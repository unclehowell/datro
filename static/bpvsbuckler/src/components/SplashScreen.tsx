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
    <div className="flex flex-col items-center justify-start w-full bg-black text-center transition-opacity duration-1000 overflow-y-auto overflow-x-hidden no-scrollbar" style={{ minHeight: '100dvh', minHeight: '100vh' }}>
      <div className="w-full px-6 py-10 sm:py-16 flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-special text-amber-500 mb-3 tracking-wider animate-fade-in-up text-center">
          {title}
        </h1>
        <h2 className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {subtitle}
        </h2>
        <div className="w-full max-w-3xl text-left mb-8 sm:mb-12 space-y-3">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-300 animate-fade-in-up leading-relaxed" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
              <span className="text-amber-500 mt-1 shrink-0">{'\u2022'}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onEnter}
          className="px-10 py-4 bg-amber-500 text-black font-bold text-lg rounded hover:bg-amber-400 transition-colors animate-fade-in-up cursor-pointer shrink-0"
          style={{ animationDelay: '1.6s' }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
