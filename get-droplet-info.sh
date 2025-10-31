#!/bin/bash

###############################################################################
# Script para Obtener Info de Droplets de Digital Ocean
# Requiere: doctl (CLI de Digital Ocean)
###############################################################################

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Digital Ocean Droplets - Información de Conexión${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar si doctl está instalado
if ! command -v doctl &> /dev/null; then
    echo -e "${YELLOW}⚠️  'doctl' no está instalado${NC}"
    echo ""
    echo "Para instalarlo:"
    echo ""
    echo "Windows (con Chocolatey):"
    echo "  choco install doctl"
    echo ""
    echo "Mac:"
    echo "  brew install doctl"
    echo ""
    echo "Linux:"
    echo "  snap install doctl"
    echo ""
    echo "Luego autenticar:"
    echo "  doctl auth init"
    echo ""
    exit 1
fi

# Verificar si está autenticado
if ! doctl account get &> /dev/null; then
    echo -e "${YELLOW}⚠️  No estás autenticado${NC}"
    echo ""
    echo "Para autenticar:"
    echo "  1. Ve a: https://cloud.digitalocean.com/account/api/tokens"
    echo "  2. Genera un nuevo token (Personal Access Token)"
    echo "  3. Ejecuta: doctl auth init"
    echo "  4. Pega el token cuando lo pida"
    echo ""
    exit 1
fi

# Listar todos los droplets
echo -e "${GREEN}Tus Droplets:${NC}"
echo ""

doctl compute droplet list --format ID,Name,PublicIPv4,Status,Region,Size,VCPUs,Memory,Disk

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# Buscar droplet específico si se proporciona
if [ -n "$1" ]; then
    DROPLET_ID="$1"

    echo ""
    echo -e "${GREEN}Detalles del Droplet $DROPLET_ID:${NC}"
    echo ""

    # Obtener info del droplet
    INFO=$(doctl compute droplet get $DROPLET_ID --format ID,Name,PublicIPv4,Status,Region --no-header)

    if [ -n "$INFO" ]; then
        IP=$(echo "$INFO" | awk '{print $3}')
        NAME=$(echo "$INFO" | awk '{print $2}')
        STATUS=$(echo "$INFO" | awk '{print $4}')

        echo "ID:       $DROPLET_ID"
        echo "Nombre:   $NAME"
        echo "IP:       $IP"
        echo "Estado:   $STATUS"
        echo ""

        if [ "$STATUS" = "active" ]; then
            echo -e "${GREEN}✅ Droplet activo${NC}"
            echo ""
            echo "Comando de conexión:"
            echo -e "${BLUE}ssh root@$IP${NC}"
            echo ""

            # Ofrecer conectar directamente
            read -p "¿Conectar ahora? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                ssh root@$IP
            fi
        else
            echo -e "${YELLOW}⚠️  Droplet no está activo (Estado: $STATUS)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No se encontró el droplet $DROPLET_ID${NC}"
    fi
fi

echo ""
echo "Uso:"
echo "  ./get-droplet-info.sh           # Listar todos los droplets"
echo "  ./get-droplet-info.sh 159       # Ver detalles del droplet 159"
echo ""
