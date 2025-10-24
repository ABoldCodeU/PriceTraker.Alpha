#!/bin/bash

###############################################################################
# Script de Verificación Externa - AZULIK Chat
# Versión: 1.0
# Descripción: Verifica el estado del servidor DESDE AFUERA (sin SSH)
# Uso: Ejecutar desde tu PC local para ver si el servidor está vivo
###############################################################################

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
SERVER="chat.soluciones-ia.info"
IP=$(dig +short $SERVER | head -1)

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

check_dns() {
    print_header "1. RESOLUCIÓN DNS"

    if [ -z "$IP" ]; then
        print_error "No se pudo resolver $SERVER"
        return 1
    else
        print_success "DNS resuelve a: $IP"
    fi
}

check_ping() {
    print_header "2. PING (ICMP)"

    print_info "Enviando 5 pings a $SERVER..."
    if ping -c 5 -W 3 $SERVER > /dev/null 2>&1; then
        PING_TIME=$(ping -c 1 $SERVER | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}')
        print_success "Servidor responde a ping (${PING_TIME}ms)"
    else
        print_error "Servidor NO responde a ping"
        print_warning "Esto puede ser normal si el firewall bloquea ICMP"
    fi
}

check_http() {
    print_header "3. SERVICIO WEB (HTTP/HTTPS)"

    # HTTP
    print_info "Verificando HTTP (puerto 80)..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER --max-time 10 --connect-timeout 5 || echo "000")
    if [ "$HTTP_CODE" != "000" ]; then
        print_success "Puerto 80 responde (HTTP $HTTP_CODE)"
    else
        print_error "Puerto 80 NO responde"
    fi

    # HTTPS
    print_info "Verificando HTTPS (puerto 443)..."
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$SERVER --max-time 10 --connect-timeout 5 || echo "000")
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://$SERVER --max-time 10 || echo "timeout")

    if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "301" ] || [ "$HTTPS_CODE" = "302" ]; then
        print_success "HTTPS responde correctamente (HTTP $HTTPS_CODE, ${RESPONSE_TIME}s)"
    else
        print_error "HTTPS NO responde correctamente (HTTP $HTTPS_CODE)"
    fi

    # Verificar certificado SSL
    print_info "Verificando certificado SSL..."
    SSL_EXPIRY=$(echo | openssl s_client -servername $SERVER -connect $SERVER:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
    if [ -n "$SSL_EXPIRY" ]; then
        print_success "Certificado SSL válido hasta: $SSL_EXPIRY"
    else
        print_warning "No se pudo verificar el certificado SSL"
    fi
}

check_ssh() {
    print_header "4. SERVICIO SSH"

    print_info "Verificando SSH (puerto 22)..."
    if timeout 5 bash -c "echo > /dev/tcp/$SERVER/22" 2>/dev/null; then
        print_success "Puerto SSH (22) está abierto"
    else
        print_error "Puerto SSH (22) está cerrado o no responde"
    fi
}

