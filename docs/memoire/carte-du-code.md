# Carte du code (dépôt timj1-1/guitare, v51)

_Mis à jour le 2026-11-04 (app v51, MAJ 01)._

L'app est en JavaScript sans framework ni étape de compilation. Les cours sont générés en Python. Les chemins sont relatifs à la racine du dépôt.

## L'app (ce qui est publié)
| Fichier | Rôle | Taille |
|---|---|---|
| `index.html` | Page unique : les 5 onglets, charge les scripts. | 8 Ko |
| `app.js` | Cœur de l'app : onglets (`go`), Mon cours (`renderCours`, `renderBloc`, `renderExo`, `programme`, `rangeBloc`), le prof qui parle (`parle`, `montre`), Mes morceaux (`renderMorceaux`, `ficheMorceau`, `editeMorceau`, `listeTabs`), fin de cours et bilan de la semaine (`finish`, `recapSemaine`), Mon bilan (`renderBilan`, `pliSons`, `pliReglages`, `pliDonnees`, `restaure`), minuteurs, métronome, maintien de l'écran allumé. | 2 320 lignes |
| `jeux.js` | Jeux du manche intégrés aux blocs : indice, Résoudre, Réessayer, mode écoute au micro (détection de notes YIN, AudioWorklet). | 645 lignes |
| `accordeur.js` | Accordeur (bouton diapason de l'en-tête) : YIN, La = 440, mode automatique. Utilise le micro de jeux.js (`Jeux.micro.start(..., { brut, taille })`). | ~150 lignes |
| `niveaux.js` | Onglet Jeux : 5 jeux à 10 niveaux (Notes du manche, Gammes, Pentatonique, Accords ouverts, Barrés), un seul moteur, mémoire v3 (`migre3` remet chaque question à son niveau), répétition des erreurs (boîtes de Leitner), chrono, mode sans fin, journal des parties pour le bilan. `PASSE = 10`. | 559 lignes |
| `sons.js` | Contexte audio, petits sons en notes de guitare, « musique du cours » (12 gammes rares, `GAMMES`), et la voix (`Sons.dire`). | 307 lignes |
| `reglages.js` | Réglages partagés (`window.Reglages`), thème, timbre de guitare (`Reglages.TIMBRES`). Chargé aussi par manche.html. | 56 lignes |
| `manche.html` | Mon manche, affiché dans un cadre. C'est une copie adaptée de l'Artifact « Mon manche » : elle n'embarque pas les sons depuis la v39. | 1 734 lignes |
| `style.css` | Tout le style, avec les thèmes clair et sombre. | 1 050 lignes |
| `sw.js` | Service worker : hors ligne, mises à jour (`VERSION`), caches stables pour la voix, les sons et pdf.js. | 77 lignes |
| `samples-nylon.js`, `samples-acier.js` | Vrais enregistrements de guitare (nylon, acier pour le son Manouche par défaut). | 0,6 + 1,1 Mo |
| `manifest.webmanifest`, `icons/` | Installation sur l'écran d'accueil. | |
| `fonts/` | Polices en local (Instrument Serif et Sans, JetBrains Mono). | |
| `lib/pdfjs/` | Lecteur de PDF pour les tablatures importées. | 1,4 Mo |
| `schemas/` | Images de schémas (notes du manche). | |
| `voix/` | Une phrase = un mp3 nommé d'après son texte. Racine : Siwis (1 394 fichiers). `voix/remy/` : 1 585 fichiers. `voix/vivienne/` : 372 fichiers (pas proposée dans l'app). `voix/voix.json` liste les voix proposées (Siwis, Rémy). | |

## Les données
| Fichier | Rôle |
|---|---|
| `data/cours.json` | Les 36 cours, les 3 paliers, les thèmes, les morceaux, les analyses et les textes du prof. **Généré, à ne pas modifier à la main.** |
| `data/schemas.json` | Schémas SVG repris du Claude Doc du cours. |
| `data/adaptations.json` | Changements du cours après un bilan, rangés par cours (vide aujourd'hui). |
| `data/retours.json` | Mots du prof après un bilan (seulement le mot de bienvenue du 2026-10-23). |

Sur l'appareil, les données sont dans localStorage : `maguitare:v1` (cases, tempos, morceaux, jeux), `maguitare:*` (réglages) et `manche:*` (Mon manche, dont `manche:timbre` et `manche:naming` partagés avec toute l'app). Les photos et PDF sont dans IndexedDB (`maguitare-fichiers`).

## Les outils (non publiés dans l'app)
| Fichier | Rôle |
|---|---|
| `tools/build_cours.py` | **Source du cours.** MAJ 01 : `VIDEO_EXO` et `SCHEMA_EXO` donnent vidéos et schémas de chaque exercice ; `duree_ex`/`complete_durees` la durée ; le type et « Relire » sont calculés après la construction des cours ; `ARAIGNEE*` les variantes. Paliers (`PALIERS`, `NOMS`), blocs, « pourquoi c'est utile » (`QUAND`), schémas, morceaux (`MISSIONS`, `REPERTOIRE`, `BOSSA`, `MAITRISER`, `ANALYSES`), textes du prof (`PROF`, `NOM_BLOC`). Lancer `python3 tools/build_cours.py` pour régénérer `data/cours.json`. |
| `tools/explications.py` | Explications par exercice et positions (accords, gammes). |
| `tools/voix.py` | Enregistre les phrases manquantes (Kokoro ou Azure `--azure`). Ses phrases doivent rester identiques à celles de l'app. |
| `tools/schemas/` | Schémas des effets en JSX (`effets/`), compilés par `compile.cjs` et recadrés par `crop.mjs`. |
| `tools/icons.py` | Génère les icônes. |
| `tools/schemas/penta_notes.py` | Schéma « penta-1-notes » (nom des notes dans les ronds), écrit dans `data/schemas.json`. |
| `tools/test-micro.html` | Page de diagnostic du micro. |
| `tools/tests/banc_accordeur.js` | Banc d'essai de l'accordeur (YIN contre MPM sur des cordes simulées). |
| `tools/tests/smoke.js` | Test automatique (MAJ 01) : 36 cours, chaque bloc et chaque onglet, écran ordinateur et téléphone, erreurs de console. `node tools/tests/smoke.js`. |
| `tools/tests/contenu.py` | Contrôle du contenu : exercices disparus (référence `exercices-reference.json`), durée ≤ 90 min, prénom en dur. |

## Pour publier un changement (méthode suivie jusqu'ici)
1. Modifier `tools/build_cours.py` ou `tools/explications.py`, puis lancer `build_cours.py`.
2. Enregistrer les phrases neuves avec `tools/voix.py`. Sinon, l'appareil les lit avec sa propre voix.
3. Monter `VERSION` dans `sw.js`, lancer `node --check` sur les .js et tester dans Chromium (Playwright).
4. Faire le commit puis le push sur `main` : GitHub Pages publie, et l'app installée se met à jour seule.

## Points fragiles
- Ne jamais changer l'`id` d'un exercice, sinon les cases cochées sont perdues.
- Micro sur Safari : passer en « play-and-record » pendant l'écoute, puis revenir à « playback ».
- Le micro est coupé sur Chrome pour Mac (`chromeMac`), car la page se fige pour une cause encore inconnue.
- Si on recopie l'Artifact « Mon manche » dans l'app, il faut retirer à nouveau les sons embarqués.
