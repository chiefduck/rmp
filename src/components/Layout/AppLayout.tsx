// src/components/Layout/AppLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  // State to manage the mobile sidebar's visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* --- Desktop Sidebar --- */}
      {/* This is hidden on screens smaller than md (768px) */}
      <div className="hidden md:flex md:flex-shrink-0 w-64">
        <Sidebar className="h-full" />
      </div>

      {/* --- Mobile Sidebar & Overlay --- */}
      {/* This entire block is only visible on screens smaller than md */}
      <div className={`md:hidden fixed inset-0 z-40 transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* The actual sidebar */}
        <div className="w-64 h-full">
          <Sidebar className="h-full" onClose={() => setIsMobileMenuOpen(false)} />
        </div>
      </div>
      
      {/* Overlay for mobile menu (closes menu on click) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto">
          {/* Outlet is where your Dashboard, RateMonitor, etc. will be rendered */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};