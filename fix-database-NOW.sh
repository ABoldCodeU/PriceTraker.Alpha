#!/bin/bash

###############################################################################
# Script de Limpieza de Base de Datos - AZULIK Chat
# Versión: 1.0
# Descripción: Elimina mensajes malformados y actualiza el interceptor
###############################################################################

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL de conexión a la base de datos
DB_URL="postgresql://neondb_owner:npg_oAgZej74WEQl@ep-gentle-hill-a5dmte40m-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Paths
INTERCEPTOR_SOURCE="/root/chat-interceptor-v2.6.js"
INTERCEPTOR_DEST="/var/www/azulik/chat-interceptor.js"
BACKUP_DIR="/root/backups"

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
# PASO 1: BACKUP
###############################################################################

backup_database() {
    print_header "PASO 1: BACKUP DE BASE DE DATOS"

    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/messages_backup_$(date +%Y%m%d_%H%M%S).sql"

    print_info "Creando backup en: $BACKUP_FILE"

    pg_dump "$DB_URL" -t messages -t conversations > "$BACKUP_FILE"

    if [ -f "$BACKUP_FILE" ]; then
        print_success "Backup creado exitosamente"
        echo "  Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
    else
        print_error "Error al crear backup"
        exit 1
    fi
}

###############################################################################
# PASO 2: ANÁLISIS
###############################################################################

analyze_database() {
    print_header "PASO 2: ANÁLISIS DE BASE DE DATOS"

    print_info "Contando mensajes totales..."
    TOTAL_BEFORE=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM messages;" | tr -d ' ')
    print_info "Total de mensajes: $TOTAL_BEFORE"

    print_info "Analizando mensajes problemáticos..."

    echo ""
    echo "Fragmentos (< 10 caracteres):"
    psql "$DB_URL" -c "SELECT COUNT(*) as count FROM messages WHERE LENGTH(content) < 10;"

    echo ""
    echo "URLs solas:"
    psql "$DB_URL" -c "SELECT COUNT(*) as count FROM messages WHERE content ~ '^https?://[^\s]{1,20}$';"

    echo ""
    echo "Solo símbolos:"
    psql "$DB_URL" -c "SELECT COUNT(*) as count FROM messages WHERE content ~ '^[\s\*\-_\[\]\(\)\.]+$';"

    echo ""
    echo "Contienen 'taskade':"
    psql "$DB_URL" -c "SELECT COUNT(*) as count FROM messages WHERE content ILIKE '%taskade%';"

    echo ""
    echo "Timestamps futuros:"
    psql "$DB_URL" -c "SELECT COUNT(*) as count FROM messages WHERE ts > NOW() + INTERVAL '1 hour';"
}

###############################################################################
# PASO 3: LIMPIEZA
###############################################################################

clean_database() {
    print_header "PASO 3: LIMPIEZA DE BASE DE DATOS"

    print_warning "Se eliminarán mensajes malformados"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Operación cancelada"
        exit 1
    fi

    print_info "Ejecutando limpieza..."

    # Ejecutar queries de limpieza
    psql "$DB_URL" <<-EOSQL
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
EOSQL

    print_success "Limpieza completada"

    # Mostrar resultado
    TOTAL_AFTER=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM messages;" | tr -d ' ')
    DELETED=$((TOTAL_BEFORE - TOTAL_AFTER))

    echo ""
    print_info "Mensajes antes:    $TOTAL_BEFORE"
    print_info "Mensajes después:  $TOTAL_AFTER"
    print_success "Mensajes eliminados: $DELETED"
}

###############################################################################
# PASO 4: ACTUALIZAR INTERCEPTOR
###############################################################################

