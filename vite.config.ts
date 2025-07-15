// https://vite.dev/config/
/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import * as path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 5173,
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
            ],
            credentials: true,
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/test.config.ts'],
        coverage: {
            provider: 'v8',
            exclude: ['*.config.(j|t)s'],
            all: true,
        },
    },
    plugins: [react(), tsconfigPaths(), tailwindcss()],
    build: {
        target: 'esnext',
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    define: {
        global: 'globalThis',
    },
    optimizeDeps: {
        include: ['@aws-sdk/client-s3', '@aws-sdk/lib-storage'],
    },
})
