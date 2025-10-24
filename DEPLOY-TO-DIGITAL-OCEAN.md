# Guía de Deployment a Digital Ocean - AZULIK Chat Fixes

## Resumen de Cambios

Esta guía te ayudará a aplicar los siguientes fixes a tu servidor de chat en Digital Ocean:

### Problemas Resueltos
- ✅ **Fragmentos de mensajes** (ej: "hola con", "**J")
- ✅ **Timestamps incorrectos** (UTC+5 en vez de America/Cancun)
- ✅ **Referencias a "taskade"** en la base de datos
- ✅ **Mensajes con solo símbolos** o URLs solas
- ✅ **Prefijos no deseados** (Invitado, Azulik - Assistik)

### Mejoras Implementadas
- 🔧 **Delay de 4 segundos** para evitar fragmentos
- 🌍 **Timezone correcto** (America/Cancun / Tulum)
- 📏 **Longitud mínima** de 10 caracteres por mensaje
- 🚫 **Blacklist** de patrones no deseados
- 🧹 **Limpieza automática** de prefijos

---

## Archivos Incluidos

```
├── chat-interceptor-v2.6.js    # Interceptor JavaScript mejorado
├── fix-database-NOW.sh         # Script automático de limpieza
├── cleanup-queries.sql         # Queries SQL para limpieza manual
└── DEPLOY-TO-DIGITAL-OCEAN.md  # Esta guía
```

---

## Opción 1: Deployment Automático (Recomendado)

### Requisitos Previos
- Acceso SSH al servidor: `chat.soluciones-ia.info`
- Usuario: `root`
- Herramientas instaladas: `psql`, `pg_dump`, `nginx`

### Pasos

#### 1. Subir archivos al servidor

Desde tu computadora local (Windows PowerShell o CMD):

```powershell
# Navegar a la carpeta del proyecto
cd C:\Users\LENKABITS\PriceTraker.Alpha

# Subir el interceptor
scp chat-interceptor-v2.6.js root@chat.soluciones-ia.info:/root/

# Subir el script de limpieza
scp fix-database-NOW.sh root@chat.soluciones-ia.info:/root/
```

#### 2. Conectarte al servidor

```bash
ssh root@chat.soluciones-ia.info
```

#### 3. Ejecutar el script automático

```bash
cd /root
chmod +x fix-database-NOW.sh
./fix-database-NOW.sh
```

El script realizará automáticamente:
1. ✅ Backup de la base de datos
2. 📊 Análisis de mensajes problemáticos
3. 🧹 Limpieza de mensajes malformados
4. 🔄 Actualización del interceptor a v2.6
5. ⚙️ Recarga de Nginx
6. ✔️ Verificación final

#### 4. Verificación en el navegador

1. Abre: https://chat.soluciones-ia.info
2. Presiona **F12** para abrir la consola
3. Deberías ver: `🔍 AZULIK Chat Interceptor v2.6`
4. Envía un mensaje de prueba
5. Espera 4 segundos
6. Verifica en los logs: `✅ ASSISTANT: tu mensaje...`

---

## Opción 2: Deployment Manual (Paso a Paso)

### Paso 1: Conectarte al Servidor

```bash
ssh root@chat.soluciones-ia.info
```

### Paso 2: Backup de la Base de Datos

```bash
# Crear directorio de backups
mkdir -p /root/backups

# Crear backup
pg_dump "postgresql://neondb_owner:npg_oAgZej74WEQl@ep-gentle-hill-a5dmte40m-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" \
  -t messages -t conversations \
  > /root/backups/messages_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 3: Limpiar la Base de Datos

```bash
# Conectar a la base de datos
psql 'postgresql://neondb_owner:npg_oAgZej74WEQl@ep-gentle-hill-a5dmte40m-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
```

Ejecuta las siguientes queries SQL:

```sql
-- Ver total antes
SELECT COUNT(*) FROM messages;

-- 1. Borrar fragmentos (< 10 caracteres)
DELETE FROM messages WHERE LENGTH(content) < 10;

