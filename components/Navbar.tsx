

import React from 'react';
import { AppView } from '../types';
import { PriceTagIcon, CalculatorIcon, SparklesIcon } from './icons/FeatureIcons';

interface NavbarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

// This NavButton styled component might be reusable if a similar tab structure is needed elsewhere.
const NavButton: React.FC<{
  Icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ Icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center px-4 py-3 sm:px-6 sm:py-4 
        font-medium text-sm sm:text-base leading-5 
        transition-colors duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${isActive 
          ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' 
          : 'text-secondary-600 hover:text-primary-700 hover:bg-primary-50 border-b-2 border-transparent'
        }
      `}
    >
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 ${isActive ? 'text-primary-600' : 'text-secondary-500'}`} />
      {label}
    </button>
  );
};


const Navbar: React.FC<NavbarProps> = ({ activeView, setActiveView }) => {
  // This component is no longer rendered in App.tsx as per the new design.
  // The navigation has moved to the sidebar in App.tsx.
  // Keeping the code in case it's needed for a different layout or sub-navigation in the future.
  // If it's definitively not needed, this file can be removed.

  // console.log("Navbar component rendered, but it's likely unused in the current App.tsx layout.");

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40"> {/* Ensure z-index is less than login/modal if any */}
      <div className="container mx-auto flex justify-around">
        <NavButton
          Icon={PriceTagIcon}
          label="Dashboard" // Changed from "Monitor Precios"
          isActive={activeView === AppView.PriceTracker}
          onClick={() => setActiveView(AppView.PriceTracker)}
        />
        <NavButton
          Icon={CalculatorIcon}
          label="Calc. Elasticidad" // This label might need update if ScrapingHistory has different purpose
          // FIX: AppView.ElasticityCalculator was replaced by AppView.ScrapingHistory in types.ts
          isActive={activeView === AppView.ScrapingHistory}
          // FIX: AppView.ElasticityCalculator was replaced by AppView.ScrapingHistory in types.ts
          onClick={() => setActiveView(AppView.ScrapingHistory)}
        />
        <NavButton
          Icon={SparklesIcon}
          label="Limpiar Marcas"
          isActive={activeView === AppView.BrandCleaner}
          onClick={() => setActiveView(AppView.BrandCleaner)}
        />
      </div>
    </nav>
  );
};

export default Navbar;