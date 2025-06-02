import React, { useState, useEffect } from 'react';
import Card from './common/Card';
// EyeIcon and EyeSlashIcon might not be needed if API key display is removed
// For now, let's keep them in case they are used for proxy URL display if it were sensitive
import { EyeIcon, EyeSlashIcon } from './icons/FeatureIcons'; 
import { LOCAL_STORAGE_CORS_PROXY_URL_KEY, PROXY_BASE } from '../constants';

const SuperuserView: React.FC = () => {
  const [proxyBaseUrl, setProxyBaseUrl] = useState<string>('');
  const [tempProxyBaseUrl, setTempProxyBaseUrl] = useState<string>('');
  const [proxyFeedback, setProxyFeedback] = useState<string>('');

  useEffect(() => {
    const storedProxyUrl = localStorage.getItem(LOCAL_STORAGE_CORS_PROXY_URL_KEY);
    setProxyBaseUrl(storedProxyUrl || ''); 
    setTempProxyBaseUrl(storedProxyUrl || PROXY_BASE);
  }, []);

  const handleSaveProxyUrl = () => {
    if (!tempProxyBaseUrl.trim()) {
      setProxyFeedback('La URL no puede estar vacía.');
      setTimeout(() => setProxyFeedback(''), 3000);
      return;
    }
    try {
      new URL(tempProxyBaseUrl.trim());
    } catch (error) {
      setProxyFeedback('Formato de URL inválido.');
      setTimeout(() => setProxyFeedback(''), 3000);
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_CORS_PROXY_URL_KEY, tempProxyBaseUrl.trim());
    setProxyBaseUrl(tempProxyBaseUrl.trim());
    setProxyFeedback('¡URL guardada correctamente!');
    setTimeout(() => setProxyFeedback(''), 3000);
  };

  const handleClearProxyUrl = () => {
    localStorage.removeItem(LOCAL_STORAGE_CORS_PROXY_URL_KEY);
    setProxyBaseUrl('');
    setTempProxyBaseUrl(PROXY_BASE);
    setProxyFeedback('URL eliminada. Se usará la predeterminada si es válida.');
    setTimeout(() => setProxyFeedback(''), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-textHeader mb-4 text-center">
            Superuser Developer Mode
          </h2>
          <p className="text-textMuted mb-6 text-center">
            Este modo proporciona acceso a herramientas e información para desarrolladores.
            Estás en modo desarrollador. Para salir, cierra sesión e ingresa con credenciales de usuario estándar.
          </p>

          {/* Configuración de URL personalizada */}
          <div className="mt-8 border-t border-grey-100 pt-6">
            <h3 className="text-lg font-medium text-textHeader mb-3">Configuración de URL personalizada</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="proxyBaseUrlInput" className="block text-sm font-medium text-textMuted mb-1">
                  Ingresa la URL personalizada:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="proxyBaseUrlInput"
                    type="text"
                    value={tempProxyBaseUrl}
                    onChange={(e) => setTempProxyBaseUrl(e.target.value)}
                    placeholder={`Predeterminada: ${PROXY_BASE}`}
                    className="mt-1 block w-full px-3 py-2 border border-grey-200 bg-white rounded-md text-sm focus:outline-none focus:border-lavender-700"
                  />
                  <button
                    onClick={handleSaveProxyUrl}
                    className="px-4 py-2 bg-lavender-700 text-white text-sm font-medium rounded-md hover:bg-opacity-90 transition-colors whitespace-nowrap"
                  >
                    Guardar URL
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-textMuted mb-1">URL activa actual:</p>
                <div className="p-3 bg-gray-50 border border-grey-200 rounded-md min-h-[40px]">
                  <span className="text-sm text-textHeader font-mono">
                    {proxyBaseUrl || `Predeterminada: ${PROXY_BASE} (si es válida)`}
                  </span>
                </div>
              </div>
              {proxyBaseUrl && (
                <button
                  onClick={handleClearProxyUrl}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
                >
                  Eliminar personalizada (usar predeterminada)
                </button>
              )}
              {proxyFeedback && (
                <p className={`text-sm mt-2 ${proxyFeedback.includes('correctamente') ? 'text-green-600' : proxyFeedback.includes('eliminada') || proxyFeedback.includes('Predeterminada') ? 'text-blue-600' : 'text-red-600'}`}>
                  {proxyFeedback}
                </p>
              )}
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
};

export default SuperuserView;