# Ma guitare

L'app de guitare de Timothée : mon cours (un onglet par cours), mon manche et mon bilan.
Elle s'installe sur l'iPhone (Safari → Partager → Sur l'écran d'accueil) et sur le Mac (Safari → Fichier → Ajouter au Dock).

- `data/cours.json` : les 36 cours (12 semaines × 3 séances), générés par `tools/build_cours.py`.
- `data/retours.json` : les récaps et « mots du prof » ajoutés après chaque bilan.
- `data/schemas.json` : les schémas du cours (repris du Claude Doc, en SVG), et `schemas/` pour les images. Chaque bloc liste les siens (`SCHEMAS` dans `tools/build_cours.py`).
- `manche.html` : Mon manche (même page que dans Claude). Une position sans corde à vide dont l'index tient la plus basse case s'affiche en barré.
- `jeux.js` : les jeux du manche (indices, « Résoudre », mode écoute au micro).
- `sons.js` : petits sons de réussite et voix française de l'appareil (gratuite, sans Internet).
- Les cases cochées, tempos et commentaires restent sur l'appareil (localStorage).
