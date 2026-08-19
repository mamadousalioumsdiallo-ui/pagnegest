import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const path = 'dist/index.html';
let html = readFileSync(path, 'utf8');

if (!html.includes('lang=')) {
  html = html.replace('<html', '<html lang="fr"');
}

const headExtras = `
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="PagneGest" />
    <meta name="theme-color" content="#6E1C16" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      html, body, #root { background-color: #F3EBE0; }
      body { font-family: Outfit, system-ui, sans-serif; }
      @font-face {
        font-family: 'ionicons';
        font-style: normal;
        font-weight: 400;
        font-display: block;
        src: url('/pagnegest/fonts/Ionicons.ttf') format('truetype');
      }
      @font-face {
        font-family: 'Ionicons';
        font-style: normal;
        font-weight: 400;
        font-display: block;
        src: url('/pagnegest/fonts/Ionicons.ttf') format('truetype');
      }
    </style>`;

if (!html.includes('pagnegest-fonts') && !html.includes('fonts.googleapis.com')) {
  html = html.replace('</head>', `${headExtras}\n  </head>`);
}

html = html.replace(/<title>.*?<\/title>/, '<title>PagneGest — boutique de pagnes</title>');
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, shrink-to-fit=cover, viewport-fit=cover"'
);

writeFileSync(path, html);
copyFileSync(path, 'dist/404.html');
console.log('Patched dist/index.html and dist/404.html');
