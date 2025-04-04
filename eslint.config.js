import {defineConfig} from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginPrettier from "eslint-plugin-prettier";
import react from "@vitejs/plugin-react";


export default defineConfig([
    {files: ["**/src/*.t(s|sx)"], languageOptions: {globals: globals.browser}},
    {
        files: ["**/src/*.t(s|sx)"],
        plugins: {react, eslintPluginPrettier},
    },
    tseslint.configs.recommended,
]);