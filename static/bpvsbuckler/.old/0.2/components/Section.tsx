import React from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const Section: React.FC<SectionProps> = ({ title, subtitle, children, className = "", id }) => {
  return (
    <section id={id} className={`py-12 md:py-20 ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {(title || subtitle) && (
          <div className="mb-12 text-center">
            {title && <h2 className="text-3xl md:text-4xl font-serif font-bold text-justice-red mb-4">{title}</h2>}
            {subtitle && <p className="text-lg text-stone-600 italic max-w-2xl mx-auto">{subtitle}</p>}
            <div className="w-24 h-1 bg-justice-red mx-auto mt-6"></div>
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

export default Section;