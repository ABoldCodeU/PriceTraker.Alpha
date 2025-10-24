# Guía de Troubleshooting - Cuando el Servidor se Cae

## Diagnóstico Rápido

### Paso 1: Verificar si el servidor está vivo (DESDE TU PC)

```bash
# Ejecutar script de verificación externa
./check-from-outside.sh
```

O manualmente:

```bash
# Ping básico
ping chat.soluciones-ia.info

# Verificar HTTP
curl -I https://chat.soluciones-ia.info

# Verificar SSH
ssh root@chat.soluciones-ia.info
```

### Paso 2: Si el servidor responde, conectar y diagnosticar

```bash
# Conectar
ssh root@chat.soluciones-ia.info

# Ejecutar diagnóstico completo
cd /root
./check-server-health.sh
```

---

## Causas Comunes de Caídas

### 1. Memoria Insuficiente (OOM - Out of Memory)

#### Síntomas:
- Servidor no responde repentinamente
- Procesos se matan solos
- SSH funciona pero todo está lento

#### Diagnóstico:
```bash
# Ver memoria disponible
free -h

# Ver procesos matados por OOM
dmesg | grep -i "killed process"

# Ver procesos que consumen más memoria
ps aux --sort=-%mem | head -10
```

#### Solución Inmediata:
```bash
# Reiniciar servicios pesados
systemctl restart nginx

# Si es muy grave, reiniciar el servidor
reboot
```

#### Solución Permanente:
- Aumentar el tamaño del Droplet en Digital Ocean
- Optimizar aplicaciones para usar menos memoria
- Configurar swap (memoria virtual)

```bash
# Crear swap de 2GB
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

### 2. Disco Lleno

#### Síntomas:
- Servicios no pueden escribir logs
- Aplicaciones fallan al guardar datos
- Error "No space left on device"

#### Diagnóstico:
```bash
# Ver uso de disco
df -h

# Encontrar archivos grandes
du -h / 2>/dev/null | sort -rh | head -20

# Ver uso en /var/log
du -sh /var/log/*
```

#### Solución:
```bash
# Limpiar logs antiguos
journalctl --vacuum-time=7d

# Limpiar logs de nginx
find /var/log/nginx -name "*.gz" -type f -mtime +30 -delete

# Limpiar backups antiguos
find /root/backups -name "*.sql" -mtime +30 -delete

# Limpiar apt cache
apt clean
```

---

### 3. Nginx Caído

#### Síntomas:
- Puerto 80/443 no responde
- "502 Bad Gateway" o "503 Service Unavailable"
- Página no carga

#### Diagnóstico:
```bash
# Ver estado de Nginx
systemctl status nginx

# Ver errores de configuración
nginx -t

# Ver logs de error
tail -50 /var/log/nginx/error.log
```

#### Solución:
```bash
# Reiniciar Nginx
systemctl restart nginx

# Si hay error de configuración
nginx -t
# Corregir el error indicado

# Verificar que está corriendo
systemctl status nginx
curl -I http://localhost
```

---

### 4. Procesos Zombie o Colgados

#### Síntomas:
- CPU al 100%
- Servidor muy lento
- Comandos tardan mucho

#### Diagnóstico:
```bash
# Ver load average
uptime

# Ver procesos con más CPU
ps aux --sort=-%cpu | head -10

# Ver procesos zombie
ps aux | grep defunct
```

#### Solución:
```bash
# Identificar el proceso problemático
top
# Presiona 'P' para ordenar por CPU

# Matar proceso específico (reemplazar PID)
kill -9 PID

# Si todo está muy mal, reiniciar
reboot
```

---

### 5. Ataque DDoS o Tráfico Excesivo

#### Síntomas:
- Muchas conexiones simultáneas
- Bandwidth agotado
- Servidor lento o inaccesible

#### Diagnóstico:
```bash
# Ver conexiones activas
netstat -an | grep :80 | wc -l
netstat -an | grep :443 | wc -l

# Ver IPs conectadas
netstat -an | grep :80 | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# Ver access log en tiempo real
tail -f /var/log/nginx/access.log
```

#### Solución:
```bash
# Bloquear IP específica
ufw deny from DIRECCION_IP

# Limitar conexiones en Nginx (editar config)
# /etc/nginx/nginx.conf
# Agregar en http {}:
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;

# En server {}:
limit_req zone=one burst=20;

# Recargar Nginx
nginx -s reload
```

---

### 6. Base de Datos Inaccesible

#### Síntomas:
- API de mensajes falla
- Error al guardar/leer mensajes
- Timeouts en la aplicación

#### Diagnóstico:
```bash
# Probar conexión
psql 'postgresql://neondb_owner:npg_oAgZej74WEQl@ep-gentle-hill-a5dmte40m-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require' -c "SELECT 1;"

# Ver estadísticas
psql "$DB_URL" -c "SELECT COUNT(*) FROM messages;"
```

#### Solución:
- Verificar conectividad a internet del servidor
- Verificar que la URL de la base de datos no ha cambiado
- Contactar soporte de Neon si el problema persiste
- Revisar logs de la aplicación

---

## Procedimiento de Recuperación Rápida

### Si el servidor está completamente caído:

1. **Verificar en Digital Ocean Console:**
   - Ir a https://cloud.digitalocean.com/
   - Ver el droplet en el dashboard
   - Verificar que esté "Active"

2. **Si está "Powered Off":**
   ```
   Encender desde el panel de Digital Ocean
   ```

3. **Si está activo pero no responde:**
   ```bash
   # Reiniciar desde el panel de Digital Ocean
   # Power → Reboot
   ```

4. **Una vez que vuelva, verificar servicios:**
   ```bash
   ssh root@chat.soluciones-ia.info
   systemctl status nginx
   systemctl status postgresql  # Si tienes DB local
   ```

---

## Prevención de Caídas Futuras

### 1. Configurar Monitoreo

```bash
# Instalar htop para monitoreo interactivo
apt install htop

# Ver recursos en tiempo real
htop
```

### 2. Configurar Alertas en Digital Ocean

1. Ir a Monitoring en el panel de Digital Ocean
2. Configurar alertas para:
   - CPU > 80%
   - Memoria > 80%
   - Disco > 80%
   - Bandwidth excedido

### 3. Automatizar Reinicio de Servicios

```bash
# Crear script de watchdog
cat > /root/watchdog.sh << 'EOF'
#!/bin/bash
if ! systemctl is-active --quiet nginx; then
    systemctl restart nginx
    echo "$(date): Nginx reiniciado" >> /var/log/watchdog.log
fi
EOF

chmod +x /root/watchdog.sh

# Agregar a crontab (cada 5 minutos)
crontab -e
# Agregar línea:
*/5 * * * * /root/watchdog.sh
```

### 4. Logs Rotativos

```bash
# Configurar logrotate para Nginx
cat > /etc/logrotate.d/nginx << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 640 nginx adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
EOF
```

### 5. Backups Automáticos

```bash
# Script de backup automático
cat > /root/auto-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio
mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump "postgresql://..." > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos importantes
tar -czf $BACKUP_DIR/web_$DATE.tar.gz /var/www/azulik

