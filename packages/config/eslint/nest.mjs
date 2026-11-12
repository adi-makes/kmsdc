// ESLint config for NestJS applications.
import { baseConfig } from './base.mjs';

/**
 * @param {{ tsconfigRootDir: string }} options
 */
export function nestConfig({ tsconfigRootDir }) {
  return [
    ...baseConfig({ tsconfigRootDir }),
    {
      rules: {
        // Nest modules are classes with only decorators by design.
        '@typescript-eslint/no-extraneous-class': 'off',
        // Nest injects via constructor parameter metadata — type-only imports would break DI.
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
  ];
}
