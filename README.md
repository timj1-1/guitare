# Ma gratte

L'app de guitare de Timothée : mon cours (un onglet par cours), mon manche, mes morceaux, les jeux et mon bilan. Dans Mon bilan, les cartes longues (progression, construction du cours, sons et voix, données) se déplient au toucher ; leur état est gardé dans `state.open["bilan/…"]`.
Elle s'installe sur l'iPhone (Safari → Partager → Sur l'écran d'accueil) et sur le Mac (Safari → Fichier → Ajouter au Dock).

- `data/cours.json` : les 36 cours (12 semaines × 3 séances), générés par `tools/build_cours.py`.
- `data/retours.json` : les récaps et « mots du prof » ajoutés après chaque bilan.
- `data/adaptations.json` : les changements du cours après chaque bilan, rangés par cours (relancer `build_cours.py`).
- Mes morceaux : vidéos lues dans l'app (YouTube, `youtube-nocookie.com`), tablatures en boutons-cartes (`tabs`, ouvertes sur le site source ; contour laiton pour les miennes, vert pour les siennes ; ses photos et PDF s'ouvrent dans la visionneuse plein écran, PDF dessinés par pdf.js dans `lib/pdfjs`, licence Apache 2.0), et ses propres ajouts (liens, photos, PDF dans IndexedDB, liens dans `state.ajouts`). `MISSIONS`, `REPERTOIRE` et `BOSSA` dans `tools/build_cours.py` (sortis dans `morceaux` de `cours.json`) (`des` = semaine où le morceau se débloque, `niveau` = 1 abordable, 2 moyen, 3 costaud).
- `data/schemas.json` : les schémas du cours (repris du Claude Doc, en SVG), et `schemas/` pour les images. Chaque bloc liste les siens (`SCHEMAS` dans `tools/build_cours.py`).
- `manche.html` : Mon manche (même page que dans Claude). Une position sans corde à vide dont l'index tient la plus basse case s'affiche en barré.
- `jeux.js` : les jeux du manche (indices, « Résoudre », « Réessayer », mode écoute au micro).
- `niveaux.js` : les jeux à niveaux (onglet Jeux) : Notes du manche, Gammes, Pentatonique, Accords, 10 niveaux chacun (jamais la corde à vide ; noms des cordes affichables ou non, `maguitare:nomsCordes` ; pause sur un manche vide entre deux positions). 8/10 ouvre le niveau suivant, les éléments ratés reviennent plus souvent (boîtes de Leitner, `state.niveaux`), chrono dès le niveau 5, niveau 10 sans fin (3 vies), « Révision du jour ». Chaque bloc du cours propose son jeu au niveau de la semaine (`JEU_BLOC` dans `app.js`) ; le cours ouvre d'office ces niveaux. Les consignes lues sont dans `phrases_niveaux()` de `tools/voix.py`. Chaque partie est notée dans `state.niveaux.log` (score, essais, notes, fautes les plus fréquentes, cours d'origine) et le bilan de la semaine en fait la synthèse. Le bloc « Pour le maîtriser » de chaque morceau vient de `MAITRISER` dans `tools/build_cours.py`.
- `sons.js` : petits sons en notes de guitare, et la voix.
- `voix/` : la voix, une phrase par fichier MP3, enregistrée par `tools/voix.py` après chaque `build_cours.py`. À la racine : la voix Kokoro (française, licence Apache 2.0) ; dans `voix/<id>/` : les voix Microsoft (Azure, `--azure`). `voix/voix.json` liste les voix proposées dans Mon bilan › Sons et voix. Une phrase absente est lue par la voix Kokoro, sinon par la voix de l'appareil.
- Le bilan part une fois par semaine, après la séance C : il regroupe les 3 séances (« Bilan de la semaine N »).
- Les cases cochées, tempos, commentaires et morceaux restent sur l'appareil (localStorage).