# Limpiar backups antiguos (> 7 días)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completado: $DATE"
EOF

chmod +x /root/auto-backup.sh

# Ejecutar diariamente a las 3 AM
crontab -e
# Agregar:
0 3 * * * /root/auto-backup.sh
```

---

## Comandos de Emergencia

### Reiniciar Servicios Críticos
```bash
# Nginx
systemctl restart nginx

# Todos los servicios web
systemctl restart nginx && systemctl restart php-fpm  # Si usas PHP
```

### Ver qué está consumiendo recursos
```bash
# CPU
ps aux --sort=-%cpu | head -10

# Memoria
ps aux --sort=-%mem | head -10

# Disco
du -sh /* | sort -rh
```

### Liberar memoria
```bash
# Limpiar caché
sync; echo 3 > /proc/sys/vm/drop_caches

# Matar procesos pesados (cuidado!)
pkill -f nombre_proceso
```

### Ver logs en tiempo real
```bash
# Nginx
tail -f /var/log/nginx/error.log

# Sistema
journalctl -f

# Filtrar solo errores
journalctl -p err -f
```

---

## Contactos de Emergencia

### Digital Ocean Support
- Panel: https://cloud.digitalocean.com/support
- Chat: Disponible en el panel
- Docs: https://docs.digitalocean.com/

### Neon Database Support
- Dashboard: https://console.neon.tech/
- Docs: https://neon.tech/docs/

---

## Checklist de Recuperación

Cuando el servidor se cae, seguir estos pasos:

- [ ] Verificar si está vivo con `./check-from-outside.sh`
- [ ] Conectar por SSH si es posible
- [ ] Ejecutar `./check-server-health.sh`
- [ ] Revisar logs: `journalctl -p err -n 50`
- [ ] Verificar memoria: `free -h`
- [ ] Verificar disco: `df -h`
- [ ] Verificar Nginx: `systemctl status nginx`
- [ ] Revisar procesos: `top` o `htop`
- [ ] Reiniciar servicios si es necesario
- [ ] Verificar que el sitio funciona: `curl https://chat.soluciones-ia.info`
- [ ] Probar el chat manualmente
- [ ] Documentar qué pasó para prevenir futuras caídas

---

## Logs Importantes

| Log | Ubicación | Para qué sirve |
|-----|-----------|----------------|
| Nginx Error | `/var/log/nginx/error.log` | Errores del servidor web |
| Nginx Access | `/var/log/nginx/access.log` | Peticiones HTTP |
| Sistema | `journalctl -xe` | Errores del sistema |
| Auth (SSH) | `/var/log/auth.log` | Intentos de login |
| OOM Kills | `dmesg | grep -i killed` | Procesos matados por memoria |

---

**Última actualización:** 24 de Octubre, 2024
