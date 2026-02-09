// Lightweight internationalization dictionary used by the UI.
// This is intentionally small and focused on UI labels. Page content
// translation is handled by extending the ES/CY databases as needed.

export type LangCode = 'en' | 'es' | 'cy';

type Labels = {
  top: string;
  brand: string;
  home: string;
  about: string;
  story: string;
  writings: string;
  newsletter: string;
  gallery: string;
  overview: string;
  historical: string;
  excavations: string;
  family: string;
  cms: string;
  menu: string;
  englishLabel: string;
  spanishLabel: string;
  welshLabel: string;
};

export const I18N: Record<LangCode, Partial<Labels>> = {
  en: {
    top: 'Truth • Justice • Change',
    brand: 'Great House Farm',
    home: 'Home',
    about: 'About',
    story: 'Our Story',
    writings: 'Writings',
    newsletter: 'Newsletter',
    gallery: 'Gallery',
    overview: 'Overview',
    historical: 'Historical',
    excavations: 'Excavations',
    family: 'Family',
    cms: 'CMS',
    menu: 'Menu',
    englishLabel: 'English',
    spanishLabel: 'Español',
    welshLabel: 'Cymraeg',
  },
  es: {
    top: 'Verdad • Justicia • Cambio',
    brand: 'Gran Casa Farm',
    home: 'Inicio',
    about: 'Acerca de',
    story: 'Nuestra Historia',
    writings: 'Escritos',
    newsletter: 'Boletín',
    gallery: 'Galería',
    overview: 'Resumen',
    historical: 'Histórico',
    excavations: 'Excavaciones',
    family: 'Familia',
    cms: 'CMS',
    menu: 'Menú',
    englishLabel: 'Inglés',
    spanishLabel: 'Español',
    welshLabel: 'Cymraeg',
  },
  cy: {
    top: 'Gwirionedd • Cyfiawnder • Newid',
    brand: 'Ty Mawr Fferm',
    home: 'Cartref',
    about: 'Amdano',
    story: 'Ein Hanes',
    writings: 'Ysgrifau',
    newsletter: 'Cylchlythyr',
    gallery: 'Galleria',
    overview: 'Trosolwg',
    historical: 'Hanesyddol',
    excavations: 'Cloddfeydd',
    family: 'Teulu',
    cms: 'CMS',
    menu: 'Dewislen',
    englishLabel: 'Saesneg',
    spanishLabel: 'Sbaeneg',
    welshLabel: 'Cymraeg',
  },
};

// Simple translator helper. Falls back to English if a translation is missing
// for the current language.
export function t(lang: LangCode, key: keyof Labels): string {
  const map = I18N[lang] as Partial<Labels>;
  const val = map?.[key];
  if (val) return val;
  // Fallback to English for missing translations
  return (I18N.en as Labels)[key];
}
