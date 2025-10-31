import React from 'react';

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, title, children }) => {
  return (
    <section id={id} className="py-8">
      <h2 className="text-3xl sm:text-4xl font-bold text-white border-b-2 border-amber-400 pb-3 mb-8">
        {title}
      </h2>
      <div className="text-lg text-slate-300 leading-relaxed space-y-6">
        {children}
      </div>
    </section>
  );
};

export default Section;