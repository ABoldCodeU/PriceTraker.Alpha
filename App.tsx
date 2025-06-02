
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PriceTracker from './components/PriceTracker'; // This will be the Dashboard
import ScrapingHistory from './components/ScrapingHistory'; // Changed from ElasticityCalculator
import RetailerManagement from './components/RetailerManagement'; 
import Login from './components/Login';
import UserManagement from './components/UserManagement'; 
import ScrapingView from './components/ScrapingView'; // Import the new Scraping view
import SuperuserView from './components/SuperuserView'; // Import Superuser view
import { AppView } from './types';
import { PriceTagIcon, CalculatorIcon, SparklesIcon, LogoutIcon, UserCircleIcon, BellIcon, DocumentTextIcon, CogIcon } from './components/icons/FeatureIcons';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userType, setUserType] = useState<string | null>(null); 
  const [activeView, setActiveView] = useState<AppView>(AppView.PriceTracker);

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUserType = localStorage.getItem('userType');
    if (storedAuth === 'true' && storedUserType) {
      setIsAuthenticated(true);
      setUserType(storedUserType);
      // If the stored userType is 'Developer', set view to Superuser, otherwise default to Dashboard
      if (storedUserType === 'Developer') {
        setActiveView(AppView.Superuser);
      } else {
        setActiveView(AppView.PriceTracker);
      }
    }
  }, []);

  const handleLoginSuccess = (type: string) => {
    if (type === 'SuperuserAccess') {
      setIsAuthenticated(true);
      setUserType('Developer'); // Set display type for Superuser
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userType', 'Developer');
      setActiveView(AppView.Superuser);
    } else {
      setIsAuthenticated(true);
      setUserType(type); // Admin or User
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userType', type);
      setActiveView(AppView.PriceTracker); 
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    // After logout, Login component will be rendered automatically due to !isAuthenticated
  };


  const renderView = () => {
    switch (activeView) {
      case AppView.PriceTracker:
        return <PriceTracker />;
      case AppView.ScrapingHistory: 
        return <ScrapingHistory />;
      case AppView.BrandCleaner: 
        return <RetailerManagement />;
      case AppView.UserManagement: 
        return <UserManagement />;
      case AppView.Scraping: 
        return <ScrapingView />;
      case AppView.Superuser:
        return <SuperuserView />;
      default:
        return <PriceTracker />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-grey-100"> {/* Page background from CSS vars */}
      {/* Sidebar */}
      <aside className="w-40 bg-sidebarBg text-textLight flex flex-col fixed h-full">
        <div className="px-4 py-4 border-b border-black-800 flex items-center justify-center h-11"> {/* Sidebar header border */}
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C9.24 6 7 8.24 7 11C7 12.85 8.03 14.44 9.5 15.23V17H14.5V15.23C15.97 14.44 17 12.85 17 11C17 8.24 14.76 6 12 6ZM10.5 13.5H13.5V12H10.5V13.5ZM10.5 10.5H13.5V9H10.5V10.5Z"/>
          </svg>
        </div>
        <nav className="flex-grow mt-5">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView(AppView.PriceTracker); }}
            className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-200 ${activeView === AppView.PriceTracker ? 'bg-sidebarActiveBg text-white' : 'text-textLight hover:bg-black-800'}`}
          >
            <PriceTagIcon className="w-5 h-5 mr-3 text-white" /> Dashboard
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView(AppView.UserManagement); }}
            className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-200 ${activeView === AppView.UserManagement ? 'bg-sidebarActiveBg text-white' : 'text-textLight hover:bg-black-800'}`}
          >
            <UserCircleIcon className="w-5 h-5 mr-3 text-white" /> Usuarios
          </a>
           <a 
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView(AppView.Scraping); }} // Update to set Scraping view
            className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-200 ${activeView === AppView.Scraping ? 'bg-sidebarActiveBg text-white' : 'text-textLight hover:bg-black-800'}`}
          >
            <svg className="w-5 h-5 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
            Scraping
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView(AppView.ScrapingHistory); }} 
            className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-200 ${activeView === AppView.ScrapingHistory ? 'bg-sidebarActiveBg text-white' : 'text-textLight hover:bg-black-800'}`}
          >
            <DocumentTextIcon className="w-5 h-5 mr-3 text-white" /> Historial 
          </a>
           <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView(AppView.BrandCleaner); }} 
            className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-200 ${activeView === AppView.BrandCleaner ? 'bg-sidebarActiveBg text-white' : 'text-textLight hover:bg-black-800'}`}
          >
            <SparklesIcon className="w-5 h-5 mr-3 text-white" /> Comercios
          </a>
          {userType === 'Developer' && (
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setActiveView(AppView.Superuser); }}
              className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-200 ${activeView === AppView.Superuser ? 'bg-sidebarActiveBg text-white' : 'text-textLight hover:bg-black-800'}`}
            >
              <CogIcon className="w-5 h-5 mr-3 text-white" /> Dev Settings
            </a>
          )}
        </nav>
        <div className="px-4 py-3 border-t border-black-800"> {/* Sidebar footer border */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-textLight hover:bg-black-800 rounded-md focus:outline-none transition-colors"
          >
            <LogoutIcon className="w-5 h-5 mr-2 text-white" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-40"> {/* ml-40 to offset sidebar */}
        <header className="bg-topBarBg shadow-sm p-4 flex justify-end items-center h-11 border-b border-black-800"> {/* Top bar uses specific #0E0E0E */}
            <div className="flex items-center space-x-4">
                <button className="text-grey-300 hover:text-white">
                    <BellIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center">
                    <img src="https://picsum.photos/seed/avatar1/32/32" alt="User Avatar" className="w-7 h-7 rounded-full mr-2 border-2 border-grey-400" />
                    <span className="text-xs font-medium text-textLight">{userType}</span>
                </div>
            </div>
        </header>

        <main className="flex-grow p-6 overflow-auto">
          {renderView()}
        </main>

        <footer className="bg-white text-grey-300 text-center p-3 border-t border-grey-100">
          <p className="text-xs">&copy; {new Date().getFullYear()} Price Tracking. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
