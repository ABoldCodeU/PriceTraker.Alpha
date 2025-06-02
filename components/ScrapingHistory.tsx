
import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import { ChevronLeftIcon, EyeIcon, SearchIcon as SearchIconMini } from './icons/FeatureIcons'; // Renamed SearchIcon to avoid conflict
import { ScrapingHistoryEntry } from '../types';

const MOCK_HISTORY_DATA: ScrapingHistoryEntry[] = [
  { id: '1', comercio: 'Walmart', categoria: 'Bebidas', producto: 'Coca Cola', upc: '012345678912', sku: 'ZGQAQA', precio: 'MXN 54.00', fechaHora: '29/04/2025 - 09:32 AM' },
  { id: '2', comercio: 'Garis', categoria: 'Alimentos', producto: 'Mondel', upc: '015345678912', sku: 'AP1AQB', precio: 'MXN 51.00', fechaHora: '29/04/2025 - 09:32 AM' },
  { id: '3', comercio: 'La Comer', categoria: 'Bebidas', producto: 'Pepsi', upc: '016345678912', sku: 'ZGQAQA', precio: 'MXN 52.00', fechaHora: '29/04/2025 - 09:32 AM' },
  { id: '4', comercio: 'Chedraui', categoria: 'Limpieza', producto: 'Bimbo', upc: '072345678912', sku: 'AP1AQB', precio: 'MXN 53.00', fechaHora: '29/04/2025 - 09:32 AM' },
  { id: '5', comercio: 'Soriana', categoria: 'Lácteos', producto: 'Kellogs', upc: '018345678912', sku: 'ZGQAQA', precio: 'MXN 52.00', fechaHora: '29/04/2025 - 09:32 AM' },
  { id: '6', comercio: 'Walmart', categoria: 'Farmacia', producto: 'Aspirina', upc: '019345678912', sku: 'BC2XYZ', precio: 'MXN 30.50', fechaHora: '28/04/2025 - 11:15 AM' },
  { id: '7', comercio: 'Garis', categoria: 'Hogar', producto: 'Fabuloso', upc: '020345678912', sku: 'CD3ABC', precio: 'MXN 22.00', fechaHora: '28/04/2025 - 02:40 PM' },
];

const TABLE_HEADERS = ["Comercio", "Categoría", "Producto", "UPC", "SKU", "Precio", "Fecha y hora", ""];


const ScrapingHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return MOCK_HISTORY_DATA;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return MOCK_HISTORY_DATA.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(lowerSearchTerm)
      )
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-2">
        <button 
            onClick={() => alert('Regresar (funcionalidad no implementada)')} 
            className="p-2 mr-2 text-textMuted hover:text-textHeader rounded-full hover:bg-grey-200 transition-colors"
            aria-label="Regresar"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold text-textHeader">Historial Web Scraping</h2>
      </div>
      
      <Card>
        <div className="p-4">
          <div className="mb-4 flex items-center">
            <label htmlFor="search-history" className="text-sm font-medium text-textMuted mr-2">Buscar</label>
            <div className="relative flex-grow max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIconMini className="h-4 w-4 text-grey-400" />
                </div>
                <input
                    id="search-history"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-grey-200 bg-white rounded-md text-sm placeholder-grey-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Escribe para buscar..."
                />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {TABLE_HEADERS.map((header, index) => (
                    <th 
                        key={header || `header-${index}`} 
                        scope="col" 
                        className={`px-5 py-3 text-left text-xs font-semibold text-grey-400 uppercase tracking-wider ${index === TABLE_HEADERS.length -1 ? 'text-right' : ''}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-grey-100">
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textHeader font-medium">{item.comercio}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted">{item.categoria}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted">{item.producto}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted">{item.upc}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted">{item.sku}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted">{item.precio}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted">{item.fechaHora}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-right">
                      <button 
                        onClick={() => alert(`Ver detalles de ${item.producto} (Próximamente)`)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Ver detalles de ${item.producto}`}
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                    <tr>
                        <td colSpan={TABLE_HEADERS.length} className="text-center py-4 text-textMuted">
                            No se encontraron registros que coincidan con la búsqueda.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      <div className="text-center mt-4">
        <p className="text-xs text-grey-400">Price Tracking</p>
      </div>
    </div>
  );
};

export default ScrapingHistory;