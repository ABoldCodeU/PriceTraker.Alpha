
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import LoadingSpinner from './common/LoadingSpinner';
import { useDataSender } from '../hooks/useDataSender'; // Corrected import path
import { LOCAL_STORAGE_CORS_PROXY_URL_KEY, PROXY_BASE } from '../constants';

// Define FormInput outside the ScrapingView component
const FormInput: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder?: string, id: string}> =
  ({ label, value, onChange, placeholder, id }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-textMuted mb-0.5">{label}</label>
    <input
      type="text"
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1 block w-full p-2.5 border border-grey-200 bg-white rounded-md text-sm text-textHeader focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
    />
  </div>
);

// Define ReadOnlyDetail outside the ScrapingView component
const ReadOnlyDetail: React.FC<{label: string, value: string }> = ({label, value}) => (
   <div>
      <label className="block text-xs font-medium text-textMuted mb-0.5">{label}</label>
      <div className="mt-1 block w-full p-2.5 border border-transparent bg-gray-100 rounded-md text-sm text-gray-700 min-h-[42px] flex items-center">
      {value || '-'}
      </div>
  </div>
);

const COMERCIO_OPTIONS = [
  { value: "", label: "Seleccione un comercio" },
  { value: "Walmart", label: "Walmart" },
  { value: "Walmart Express", label: "Walmart Express /super" },
  { value: "Soriana", label: "Soriana" },
  { value: "HEB", label: "HEB" },
];

const COMERCIO_URLS: Record<string, string> = {
  "Walmart": "https://www.walmart.com.mx/inicio",
  "Walmart Express": "https://super.walmart.com.mx/",
  "Soriana": "https://www.soriana.com/",
  "HEB": "https://www.heb.com.mx/",
};

