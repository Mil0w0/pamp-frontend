// https://vite.dev/config/
/// <reference types="vitest" />
/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import * as path from "path";
import tailwindcss from "@tailwindcss/vite"

// https://vitejs.dev/config/
export default defineConfig({
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
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
