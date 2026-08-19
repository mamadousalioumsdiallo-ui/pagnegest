import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=cover, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="PagneGest" />
        <meta name="theme-color" content="#6E1C16" />
        <title>PagneGest — boutique de pagnes</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body, #root {
  height: 100%;
  background-color: #F3EBE0;
}
body {
  margin: 0;
  overflow: hidden;
  font-family: Outfit, system-ui, sans-serif;
}
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
`;
