import React from 'react';
import { NewspaperArticle } from '../types';

interface NewspaperCardProps {
  article: NewspaperArticle;
}

const NewspaperCard: React.FC<NewspaperCardProps> = ({ article }) => {
  return (
    <div className="bg-[#fef3c7] text-ink p-6 shadow-md border border-stone-300 relative overflow-hidden transform transition-transform hover:-translate-y-1 hover:shadow-xl">
      {/* Old paper texture effect overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
      
      <div className="relative z-10">
        <div className="border-b-2 border-ink pb-2 mb-4">
          <div className="flex justify-between items-baseline text-xs font-bold uppercase tracking-widest text-stone-600 mb-1">
            <span>{article.source}</span>
            <span>{article.date}</span>
          </div>
          <h3 className="font-serif font-black text-2xl leading-tight text-black mb-1">
            {article.title}
          </h3>
        </div>
        
        <div className="font-serif text-sm leading-relaxed text-justify text-stone-900 columns-1 md:columns-2 gap-6">
          <p className="first-letter:text-3xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-[-2px]">
            {article.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewspaperCard;