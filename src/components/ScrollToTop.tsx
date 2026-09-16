import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when scrolled past 100vh (approx hero section)
      if (window.scrollY > window.innerHeight * 0.8) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div
      className={`fixed bottom-24 right-6 z-40 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        onClick={scrollToTop}
        className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-brand-orange dark:hover:bg-brand-orange text-slate-800 dark:text-white hover:text-white dark:hover:text-white rounded-full shadow-lg border border-slate-200 dark:border-white/10 hover:border-brand-orange/50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer group"
        aria-label="Scroll to top"
      >
        <ChevronUp size={24} className="group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}
