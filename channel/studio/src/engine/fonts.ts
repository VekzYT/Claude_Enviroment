import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { STUDIO } from '../studio.config';

// Three faces, all loaded from public/fonts so renders need no connection: GAMERULE's heavy display face for the
// title card (Poppins), its pixel face for on-screen readouts and the HUD (Pixelify Sans), and a handwriting face
// for chalk and notes (Kalam). All three are SIL Open Font License, from Google Fonts.

for (const weight of ['600', '700', '800', '900']) loadFont({ family: 'Poppins', url: staticFile(`fonts/Poppins-${weight}.woff2`), weight });
loadFont({ family: 'Pixelify Sans', url: staticFile('fonts/PixelifySans-500.woff2'), weight: '400 700' });
for (const weight of ['400', '700']) loadFont({ family: 'Kalam', url: staticFile(`fonts/Kalam-${weight}.woff2`), weight });
if (STUDIO.titleFont) loadFont({ family: STUDIO.titleFont.family, url: staticFile(STUDIO.titleFont.file), weight: STUDIO.titleFont.weight });

export const FONT = {
  title: STUDIO.titleFont ? STUDIO.titleFont.family : 'Poppins',
  ui: 'Pixelify Sans',
  hand: 'Kalam',
};