-- 2. Borrar URLs solas
DELETE FROM messages WHERE content ~ '^https?://[^\s]{1,20}$';

-- 3. Borrar solo símbolos
DELETE FROM messages WHERE content ~ '^[\s\*\-_\[\]\(\)\.]+$';

-- 4. Borrar referencias a "taskade"
DELETE FROM messages WHERE content ILIKE '%taskade%';

-- 5. Borrar timestamps futuros (mal timezone)
DELETE FROM messages WHERE ts > NOW() + INTERVAL '1 hour';

-- 6. Limpiar conversaciones huérfanas
DELETE FROM conversations c
WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);

-- Ver total después
SELECT COUNT(*) FROM messages;

-- Ver últimos 10 mensajes
SELECT id, role, LEFT(content, 60), ts
FROM messages
ORDER BY ts DESC
LIMIT 10;

-- Salir
\q
```

### Paso 4: Subir el Interceptor v2.6

Desde tu computadora local:

```bash
scp chat-interceptor-v2.6.js root@chat.soluciones-ia.info:/var/www/azulik/chat-interceptor.js
```

### Paso 5: Recargar Nginx

En el servidor:

```bash
# Verificar configuración
nginx -t

# Si está OK, recargar
nginx -s reload
```

### Paso 6: Verificación

```bash
# Ver últimos mensajes en la base de datos
psql 'postgresql://neondb_owner:npg_oAgZej74WEQl@ep-gentle-hill-a5dmte40m-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require' -c "
SELECT
    role,
    LEFT(content, 80) as content,
    ts
FROM messages
ORDER BY ts DESC
LIMIT 5;
"
```

---

## Verificación Completa

### En la Base de Datos

Los mensajes deben cumplir:
- ✅ Longitud mínima de 10 caracteres
- ✅ Sin prefijos como "Invitado" o "Azulik - Assistik"
- ✅ Timestamp correcto (hora de Tulum, no UTC+5)
- ✅ Sin referencias a "taskade"
- ✅ Sin fragmentos incompletos

### En el Navegador

1. Abre: https://chat.soluciones-ia.info
2. Abre la consola del navegador (F12)
3. Verifica que aparezca:
   ```
   🔍 AZULIK Chat Interceptor v2.6 cargando...
   ✅ AZULIK Chat Interceptor v2.6 iniciado
   ⏱️ Delay configurado: 4000 ms
   🌍 Timezone: America/Cancun
   📏 Longitud mínima: 10 caracteres
   ```

4. Envía un mensaje de prueba (por ejemplo: "Hola, esto es una prueba")
5. Espera 4 segundos
6. Verifica en los logs de la consola:
   ```
   👤 USER detectado: Hola, esto es una prueba
   📤 Enviando a API: {...}
   ✅ USER: Hola, esto es una prueba
   ```

7. La respuesta del asistente también debería aparecer:
   ```
   🤖 ASSISTANT detectado: [respuesta]
   ✅ ASSISTANT: [respuesta]
   ```

---

## Configuración de Nginx

Si necesitas verificar o actualizar la configuración de Nginx para servir el interceptor:

```nginx
# Archivo: /etc/nginx/sites-available/azulik-chat

