# Ma guitare

L'app de guitare de Timothée : mon cours (un onglet par cours), mes morceaux, mon manche et mon bilan.
Elle s'installe sur l'iPhone (Safari → Partager → Sur l'écran d'accueil) et sur le Mac (Safari → Fichier → Ajouter au Dock).

- `data/cours.json` : les 36 cours (12 semaines × 3 séances), générés par `tools/build_cours.py`.
- `data/retours.json` : les récaps et « mots du prof » ajoutés après chaque bilan.
- `data/adaptations.json` : les changements du cours après chaque bilan, rangés par cours (relancer `build_cours.py`).
- Mes morceaux : `MISSIONS`, `REPERTOIRE` et `BOSSA` dans `tools/build_cours.py` (sortis dans `morceaux` de `cours.json`) (`des` = semaine où le morceau se débloque, `niveau` = 1 abordable, 2 moyen, 3 costaud).
- `data/schemas.json` : les schémas du cours (repris du Claude Doc, en SVG), et `schemas/` pour les images. Chaque bloc liste les siens (`SCHEMAS` dans `tools/build_cours.py`).
- `manche.html` : Mon manche (même page que dans Claude). Une position sans corde à vide dont l'index tient la plus basse case s'affiche en barré.
- `jeux.js` : les jeux du manche (indices, « Résoudre », « Réessayer », mode écoute au micro).
- `sons.js` : petits sons en notes de guitare, et la voix.
- `voix/` : la voix, une phrase par fichier MP3, enregistrée par `tools/voix.py` après chaque `build_cours.py`. À la racine : la voix Kokoro (française, licence Apache 2.0) ; dans `voix/<id>/` : les voix Microsoft (Azure, `--azure`). `voix/voix.json` liste les voix proposées dans Mon bilan › Sons et voix. Une phrase absente est lue par la voix Kokoro, sinon par la voix de l'appareil.
- Le bilan part une fois par semaine, après la séance C : il regroupe les 3 séances (« Bilan de la semaine N »).
- Les cases cochées, tempos, commentaires et morceaux restent sur l'appareil (localStorage).
