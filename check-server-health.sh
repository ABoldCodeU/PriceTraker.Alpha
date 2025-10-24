#!/bin/bash

###############################################################################
# Script de Diagnóstico de Salud del Servidor - AZULIK Chat
# Versión: 1.0
# Descripción: Verifica el estado y salud del servidor en Digital Ocean
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
DB_URL="postgresql://neondb_owner:npg_oAgZej74WEQl@ep-gentle-hill-a5dmte40m-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

###############################################################################
# FUNCIONES
###############################################################################

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

###############################################################################
# VERIFICACIONES
###############################################################################

check_server_connectivity() {
    print_header "1. CONECTIVIDAD DEL SERVIDOR"

    # Ping
    print_info "Verificando ping al servidor..."
    if ping -c 3 $SERVER > /dev/null 2>&1; then
        print_success "Servidor responde a ping"
    else
        print_error "Servidor NO responde a ping"
        return 1
    fi

    # HTTP
    print_info "Verificando respuesta HTTP..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$SERVER --max-time 10 || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        print_success "Servidor web responde (HTTP $HTTP_CODE)"
    else
        print_error "Servidor web NO responde correctamente (HTTP $HTTP_CODE)"
    fi

    # SSH
    print_info "Verificando puerto SSH (22)..."
    if nc -z -w5 $SERVER 22 2>/dev/null; then
        print_success "Puerto SSH (22) abierto"
    else
        print_error "Puerto SSH (22) cerrado o no responde"
    fi
}

check_system_resources() {
    print_header "2. RECURSOS DEL SISTEMA"

    # Uptime
    print_info "Uptime del servidor:"
    uptime

    # Memoria
    echo ""
    print_info "Uso de memoria:"
    free -h

    # Disco
    echo ""
    print_info "Uso de disco:"
    df -h / /var /tmp 2>/dev/null || df -h

    # Procesos que consumen más memoria
    echo ""
    print_info "Top 5 procesos por uso de memoria:"
    ps aux --sort=-%mem | head -6

    # Procesos que consumen más CPU
    echo ""
    print_info "Top 5 procesos por uso de CPU:"
    ps aux --sort=-%cpu | head -6

    # Load average
    echo ""
    LOAD=$(uptime | awk -F'load average:' '{print $2}')
    print_info "Load average: $LOAD"

    # CPU cores
    CORES=$(nproc)
    print_info "CPU cores: $CORES"
}

check_nginx() {
    print_header "3. ESTADO DE NGINX"

    # Verificar si está corriendo
    if systemctl is-active --quiet nginx; then
        print_success "Nginx está corriendo"
    else
        print_error "Nginx NO está corriendo"
        print_info "Intentando iniciar Nginx..."
        systemctl start nginx
        if [ $? -eq 0 ]; then
            print_success "Nginx iniciado exitosamente"
        else
            print_error "No se pudo iniciar Nginx"
        fi
    fi

    # Configuración
    print_info "Verificando configuración de Nginx..."
    if nginx -t 2>&1 | grep -q "successful"; then
        print_success "Configuración de Nginx es válida"
    else
        print_error "Configuración de Nginx tiene errores"
        nginx -t
    fi

    # Logs recientes
    echo ""
    print_info "Últimos 10 errores de Nginx:"
    tail -10 /var/log/nginx/error.log 2>/dev/null || print_warning "No se pueden leer logs de Nginx"

    # Conexiones activas
    echo ""
    print_info "Conexiones activas en puerto 80/443:"
    netstat -an | grep -E ':80|:443' | grep ESTABLISHED | wc -l
}

check_database() {
    print_header "4. ESTADO DE LA BASE DE DATOS"

    # Conectividad
    print_info "Verificando conexión a la base de datos..."
    if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Conexión a base de datos exitosa"
    else
        print_error "No se puede conectar a la base de datos"
        return 1
    fi

    # Estadísticas
    echo ""
    print_info "Estadísticas de la base de datos:"
    psql "$DB_URL" -c "
        SELECT
            'Total messages' as metric,
            COUNT(*)::text as value
        FROM messages
        UNION ALL
        SELECT
            'Total conversations',
            COUNT(*)::text
        FROM conversations
        UNION ALL
        SELECT
            'Messages last hour',
            COUNT(*)::text
        FROM messages
        WHERE ts > NOW() - INTERVAL '1 hour'
        UNION ALL
        SELECT
            'Messages last 24h',
            COUNT(*)::text
        FROM messages
        WHERE ts > NOW() - INTERVAL '24 hours';
    " 2>/dev/null || print_error "Error al obtener estadísticas"

    # Último mensaje
    echo ""
    print_info "Último mensaje registrado:"
    psql "$DB_URL" -c "
        SELECT
            role,
            LEFT(content, 60) as content,
            ts
        FROM messages
        ORDER BY ts DESC
        LIMIT 1;
    " 2>/dev/null
}

