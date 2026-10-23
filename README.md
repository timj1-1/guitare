# Ma guitare

L'app de guitare de Timothée : mon cours (un onglet par cours), mon manche et mon bilan.
Elle s'installe sur l'iPhone (Safari → Partager → Sur l'écran d'accueil) et sur le Mac (Safari → Fichier → Ajouter au Dock).

- `data/cours.json` : les 36 cours (12 semaines × 3 séances), générés par `tools/build_cours.py`.
- `data/retours.json` : les récaps et « mots du prof » ajoutés après chaque bilan.
- `manche.html` : Mon manche (même page que dans Claude).
- Les cases cochées, tempos et commentaires restent sur l'appareil (localStorage).
