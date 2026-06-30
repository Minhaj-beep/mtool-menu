// Next.js self-hosts Google Fonts at build time, which means every font a
// restaurant could pick must be statically imported here (you can't import
// a font dynamically by name at runtime). This is the single place that
// needs to change if a new font is added to the "Font" dropdown in
// app/admin/settings/page.tsx.
import {
  Inter,
  Poppins,
  Roboto,
  Montserrat,
  Open_Sans,
  Lato,
  Nunito,
  Playfair_Display,
} from 'next/font/google';
import type { FontFamilyOption } from '@/lib/types/database';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-restaurant' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-restaurant' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-restaurant' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-restaurant' });
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-restaurant' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-restaurant' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-restaurant' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-restaurant' });

export const FONT_MAP: Record<FontFamilyOption, { className: string; family: string }> = {
  Inter: { className: inter.className, family: inter.style.fontFamily },
  Poppins: { className: poppins.className, family: poppins.style.fontFamily },
  Roboto: { className: roboto.className, family: roboto.style.fontFamily },
  Montserrat: { className: montserrat.className, family: montserrat.style.fontFamily },
  'Open Sans': { className: openSans.className, family: openSans.style.fontFamily },
  Lato: { className: lato.className, family: lato.style.fontFamily },
  Nunito: { className: nunito.className, family: nunito.style.fontFamily },
  'Playfair Display': { className: playfair.className, family: playfair.style.fontFamily },
};

export function resolveFont(fontFamily: string | null | undefined) {
  if (fontFamily && fontFamily in FONT_MAP) {
    return FONT_MAP[fontFamily as FontFamilyOption];
  }
  return FONT_MAP.Inter;
}
