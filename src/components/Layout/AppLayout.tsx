import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  // This state is the "brain" that controls the mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      {/* Always visible on medium screens and up, completely hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0 w-64">
        <Sidebar className="h-full" />
      </div>

      {/* --- MOBILE SIDEBAR & OVERLAY --- */}
      {/* This section is only for mobile screens (hidden on md and up) */}
      <div className={`md:hidden fixed inset-0 flex z-40 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* The sidebar itself */}
        <div className="w-64 h-full">
          <Sidebar className="h-full" onClose={() => setIsMobileMenuOpen(false)} />
        </div>
        
        {/* The dark overlay that appears next to the sidebar */}
        <div 
          className="flex-shrink-0 w-14" 
          aria-hidden="true"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      </div>
      
      {/* --- MAIN CONTENT AREA --- */}
      {/* This is the main container for your header and pages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* We pass the function to toggle the menu down to the Header */}
        <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        <main className="flex-1 overflow-y-auto">
          {/* Your Dashboard, RateMonitor, etc. will appear here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};