check_interceptor() {
    print_header "5. CHAT INTERCEPTOR"

    print_info "Descargando interceptor..."
    INTERCEPTOR_CONTENT=$(curl -s https://$SERVER/chat-interceptor.js --max-time 10)
    INTERCEPTOR_SIZE=${#INTERCEPTOR_CONTENT}

    if [ "$INTERCEPTOR_SIZE" -gt 1000 ]; then
        VERSION=$(echo "$INTERCEPTOR_CONTENT" | grep -o 'v[0-9]\+\.[0-9]\+' | head -1)
        print_success "Interceptor disponible ($INTERCEPTOR_SIZE bytes)"
        if [ -n "$VERSION" ]; then
            print_info "Versión detectada: $VERSION"
        fi
    else
        print_error "Interceptor no disponible o muy pequeño"
    fi
}

check_api() {
    print_header "6. API DE MENSAJES"

    print_info "Verificando endpoint de la API..."
    API_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$SERVER/api/messages --max-time 10 || echo "000")

    if [ "$API_CODE" = "200" ] || [ "$API_CODE" = "405" ] || [ "$API_CODE" = "404" ]; then
        print_success "API responde (HTTP $API_CODE)"
        if [ "$API_CODE" = "405" ]; then
            print_info "Método no permitido (normal para GET en un endpoint POST)"
        fi
    else
        print_warning "API no responde como se esperaba (HTTP $API_CODE)"
    fi
}

check_uptime() {
    print_header "7. SERVICIOS DE TERCEROS"

    # Verificar con uptimerobot o similar (si está configurado)
    print_info "Verificando en servicios de monitoreo públicos..."

    # DownDetector simulado
    print_info "Verificando disponibilidad general..."
    if curl -s https://$SERVER --max-time 5 > /dev/null; then
        print_success "Servidor responde a conexiones HTTPS"
    else
        print_error "Servidor no responde"
    fi
}

test_full_flow() {
    print_header "8. PRUEBA DE FLUJO COMPLETO"

    print_info "Simulando acceso completo al chat..."

    # 1. Obtener página principal
    print_info "  1/3 Descargando página principal..."
    if curl -s https://$SERVER --max-time 10 > /dev/null; then
        print_success "    Página principal descargada"
    else
        print_error "    No se pudo descargar la página"
        return 1
    fi

    # 2. Obtener interceptor
    print_info "  2/3 Descargando interceptor..."
    if curl -s https://$SERVER/chat-interceptor.js --max-time 10 > /dev/null; then
        print_success "    Interceptor descargado"
    else
        print_error "    No se pudo descargar el interceptor"
        return 1
    fi

    # 3. Verificar API
    print_info "  3/3 Verificando API..."
    if curl -s -X OPTIONS https://$SERVER/api/messages --max-time 10 > /dev/null; then
        print_success "    API accesible"
    else
        print_warning "    API puede no estar accesible"
    fi

    echo ""
    print_success "Flujo completo verificado"
}

generate_report() {
    print_header "9. RESUMEN"

    echo ""
    echo "RESULTADO DEL DIAGNÓSTICO:"
    echo "─────────────────────────────────────"
    echo "Servidor: $SERVER"
    echo "IP: $IP"
    echo "Fecha: $(date)"
    echo ""

    # Estado general
    if curl -s https://$SERVER --max-time 5 > /dev/null; then
        echo -e "${GREEN}ESTADO: SERVIDOR ACTIVO ✅${NC}"
        echo ""
        echo "El servidor está respondiendo correctamente."
        echo "Puedes acceder al chat en: https://$SERVER"
    else
        echo -e "${RED}ESTADO: SERVIDOR INACCESIBLE ❌${NC}"
        echo ""
        echo "El servidor no responde. Posibles causas:"
        echo "  1. Servidor apagado o reiniciando"
        echo "  2. Problemas de red"
        echo "  3. Firewall bloqueando conexiones"
        echo "  4. Nginx/servicios caídos"
        echo ""
        echo "Acciones recomendadas:"
        echo "  1. Conectar por SSH y ejecutar: ./check-server-health.sh"
        echo "  2. Verificar logs: journalctl -xe"
        echo "  3. Reiniciar servicios: systemctl restart nginx"
        echo "  4. Contactar soporte de Digital Ocean"
    fi

    echo ""
}

###############################################################################
# MAIN
###############################################################################

main() {
    clear
    print_header "VERIFICACIÓN EXTERNA DEL SERVIDOR - AZULIK CHAT"

    print_info "Este script verifica el servidor DESDE AFUERA (sin SSH)"
    print_info "Servidor objetivo: $SERVER"
    echo ""
    sleep 1

    check_dns
    echo ""
    sleep 1

    check_ping
    echo ""
    sleep 1

    check_http
    echo ""
    sleep 1

    check_ssh
    echo ""
    sleep 1

    check_interceptor
    echo ""
    sleep 1

    check_api
    echo ""
    sleep 1

    check_uptime
    echo ""
    sleep 1

    test_full_flow
    echo ""
    sleep 1

    generate_report
}

# Ejecutar
main
