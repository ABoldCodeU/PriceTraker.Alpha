
import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import Card from './common/Card';

const PRODUCTS = [
  { id: "coca-cola-3l", name: "Coca Cola 3L" },
  { id: "pepsi-2l", name: "Pepsi 2L" },
];

const ALL_RETAILERS = ["Walmart", "Garis", "Chedraui", "Soriana", "Comercial Mexicana"];

// Mock data remains mostly the same, styling changes will affect its presentation
const MOCK_PRICE_HISTORY_MONTHLY = {
  "Coca Cola 3L": {
    "Walmart": [ 
      { month: "Ene", price: 52.5 }, { month: "Feb", price: 53.7 }, { month: "Mar", price: 52.5 }, 
      { month: "Apr", price: 54.2 }, { month: "May", price: 52.0 }, { month: "Jun", price: 54.0 }, 
      { month: "Jul", price: 51.5 }, { month: "Ago", price: 52.8 }, { month: "Sep", price: 55.5 } 
    ],
    "Garis": [ 
      { month: "Ene", price: 51.2 }, { month: "Feb", price: 52.2 }, { month: "Mar", price: 51.8 }, 
      { month: "Apr", price: 51.5 }, { month: "May", price: 53.0 }, { month: "Jun", price: 52.0 }, 
      { month: "Jul", price: 69.0 }, { month: "Ago", price: 53.5 }, { month: "Sep", price: 53.0 } 
    ],
    "Chedraui": [ { month: "Ene", price: 53.0 }, { month: "Feb", price: 53.0 }, { month: "Mar", price: 53.5 }, { month: "Abr", price: 54.0 }, { month: "May", price: 52.5 }, { month: "Jun", price: 53.0 }, { month: "Jul", price: 52.0 }, { month: "Ago", price: 54.5 }, { month: "Sep", price: 53.0 } ],
    "Soriana": [ { month: "Ene", price: 51.5 }, { month: "Feb", price: 52.0 }, { month: "Mar", price: 52.0 }, { month: "Abr", price: 53.5 }, { month: "May", price: 54.0 }, { month: "Jun", price: 53.0 }, { month: "Jul", price: 51.5 }, { month: "Ago", price: 52.0 }, { month: "Sep", price: 54.0 } ],
    "Comercial Mexicana": [ { month: "Ene", price: 52.5 }, { month: "Feb", price: 53.5 }, { month: "Mar", price: 51.5 }, { month: "Abr", price: 52.0 }, { month: "May", price: 53.0 }, { month: "Jun", price: 54.5 }, { month: "Jul", price: 52.5 }, { month: "Ago", price: 53.0 }, { month: "Sep", price: 53.5 } ],
  }
};

const MOCK_CURRENT_PRICES = {
  "Coca Cola 3L": [
    { comercio: "Walmart", producto: "Coca Cola 3L", precio: 54.00, fechaHora: "29/04/2025 - 09:32 AM" },
    { comercio: "Garis", producto: "Coca Cola 3L", precio: 51.00, fechaHora: "29/04/2025 - 09:32 AM" },
    { comercio: "Soriana", producto: "Coca Cola 3L", precio: 52.00, fechaHora: "29/04/2025 - 09:32 AM" },
    { comercio: "La Comer", producto: "Coca Cola 3L", precio: 53.00, fechaHora: "29/04/2025 - 09:32 AM" }, // Will be mapped to "Comercial Mexicana"
    { comercio: "Chedraui", producto: "Coca Cola 3L", precio: 53.00, fechaHora: "29/04/2025 - 09:32 AM" },
  ]
};

