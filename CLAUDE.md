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

## Tenir la mémoire à jour
Après un changement qui compte (nouvelle version, décision, bug résolu), corrige la fiche concernée dans la même PR, en une ou deux lignes. Si la fiche et le code ne sont pas d'accord, le code a raison : corrige la fiche.
