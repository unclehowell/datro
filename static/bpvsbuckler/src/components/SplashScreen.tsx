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
    <div className={`flex flex-col items-center justify-center h-screen w-screen bg-black text-center px-4 transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl md:text-6xl font-special text-amber-500 mb-4 tracking-wider animate-fade-in-up">
          {title}
        </h1>
        <h2 className="text-lg md:text-xl text-slate-400 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {subtitle}
        </h2>
        <div className="text-left max-w-lg mx-auto mb-12 space-y-2">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-3 text-sm md:text-base text-slate-300 animate-fade-in-up" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
              <span className="text-amber-500 mt-1 shrink-0">{'\u2022'}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onEnter}
          className="px-8 py-3 bg-amber-500 text-black font-bold text-lg rounded hover:bg-amber-400 transition-colors animate-fade-in-up cursor-pointer"
          style={{ animationDelay: '1.6s' }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
