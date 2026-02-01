import React from 'react';
import Section from '../components/Section';
import NewspaperCard from '../components/NewspaperCard';
import { NEWSPAPER_ARTICLES } from '../constants';

const EvidencePage: React.FC = () => {
  return (
    <div className="bg-stone-800 min-h-screen text-parchment">
      <div className="py-16 text-center">
        <h1 className="text-4xl font-serif font-bold text-parchment mb-4">The Archive</h1>
        <p className="text-stone-400 max-w-2xl mx-auto px-4">
          Contemporary newspaper reports from the South Wales Echo and Western Mail documenting the eviction, the "warzone" demolition, and the family's struggle.
        </p>
      </div>

      <Section className="bg-stone-800 pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {NEWSPAPER_ARTICLES.map((article) => (
            <NewspaperCard key={article.id} article={article} />
          ))}
        </div>
        
        <div className="mt-16 bg-stone-900 p-8 rounded border border-stone-700">
            <h3 className="text-2xl font-serif font-bold mb-4 text-white">Missing: The Deeds</h3>
            <p className="text-stone-300 mb-4">
                A critical turning point in the family history involves the "Theft of the Deeds" in the 1950s. 
                Copies of the deed of transfer from the Bute Estate to Daniel Thomas went missing from Cardiff Library in 1984.
            </p>
            <p className="text-stone-400 italic text-sm">
                "We have got no documents for it. If it's theirs, why have I never paid a penny in rent for it in my life?" - Bill Buckler, 1988
            </p>
        </div>
      </Section>
    </div>
  );
};

export default EvidencePage;