check_application() {
    print_header "5. ESTADO DE LA APLICACIÓN"

    # Verificar archivos críticos
    print_info "Verificando archivos críticos..."

    if [ -f "/var/www/azulik/index.html" ]; then
        print_success "index.html existe"
    else
        print_error "index.html NO existe"
    fi

    if [ -f "/var/www/azulik/chat-interceptor.js" ]; then
        print_success "chat-interceptor.js existe"
        echo "  Versión: $(grep -o 'v[0-9]\+\.[0-9]\+' /var/www/azulik/chat-interceptor.js | head -1)"
    else
        print_error "chat-interceptor.js NO existe"
    fi

    # Verificar interceptor cargando desde el navegador
    echo ""
    print_info "Verificando interceptor desde HTTP..."
    INTERCEPTOR_SIZE=$(curl -s https://$SERVER/chat-interceptor.js | wc -c)
    if [ "$INTERCEPTOR_SIZE" -gt 1000 ]; then
        print_success "Interceptor se sirve correctamente ($INTERCEPTOR_SIZE bytes)"
    else
        print_error "Interceptor no se sirve correctamente o está vacío"
    fi
}

check_logs() {
    print_header "6. ANÁLISIS DE LOGS"

    # System logs
    print_info "Últimos errores del sistema (journalctl):"
    journalctl -p err -n 10 --no-pager 2>/dev/null || print_warning "No se pueden leer logs del sistema"

    echo ""
    print_info "Servicios que fallaron recientemente:"
    systemctl --failed --no-pager 2>/dev/null || print_warning "No hay información de servicios fallidos"

    # Nginx access log - últimas peticiones
    echo ""
    print_info "Últimas 10 peticiones HTTP:"
    tail -10 /var/log/nginx/access.log 2>/dev/null || print_warning "No se pueden leer access logs"

    # Verificar OOM (Out of Memory) kills
    echo ""
    print_info "Verificando OOM kills (Out of Memory):"
    if dmesg | grep -i "killed process" | tail -5; then
        print_warning "Se encontraron procesos matados por falta de memoria"
    else
        print_success "No hay OOM kills recientes"
    fi
}

check_security() {
    print_header "7. VERIFICACIONES DE SEGURIDAD"

    # Usuarios conectados
    print_info "Usuarios conectados actualmente:"
    who

    # Últimos logins
    echo ""
    print_info "Últimos 10 logins:"
    last -10

    # Intentos fallidos de SSH
    echo ""
    print_info "Últimos intentos fallidos de SSH:"
    grep "Failed password" /var/log/auth.log 2>/dev/null | tail -5 || print_warning "No se pueden leer logs de auth"

    # Firewall
    echo ""
    print_info "Estado del firewall (UFW):"
    ufw status 2>/dev/null || print_warning "UFW no está instalado o no disponible"
}

generate_report() {
    print_header "8. REPORTE FINAL"

    REPORT_FILE="/root/health-report-$(date +%Y%m%d_%H%M%S).txt"

    echo "Generando reporte completo..."
    {
        echo "===== REPORTE DE SALUD DEL SERVIDOR ====="
        echo "Fecha: $(date)"
        echo "Servidor: $SERVER"
        echo ""

        echo "=== RECURSOS ==="
        free -h
        df -h
        uptime

        echo ""
        echo "=== SERVICIOS ==="
        systemctl status nginx --no-pager

        echo ""
        echo "=== PROCESOS ==="
        ps aux --sort=-%mem | head -10

        echo ""
        echo "=== LOGS RECIENTES ==="
        tail -50 /var/log/nginx/error.log

    } > "$REPORT_FILE" 2>&1

    print_success "Reporte guardado en: $REPORT_FILE"
}

###############################################################################
# RECOMENDACIONES
###############################################################################

provide_recommendations() {
    print_header "9. RECOMENDACIONES"

    # Verificar memoria disponible
    MEM_AVAILABLE=$(free -m | awk 'NR==2{print $7}')
    if [ "$MEM_AVAILABLE" -lt 200 ]; then
        print_warning "Memoria disponible baja ($MEM_AVAILABLE MB)"
        echo "  Considera:"
        echo "  - Reiniciar servicios pesados"
        echo "  - Aumentar el tamaño del droplet"
        echo "  - Revisar memory leaks"
    fi

    # Verificar disco disponible
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        print_warning "Disco casi lleno ($DISK_USAGE%)"
        echo "  Considera:"
        echo "  - Limpiar logs antiguos: journalctl --vacuum-time=7d"
        echo "  - Limpiar backups antiguos"
        echo "  - Revisar archivos grandes: du -h / | sort -rh | head -20"
    fi

    # Verificar load average
    LOAD_1MIN=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
    CORES=$(nproc)
    if (( $(echo "$LOAD_1MIN > $CORES" | bc -l) )); then
        print_warning "Load average alto ($LOAD_1MIN en $CORES cores)"
        echo "  El servidor está sobrecargado"
        echo "  Considera revisar procesos pesados"
    fi
}

###############################################################################
# MAIN
###############################################################################

main() {
    clear
    print_header "DIAGNÓSTICO DE SALUD DEL SERVIDOR - AZULIK CHAT"

    echo ""
    print_info "Iniciando diagnóstico..."
    echo ""
    sleep 1

    # Verificar si estamos en el servidor correcto
    if [ -d "/var/www/azulik" ]; then
        print_success "Ejecutando en el servidor correcto"
    else
        print_warning "Este script está diseñado para ejecutarse en el servidor"
        print_info "Ejecutando verificaciones remotas disponibles..."
    fi

    echo ""

    # Ejecutar todas las verificaciones
    check_server_connectivity || true
    echo ""
    sleep 1

    if [ -d "/var/www/azulik" ]; then
        # Verificaciones locales (en el servidor)
        check_system_resources || true
        echo ""
        sleep 1

        check_nginx || true
        echo ""
        sleep 1

        check_application || true
        echo ""
        sleep 1

        check_logs || true
        echo ""
        sleep 1

        check_security || true
        echo ""
        sleep 1
    fi

    check_database || true
    echo ""
    sleep 1

    if [ -d "/var/www/azulik" ]; then
        provide_recommendations || true
        echo ""
        sleep 1

        generate_report || true
    fi

    echo ""
    print_header "DIAGNÓSTICO COMPLETADO"
    print_success "Revisa los resultados arriba para identificar problemas"
}

# Ejecutar
main
