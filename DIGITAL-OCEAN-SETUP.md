# Guía de Configuración - Digital Ocean CLI

## 📋 Instalación de `doctl`

### Windows

**Opción 1: Con Chocolatey (Recomendado)**
```powershell
choco install doctl
```

**Opción 2: Descargar directamente**
1. Ir a: https://github.com/digitalocean/doctl/releases
2. Descargar `doctl-*-windows-amd64.zip`
3. Extraer y agregar al PATH

### Mac
```bash
brew install doctl
```

### Linux
```bash
# Ubuntu/Debian
snap install doctl

# O descargar directamente
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

---

## 🔑 Autenticación

### Paso 1: Generar Token de API

1. Ir a: https://cloud.digitalocean.com/account/api/tokens
2. Click en "Generate New Token"
3. Configurar:
   - **Name:** `doctl-access` (o cualquier nombre)
   - **Expiration:** Elegir duración
   - **Scopes:** Marcar "Read" y "Write"
4. Click "Generate Token"
5. **COPIAR EL TOKEN** (solo se muestra una vez)

### Paso 2: Autenticar doctl

```bash
doctl auth init
```

Pegar el token cuando lo pida.

### Paso 3: Verificar

```bash
# Ver tu cuenta
doctl account get

# Listar droplets
doctl compute droplet list
```

---

## 🖥️ Comandos Útiles de `doctl`

### Listar Droplets

```bash
# Lista simple
doctl compute droplet list

# Lista detallada
doctl compute droplet list --format ID,Name,PublicIPv4,Status,Region,Memory,Disk

# Solo activos
doctl compute droplet list --format Name,PublicIPv4 --no-header | grep active
```

### Ver Detalles de un Droplet Específico

```bash
# Por ID
doctl compute droplet get 159

# Información completa
doctl compute droplet get 159 --format ID,Name,PublicIPv4,PrivateIPv4,Status,Region,VCPUs,Memory,Disk,CreatedAt
```

### Operaciones de Droplet

```bash
# Encender
doctl compute droplet-action power-on 159

# Apagar
doctl compute droplet-action power-off 159

# Reiniciar
doctl compute droplet-action reboot 159

# Ver acciones recientes
doctl compute droplet-action list 159
```

### SSH a Droplet

```bash
# Obtener IP y conectar
IP=$(doctl compute droplet get 159 --format PublicIPv4 --no-header)
ssh root@$IP

# O directamente con doctl
doctl compute ssh 159
```

### Snapshots y Backups

```bash
# Crear snapshot
doctl compute droplet-action snapshot 159 --snapshot-name "backup-$(date +%Y%m%d)"

# Listar snapshots
doctl compute snapshot list

# Listar backups
doctl compute backup list
```

---

## 🔐 Configuración de SSH

### Opción 1: Usar Contraseña

Si tienes la contraseña del droplet:

```bash
ssh root@[IP_DEL_DROPLET]
# Introducir contraseña cuando lo pida
```

### Opción 2: Usar Llave SSH (Recomendado)

**Si aún no tienes llave SSH:**

```bash
# Generar llave (en tu PC)
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Windows: La guardará en C:\Users\TU_USUARIO\.ssh\id_ed25519
# Mac/Linux: La guardará en ~/.ssh/id_ed25519
```

**Agregar llave a Digital Ocean:**

```bash
# Leer tu llave pública
cat ~/.ssh/id_ed25519.pub
# Windows: type C:\Users\TU_USUARIO\.ssh\id_ed25519.pub

# Copiar el contenido
```

Luego:
1. Ir a: https://cloud.digitalocean.com/account/security
2. Click "Add SSH Key"
3. Pegar la llave pública
4. Darle un nombre

**O usando doctl:**

```bash
# Agregar llave desde archivo
doctl compute ssh-key create "Mi PC" --public-key-file ~/.ssh/id_ed25519.pub

# Listar llaves
doctl compute ssh-key list
```

**Conectar usando la llave:**

```bash
ssh -i ~/.ssh/id_ed25519 root@[IP_DEL_DROPLET]
```

### Opción 3: Configurar SSH Config (Más Fácil)

Crear/editar archivo de configuración SSH:

**Windows:** `C:\Users\TU_USUARIO\.ssh\config`
**Mac/Linux:** `~/.ssh/config`

Contenido:

```
Host droplet159
    HostName [IP_DEL_DROPLET]
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60

