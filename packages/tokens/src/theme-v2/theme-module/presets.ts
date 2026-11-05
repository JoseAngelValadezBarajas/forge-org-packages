import type { ThemeConfig } from '../theme-abstractions/index.js';

export const presets: Readonly<Record<'forge' | 'formiai' | 'autofund' | 'neutral', ThemeConfig>> = {
  forge: { name: 'Forge', colors: { primary: '#d8874d', secondary: '#bc8a70', neutral: '#24272a' }, mode: 'dark' },
  formiai: { name: 'FormiAI (demo)', colors: { primary: '#008e83', secondary: '#75bba7', neutral: '#253330' }, mode: 'light' },
  autofund: { name: 'AutoFund (demo)', colors: { primary: '#4058b5', secondary: '#7986cb', neutral: '#292e3d' }, mode: 'light' },
  neutral: { name: 'Neutral', colors: { primary: '#666666', secondary: '#777777', neutral: '#555555' }, mode: 'light' },
};
