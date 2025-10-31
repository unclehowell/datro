import React from 'react';
import { Tab } from '../types';

interface NavbarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs: Tab[] = ['Motion Graph', 'Timeline', 'Introduction', 'Business Plan', 'Financials', 'Investment', 'Contact'];

  return (
    <nav className="bg-slate-800 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-3 sm:px-6 text-sm sm:text-base font-medium transition-colors duration-300 ease-in-out focus:outline-none whitespace-nowrap
                ${
                  activeTab === tab
                    ? 'border-b-2 border-amber-400 text-white'
                    : 'text-gray-400 hover:text-white'
                }
              `}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;