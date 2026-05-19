# SpritePlayer

Petit outil web pour prévisualiser une **sprite sheet** (PNG ou JPEG) en **boucle**, comme un GIF animé. Tout s’exécute **dans le navigateur** : aucun serveur ni upload de fichiers n’est requis.

## Fonctionnalités

- **Import local** : sélection d’une image via `FileReader` (data URL), sans backend.
- **Configuration de la feuille** :
  - orientation **horizontale** (frames côte à côte) ou **verticale** (empilées) ;
  - nombre total de **frames** ;
  - bouton **Valider & Lancer** : calcule la taille d’une frame à partir des dimensions réelles (`naturalWidth` / `naturalHeight`).
- **Vitesse** : curseur **1 à 60 FPS** ; le changement s’applique tout de suite à l’animation en cours (`useEffect` + intervalle).
- **Lecture** : **Pause** / **Lecture**, **Précédent** / **Suivant** (image à image), **Début** (retour à la première frame) ; compteur « Image n / total ».
- **Rendu** : `background-image` + `background-position` (sans transition CSS), zone d’aperçu sur fond sombre, `image-rendering: pixelated` pour le pixel art.

## Prérequis

- [Node.js](https://nodejs.org/) (LTS 20 ou 22 recommandé)
- npm (fourni avec Node)

## Installation

```bash
git clone <url-du-depot>
cd SpritePlayer
npm install
```

## Scripts

| Commande        | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`   | Serveur de développement (Vite + HMR)|
| `npm run build` | Build de production dans `dist/`    |
| `npm run preview` | Sert le build localement pour test |

Après `npm run dev`, ouvre l’URL affichée (souvent `http://localhost:5173`).

## Utilisation rapide

1. Lance `npm run dev`.
2. **Choisir un fichier** image (`.png`, `.jpg`, `.jpeg`).
3. Indique l’**orientation** de la bande de sprites et le **nombre d’images**.
4. Clique sur **Valider & Lancer** pour démarrer la boucle.
5. Ajuste les **FPS** avec le curseur.
6. Utilise la barre sous l’aperçu : **Pause** / **Lecture**, pas à pas, **Début**.

## Structure du projet

```
SpritePlayer/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx          # Point d’entrée React
    ├── App.jsx           # Monte le composant SpritePlayer
    ├── index.css         # Reset / fond global
    ├── SpritePlayer.jsx  # Composant principal
    └── SpritePlayer.css  # Styles du lecteur
```

## Intégration dans une autre app

```jsx
import SpritePlayer from './SpritePlayer';

export default function App() {
  return <SpritePlayer />;
}
```

Les styles du lecteur sont importés dans `SpritePlayer.jsx`.

## Stack technique

- **React** 19 (hooks)
- **Vite** 6 + `@vitejs/plugin-react`

## Licence

Projet personnel : adapte la licence selon ton usage.