const PriceTracker: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>(PRODUCTS[0].id);
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>(ALL_RETAILERS);
  const [timePeriod, setTimePeriod] = useState<'Día' | 'Semana' | 'Mes' | 'Año'>('Mes');
  // barChartSort state is kept but dropdown is hidden
  const [barChartSort, setBarChartSort] = useState<string>('Mejor precio');


  const handleRetailerChange = (retailerName: string) => {
    setSelectedRetailers(prev =>
      prev.includes(retailerName)
        ? prev.filter(r => r !== retailerName)
        : [...prev, retailerName]
    );
  };

  const currentProductDetails = PRODUCTS.find(p => p.id === selectedProduct);

  const tableData = useMemo(() => {
    if (!currentProductDetails) return [];
    const basePrices = MOCK_CURRENT_PRICES[currentProductDetails.name as keyof typeof MOCK_CURRENT_PRICES] || [];
    const mappedPrices = basePrices.map(p => {
      const originalComercioValue = p.comercio === "La Comer" ? "Comercial Mexicana" : p.comercio;
      return { ...p, originalComercio: originalComercioValue };
    });
    return mappedPrices.filter(item => selectedRetailers.includes(item.originalComercio));
  }, [selectedProduct, selectedRetailers, currentProductDetails]);

  const lineChartData = useMemo(() => {
    if (!currentProductDetails || timePeriod !== 'Mes') return []; 
    const history = MOCK_PRICE_HISTORY_MONTHLY[currentProductDetails.name as keyof typeof MOCK_PRICE_HISTORY_MONTHLY];
    if (!history) return [];

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep"];
    const chartData = months.map(month => {
        const entry: { name: string; [key: string]: any } = { name: month };
        selectedRetailers.forEach(retailer => { 
            const retailerHistory = history[retailer as keyof typeof history];
            if (retailerHistory) {
                const monthData = retailerHistory.find(d => d.month === month);
                if (monthData) {
                    entry[retailer] = monthData.price;
                }
            }
        });
        return entry;
    });
    return chartData;
  }, [selectedProduct, selectedRetailers, timePeriod, currentProductDetails]);
  
  const lineChartRetailerColors: { [key: string]: string } = {
      "Walmart": "var(--lavender-700)",
      "Garis": "var(--pink-500)",
      // Add other retailer colors if they can be selected and should have specific colors
      "Chedraui": "var(--grey-400)", 
      "Soriana": "var(--grey-300)",
      "Comercial Mexicana": "var(--black-800)" 
  };

  const barChartData = useMemo(() => {
    const data = MOCK_CURRENT_PRICES[currentProductDetails?.name as keyof typeof MOCK_CURRENT_PRICES]
    ?.map(item => {
      // Map "La Comer" to "Comercial Mexicana" for filtering, but use original name for display if needed
      const mappedName = item.comercio === "La Comer" ? "Comercial Mexicana" : item.comercio;
      return {
        store: item.comercio, // This is the key for XAxis dataKey
        price: item.precio,
        internalFilterName: mappedName
      };
    })
    .filter(item => selectedRetailers.includes(item.internalFilterName)) || [];

    if (barChartSort === 'Mejor precio') {
      return data.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    }
    return data;
  }, [currentProductDetails, barChartSort, selectedRetailers]);


  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-textHeader">Dashboard</h2>
      
      {/* Filter Section */}
      <div className="min-h-[80px] p-6 bg-white rounded shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="analysisType" className="block text-xs font-medium text-textMuted">Tipo de análisis</label>
            <select id="analysisType" disabled 
              className="mt-1 block w-full py-2 px-3 border border-grey-200 bg-gray-100 rounded text-sm text-gray-500 cursor-not-allowed focus:outline-none">
              <option>Por comercio</option>
            </select>
          </div>
          <div>
            <label htmlFor="productSelect" className="block text-xs font-medium text-textMuted">Selecciona el producto</label>
            <select 
              id="productSelect" 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="mt-1 block w-full py-2 px-3 border border-grey-200 bg-white rounded text-sm focus:outline-none focus:border-lavender-700"
            >
              {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-3 xl:col-span-1">
            <label className="block text-xs font-medium text-textMuted mb-1">Selecciona los comercios</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
              {ALL_RETAILERS.map(retailer => (
                <label key={retailer} className="inline-flex items-center">
                  <input 
                    type="checkbox" 
                    className="form-checkbox-custom h-4 w-4 border-grey-200 rounded focus:ring-lavender-700"
                    checked={selectedRetailers.includes(retailer)}
                    onChange={() => handleRetailerChange(retailer)}
                  />
                  <span className="ml-2 text-sm text-textMuted">{retailer}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table Card - mb-6 (24px) */}
      <Card title="Resultados:" className="mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-grey-400 uppercase tracking-wider">Comercio</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-grey-400 uppercase tracking-wider">Producto</th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-grey-400 uppercase tracking-wider w-[120px]">Precio</th>
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-grey-400 uppercase tracking-wider">Fecha y hora</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {tableData.map((item, index) => (
                <tr key={index} className="border-b border-grey-100 last:border-b-0">
                  <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-textHeader">{item.comercio}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-textMuted">{item.producto}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-textMuted text-right w-[120px]">MXN {item.precio?.toFixed(2)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-textMuted">{item.fechaHora}</td>
                </tr>
              ))}
               {tableData.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-textMuted border-b border-grey-100 last:border-b-0">No hay datos disponibles para la selección actual.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart Card */}
        <Card title="Cambio de precio durante el tiempo" className="lg:col-span-2">
            <div className="mb-4 flex justify-center space-x-1">
                {(['Día', 'Semana', 'Mes', 'Año'] as const).map(p => (
                <button 
                    key={p} 
                    onClick={() => setTimePeriod(p)}
                     className={`range-btn ${timePeriod === p ? 'active' : ''}`}
                     style={{
                        display:'inline-block', padding:'4px 12px', fontSize:'12px',
                        border:'1px solid var(--grey-200)', borderRadius:'20px',
                        background: timePeriod === p ? 'var(--black-900)' : 'transparent', 
                        color: timePeriod === p ? 'var(--white)' : 'var(--grey-400)', 
                        cursor:'pointer',
                        borderColor: timePeriod === p ? 'transparent' : 'var(--grey-200)',
                     }}
                     onMouseOver={(e) => { if (timePeriod !== p) e.currentTarget.style.borderColor = 'var(--lavender-700)'; }}
                     onMouseOut={(e) => { if (timePeriod !== p) e.currentTarget.style.borderColor = 'var(--grey-200)'; }}
                >
                    {p}
                </button>
                ))}
            </div>
            <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--grey-100)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--grey-400)' }} axisLine={{ stroke: 'var(--grey-200)' }} tickLine={{ stroke: 'var(--grey-200)' }}/>
                    <YAxis tickFormatter={(value) => `$${value}`} tick={{ fontSize: 11, fill: 'var(--grey-300)' }} domain={['dataMin - 2', 'dataMax + 2']} axisLine={{ stroke: 'var(--grey-200)' }} tickLine={{ stroke: 'var(--grey-200)' }}/>
                    <Tooltip formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name]} wrapperStyle={{fontSize: "12px"}}/>
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: "12px", paddingTop: "10px", color: 'var(--grey-400)' }} />
                    {selectedRetailers.map((retailer) => (
                         <Line 
                            key={retailer} 
                            type="monotone" 
                            dataKey={retailer} 
                            stroke={lineChartRetailerColors[retailer] || 'var(--black-900)'}
                            strokeWidth={2} 
                            dot={false} // elements.point.radius = 0
                            activeDot={{ r: 4, strokeWidth: 0 }} // Keep a small active dot for interaction feedback
                            name={retailer}
                          />
                    ))}
                </LineChart>
            </ResponsiveContainer>
            </div>
        </Card>

        {/* Bar Chart Card - Vertical Bars */}
        <Card title={`${currentProductDetails?.name || ''} - Precio por comercio`}>
            <div className="mb-4 flex justify-end hidden"> {/* "Mejor precio" dropdown hidden */}
            <select 
                value={barChartSort} 
                onChange={(e) => setBarChartSort(e.target.value)}
                className="mt-1 block w-auto py-2 px-3 border border-grey-200 bg-white rounded text-sm focus:outline-none focus:border-lavender-700"
            >
                <option value="Mejor precio">Mejor precio</option>
            </select>
            </div>
            <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grey-100)"/>
                    <XAxis dataKey="store" type="category" tick={{ fill:'var(--grey-400)', fontSize:12 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis type="number" tick={{ fill:'var(--grey-300)', fontSize:12 }} tickFormatter={(v)=>`$${v}`} axisLine={false} tickLine={false} domain={['dataMin - 1', 'auto']}/>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} wrapperStyle={{fontSize: "12px"}}/>
                    {/* Legend is hidden as per new mockup requirement */}
                    <Bar dataKey="price" fill="var(--lavender-100)" radius={[4,4,0,0]} barSize={28}>
                        {/* No LabelList as per new mockup */}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default PriceTracker;