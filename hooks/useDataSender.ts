import { useState } from "react";
import { LOCAL_STORAGE_CORS_PROXY_URL_KEY, PROXY_BASE } from '../constants';

type SenderStatus = "idle" | "enviando" | "ok" | "err" | "skipped";

const getEffectiveProxyUrl = (): string => {
  const userDefinedProxy = localStorage.getItem(LOCAL_STORAGE_CORS_PROXY_URL_KEY);
  if (userDefinedProxy && userDefinedProxy.trim() !== '') {
    try {
      new URL(userDefinedProxy.trim()); 
      return userDefinedProxy.trim();
    } catch (e) {
      console.warn(`Invalid user-defined proxy URL in localStorage: "${userDefinedProxy}".`);
    }
  }
  if (PROXY_BASE && PROXY_BASE.trim() !== '') {
     try {
      new URL(PROXY_BASE.trim()); 
      return PROXY_BASE.trim();
    } catch (e) {
      console.error(`Invalid default PROXY_BASE constant: "${PROXY_BASE}".`);
      return ''; 
    }
  }
  console.error("No valid proxy URL is configured.");
  return '';
};

export function useDataSender() {
  const [estado, setEstado] = useState<SenderStatus>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function enviar(data: Record<string, any>) {
    setFeedback(null); 
    if (data.comercio === "Walmart Express") { 
      const endpoint = getEffectiveProxyUrl();
      if (!endpoint) {
        setEstado("err");
        setFeedback("Error: La URL de envío no está configurada correctamente.");
        return; 
      }
      const requestBody = {
        comercio: data.comercio || "",
        producto: data.producto || "",
        variante: data.variante || "",
        marca: data.marca || "",
        urlComercio: data.urlComercio || "",
        fechaHoraEnvio: new Date().toISOString() 
      };
      setEstado("enviando");
      setFeedback("Enviando datos de Walmart Express...");
      try {
        const response = await fetch(endpoint, {
          method : "POST",
          headers: { "Content-Type": "application/json" },
          body   : JSON.stringify(requestBody)
        });
        if (response.ok) {
          setEstado("ok");
          setFeedback("Proceso de raspado de datos iniciado");
        } else {
          setEstado("err");
          setFeedback(`ERROR: Falló el envío de datos de Walmart Express (Estado: ${response.status}).`);
        }
      } catch (error) {
        setEstado("err");
        setFeedback("ERROR: Problema de red o excepción al enviar datos de Walmart Express.");
      }
    } else {
      setEstado("skipped");
      setFeedback(`Los datos para '${data.comercio}' no se envían a Walmart Express. Se procesarán de otra forma.`);
    }
  }
  return { estado, enviar, feedback };
}
