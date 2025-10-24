# Herramientas de Diagnóstico - AZULIK Chat Server

## 📋 Resumen

Este conjunto de herramientas te permite diagnosticar, monitorear y resolver problemas con tu servidor de chat en Digital Ocean.

---

## 🛠️ Herramientas Disponibles

### 1. `check-from-outside.sh` - Verificación Externa
**Úsalo cuando:** El servidor se cayó y quieres verificar si está vivo SIN conectarte por SSH

**Dónde ejecutar:** En tu PC local (Windows/Mac/Linux)

**Qué hace:**
- ✅ Verifica DNS
- ✅ Hace ping al servidor
- ✅ Prueba HTTP/HTTPS (puertos 80/443)
- ✅ Verifica SSH (puerto 22)
- ✅ Descarga y verifica el interceptor
- ✅ Prueba la API de mensajes
- ✅ Simula un flujo completo de usuario

**Cómo usar:**
```bash
# Desde tu PC
cd PriceTraker.Alpha
chmod +x check-from-outside.sh
./check-from-outside.sh
```

**Resultado:** Te dice si el servidor está UP o DOWN y qué servicios responden.

---

### 2. `check-server-health.sh` - Diagnóstico Completo
**Úsalo cuando:** Puedes conectarte por SSH y quieres un análisis completo

**Dónde ejecutar:** Dentro del servidor (por SSH)

**Qué hace:**
- ✅ Verifica conectividad
- ✅ Analiza recursos (CPU, memoria, disco)
- ✅ Revisa estado de Nginx
- ✅ Prueba conexión a base de datos
- ✅ Verifica archivos de la aplicación
- ✅ Analiza logs del sistema
- ✅ Revisa seguridad
- ✅ Da recomendaciones automáticas
- ✅ Genera reporte completo

**Cómo usar:**
```bash
# 1. Subir al servidor
scp check-server-health.sh root@chat.soluciones-ia.info:/root/

# 2. Conectar y ejecutar
ssh root@chat.soluciones-ia.info
cd /root
chmod +x check-server-health.sh
./check-server-health.sh
```

**Resultado:** Reporte detallado de TODO el estado del servidor + archivo de log.

---

### 3. `monitor-server.sh` - Monitoreo Continuo
**Úsalo cuando:** Quieres vigilar el servidor 24/7 y auto-reparar problemas

**Dónde ejecutar:** Dentro del servidor (por SSH)

**Qué hace:**
- ✅ Monitorea continuamente cada 60 segundos
- ✅ Reinicia Nginx automáticamente si se cae
- ✅ Alerta cuando hay poco espacio/memoria
- ✅ Detecta procesos zombie
- ✅ Guarda logs de todo
- ✅ Puede instalarse como servicio permanente

**Cómo usar:**

**Opción A: Ejecutar una vez (prueba)**
```bash
ssh root@chat.soluciones-ia.info
cd /root
chmod +x monitor-server.sh
./monitor-server.sh once
```

**Opción B: Ejecutar continuamente (daemon)**
```bash
./monitor-server.sh daemon
# Presiona Ctrl+C para detener
```

**Opción C: Instalar como servicio (recomendado)**
```bash
./monitor-server.sh install

# Ver logs en tiempo real
journalctl -u azulik-monitor -f

# Ver estado
systemctl status azulik-monitor

# Detener
systemctl stop azulik-monitor

# Reiniciar
systemctl restart azulik-monitor
```

**Resultado:** El servidor se auto-vigila y auto-repara problemas comunes.

---

### 4. `TROUBLESHOOTING-SERVER-CRASH.md` - Guía de Troubleshooting
**Úsalo cuando:** El servidor se cayó y no sabes por qué ni cómo arreglarlo

**Qué contiene:**
- 📖 Diagnóstico paso a paso
- 🔥 Causas comunes de caídas:
  - Memoria llena (OOM)
  - Disco lleno
  - Nginx caído
  - Procesos colgados
  - Ataque DDoS
  - Base de datos inaccesible
- 💡 Soluciones inmediatas y permanentes
- ⚡ Comandos de emergencia
- 🛡️ Configuración preventiva
- ✅ Checklist de recuperación

**Cómo usar:**
```bash
# Leer desde el repo
cat TROUBLESHOOTING-SERVER-CRASH.md | less

# O abrir en tu editor favorito
```

**Resultado:** Instrucciones detalladas para resolver cualquier problema común.

---

## 🚨 Guía Rápida: "Se Me Cayó el Servidor"

### Paso 1: Verificar si está vivo (desde tu PC)
```bash
./check-from-outside.sh
```

Si dice "SERVIDOR INACCESIBLE" → ir a Paso 2
Si dice "SERVIDOR ACTIVO" pero el chat no funciona → ir a Paso 3

### Paso 2: Servidor completamente caído
1. Ir al panel de Digital Ocean: https://cloud.digitalocean.com/
2. Ver el droplet
3. Si está "Powered Off" → Encenderlo
4. Si está activo pero no responde → Power → Reboot

### Paso 3: Servidor vivo pero con problemas
```bash
ssh root@chat.soluciones-ia.info
cd /root
./check-server-health.sh
```

