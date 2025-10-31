
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-900 text-gray-400 mt-20">
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} Platinum Luxury Transportation Ltd. All Rights Reserved.</p>
                <p className="mt-1">Confidential Business Plan. Do not distribute.</p>
            </div>
        </footer>
    );
};

export default Footer;
