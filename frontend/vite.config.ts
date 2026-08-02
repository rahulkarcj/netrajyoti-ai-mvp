import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ plugins: [react(), tailwindcss(), VitePWA({ registerType: 'autoUpdate', manifest: { name: 'NetraJyoti AI', short_name: 'NetraJyoti', start_url: '/', display: 'standalone', background_color: '#f7fbfa', theme_color: '#007d75', icons: [] } })], server: { port: 5173 } });
