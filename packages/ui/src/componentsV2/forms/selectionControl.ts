import type { ReactNode } from 'react';

export type SelectionControlName =
  | { children: ReactNode }
  | { children?: undefined; 'aria-label': string }
  | { children?: undefined; 'aria-labelledby': string }
  | { children?: undefined; id: string };
