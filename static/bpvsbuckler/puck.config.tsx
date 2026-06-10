import { Config } from "@measured/puck";
import React from "react";

type Props = {
  Hero: {
    title: string;
    subtitle: string;
  };
  Text: {
    content: string;
  };
  MediaIcons: {
    filterTag: string;
  };
};

const WAYBACK_BASE = 'https://wayback.datro.xyz';

export const config: Config<Props> = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
      },
      defaultProps: {
        title: "BP vs Buckler Archive",
        subtitle: "Evidence and documentation for the Great House Farm dispute",
      },
      render: ({ title, subtitle }) => (
        <section className="bg-slate-900 text-white py-16 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-4xl md:text-6xl font-special font-bold leading-tight">
              {title}
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl">
              {subtitle}
            </p>
          </div>
        </section>
      ),
    },
    MediaIcons: {
      label: "Media Gallery Icons",
      fields: {
        filterTag: { type: "text" },
      },
      defaultProps: {
        filterTag: "bpvsbuckler",
      },
      render: ({ filterTag }) => {
        const [counts, setCounts] = React.useState({ text: 0, pdf: 0, image: 0, video: 0 });
        
        React.useEffect(() => {
          const fetchCounts = async () => {
            const types = ['text', 'pdf', 'image', 'video'];
            const newCounts: any = {};
            for (const type of types) {
              try {
                const response = await fetch(`${WAYBACK_BASE}/${type === 'image' ? 'images' : type}/_treeview.json`);
                const data = await response.json();
                const filtered = data.filter((item: any) => item.name && item.name.includes('#' + filterTag));
                newCounts[type] = filtered.length;
              } catch (e) {
                newCounts[type] = 0;
              }
            }
            setCounts(newCounts);
          };
          fetchCounts();
        }, [filterTag]);
        
        return (
          <div className="flex gap-4 justify-center my-8 flex-wrap">
            <button 
              onClick={() => openModal('text', filterTag)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Open text/email gallery"
            >
              <span className="text-2xl">📧</span>
              <span className="text-sm font-special">Text ({counts.text})</span>
            </button>
            <button 
              onClick={() => openModal('pdf', filterTag)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Open PDF gallery"
            >
              <span className="text-2xl">📄</span>
              <span className="text-sm font-special">PDF ({counts.pdf})</span>
            </button>
            <button 
              onClick={() => openModal('image', filterTag)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Open image gallery"
            >
              <span className="text-2xl">🖼️</span>
              <span className="text-sm font-special">Images ({counts.image})</span>
            </button>
            <button 
              onClick={() => openModal('video', filterTag)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Open video gallery"
            >
              <span className="text-2xl">▶️</span>
              <span className="text-sm font-special">Videos ({counts.video})</span>
            </button>
          </div>
        );
      },
    },
    Text: {
      label: "Text Block with Icons",
      fields: {
        content: { type: "textarea" },
      },
      defaultProps: {
        content: "Enter your text here...",
      },
      render: ({ content }) => {
        const paragraphs = content.split('\n\n').map((p, i) => (
          <p key={i} className="text-lg leading-relaxed mb-4 whitespace-pre-wrap">
            {p.trim()}
          </p>
        ));
        
        return (
          <div className="max-w-4xl mx-auto px-4 py-8 text-slate-200">
            {paragraphs}
          </div>
        );
      },
    },
  },
};

function openModal(type: string, filterTag: string) {
  window.open(`${WAYBACK_BASE}/${type === 'image' ? 'images' : type}/index.html`, '_blank');
}