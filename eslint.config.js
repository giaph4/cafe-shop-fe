import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
    js.configs.recommended,
    ...vue.configs['flat/essential'],
    ...vue.configs['flat/strongly-recommended'],
    ...vue.configs['flat/recommended'],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        },
        plugins: {
            vue
        },
        rules: {
            // Vue specific
            'vue/multi-word-component-names': 'warn',
            'vue/no-unused-vars': 'error',
            'vue/no-unused-components': 'warn',
            'vue/require-default-prop': 'warn',
            'vue/require-prop-types': 'warn',
            'vue/prop-name-casing': ['warn', 'camelCase'],
            'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
            'vue/attribute-hyphenation': ['warn', 'always'],
            'vue/v-on-event-hyphenation': ['warn', 'always'],
            
            // General JavaScript
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-debugger': 'error',
            'no-unused-vars': ['error', { 
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'no-undef': 'error',
            'no-var': 'error',
            'prefer-const': 'warn',
            'prefer-arrow-callback': 'warn',
            'arrow-body-style': ['warn', 'as-needed'],
            'object-shorthand': 'warn',
            'prefer-template': 'warn',
            
            // Code quality
            'eqeqeq': ['error', 'always'],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-return-assign': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-throw-literal': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unused-expressions': 'error',
            'no-useless-call': 'error',
            'no-useless-concat': 'error',
            'no-useless-return': 'error',
            'require-await': 'warn',
            
            // Best practices
            'array-callback-return': 'warn',
            'consistent-return': 'warn',
            'default-case': 'warn',
            'default-case-last': 'warn',
            'dot-notation': 'warn',
            'no-else-return': 'warn',
            'no-empty-function': 'warn',
            'no-implicit-coercion': 'warn',
            'no-lone-blocks': 'warn',
            'no-param-reassign': ['warn', { props: false }],
            'no-return-await': 'warn',
            'prefer-promise-reject-errors': 'warn',
            
            // Style
            'indent': ['warn', 4, { SwitchCase: 1 }],
            'quotes': ['warn', 'single', { avoidEscape: true }],
            'semi': ['warn', 'never'],
            'comma-dangle': ['warn', 'never'],
            'comma-spacing': ['warn', { before: false, after: true }],
            'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
            'object-curly-spacing': ['warn', 'always'],
            'array-bracket-spacing': ['warn', 'never'],
            'space-before-blocks': 'warn',
            'space-before-function-paren': ['warn', 'always'],
            'space-in-parens': ['warn', 'never'],
            'space-infix-ops': 'warn',
            'space-unary-ops': 'warn',
            'spaced-comment': ['warn', 'always'],
            'brace-style': ['warn', '1tbs'],
            'camelcase': ['warn', { properties: 'always' }],
            'eol-last': ['warn', 'always'],
            'no-trailing-spaces': 'warn',
            'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
            'padded-blocks': ['warn', 'never']
        }
    },
    {
        files: ['*.vue'],
        rules: {
            'indent': 'off'
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            '*.config.js',
            '*.config.mjs',
            '.vite/**',
            'coverage/**'
        ]
    }
]

