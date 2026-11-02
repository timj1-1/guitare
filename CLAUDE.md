# Ma gratte : guide pour Claude

App de guitare personnelle de Timothée (PWA, JavaScript sans framework, cours générés en Python). Publiée par GitHub Pages à chaque push sur `main` : https://timj1-1.github.io/guitare/. **Le dépôt fait foi.** Réponds en français, simplement : Timothée débute avec GitHub.

## Règles de travail
- Timothée valide ses idées une par une : pas de code sans son accord.
- Rien ne va sur `main` sans sa validation : branche + PR.
- Économie de tokens : lis seulement la fiche utile (tableau ci-dessous), jamais tout `docs/memoire/`, `data/cours.json` (1 Mo), `voix/` ni `samples-*.js`.
- Ne modifie jamais `data/cours.json` à la main : il est généré par `tools/build_cours.py`.
- Ne change jamais l'`id` d'un exercice (les cases cochées seraient perdues).
- Chaque changement visible : monter `VERSION` dans `sw.js`, `node --check` sur les `.js`, test dans Chromium.
- Une phrase du prof modifiée = un mp3 à réenregistrer (`tools/voix.py`). Jamais de clé Azure dans le chat, le dépôt ni la mémoire.

## Quelle fiche lire (dans `docs/memoire/`)
| Tu dois... | Lis |
|---|---|
| Savoir où est quoi dans le code, comment publier | `carte-du-code.md` |
| Ne pas refaire un choix déjà tranché | `decisions.md` |
| Chercher un bug ou une idée à reprendre | `backlog.md` |
| Nettoyer le dépôt | `doublons-obsoletes.md` |

Les fiches personnelles (profil de Timothée, résumé, pédagogie) ne sont pas dans le dépôt, qui est public : elles sont dans le dossier du projet, `/mnt/project-files/memoire-projet/` (`resume.md`, `pedagogie.md`). Ne les copie jamais ici.

## Tenir la mémoire à jour (c'est ton travail, pas celui de Timothée)
1. À chaque grosse mise à jour de l'app (nouvelle version, décision, bug résolu), corrige la fiche concernée dans la même PR, en une ou deux lignes, et change la ligne « Mis à jour le… (app vXX) » en haut de la fiche.
2. Tous les 15 jours, un contrôle automatique compare les fiches au code et ouvre une PR avec les corrections. Timothée peut aussi écrire « mets à jour la mémoire » dans n'importe quel fil.
3. Si une fiche et le code se contredisent, le code a raison : corrige la fiche.
4. Fiches personnelles (`resume.md`, `pedagogie.md`) : mêmes règles, mais dans `/mnt/project-files/memoire-projet/`, jamais dans le dépôt.
