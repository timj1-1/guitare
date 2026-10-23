# Ma guitare

L'app de guitare de Timothée : mon cours (un onglet par cours), mon manche et mon bilan.
Elle s'installe sur l'iPhone (Safari → Partager → Sur l'écran d'accueil) et sur le Mac (Safari → Fichier → Ajouter au Dock).

- `data/cours.json` : les 36 cours (12 semaines × 3 séances), générés par `tools/build_cours.py`.
- `data/retours.json` : les récaps et « mots du prof » ajoutés après chaque bilan.
- `data/schemas.json` : les schémas du cours (repris du Claude Doc, en SVG), et `schemas/` pour les images. Chaque bloc liste les siens (`SCHEMAS` dans `tools/build_cours.py`).
- `manche.html` : Mon manche (même page que dans Claude). Une position sans corde à vide dont l'index tient la plus basse case s'affiche en barré.
- `jeux.js` : les jeux du manche (indices, « Résoudre », « Réessayer », mode écoute au micro).
- `sons.js` : petits sons en notes de guitare, et la voix.
- `voix/` : la voix, une phrase par fichier MP3 (voix neuronale Kokoro, française, licence Apache 2.0), enregistrée par `tools/voix.py` après chaque `build_cours.py`. Une phrase sans fichier est lue par la voix de l'appareil.
- Les cases cochées, tempos et commentaires restent sur l'appareil (localStorage).
