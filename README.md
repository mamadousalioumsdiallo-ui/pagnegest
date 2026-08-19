# PagneGest

Application mobile pour gérer une boutique de pagnes africains (Woodin, Phoenix, Uniwax), bazin, voile, tissus, vêtements bébé et enfants, et accessoires.

Elle fonctionne **hors ligne** sur le téléphone : ventes, stock et dettes restent sur l’appareil.

## Fonctions

- **Ventes** : panier, client passage ou client enregistré, paiement comptant, acompte ou crédit
- **Stock** : catégories (Woodin, Phoenix, Uniwax, bazin, voile, tissus, bébé, enfants, accessoires), seuils d’alerte, entrées/sorties
- **Dettes** : solde par client, encaissement d’un paiement, appel du client
- **Accueil** : chiffre du jour, alertes stock, dettes ouvertes

Les montants sont en **francs CFA** (affichés en `F`).

Pour tester dans Safari (iPhone ou Mac), ouvrez :

**https://mamadousalioumsdiallo-ui.github.io/pagnegest/**

Vous pouvez aussi l’ajouter à l’écran d’accueil : Partager → Sur l’écran d’accueil.

## Lancer l’application


Prérequis : Node.js 20+, puis [Expo Go](https://expo.dev/go) sur un téléphone Android ou iPhone.

```bash
npm install
npx expo start
```

Scannez le QR code avec Expo Go. Pour tester dans le navigateur :

```bash
npx expo start --web
```

## Première utilisation

Au premier lancement, PagneGest charge un **exemple de boutique** (pagnes, vêtements bébé, quelques ventes et dettes). Vous pouvez tout réinitialiser depuis l’onglet **Plus**.

Ajoutez ensuite vos vrais produits, vendez, et enregistrez les crédits clients.

## Production

Pour publier sur l’App Store / Google Play :

```bash
npx expo prebuild
npx expo run:android
```

ou via [EAS Build](https://docs.expo.dev/build/setup/).