Host azulik-chat
    HostName chat.soluciones-ia.info
    User root
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
```

Luego conectar simplemente con:

```bash
ssh droplet159
# O
ssh azulik-chat
```

---

## 📊 Script de Ayuda Rápida

He creado un script que te ayuda a obtener la info:

```bash
# Dar permisos
chmod +x get-droplet-info.sh

# Ver todos los droplets
./get-droplet-info.sh

# Ver droplet específico
./get-droplet-info.sh 159
```

---

## 🔍 Encontrar Droplet 159

### Método 1: Panel Web

1. Ir a: https://cloud.digitalocean.com/droplets
2. En la lista, busca el droplet
3. La IP pública aparece al lado del nombre

### Método 2: Buscar en todos los proyectos

A veces los droplets están en diferentes proyectos:

1. Panel de Digital Ocean → Projects (menú lateral)
2. Revisar cada proyecto
3. Buscar "159" o el nombre del droplet

### Método 3: Usando la API directamente

Si no tienes doctl:

```bash
# Con tu token de API
TOKEN="tu_token_aqui"

# Listar todos los droplets
curl -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.digitalocean.com/v2/droplets" | jq

# Buscar droplet 159
curl -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  "https://api.digitalocean.com/v2/droplets/159" | jq
```

---

## 🚨 Si No Encuentras el Droplet

Posibles razones:

1. **ID incorrecto:** Puede que sea otro número
2. **Droplet eliminado:** Verificar en la papelera de Digital Ocean
3. **Otra cuenta:** Puede estar en otra cuenta de DO
4. **Otra región/proyecto:** Revisar todos los proyectos

### Verificar droplets existentes:

```bash
# Con doctl
doctl compute droplet list --format ID,Name,Status

# Buscar por nombre si conoces parte
doctl compute droplet list | grep -i "azulik"
doctl compute droplet list | grep -i "chat"
```

---

## 📝 Datos que Necesitas para Conectarte

Para conectarte a cualquier droplet necesitas:

| Dato | Dónde encontrarlo |
|------|-------------------|
| **IP Pública** | Panel de DO o `doctl compute droplet get 159 --format PublicIPv4` |
| **Usuario** | Normalmente `root` (o el que configuraste) |
| **Puerto** | `22` (por defecto) |
| **Autenticación** | Contraseña O llave SSH |

---

## ✅ Checklist de Conexión

- [ ] Instalado `doctl`
- [ ] Autenticado con `doctl auth init`
- [ ] Verificado que puedo listar droplets: `doctl compute droplet list`
- [ ] Encontrado el droplet 159
- [ ] Obtenida la IP pública
- [ ] Configurada llave SSH (opcional pero recomendado)
- [ ] Probada conexión: `ssh root@[IP]`

---

## 💡 Alternativa Rápida (Sin doctl)

Si no quieres instalar `doctl`, simplemente:

1. **Ve al panel:** https://cloud.digitalocean.com/droplets
2. **Busca el droplet 159** (o por nombre)
3. **Copia la IP pública**
4. **Conéctate:**
   ```bash
   ssh root@[LA_IP_QUE_COPIASTE]
   ```

Si te pide contraseña y no la sabes:
1. En el panel de DO, click en el droplet
2. Ir a "Access" → "Reset Root Password"
3. Te llegará la nueva contraseña por email

---

## 🆘 Ayuda Adicional

**Documentación oficial de Digital Ocean:**
- CLI doctl: https://docs.digitalocean.com/reference/doctl/
- SSH Keys: https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/
- Conexión SSH: https://docs.digitalocean.com/products/droplets/how-to/connect-with-ssh/

**Soporte de Digital Ocean:**
- Chat: Disponible en el panel
- Tickets: https://cloud.digitalocean.com/support/tickets

---

**Creado:** 24 de Octubre, 2024
**Para:** Gestión de Droplets en Digital Ocean
