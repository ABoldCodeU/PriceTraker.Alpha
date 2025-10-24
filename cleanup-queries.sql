-- ============================================================================
-- AZULIK Chat Database Cleanup Queries
-- Versión: 1.0
-- Descripción: Queries para limpiar mensajes malformados
-- ============================================================================

-- ====================
-- ANÁLISIS PREVIO
-- ====================

-- Ver total de mensajes antes de la limpieza
SELECT COUNT(*) as total_messages FROM messages;

-- Ver mensajes problemáticos por categoría
SELECT
    'Fragmentos (< 10 chars)' as category,
    COUNT(*) as count
FROM messages
WHERE LENGTH(content) < 10

UNION ALL

SELECT
    'URLs solas',
    COUNT(*)
FROM messages
WHERE content ~ '^https?://[^\s]{1,20}$'

UNION ALL

SELECT
    'Solo símbolos',
    COUNT(*)
FROM messages
WHERE content ~ '^[\s\*\-_\[\]\(\)\.]+$'

UNION ALL

SELECT
    'Contienen "taskade"',
    COUNT(*)
FROM messages
WHERE content ILIKE '%taskade%'

UNION ALL

SELECT
    'Timestamps futuros',
    COUNT(*)
FROM messages
WHERE ts > NOW() + INTERVAL '1 hour';

-- Ver ejemplos de mensajes problemáticos
SELECT
    'Fragmento' as tipo,
    content,
    LENGTH(content) as len,
    ts
FROM messages
WHERE LENGTH(content) < 10
LIMIT 5;

-- ====================
-- LIMPIEZA
-- ====================

-- PASO 1: Borrar fragmentos (menos de 10 caracteres)
-- Estos son mensajes incompletos como "hola con", "**J", etc.
DELETE FROM messages
WHERE LENGTH(content) < 10;

-- PASO 2: Borrar URLs solas muy cortas
-- URLs sin contexto que no aportan valor
DELETE FROM messages
WHERE content ~ '^https?://[^\s]{1,20}$';

-- PASO 3: Borrar mensajes con solo símbolos
-- Mensajes que solo contienen *, -, _, [], (), etc.
DELETE FROM messages
WHERE content ~ '^[\s\*\-_\[\]\(\)\.]+$';

-- PASO 4: Borrar referencias a "taskade"
-- Mensajes que mencionan taskade (herramienta externa no deseada)
DELETE FROM messages
WHERE content ILIKE '%taskade%';

-- PASO 5: Borrar timestamps futuros
-- Mensajes con timezone incorrecto (UTC+5 en vez de America/Cancun)
DELETE FROM messages
WHERE ts > NOW() + INTERVAL '1 hour';

-- PASO 6: Limpiar conversaciones huérfanas
-- Conversaciones sin mensajes asociados
DELETE FROM conversations c
WHERE NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);

-- ====================
-- VERIFICACIÓN
-- ====================

-- Ver total después de la limpieza
SELECT COUNT(*) as total_messages_after FROM messages;

-- Ver últimos 10 mensajes
SELECT
    id,
    role,
    LEFT(content, 80) as content,
    ts,
    LENGTH(content) as len
FROM messages
ORDER BY ts DESC
LIMIT 10;

-- Ver distribución por rol
SELECT
    role,
    COUNT(*) as count,
    AVG(LENGTH(content))::int as avg_length,
    MIN(LENGTH(content)) as min_length,
    MAX(LENGTH(content)) as max_length
FROM messages
GROUP BY role;

-- Ver conversaciones activas
SELECT
    c.id,
    c.created_at,
    COUNT(m.id) as message_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.created_at
ORDER BY c.created_at DESC
LIMIT 10;

-- ====================
-- QUERIES ÚTILES PARA MANTENIMIENTO
-- ====================

-- Ver mensajes sospechosos (cortos pero no eliminados)
SELECT
    id,
    role,
    content,
    LENGTH(content) as len,
    ts
FROM messages
WHERE LENGTH(content) BETWEEN 10 AND 15
ORDER BY ts DESC
LIMIT 20;

-- Ver mensajes con prefijos (para verificar limpieza)
SELECT
    content
FROM messages
WHERE
    content ILIKE 'Invitado%' OR
    content ILIKE 'Azulik%' OR
    content ILIKE 'Assistik%' OR
    content ILIKE 'Usuario%'
LIMIT 10;

-- Ver mensajes duplicados
SELECT
    content,
    COUNT(*) as count
FROM messages
GROUP BY content
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 10;

-- Ver actividad por fecha (últimos 7 días)
SELECT
    DATE(ts) as date,
    COUNT(*) as messages,
    COUNT(DISTINCT conversation_id) as conversations
FROM messages
WHERE ts > NOW() - INTERVAL '7 days'
GROUP BY DATE(ts)
ORDER BY date DESC;

-- ====================
-- BACKUP Y RESTORE
-- ====================

-- Crear tabla de backup (ejecutar antes de limpieza)
CREATE TABLE messages_backup AS
SELECT * FROM messages;

-- Restaurar desde backup (si algo sale mal)
-- TRUNCATE messages;
-- INSERT INTO messages SELECT * FROM messages_backup;

-- Eliminar backup
-- DROP TABLE messages_backup;

-- ====================
-- ÍNDICES RECOMENDADOS (si no existen)
-- ====================

-- Índice para búsquedas por conversation_id
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
ON messages(conversation_id);

-- Índice para ordenar por timestamp
CREATE INDEX IF NOT EXISTS idx_messages_ts
ON messages(ts DESC);

-- Índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_messages_role
ON messages(role);

-- Índice para búsquedas por contenido (texto completo)
CREATE INDEX IF NOT EXISTS idx_messages_content_gin
ON messages USING gin(to_tsvector('spanish', content));

-- ====================
-- MANTENIMIENTO AUTOMÁTICO
-- ====================

-- Función para limpiar mensajes antiguos (> 90 días)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM messages
    WHERE ts < NOW() - INTERVAL '90 days';

    DELETE FROM conversations c
    WHERE NOT EXISTS (
        SELECT 1 FROM messages m WHERE m.conversation_id = c.id
    );
END;
$$ LANGUAGE plpgsql;

-- Ejecutar limpieza de mensajes antiguos
-- SELECT cleanup_old_messages();

-- ====================
-- ESTADÍSTICAS
-- ====================

-- Ver tamaño de las tablas
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('messages', 'conversations')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Ver estadísticas de la base de datos
SELECT
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(*) FROM conversations) as total_conversations,
    (SELECT COUNT(*) FROM messages WHERE role = 'user') as user_messages,
    (SELECT COUNT(*) FROM messages WHERE role = 'assistant') as assistant_messages,
    (SELECT AVG(LENGTH(content))::int FROM messages) as avg_message_length,
    (SELECT MIN(ts) FROM messages) as first_message,
    (SELECT MAX(ts) FROM messages) as last_message;
