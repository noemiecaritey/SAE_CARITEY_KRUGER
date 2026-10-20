- URL site WEB : sae-konstance-noemie.netlify.app
- URL Notebook Observable : https://observablehq.com/d/18018990b0accaa7
- Nom :CARITEY
- Prénom : Noémie
- Nom binome : KRUGER
- Prénom binome : Konstance


# Sans filtre — SAE 303, défi A, groupe 19

**Problématique :** OpenAI, Google et Mistral publient-ils assez de chiffres pour qu'on puisse vérifier s'ils tiennent leurs objectifs climat ?
Site Astro construit sur la base commune [ppierre/base-astro-tw-plot](https://github.com/ppierre/base-astro-tw-plot), Tailwind 4 + DaisyUI 5.

```
npm install
npm run donnees   # régénère les données filtrées (voir « Données »)
npm run dev       # http://localhost:4321/
npm run build     # production (Netlify)
```

## Éléments techniques remarquables

### Trois routes d'export, choisies selon le besoin
La question qui tranche : « est-ce que ça doit bouger chez le lecteur ? »

| Route | Où dans le code | Utilisée pour | Pourquoi |
|---|---|---|---|
| **A — build** | [`PlotFigure.astro`](src/components/PlotFigure.astro) (Plot + JSDOM, SVG injecté avec `set:html`) | matrice des publications ([V1](src/components/GrapheV1.astro)), [distribution Stanford](src/components/GrapheStanford.astro), [domaines FMTI](src/components/GrapheV2.astro), [variations Google](src/components/GrapheV3.astro), [courbe 2019-2024](src/components/GrapheCourbe.astro), [chronologie](src/components/GrapheV5.astro), [carte](src/components/CarteCentres.astro) | données figées, lecture seule : zéro JavaScript chez le lecteur, meilleur pour l'accessibilité et le SEO |
| **B — client** | `<script>` + `import * as Plot` dans [`GrapheV4.astro`](src/components/GrapheV4.astro) et [`TableFMTI.astro`](src/components/TableFMTI.astro) | comparaison de deux années, filtre de la table FMTI | le lecteur choisit : le graphique est redessiné dans son navigateur à chaque `change` (`innerHTML = ""`, puis nouveau tracé, appel initial) |
| **C — une page par valeur** | [`entreprise/[entreprise].astro`](src/pages/entreprise/[entreprise].astro) (`getStaticPaths`, `prerender`, `Astro.params`) | une fiche par entreprise | contenu stable, indexable, partageable par lien |

Chaque graphique de l'accueil a sa **fiche de visualisation** dépliable ([`FicheViz.astro`](src/components/FicheViz.astro)) : question, famille, encodage, dénominateur, titre/sous-titre porteurs, alternative textuelle, route d'export justifiée.

### Interactions
- **Comparaison de deux années** ([`GrapheV4.astro`](src/components/GrapheV4.astro)) : deux `<select>` ; l'année d'arrivée se recalcule pour rester postérieure au départ ; titre, sous-titre et alternative textuelle changent avec le choix et sont annoncés aux lecteurs d'écran (`aria-live`). La fonction de tracé ([`lib/periode.ts`](src/lib/periode.ts)) est réutilisable : la page [Méthode](src/pages/methode.astro) la rappelle avec seulement deux indicateurs (test TP5).
- **Filtre de la table Stanford** par domaine ([`TableFMTI.astro`](src/components/TableFMTI.astro)).
- **Détails au survol** de chaque case de la matrice des publications (valeur, explication, source).
- **Animations de défilement** ([`scripts/reveal.ts`](src/scripts/reveal.ts), [`styles/animations.css`](src/styles/animations.css)) : apparition des blocs, barres et cases qui se dessinent, compteurs, barre de progression de lecture. Uniquement `transform` et `opacity`, toutes désactivées par `prefers-reduced-motion`, et le contenu reste entièrement visible sans JavaScript.

### Navigation
- **Entre pages** : `<select>` + `location.pathname` ([`Layout.astro`](src/layouts/Layout.astro)), avec `trailingSlash: "always"` ([`astro.config.mjs`](astro.config.mjs)) pour que ça fonctionne sur Netlify.
- **Sur l'accueil** : menu d'ancres (`location.hash`) dont la section visible est mise en surbrillance par un `IntersectionObserver` (`.menu-item`, `.item`, `.active`). Écart assumé avec le TP : sections plus hautes que l'écran, donc l'observer cible une bande centrale (`rootMargin: -45%`) plutôt que `threshold: 0.5`.
- Lien d'évitement « aller au contenu », fil d'avancement en haut de page.

### Responsive
Mise en page Tailwind mobile d'abord (grilles `md:` / `lg:`), menu d'ancres remplacé par un `<select>` sur petit écran, tableaux dans des conteneurs à défilement horizontal, graphiques SVG à largeur fluide, graphique des variations « collé » pendant la lecture seulement à partir de `lg` (`position: sticky`).

### Accessibilité
- Chaque graphique : `<figure>`, `role="img"` et `aria-label` détaillé (valeurs lues), titre/sous-titre/légende Plot (`ariaLabel`, `caption`).
- Second repère que la couleur partout : ✓ / —, lettres A-P-O dans la chronologie, valeurs écrites sur les barres.
- Tableaux avec `<caption>` et `scope`, contrastes vérifiés sur le menu actif, lien d'évitement, `aria-live` sur l'interaction.
- Lighthouse : à lancer sur le site déployé (score à reporter ici).

### Données
Les fichiers bruts du défi **ne sont pas dans le dépôt** (`donnees-brutes/` est ignoré par git). [`scripts/preparer-donnees.mjs`](scripts/preparer-donnees.mjs) les transforme en fichiers pré-filtrés de [`src/assets/`](src/assets) : colonnes utiles seulement, dénominateurs conservés, 2 décimales. Un fichier absent est ignoré : le composant concerné affiche alors un message ([`DonneesAttendues.astro`](src/components/DonneesAttendues.astro)). Fichiers attendus dans `donnees-brutes/` : `Dec2025_scores.csv` (ou `.json`), `Dec2025_indicators.csv`, `comparia_echantillon.csv`, `export.geojson`, `metropole-version-simplifiee.geojson`. Sources, dates, jointures, limites et téléchargements : page [Méthode](src/pages/methode.astro).