Revisa el reporte y las recomendaciones. Problemas comunes:

**Nginx caído:**
```bash
systemctl restart nginx
```

**Memoria llena:**
```bash
free -h  # Ver memoria
sync; echo 3 > /proc/sys/vm/drop_caches  # Liberar caché
```

**Disco lleno:**
```bash
df -h  # Ver espacio
journalctl --vacuum-time=7d  # Limpiar logs
```

### Paso 4: Prevenir futuras caídas
```bash
# Instalar monitoreo automático
./monitor-server.sh install

# Configurar alertas en Digital Ocean
# (desde el panel web → Monitoring)
```

---

## 📊 Qué Hacer Después de Recuperar el Servidor

1. **Identificar la causa:**
   ```bash
   # Ver logs recientes
   journalctl -p err -n 50

   # Ver si hubo OOM kills
   dmesg | grep -i "killed process"
   ```

2. **Aplicar fix permanente:**
   - Si fue memoria → Aumentar RAM o agregar swap
   - Si fue disco → Limpiar archivos o aumentar tamaño
   - Si fue Nginx → Revisar configuración

3. **Configurar prevención:**
   - Instalar monitoreo: `./monitor-server.sh install`
   - Configurar backups automáticos (ver guía)
   - Configurar alertas en Digital Ocean

---

## 🔧 Comandos Útiles de Emergencia

### Ver recursos
```bash
# Memoria
free -h

# Disco
df -h

# CPU y procesos
top
htop  # Si está instalado

# Load average
uptime
```

### Reiniciar servicios
```bash
# Nginx
systemctl restart nginx

# Ver estado
systemctl status nginx
```

### Ver logs
```bash
# Sistema
journalctl -xe
journalctl -p err -n 50

# Nginx
tail -50 /var/log/nginx/error.log
tail -100 /var/log/nginx/access.log
```

### Liberar recursos
```bash
# Limpiar memoria caché
sync; echo 3 > /proc/sys/vm/drop_caches

# Limpiar logs antiguos
journalctl --vacuum-time=7d

# Ver qué consume más
du -sh /* | sort -rh
ps aux --sort=-%mem | head -10
```

---

## 📞 Contactos de Soporte

### Digital Ocean
- Panel: https://cloud.digitalocean.com/
- Support: Chat en el panel
- Docs: https://docs.digitalocean.com/

### Neon Database
- Console: https://console.neon.tech/
- Docs: https://neon.tech/docs/

---

## 📦 Cómo Subir Estas Herramientas al Servidor

```bash
# Desde tu PC (Windows PowerShell o terminal)
cd C:\Users\LENKABITS\PriceTraker.Alpha

# Subir todos los scripts
scp check-server-health.sh root@chat.soluciones-ia.info:/root/
scp monitor-server.sh root@chat.soluciones-ia.info:/root/

# Conectar y dar permisos
ssh root@chat.soluciones-ia.info
chmod +x /root/*.sh
```

---

## 📝 Logs y Reportes

### Dónde se guardan los logs:

| Archivo | Ubicación | Qué contiene |
|---------|-----------|--------------|
| Monitor logs | `/var/log/azulik-monitor.log` | Logs del monitoreo continuo |
| Alertas | `/var/log/azulik-alerts.log` | Alertas críticas |
| Health reports | `/root/health-report-*.txt` | Reportes de diagnóstico |
| Nginx error | `/var/log/nginx/error.log` | Errores de Nginx |
| Nginx access | `/var/log/nginx/access.log` | Peticiones HTTP |
| Sistema | `journalctl` | Logs del sistema |

### Ver logs en tiempo real:
```bash
# Monitor
tail -f /var/log/azulik-monitor.log

# Nginx errors
tail -f /var/log/nginx/error.log

# Sistema
journalctl -f
```

---

## ✅ Checklist Post-Instalación

Después de subir estas herramientas:

- [ ] Scripts subidos y con permisos de ejecución
- [ ] Probado `./check-server-health.sh` una vez
- [ ] Instalado monitor: `./monitor-server.sh install`
- [ ] Verificado que el monitor está corriendo: `systemctl status azulik-monitor`
- [ ] Configuradas alertas en Digital Ocean (Monitoring → Alerts)
- [ ] Documentado qué causó la última caída (para prevenir)
- [ ] Leída la guía de troubleshooting
- [ ] Configurados backups automáticos (opcional)

---

## 💡 Tips

1. **Ejecuta `check-server-health.sh` semanalmente** para detectar problemas antes de que causen una caída

2. **Instala el monitor como servicio** para que el servidor se auto-vigile 24/7

3. **Configura alertas en Digital Ocean** para recibir notificaciones cuando:
   - CPU > 80%
   - Memoria > 80%
   - Disco > 80%

4. **Mantén backups actualizados** (script incluido en la guía de troubleshooting)

5. **Revisa logs periódicamente** para detectar patrones de problemas

---

**Creado:** 24 de Octubre, 2024
**Versión:** 1.0
**Para:** AZULIK Chat Server (chat.soluciones-ia.info)
