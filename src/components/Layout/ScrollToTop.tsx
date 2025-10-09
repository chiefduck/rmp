// src/components/Layout/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // The main scrollable container in AppLayout
    const mainElement = document.querySelector('main');
    
    if (mainElement) {
      // Scroll the main content area to top
      mainElement.scrollTo(0, 0);
    }
    
    // Also scroll window as fallback
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};