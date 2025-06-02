
import React, { useState } from 'react';
import Card from './common/Card';
import { SearchIcon, PencilIcon, FilterIcon, BoxIcon } from './icons/FeatureIcons';
import { Retailer } from '../types';

// Placeholder Walmart logo
const WALMART_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Walmart_logo.svg/60px-Walmart_logo.svg.png";

const initialRetailers: Retailer[] = [
  { 
    id: '1', 
    name: 'Walmart', 
    imageUrl: WALMART_LOGO_URL, 
    url: 'https://www.walmart.com.mx/', 
    isActive: true 
  },
  // Add more mock retailers if needed
];

// Basic Toggle Switch component (can be moved to common components if used elsewhere)
const ToggleSwitch: React.FC<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ id, checked, onChange }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input 
          id={id} 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
      </div>
    </label>
  );
};


const RetailerManagement: React.FC = () => {
  const [retailers, setRetailers] = useState<Retailer[]>(initialRetailers);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleToggleActive = (retailerId: string) => {
    setRetailers(prevRetailers =>
      prevRetailers.map(retailer =>
        retailer.id === retailerId ? { ...retailer, isActive: !retailer.isActive } : retailer
      )
    );
  };

  const filteredRetailers = retailers.filter(retailer =>
    retailer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    retailer.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-textHeader">Comercios</h2>

      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            {/* Search and Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <button 
                  aria-label="Filtrar comercios"
                  className="p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-100 transition-colors"
              >
                  <FilterIcon className="w-5 h-5" />
              </button>
              {/* Placeholder Dropdown */}
              <div className="relative">
                <select 
                    className="appearance-none py-2 px-3 pr-8 border border-grey-200 bg-white rounded-md text-sm text-textMuted focus:outline-none focus:border-lavender-700"
                    defaultValue="comercio"
                    aria-label="Filtrar por tipo de comercio"
                >
                    <option value="comercio">Comercio</option>
                    {/* Add other filter options here */}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-textMuted">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Add Retailer Button */}
            <button
              onClick={() => alert('Funcionalidad "Agregar comercio" (Próximamente)')}
              className="px-4 py-2 bg-[#088395] hover:bg-[#077080] text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#088395] w-full mt-2 sm:w-auto sm:mt-0"
            >
              Agregar comercio
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {["Imagen", "Comercio", "URL del comercio", "Estado", "Acciones"].map(header => (
                    <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-contentBorder">
                {filteredRetailers.map(retailer => (
                  <tr key={retailer.id}>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <img 
                        src={retailer.imageUrl} 
                        alt={retailer.name} 
                        className="h-8 w-auto max-w-[60px] object-contain rounded" 
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-textHeader">{retailer.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted hover:text-primary">
                        <a href={retailer.url} target="_blank" rel="noopener noreferrer">{retailer.url}</a>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <ToggleSwitch 
                        id={`retailer-toggle-${retailer.id}`} 
                        checked={retailer.isActive} 
                        onChange={() => handleToggleActive(retailer.id)} 
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm space-x-3">
                      <button 
                        onClick={() => alert(`Editar comercio ${retailer.name} (Próximamente)`)}
                        aria-label={`Editar comercio ${retailer.name}`}
                        className="text-gray-400 hover:text-primary transition-colors"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                       <button 
                        onClick={() => alert(`Ver productos de ${retailer.name} (Próximamente)`)}
                        aria-label={`Ver productos de ${retailer.name}`}
                        className="text-gray-400 hover:text-primary transition-colors"
                      >
                        <BoxIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRetailers.length === 0 && (
                    <tr>
                        <td colSpan={5} className="text-center py-4 text-textMuted">
                            No se encontraron comercios que coincidan con la búsqueda.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RetailerManagement;
