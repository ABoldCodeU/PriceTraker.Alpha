#!/bin/bash

###############################################################################
# Script de Monitoreo Continuo - AZULIK Chat
# Versión: 1.0
# Descripción: Monitorea el servidor continuamente y alerta/repara problemas
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
SERVER="chat.soluciones-ia.info"
CHECK_INTERVAL=60  # Segundos entre verificaciones
LOG_FILE="/var/log/azulik-monitor.log"
ALERT_EMAIL=""  # Configurar si quieres recibir emails

# Umbrales
MAX_LOAD=4.0
MAX_MEM_PERCENT=85
MAX_DISK_PERCENT=80
MIN_FREE_MEM_MB=200

# Auto-repair
AUTO_REPAIR_NGINX=true
AUTO_REPAIR_MEMORY=false  # Cuidado con esto

###############################################################################
# FUNCIONES DE LOG
###############################################################################

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] [$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARN] [$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[OK] [$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO] [$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

###############################################################################
# FUNCIONES DE ALERTA
###############################################################################

send_alert() {
    local SUBJECT="$1"
    local MESSAGE="$2"

    log_error "ALERTA: $SUBJECT - $MESSAGE"

    # Email (si está configurado)
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$MESSAGE" | mail -s "AZULIK Alert: $SUBJECT" "$ALERT_EMAIL" 2>/dev/null || true
    fi

    # Guardar en archivo de alertas
    echo "[$(date)] $SUBJECT: $MESSAGE" >> /var/log/azulik-alerts.log
}

###############################################################################
# FUNCIONES DE VERIFICACIÓN
###############################################################################

check_nginx_service() {
    if ! systemctl is-active --quiet nginx; then
        log_error "Nginx no está corriendo"

        if [ "$AUTO_REPAIR_NGINX" = true ]; then
            log_info "Intentando reiniciar Nginx..."
            systemctl restart nginx

            sleep 2

            if systemctl is-active --quiet nginx; then
                log_success "Nginx reiniciado exitosamente"
                send_alert "Nginx Reiniciado" "Nginx se cayó y fue reiniciado automáticamente"
            else
                send_alert "Nginx CAÍDO" "Nginx no se pudo reiniciar automáticamente"
                return 1
            fi
        else
            send_alert "Nginx CAÍDO" "Nginx no está corriendo y auto-repair está deshabilitado"
            return 1
        fi
    fi
    return 0
}

check_memory() {
    local MEM_AVAILABLE=$(free -m | awk 'NR==2{print $7}')
    local MEM_TOTAL=$(free -m | awk 'NR==2{print $2}')
    local MEM_USED_PERCENT=$(( 100 - (MEM_AVAILABLE * 100 / MEM_TOTAL) ))

    if [ "$MEM_AVAILABLE" -lt "$MIN_FREE_MEM_MB" ]; then
        log_warning "Memoria disponible baja: ${MEM_AVAILABLE}MB (${MEM_USED_PERCENT}% usado)"

        if [ "$AUTO_REPAIR_MEMORY" = true ]; then
            log_info "Intentando liberar memoria..."
            sync
            echo 3 > /proc/sys/vm/drop_caches
            log_info "Caché liberada"
        else
            send_alert "Memoria Baja" "Solo ${MEM_AVAILABLE}MB disponibles (${MEM_USED_PERCENT}% usado)"
        fi
        return 1
    fi

    return 0
}

check_disk() {
    local DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')

    if [ "$DISK_USAGE" -gt "$MAX_DISK_PERCENT" ]; then
        log_warning "Disco casi lleno: ${DISK_USAGE}%"
        send_alert "Disco Lleno" "Uso de disco: ${DISK_USAGE}%"
        return 1
    fi

    return 0
}

check_load_average() {
    local LOAD_1MIN=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
    local CORES=$(nproc)

    # Comparación con bc
    if command -v bc &> /dev/null; then
        if (( $(echo "$LOAD_1MIN > $MAX_LOAD" | bc -l) )); then
            log_warning "Load average alto: $LOAD_1MIN (cores: $CORES)"
            send_alert "Load Average Alto" "Load: $LOAD_1MIN en $CORES cores"
            return 1
        fi
    fi

    return 0
}

check_http_response() {
    local HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$SERVER --max-time 10 || echo "000")

    if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "301" ] && [ "$HTTP_CODE" != "302" ]; then
        log_error "HTTP no responde correctamente (código: $HTTP_CODE)"
        send_alert "HTTP Error" "Servidor responde con código: $HTTP_CODE"
        return 1
    fi

    return 0
}

check_database() {
    local DB_URL="postgresql://neondb_owner:npg_oAgZej74WEQl@ep-gentle-hill-a5dmte40m-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

    if ! psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Base de datos no accesible"
        send_alert "Database Error" "No se puede conectar a la base de datos"
        return 1
    fi

    return 0
}

