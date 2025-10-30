import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center space-x-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
            </svg>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Naukri
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">Parse Pro</span>
            </h1>
          </div>
          <p className="hidden md:block text-slate-500 font-medium">Your AI-Powered Career Co-Pilot</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
