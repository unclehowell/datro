import React from 'react';
import { NewspaperArticle } from '../types';

interface NewspaperCardProps {
  article: NewspaperArticle;
}

const NewspaperCard: React.FC<NewspaperCardProps> = ({ article }) => {
  return (
    <div className="bg-white p-8 border border-slate-200 shadow-sm rounded-sm hover:shadow-lg transition-all group">
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-justice-red mb-1">{article.source}</h4>
            <span className="text-sm font-serif italic text-slate-500">{article.date}</span>
        </div>
        <div className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 uppercase">
            Archive ID: #{article.id}
        </div>
      </div>
      
      <h3 className="font-serif font-black text-3xl leading-tight text-slate-900 mb-6 group-hover:text-justice-red transition-colors">
        "{article.title}"
      </h3>
      
      <div className="font-serif text-lg leading-relaxed text-slate-700 mb-6">
        <p>
          {article.content}
        </p>
      </div>

      {article.context && (
        <div className="bg-slate-50 p-4 text-sm text-slate-600 border-l-2 border-slate-300">
            <span className="font-bold text-slate-900 block mb-1">Analysis:</span>
            {article.context}
        </div>
      )}
    </div>
  );
};

export default NewspaperCard;