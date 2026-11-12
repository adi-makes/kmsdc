import nextVitals from 'eslint-config-next/core-web-vitals';
import { baseConfig } from '@kmsdc/config/eslint/base';

// Next's rules first; our typed TypeScript config afterwards so its parser (with type
// information) wins over the parser bundled in eslint-config-next.
const config = [
  ...nextVitals,
  ...baseConfig({ tsconfigRootDir: import.meta.dirname }),
  { ignores: ['.next/**', 'next-env.d.ts'] },
];

export default config;