const ScrapingView: React.FC = () => {
  const [comercioInput, setComercioInput] = useState<string>(''); 
  const [productoInput, setProductoInput] = useState<string>('');
  const [varianteInput, setVarianteInput] = useState<string>('');
  const [urlComercioInput, setUrlComercioInput] = useState<string>('');
  const [urlProductoInput, setUrlProductoInput] = useState<string>('');
  const [marcaProductoInput, setMarcaProductoInput] = useState<string>('');
  const [categoriaInput, setCategoriaInput] = useState<string>('');
  const [unidadMedidaInput, setUnidadMedidaInput] = useState<string>('');
  const [saborProductoInput, setSaborProductoInput] = useState<string>('');
  const [skuDelProductoInput, setSkuDelProductoInput] = useState<string>('');
  const [upcDeProductoInput, setUpcDeProductoInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackUIMessage, setFeedbackUIMessage] = useState<string | null>(null); // Renamed for clarity from feedbackMessage

  const { estado: dataSenderStatus, enviar: sendScrapingData, feedback: dataSenderFeedback } = useDataSender(); // Updated hook usage

  useEffect(() => {
    setUrlComercioInput(COMERCIO_URLS[comercioInput] || '');
  }, [comercioInput]);

  useEffect(() => {
    // Update UI feedback based on hook's state and feedback message
    if (dataSenderFeedback) {
      setFeedbackUIMessage(dataSenderFeedback);
    }

    if (dataSenderStatus === 'enviando') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
    
    // Additional specific message handling if needed, though dataSenderFeedback should be primary
    if (dataSenderStatus === 'err' && !dataSenderFeedback) {
      // Generic error if hook doesn't provide one (should be rare)
      let errMsg = 'Error en el proceso de envío.';
      const activeProxy = localStorage.getItem(LOCAL_STORAGE_CORS_PROXY_URL_KEY) || PROXY_BASE;
      if (!activeProxy || activeProxy.trim() === '') {
        errMsg += ' Causa: Proxy Base URL no configurado. Verifique "Dev Settings".';
      }
      setFeedbackUIMessage(errMsg);
    }

  }, [dataSenderStatus, dataSenderFeedback]);


  const handleEnviarDatos = async () => {
    if (!comercioInput.trim()) {
      setFeedbackUIMessage('Por favor, seleccione un comercio de la lista.');
      setIsLoading(false); // Ensure loading is false if validation fails early
      return;
    }
    
    // setIsLoading(true); // This is now handled by useEffect based on dataSenderStatus
    setFeedbackUIMessage(null); // Clear previous manual messages before sending

    const payload = {
      comercio   : comercioInput,
      producto   : productoInput,
      variante   : varianteInput,
      urlComercio: urlComercioInput,
      urlProducto: urlProductoInput,
      marca: marcaProductoInput,
      categoria: categoriaInput,
      sku: skuDelProductoInput,
      upc: upcDeProductoInput,
      sabor: saborProductoInput,
      unidadMedida: unidadMedidaInput,
    };
    
    await sendScrapingData(payload); 
  };

  const handleLimpiarCampos = () => {
    setComercioInput('');
    setProductoInput('');
    setVarianteInput('');
    setUrlProductoInput('');
    setMarcaProductoInput('');
    setCategoriaInput('');
    setUnidadMedidaInput('');
    setSaborProductoInput('');
    setSkuDelProductoInput('');
    setUpcDeProductoInput('');
    setFeedbackUIMessage('Formulario limpiado.');
    setTimeout(() => setFeedbackUIMessage(null), 2000);
  };
  
  const getFeedbackClasses = () => {
    if (!feedbackUIMessage) return '';
    switch (dataSenderStatus) {
      case 'ok':
        return 'text-green-700 bg-green-100 border border-green-300';
      case 'err':
        return 'text-red-700 bg-red-100 border border-red-300';
      case 'enviando':
        return 'text-blue-700 bg-blue-100 border border-blue-300';
      case 'skipped':
        return 'text-amber-700 bg-amber-100 border border-amber-300'; // Using amber for skipped
      default: // For "idle" or other general messages like validation or "Formulario Limpiado"
        if (feedbackUIMessage.toLowerCase().includes('error') || 
            feedbackUIMessage.toLowerCase().includes('seleccione') ||
            feedbackUIMessage.toLowerCase().includes('requerida')) {
          return 'text-red-700 bg-red-100 border border-red-300';
        }
        return 'text-gray-700 bg-gray-100 border border-gray-300'; // Neutral for "Formulario limpiado"
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-xl font-semibold text-textHeader mb-3 sm:mb-0">Entrada de Datos</h2>
            <button
              onClick={handleLimpiarCampos}
              className="px-4 py-2 bg-grey-200 text-textHeader hover:bg-grey-300 text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-grey-400"
            >
              Limpiar Campos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-6">
            <div>
              <label htmlFor="comercioInput" className="block text-xs font-medium text-textMuted mb-0.5">Selecciona el comercio</label>
              <select
                id="comercioInput"
                value={comercioInput}
                onChange={(e) => setComercioInput(e.target.value)}
                className="mt-1 block w-full p-2.5 border border-grey-200 bg-white rounded-md text-sm text-textHeader focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {COMERCIO_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} disabled={option.value === ""}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <FormInput id="productoInput" label="Selecciona el producto" value={productoInput} onChange={(e) => setProductoInput(e.target.value)} placeholder="Ej: Ades"/>
            <FormInput id="varianteInput" label="Variante" value={varianteInput} onChange={(e) => setVarianteInput(e.target.value)} placeholder="Ej: 946 ml"/>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <ReadOnlyDetail label="URL del comercio (Automático)" value={urlComercioInput} />
              <FormInput id="urlProductoInput" label="URL del Producto (para referencia)" value={urlProductoInput} onChange={(e) => setUrlProductoInput(e.target.value)} />
              <FormInput id="marcaProductoInput" label="Marca del producto" value={marcaProductoInput} onChange={(e) => setMarcaProductoInput(e.target.value)} />
              <FormInput id="categoriaInput" label="Categoría" value={categoriaInput} onChange={(e) => setCategoriaInput(e.target.value)} />
              <FormInput id="unidadMedidaInput" label={`Unidad de medida producto en ${comercioInput || 'comercio'}`} value={unidadMedidaInput} onChange={(e) => setUnidadMedidaInput(e.target.value)} />
              <FormInput id="saborProductoInput" label="Sabor del producto" value={saborProductoInput} onChange={(e) => setSaborProductoInput(e.target.value)} />
              <FormInput id="skuDelProductoInput" label="SKU del producto" value={skuDelProductoInput} onChange={(e) => setSkuDelProductoInput(e.target.value)} />
              <FormInput id="upcDeProductoInput" label="UPC de producto" value={upcDeProductoInput} onChange={(e) => setUpcDeProductoInput(e.target.value)} />
              <ReadOnlyDetail label="Tamaño (Referencia)" value={varianteInput} />
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-grey-100">
             {feedbackUIMessage && (
              <p 
                className={`mb-4 text-sm p-3 rounded-md whitespace-pre-line ${getFeedbackClasses()}`}
                role="alert"
                aria-live="assertive"
              >
                {feedbackUIMessage}
              </p>
            )}
            
            <button
              onClick={handleEnviarDatos}
              disabled={isLoading || dataSenderStatus === 'enviando'}
              className="w-full px-6 py-3 bg-[#088395] text-white font-medium rounded-md shadow-sm hover:bg-[#077080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#088395] disabled:bg-grey-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {(isLoading || dataSenderStatus === 'enviando') ? (
                <>
                  <LoadingSpinner size="sm" color="text-white" />
                  <span className="ml-2">Enviando Datos...</span>
                </>
              ) : (
                'Scrapping' 
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ScrapingView;
