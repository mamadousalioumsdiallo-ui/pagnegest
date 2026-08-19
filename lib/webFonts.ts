import { Platform } from 'react-native';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@400;500;600;700&display=swap';

export function ensureWebFonts(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('hafsa-gestion-fonts')) return;
  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnect);
  const gstatic = document.createElement('link');
  gstatic.rel = 'preconnect';
  gstatic.href = 'https://fonts.gstatic.com';
  gstatic.crossOrigin = 'anonymous';
  document.head.appendChild(gstatic);
  const link = document.createElement('link');
  link.id = 'hafsa-gestion-fonts';
  link.rel = 'stylesheet';
  link.href = FONT_HREF;
  document.head.appendChild(link);
}
