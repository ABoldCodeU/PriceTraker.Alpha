# Price Tracker Alpha (Frontend)

Aplicación web desarrollada en React + Vite para rastrear y comparar precios de productos en diferentes tiendas en línea. Este proyecto es **solo frontend** y no depende de ningún backend ni servicios externos.

## Requisitos Previos

- Node.js (versión 16 o superior)
- npm (incluido con Node.js)

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/ABoldCodeU/PriceTraker.Alpha.git
   cd PriceTraker.Alpha
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

## Desarrollo Local

Para iniciar el servidor de desarrollo (hot reload):

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Build para Producción

Para generar los archivos estáticos optimizados para producción:

```bash
npm run build
```

El resultado estará en la carpeta `dist/` y puede ser desplegado en cualquier hosting estático (Vercel, Netlify, GitHub Pages, etc).

Para previsualizar el build localmente:

```bash
npm run preview
```

## Estructura del Proyecto

```
pricetracker.alpha/
├── components/     # Componentes React reutilizables
├── hooks/         # Custom hooks de React
├── services/      # Utilidades y lógica de negocio
├── App.tsx        # Componente principal
├── index.tsx      # Punto de entrada
├── vite.config.ts # Configuración de Vite
└── ...
```

## Tecnologías Utilizadas

- React 18+
- TypeScript
- Vite
- Tailwind CSS

## Contribución

1. Haz un Fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/mi-feature`)
3. Haz commit de tus cambios (`git commit -m 'feat: agrega mi feature'`)
4. Haz push a tu rama (`git push origin feature/mi-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
