import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import js from '@eslint/js'

export default tseslint
    .config(
        { ignores: ['dist'] },
        {
            extends: [js.configs.recommended, ...tseslint.configs.recommended],
            files: ['**/src/*.t(s|sx)'],
            languageOptions: {
                ecmaVersion: 2020,
                globals: globals.browser,
            },
            plugins: ['@typescript-eslint', 'react'],
            rules: {
                'react-refresh/only-export-components': [
                    'warn',
                    { allowConstantExport: true },
                ],
            },
        }
    )
    .concat(eslintPluginPrettier)
