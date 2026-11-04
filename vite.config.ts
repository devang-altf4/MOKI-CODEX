import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createAssistantHandler } from './server/assistant.mjs';
import { createLeadsHandler } from './server/leads.mjs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const assistant = createAssistantHandler({ getConfig: () => ({ ...env, ...process.env }) });
  const leads = createLeadsHandler({ getConfig: () => ({ ...env, ...process.env }) });
  const api = { name: 'moki-api', configureServer(server: any) { server.middlewares.use('/api/chat', assistant); server.middlewares.use('/api/leads', leads); }, configurePreviewServer(server: any) {
    server.middlewares.use('/api/chat', assistant); server.middlewares.use('/api/leads', leads);
    server.middlewares.use((req: any, _res: any, next: any) => {
      if (/^\/(solutions|how-it-works|industries|about|contact|privacy|type-study)(?:[/?]|$)/.test(req.url || '')) req.url = '/legacy.html';
      next();
    });
  } };
  return {
  plugins: [react(), api],
  server: { strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'motion';
        },
      },
    },
  },
}; });