check_processes() {
    # Verificar procesos zombie
    local ZOMBIES=$(ps aux | grep defunct | grep -v grep | wc -l)

    if [ "$ZOMBIES" -gt 5 ]; then
        log_warning "Procesos zombie detectados: $ZOMBIES"
        send_alert "Procesos Zombie" "Se detectaron $ZOMBIES procesos zombie"
        return 1
    fi

    return 0
}

check_logs_for_errors() {
    # Buscar errores recientes en logs
    local RECENT_ERRORS=$(journalctl -p err -n 10 --since "1 minute ago" 2>/dev/null | wc -l)

    if [ "$RECENT_ERRORS" -gt 5 ]; then
        log_warning "Muchos errores recientes en el sistema: $RECENT_ERRORS"
        # No enviar alerta cada vez, solo loguear
    fi
}

###############################################################################
# FUNCIÓN PRINCIPAL DE MONITOREO
###############################################################################

run_checks() {
    local CHECKS_PASSED=0
    local CHECKS_FAILED=0

    # Ejecutar verificaciones
    check_nginx_service && ((CHECKS_PASSED++)) || ((CHECKS_FAILED++))
    check_memory && ((CHECKS_PASSED++)) || ((CHECKS_FAILED++))
    check_disk && ((CHECKS_PASSED++)) || ((CHECKS_FAILED++))
    check_load_average && ((CHECKS_PASSED++)) || ((CHECKS_FAILED++))
    check_processes && ((CHECKS_PASSED++)) || ((CHECKS_FAILED++))
    check_logs_for_errors && ((CHECKS_PASSED++)) || ((CHECKS_FAILED++))

    # Solo en el servidor
    if [ -d "/var/www/azulik" ]; then
        check_http_response && ((CHECKS_PASSED++)) || ((CHECKS_FAILED++))
        check_database && ((CHECKS_PASSED++)) || ((CHECKS_FAILED++))
    fi

    # Log resultado
    if [ "$CHECKS_FAILED" -eq 0 ]; then
        log_success "Todas las verificaciones pasaron ($CHECKS_PASSED/$((CHECKS_PASSED + CHECKS_FAILED)))"
    else
        log_warning "Verificaciones fallidas: $CHECKS_FAILED/$((CHECKS_PASSED + CHECKS_FAILED))"
    fi

    return $CHECKS_FAILED
}

###############################################################################
# ESTADÍSTICAS
###############################################################################

show_stats() {
    echo ""
    echo "════════════════════════════════════════════════════"
    echo "  ESTADÍSTICAS DEL SERVIDOR"
    echo "════════════════════════════════════════════════════"
    echo ""

    # Uptime
    echo "Uptime: $(uptime -p)"

    # Memoria
    local MEM_AVAILABLE=$(free -m | awk 'NR==2{print $7}')
    local MEM_TOTAL=$(free -m | awk 'NR==2{print $2}')
    echo "Memoria: ${MEM_AVAILABLE}MB disponibles de ${MEM_TOTAL}MB"

    # Disco
    local DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
    echo "Disco: ${DISK_USAGE} usado"

    # Load
    local LOAD=$(uptime | awk -F'load average:' '{print $2}')
    echo "Load average:$LOAD"

    # Nginx
    if systemctl is-active --quiet nginx; then
        echo "Nginx: ✅ Corriendo"
    else
        echo "Nginx: ❌ Detenido"
    fi

    echo ""
}

###############################################################################
# MODO DAEMON
###############################################################################

run_daemon() {
    log_info "Iniciando monitoreo en modo daemon (intervalo: ${CHECK_INTERVAL}s)"

    while true; do
        run_checks

        # Mostrar stats cada 10 iteraciones
        if [ $((SECONDS / CHECK_INTERVAL % 10)) -eq 0 ]; then
            show_stats
        fi

        sleep $CHECK_INTERVAL
    done
}

###############################################################################
# MODO ÚNICO
###############################################################################

run_once() {
    log_info "Ejecutando verificación única"
    run_checks
    show_stats
}

###############################################################################
# INSTALACIÓN COMO SERVICIO
###############################################################################

install_as_service() {
    cat > /etc/systemd/system/azulik-monitor.service << EOF
[Unit]
Description=AZULIK Chat Server Monitor
After=network.target

[Service]
Type=simple
User=root
ExecStart=/root/monitor-server.sh daemon
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable azulik-monitor.service
    systemctl start azulik-monitor.service

    log_success "Servicio instalado y iniciado"
    log_info "Ver logs: journalctl -u azulik-monitor -f"
    log_info "Estado: systemctl status azulik-monitor"
}

###############################################################################
# MAIN
###############################################################################

case "${1:-once}" in
    daemon)
        run_daemon
        ;;
    once)
        run_once
        ;;
    install)
        install_as_service
        ;;
    stats)
        show_stats
        ;;
    *)
        echo "Uso: $0 {once|daemon|install|stats}"
        echo ""
        echo "  once    - Ejecutar verificación una vez"
        echo "  daemon  - Ejecutar continuamente"
        echo "  install - Instalar como servicio systemd"
        echo "  stats   - Mostrar solo estadísticas"
        exit 1
        ;;
esac