server {
    listen 80;
    server_name chat.soluciones-ia.info;

    root /var/www/azulik;
    index index.html;

    # Servir el interceptor
    location /chat-interceptor.js {
        alias /var/www/azulik/chat-interceptor.js;
        add_header Content-Type application/javascript;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API de mensajes
    location /api/messages {
        # Tu configuración de proxy_pass aquí
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Después de modificar:

```bash
nginx -t
systemctl reload nginx
```

---

## Troubleshooting

### El interceptor no se carga

**Problema:** No aparece el mensaje en consola

**Solución:**
1. Verifica que el archivo existe:
   ```bash
   ls -la /var/www/azulik/chat-interceptor.js
   ```

2. Verifica permisos:
   ```bash
   chmod 644 /var/www/azulik/chat-interceptor.js
   ```

3. Limpia caché del navegador (Ctrl + Shift + R)

### Los mensajes siguen fragmentados

**Problema:** Sigues viendo fragmentos como "hola con"

**Solución:**
1. Verifica el delay en la consola (debe ser 4000ms)
2. Asegúrate de que el interceptor v2.6 está cargado
3. Limpia la caché del navegador completamente

### Timestamps incorrectos

**Problema:** La hora sigue siendo incorrecta

**Solución:**
1. Verifica en consola que timezone sea "America/Cancun"
2. Verifica en la base de datos:
   ```sql
   SELECT ts, NOW() FROM messages ORDER BY ts DESC LIMIT 1;
   ```
3. La diferencia debe ser razonable (no 5 horas)

### Error al conectar a la base de datos

**Problema:** `psql: error: connection failed`

**Solución:**
1. Verifica que tienes acceso a internet desde el servidor
2. Verifica la URL de conexión (puede haber expirado)
3. Verifica que `psql` está instalado:
   ```bash
   apt update && apt install postgresql-client -y
   ```

### Nginx no recarga

**Problema:** `nginx: [error] invalid PID`

**Solución:**
```bash
systemctl restart nginx
```

---

## Mantenimiento

### Limpieza periódica

Ejecuta estas queries mensualmente para mantener la base limpia:

```sql
-- Eliminar mensajes muy antiguos (> 90 días)
DELETE FROM messages
WHERE ts < NOW() - INTERVAL '90 days';

-- Limpiar conversaciones huérfanas
DELETE FROM conversations c
WHERE NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
);
```

### Monitoreo

```bash
# Ver estadísticas de mensajes
psql "$DB_URL" -c "
SELECT
    DATE(ts) as date,
    COUNT(*) as messages,
    COUNT(DISTINCT conversation_id) as conversations
FROM messages
WHERE ts > NOW() - INTERVAL '7 days'
GROUP BY DATE(ts)
ORDER BY date DESC;
"
```

---

## Logs y Debugging

### Logs de Nginx

```bash
# Ver logs en tiempo real
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Logs del Interceptor

Los logs aparecen en la consola del navegador (F12):
- 🔍 Inicialización
- 👤 Mensajes del usuario detectados
- 🤖 Mensajes del asistente detectados
- 📤 Mensajes enviados a la API
- ✅ Confirmación de envío
- ❌ Errores

---

## Recursos Adicionales

### Archivos de Configuración

- **Interceptor:** `/var/www/azulik/chat-interceptor.js`
- **Nginx config:** `/etc/nginx/sites-available/azulik-chat`
- **Backups:** `/root/backups/`

### Conexiones

- **Servidor SSH:** `root@chat.soluciones-ia.info`
- **Chat URL:** https://chat.soluciones-ia.info
- **Base de datos:** Neon PostgreSQL (ver connection string arriba)

### Comandos Útiles

```bash
# Ver procesos de Nginx
ps aux | grep nginx

# Ver conexiones activas
netstat -tulpn | grep :80

# Ver uso de disco
df -h

# Ver espacio de backups
du -sh /root/backups/

# Limpiar backups antiguos (> 30 días)
find /root/backups/ -name "*.sql" -mtime +30 -delete
```

---

## Contacto y Soporte

Si encuentras algún problema durante el deployment:

1. Revisa los logs (Nginx + consola del navegador)
2. Verifica que todos los archivos estén en su lugar
3. Asegúrate de que los servicios estén corriendo
4. Consulta la sección de Troubleshooting

---

## Changelog

### v2.6 (2024-10-24)
- ✅ Timezone correcto (America/Cancun)
- ✅ Delay aumentado a 4 segundos
- ✅ Filtro "taskade" agregado
- ✅ Longitud mínima 10 caracteres
- ✅ Limpieza automática de prefijos

### v2.5 (anterior)
- Limpieza de prefijos básica
- Delay de 2 segundos
- Sin validación de longitud mínima

---

**Última actualización:** 24 de Octubre, 2024
**Versión:** 2.6
**Autor:** Claude Code Assistant
