import { TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import { tones, type TonalScale } from '../theme-abstractions/index.js';
import { normalizeColor } from './theme.helper.js';

export function generatePalette(seed: string): TonalScale {
  const palette = TonalPalette.fromInt(argbFromHex(normalizeColor(seed, 'seed')));
  return Object.fromEntries(tones.map((tone) => [tone, hexFromArgb(palette.tone(tone))])) as TonalScale;
}
