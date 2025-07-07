import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import reactRefresh from 'eslint-plugin-react-refresh'
import js from '@eslint/js'

export default tseslint
    .config(
        { ignores: ['dist'] },
        {
            extends: [js.configs.recommended, ...tseslint.configs.recommended],
            files: ['**/*.{ts,tsx}'],
            languageOptions: {
                ecmaVersion: 2020,
                globals: globals.browser,
            },
            plugins: {
                'react-refresh': reactRefresh,
            },
            rules: {
                'react-refresh/only-export-components': [
                    'warn',
                    { allowConstantExport: true },
                ],
                '@typescript-eslint/no-explicit-any': 'off',
            },
        }
    )
    .concat(eslintPluginPrettier)
