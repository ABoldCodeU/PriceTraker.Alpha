/**
 * AZULIK Chat Interceptor v2.6
 *
 * Fixes aplicados:
 * - Timezone correcto (America/Cancun / Tulum)
 * - Delay aumentado a 4s (anti-fragmentos)
 * - Filtro "taskade" en blacklist
 * - Longitud mínima 10 caracteres
 * - Limpieza de prefijos (Invitado, Azulik - Assistik)
 */

(function() {
    'use strict';

    console.log('🔍 AZULIK Chat Interceptor v2.6 cargando...');

    // ==================== CONFIGURACIÓN ====================
    const CONFIG = {
        API_URL: 'https://chat.soluciones-ia.info/api/messages',
        DELAY_MS: 4000,  // 4 segundos para evitar fragmentos
        MIN_LENGTH: 10,  // Longitud mínima del mensaje
        TIMEZONE: 'America/Cancun',  // Timezone de Tulum
        BLACKLIST_PATTERNS: [
            /taskade/i,
            /^\s*$/,  // Solo espacios
            /^[\*\-_\[\]\(\)\.]+$/,  // Solo símbolos
            /^https?:\/\/[^\s]{1,20}$/  // URLs solas cortas
        ],
        PREFIX_PATTERNS: [
            /^Invitado\s*[-:]?\s*/i,
            /^Azulik\s*[-:]?\s*Assistik\s*[-:]?\s*/i,
            /^Assistik\s*[-:]?\s*/i,
            /^Usuario\s*[-:]?\s*/i,
            /^User\s*[-:]?\s*/i
        ]
    };

    // ==================== UTILIDADES ====================

    /**
     * Obtiene timestamp en timezone de Tulum
     */
    function getCurrentTimestamp() {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: CONFIG.TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(now);
        const get = (type) => parts.find(p => p.type === type)?.value || '';

        // Formato: YYYY-MM-DD HH:MM:SS
        return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
    }

    /**
     * Limpia prefijos no deseados del contenido
     */
    function cleanPrefix(content) {
        let cleaned = content;
        for (const pattern of CONFIG.PREFIX_PATTERNS) {
            cleaned = cleaned.replace(pattern, '');
        }
        return cleaned.trim();
    }

    /**
     * Valida si el contenido debe ser guardado
     */
    function isValidContent(content) {
        // Verificar longitud mínima
        if (content.length < CONFIG.MIN_LENGTH) {
            console.log('❌ Contenido muy corto:', content.length, 'caracteres');
            return false;
        }

        // Verificar blacklist
        for (const pattern of CONFIG.BLACKLIST_PATTERNS) {
            if (pattern.test(content)) {
                console.log('❌ Contenido en blacklist:', content.substring(0, 50));
                return false;
            }
        }

        return true;
    }

    /**
     * Envía mensaje a la API
     */
    async function sendToAPI(role, content, conversationId) {
        const cleanedContent = cleanPrefix(content);

        if (!isValidContent(cleanedContent)) {
            console.log('⏭️ Mensaje ignorado por validación');
            return;
        }

        const payload = {
            conversation_id: conversationId,
            role: role,
            content: cleanedContent,
            ts: getCurrentTimestamp()
        };

        console.log('📤 Enviando a API:', {
            role,
            content: cleanedContent.substring(0, 80) + (cleanedContent.length > 80 ? '...' : ''),
            ts: payload.ts
        });

        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('✅', role.toUpperCase() + ':', cleanedContent.substring(0, 60));
            } else {
                console.error('❌ Error en API:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
        }
    }

    // ==================== INTERCEPTORES ====================

    let messageBuffer = {
        user: { content: '', timer: null },
        assistant: { content: '', timer: null }
    };

    let conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 Conversation ID:', conversationId);

    /**
     * Procesa mensaje con delay para evitar fragmentos
     */
    function bufferMessage(role, content) {
        const buffer = messageBuffer[role];

        // Cancelar timer anterior si existe
        if (buffer.timer) {
            clearTimeout(buffer.timer);
        }

        // Acumular contenido
        buffer.content += content;

        // Programar envío después del delay
        buffer.timer = setTimeout(() => {
            if (buffer.content.trim()) {
                sendToAPI(role, buffer.content.trim(), conversationId);
                buffer.content = '';
            }
            buffer.timer = null;
        }, CONFIG.DELAY_MS);
    }

    // ==================== OBSERVER PARA DOM ====================

    /**
     * Observa mensajes del usuario en el chat
     */
    function observeUserMessages() {
        const chatContainer = document.querySelector('.claude-chat-messages') ||
                             document.querySelector('[data-testid="chat-messages"]') ||
                             document.querySelector('.messages-container');

        if (!chatContainer) {
            console.warn('⚠️ No se encontró contenedor de mensajes');
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        // Buscar mensajes del usuario
                        const userMessages = node.querySelectorAll('[data-role="user"], .user-message, .message-user');
                        userMessages.forEach((msg) => {
                            const content = msg.textContent?.trim();
                            if (content) {
                                console.log('👤 USER detectado:', content.substring(0, 50));
                                bufferMessage('user', content);
                            }
                        });

                        // Buscar mensajes del asistente
                        const assistantMessages = node.querySelectorAll('[data-role="assistant"], .assistant-message, .message-assistant');
                        assistantMessages.forEach((msg) => {
                            const content = msg.textContent?.trim();
                            if (content) {
                                console.log('🤖 ASSISTANT detectado:', content.substring(0, 50));
                                bufferMessage('assistant', content);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(chatContainer, {
            childList: true,
            subtree: true
        });

        console.log('👀 Observer activado en:', chatContainer.className);
    }

    // ==================== INTERCEPCIÓN DE FETCH ====================

    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);

        // Interceptar respuestas del chat
        if (args[0] && typeof args[0] === 'string' &&
            (args[0].includes('/chat') || args[0].includes('/api/messages'))) {

            const clonedResponse = response.clone();
            clonedResponse.json().then(data => {
                if (data.message) {
                    console.log('🔍 Respuesta interceptada');
                    bufferMessage('assistant', data.message);
                }
            }).catch(() => {
                // Ignorar errores de parsing
            });
        }

        return response;
    };

    // ==================== INICIALIZACIÓN ====================

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeUserMessages);
    } else {
        observeUserMessages();
    }

    // Reintentar cada 5 segundos si no se encuentra el contenedor
    setInterval(() => {
        if (!document.querySelector('.claude-chat-messages, [data-testid="chat-messages"], .messages-container')) {
            observeUserMessages();
        }
    }, 5000);

    console.log('✅ AZULIK Chat Interceptor v2.6 iniciado');
    console.log('⏱️ Delay configurado:', CONFIG.DELAY_MS, 'ms');
    console.log('🌍 Timezone:', CONFIG.TIMEZONE);
    console.log('📏 Longitud mínima:', CONFIG.MIN_LENGTH, 'caracteres');

})();
