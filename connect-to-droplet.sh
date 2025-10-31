#!/bin/bash

###############################################################################
# Script de Conexión Rápida a Droplets
# Uso: ./connect-to-droplet.sh [nombre_o_ip]
###############################################################################

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuración de droplets conocidos
declare -A DROPLETS
DROPLETS[azulik]="chat.soluciones-ia.info"
DROPLETS[chat]="chat.soluciones-ia.info"
# Agregar más droplets aquí:
# DROPLETS[produccion]="192.168.1.100"
# DROPLETS[desarrollo]="192.168.1.101"

show_help() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Conexión Rápida a Droplets de Digital Ocean${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Uso:"
    echo "  $0 [nombre|ip]              # Conectar a droplet"
    echo "  $0 list                     # Listar droplets guardados"
    echo "  $0 add nombre ip            # Agregar nuevo droplet"
    echo ""
    echo "Ejemplos:"
    echo "  $0 azulik                   # Conectar al servidor azulik"
    echo "  $0 167.99.123.45            # Conectar por IP directa"
    echo "  $0 list                     # Ver droplets guardados"
    echo "  $0 add miserver 192.0.2.1   # Guardar nuevo servidor"
    echo ""

    if [ ${#DROPLETS[@]} -gt 0 ]; then
        echo "Droplets guardados:"
        for name in "${!DROPLETS[@]}"; do
            echo -e "  ${GREEN}$name${NC} → ${DROPLETS[$name]}"
        done
        echo ""
    fi
}

list_droplets() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Droplets Guardados${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""

    if [ ${#DROPLETS[@]} -eq 0 ]; then
        echo -e "${YELLOW}No hay droplets guardados${NC}"
        echo ""
        echo "Para agregar uno:"
        echo "  $0 add nombre ip"
        echo ""
        return
    fi

    for name in "${!DROPLETS[@]}"; do
        ip="${DROPLETS[$name]}"
        echo -e "${GREEN}$name${NC}"
        echo "  IP/Host: $ip"
        echo "  Comando: ssh root@$ip"

        # Probar conectividad
        if ping -c 1 -W 2 "$ip" > /dev/null 2>&1; then
            echo -e "  Estado: ${GREEN}✅ Responde${NC}"
        else
            echo -e "  Estado: ${YELLOW}⚠️  No responde a ping${NC}"
        fi
        echo ""
    done
}

add_droplet() {
    local name="$1"
    local host="$2"

    if [ -z "$name" ] || [ -z "$host" ]; then
        echo -e "${RED}Error: Debes proporcionar nombre y host${NC}"
        echo "Uso: $0 add nombre ip_o_host"
        exit 1
    fi

    # Agregar al archivo (persistente)
    CONFIG_FILE="$HOME/.droplets_config"
    echo "DROPLETS[$name]=\"$host\"" >> "$CONFIG_FILE"

    echo -e "${GREEN}✅ Droplet '$name' agregado${NC}"
    echo "  Host: $host"
    echo "  Conectar con: $0 $name"
    echo ""
    echo "Configuración guardada en: $CONFIG_FILE"
}

connect_to_droplet() {
    local target="$1"

    if [ -z "$target" ]; then
        show_help
        exit 1
    fi

    # Buscar en droplets guardados
    if [ -n "${DROPLETS[$target]}" ]; then
        HOST="${DROPLETS[$target]}"
        echo -e "${BLUE}Conectando a droplet: $target${NC}"
        echo -e "${BLUE}Host: $HOST${NC}"
        echo ""
    else
        # Asumir que es una IP directa
        HOST="$target"
        echo -e "${BLUE}Conectando a: $HOST${NC}"
        echo ""
    fi

    # Verificar conectividad primero
    echo "Verificando conectividad..."
    if ! ping -c 1 -W 3 "$HOST" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Advertencia: El host no responde a ping${NC}"
        echo "Intentando conectar de todas formas..."
        echo ""
    else
        echo -e "${GREEN}✅ Host responde${NC}"
        echo ""
    fi

    # Intentar conectar
    # Primero con llave SSH por defecto
    if [ -f "$HOME/.ssh/id_ed25519" ]; then
        echo "Usando llave SSH: ~/.ssh/id_ed25519"
        ssh -i "$HOME/.ssh/id_ed25519" root@"$HOST"
    elif [ -f "$HOME/.ssh/id_rsa" ]; then
        echo "Usando llave SSH: ~/.ssh/id_rsa"
        ssh -i "$HOME/.ssh/id_rsa" root@"$HOST"
    else
        echo "Sin llave SSH específica, usando configuración por defecto"
        ssh root@"$HOST"
    fi
}

get_droplet_ip_from_api() {
    local droplet_id="$1"
    local token="$2"

    if [ -z "$token" ]; then
        echo -e "${RED}Error: Se necesita un token de API${NC}"
        echo "Obtener en: https://cloud.digitalocean.com/account/api/tokens"
        echo "Uso: $0 api [droplet_id] [token]"
        exit 1
    fi

    echo "Consultando API de Digital Ocean..."

    RESPONSE=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        "https://api.digitalocean.com/v2/droplets/$droplet_id")

    # Extraer IP (requiere jq)
    if command -v jq &> /dev/null; then
        IP=$(echo "$RESPONSE" | jq -r '.droplet.networks.v4[] | select(.type=="public") | .ip_address')
        NAME=$(echo "$RESPONSE" | jq -r '.droplet.name')
        STATUS=$(echo "$RESPONSE" | jq -r '.droplet.status')

        if [ "$IP" != "null" ] && [ -n "$IP" ]; then
            echo ""
            echo -e "${GREEN}✅ Droplet encontrado:${NC}"
            echo "  ID:     $droplet_id"
            echo "  Nombre: $NAME"
            echo "  IP:     $IP"
            echo "  Estado: $STATUS"
            echo ""
            echo "Conectar con:"
            echo -e "  ${BLUE}ssh root@$IP${NC}"
            echo ""

            read -p "¿Conectar ahora? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                ssh root@"$IP"
            fi
        else
            echo -e "${RED}❌ No se pudo obtener la IP del droplet${NC}"
            echo "Respuesta de la API:"
            echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
        fi
    else
        echo -e "${YELLOW}⚠️  'jq' no está instalado${NC}"
        echo "Respuesta raw de la API:"
        echo "$RESPONSE"
        echo ""
        echo "Para instalar jq:"
        echo "  Ubuntu/Debian: sudo apt install jq"
        echo "  Mac: brew install jq"
        echo "  Windows: choco install jq"
    fi
}

# Cargar configuración guardada
CONFIG_FILE="$HOME/.droplets_config"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Main
case "${1:-help}" in
    help|--help|-h)
        show_help
        ;;
    list|ls)
        list_droplets
        ;;
    add)
        add_droplet "$2" "$3"
        ;;
    api)
        get_droplet_ip_from_api "$2" "$3"
        ;;
    *)
        connect_to_droplet "$1"
        ;;
esac
