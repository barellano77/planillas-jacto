import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El backend (server.ts) escucha en process.env.PORT, con 3000 como valor por
// defecto (ver server.ts). El proxy debe apuntar SIEMPRE al mismo puerto, o
// las llamadas a /api/* (login, guardar planillas, catálogo) van a fallar con
// "connection refused" aunque el frontend cargue bien.
const backendPort = Number(process.env.PORT) || 3000;

// El host de HMR de Verdent cambia en cada contenedor nuevo: no lo
// hardcodeamos en el repo (queda obsoleto y rompe el preview). Si Verdent
// necesita forzar un host distinto, lo puede pasar por VITE_HMR_HOST; si no
// está seteado, Vite resuelve el host automáticamente.
const hmrHost = process.env.VITE_HMR_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    ...(hmrHost
      ? {
          hmr: {
            host: hmrHost,
            protocol: 'wss',
            clientPort: 443,
          },
        }
      : {}),
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
})
