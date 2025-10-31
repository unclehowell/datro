import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Platinum Luxury Transportation Ltd.
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-slate-300">
            Business Plan & Financial Model
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;