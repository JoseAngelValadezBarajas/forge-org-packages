import type { SemanticRole, ThemeMode, Tone } from '../constants/constants.js';

export type BrandColors = { 
    primary: string; 
    secondary: string; 
    neutral: string; 
    neutralVariant?: string; 
    tertiary?: string; 
    error?: string; 
    warning?: string; 
    success?: string; 
    info?: string 
};
export type ThemeConfig = { 
    name: string; 
    colors: BrandColors; 
    mode: ThemeMode 
};

export type Theme = { 
    name: string; 
    mode: ThemeMode; 
    colors: Required<BrandColors>; 
    palettes: Record<keyof Required<BrandColors>, TonalScale>; 
    roles: Record<SemanticRole, string> 
};

export type ContrastCheck = { 
    foreground: SemanticRole ; 
    background: SemanticRole; 
    ratio: number; 
    minimum: number; 
    passed: boolean 
};
    
export type ThemeValidation = { 
    valid: boolean; 
    errors: string[]; 
    contrasts: ContrastCheck[] 
};

export type TonalScale = Record<Tone, string>;
