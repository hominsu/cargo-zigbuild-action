import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import plugin from 'eslint-plugin-jest'
import tseslint from 'typescript-eslint'

/**
 * @type {import("eslint").Linter.Config}
 */
const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**']
  },
  {
    plugins: {
      jest: plugin
    }
  }
]

export default config