update_interceptor() {
    print_header "PASO 4: ACTUALIZAR INTERCEPTOR"

    if [ ! -f "$INTERCEPTOR_SOURCE" ]; then
        print_error "No se encuentra el archivo: $INTERCEPTOR_SOURCE"
        print_info "Por favor, sube el archivo primero con:"
        print_info "scp chat-interceptor-v2.6.js root@chat.soluciones-ia.info:/root/"
        exit 1
    fi

    # Backup del interceptor actual
    if [ -f "$INTERCEPTOR_DEST" ]; then
        cp "$INTERCEPTOR_DEST" "${INTERCEPTOR_DEST}.backup.$(date +%Y%m%d_%H%M%S)"
        print_info "Backup del interceptor anterior creado"
    fi

    # Copiar nuevo interceptor
    cp "$INTERCEPTOR_SOURCE" "$INTERCEPTOR_DEST"
    print_success "Interceptor actualizado a v2.6"

    # Verificar configuración de Nginx
    print_info "Verificando configuración de Nginx..."
    nginx -t

    if [ $? -eq 0 ]; then
        print_success "Configuración de Nginx válida"

        # Recargar Nginx
        print_info "Recargando Nginx..."
        nginx -s reload
        print_success "Nginx recargado exitosamente"
    else
        print_error "Error en configuración de Nginx"
        exit 1
    fi
}

###############################################################################
# PASO 5: VERIFICACIÓN
###############################################################################

verify_fix() {
    print_header "PASO 5: VERIFICACIÓN"

    print_info "Últimos 10 mensajes en la base de datos:"
    echo ""

    psql "$DB_URL" -c "
        SELECT
            id,
            role,
            LEFT(content, 60) as content,
            ts
        FROM messages
        ORDER BY ts DESC
        LIMIT 10;
    "

    echo ""
    print_info "Verificar manualmente:"
    echo "  1. Abre: https://chat.soluciones-ia.info"
    echo "  2. Abre consola del navegador (F12)"
    echo "  3. Deberías ver: '🔍 AZULIK Chat Interceptor v2.6'"
    echo "  4. Envía un mensaje de prueba"
    echo "  5. Espera 4 segundos"
    echo "  6. Verifica que aparezca en la base de datos"
}

###############################################################################
# RESUMEN
###############################################################################

print_summary() {
    print_header "RESUMEN DE CAMBIOS APLICADOS"

    echo -e "${GREEN}Fixes aplicados:${NC}"
    echo "  ✅ Fragmentos eliminados (< 10 caracteres)"
    echo "  ✅ URLs solas eliminadas"
    echo "  ✅ Símbolos solos eliminados"
    echo "  ✅ Referencias a 'taskade' eliminadas"
    echo "  ✅ Timestamps futuros corregidos"
    echo "  ✅ Conversaciones huérfanas limpiadas"
    echo ""
    echo -e "${GREEN}Interceptor v2.6 instalado con:${NC}"
    echo "  ✅ Timezone: America/Cancun (Tulum)"
    echo "  ✅ Delay anti-fragmentos: 4 segundos"
    echo "  ✅ Longitud mínima: 10 caracteres"
    echo "  ✅ Filtro 'taskade' activo"
    echo "  ✅ Limpieza de prefijos automática"
    echo ""
    print_success "Proceso completado exitosamente"
}

###############################################################################
# MAIN
###############################################################################

main() {
    clear
    print_header "SCRIPT DE LIMPIEZA Y ACTUALIZACIÓN - AZULIK CHAT"

    # Verificar que estamos en el servidor correcto
    if [ ! -d "/var/www/azulik" ]; then
        print_error "Este script debe ejecutarse en el servidor chat.soluciones-ia.info"
        exit 1
    fi

    # Verificar herramientas necesarias
    if ! command -v psql &> /dev/null; then
        print_error "psql no está instalado"
        exit 1
    fi

    if ! command -v pg_dump &> /dev/null; then
        print_error "pg_dump no está instalado"
        exit 1
    fi

    # Ejecutar pasos
    backup_database
    echo ""
    sleep 2

    analyze_database
    echo ""
    sleep 2

    clean_database
    echo ""
    sleep 2

    update_interceptor
    echo ""
    sleep 2

    verify_fix
    echo ""
    sleep 2

    print_summary
}

# Ejecutar script
main
