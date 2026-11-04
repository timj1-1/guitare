# Backlog : bugs et idées

_Mis à jour le 2026-11-04 (app v50, MAJ 01)._

Statuts : **ouvert** (à faire), **en pause**, **plus tard** (idée gardée, à ne pas traiter maintenant), **refusé**, **fait** (pour mémoire).

## Bugs et dettes techniques
| Sujet | Statut | Détail |
|---|---|---|
| Le micro fige Chrome pour Mac | ouvert | Le micro est coupé sur Chrome pour Mac (`chromeMac`). Cause inconnue (micro choisi dans Chrome, Teams ou Discord ?). Safari et iPhone marchent. Retirer `chromeMac` une fois la cause trouvée. |
| Tests des v36 à v47 sur Mac et iPhone | fait | Timothée a testé toutes les versions (2026-11-02). |
| README du dépôt en retard | ouvert | Il dit « 8/10 ouvre le niveau suivant » alors que le code demande 10/10 (`PASSE = 10`), et il présente encore Kokoro comme voix de repli. |
| Fichiers de Rémy en trop | à confirmer | `voix/remy/` contient 1 585 fichiers pour 1 495 phrases : sans doute d'anciennes phrases. À vérifier avant tout nettoyage. |
| Claude Doc « le cours » plus à jour | ouvert | Il ne reprend pas les changements depuis la v37. *Faut-il le mettre à jour ?* |
| app.js en un seul bloc (2 320 lignes) | ouvert, sans urgence | À découper par onglet au fil des modifications (audit point 14). |
| Fonctions trop longues | ouvert, sans urgence | `open` de jeux.js et `ouvrir` de niveaux.js. Reporté faute de tests automatiques. |
| Poids du dépôt (88 Mo d'historique Git) | ouvert, sans urgence | Chaque réenregistrement de voix l'alourdit. On ne réécrit pas l'historique. |
| Audit v37 (13 points) | fait | Points 1 à 10 en v38 et v39, 11 à 13 en grande partie en v42. |
| Audit-suite v39 (15 points) | fait en grande partie | 1 à 6 en v40, 8 à 13 en v41 et v42. Le point 7 est abandonné (son acier gardé). Restent 14 et 15 (ci-dessus). |

## Contenu
| Sujet | Statut | Détail |
|---|---|---|
| Choisir tes morceaux en plus | en attente de toi | Une fois ton choix fait, j'ajoute au cours la tablature et les passages difficiles. |
| Morceaux sans bonne tablature | ouvert | S.O.S., Sevillanas, Djobi Djoba, Malagueña : tu peux ajouter la tienne. |
| Intégrer les bilans de la semaine | ouvert | Il est au cours 2 (semaine 1). Premier bilan après le cours 3. |
| Palier 4 « Et après » | plus tard | À choisir avec toi : théorie des accords, oreille, chant, flamenco (picado), bossa nova. |
| Tempo qui monte tout seul d'une séance à l'autre | idée proposée le 2026-10-23 | *À confirmer : la v45 a ajouté un tempo de départ, mais pas de montée automatique.* |

## Voix
| Sujet | Statut | Détail |
|---|---|---|
| Vivienne | en pause | 372 sur 1 495 phrases. Reprise quand tu le demandes, puis à ajouter dans `voix/voix.json`. |
| Rémy | fait | 1 495 phrases, PR #4 fusionnée le 2026-10-28. |

## Idées gardées pour plus tard
| Idée | Date | Statut |
|---|---|---|
| Lecteur de tablature qui défile (type Songsterr, alphaTab) | 2026-10-24 | plus tard |
| Étoiles sur les 10/10 des jeux (10 étoiles = image de profil ou icône), records visibles au niveau 10 | 2026-10-24 | plus tard |
| Gamification : médailles, records en mode sans fin, flammes quotidiennes, page de profil, barre d'avancement des cours | 2026-10-28 | plus tard (prochain projet) |
| Social : partage et classement entre amis, récompenses (logos, photos de profil), donc des comptes | 2026-10-28 | plus tard |
| Chatbot présent partout, surtout dans Mon cours, qui connaît la semaine et l'écran (IA légère, de préférence gratuite) | à confirmer | plus tard |
| Questionnaire de départ : forces et faiblesses testées, guitare sèche ou électrique, cours personnalisé | à confirmer | plus tard (gros projet) |
| Version grand public : cours personnalisé pour chaque utilisateur (base de cours ou IA), coût, comptes, hébergement | 2026-10-25 | plus tard. Tu veux une réponse claire avant de lancer ce projet. |
| Veille sur les besoins des guitaristes, du débutant à l'expert | à confirmer | avant la prochaine grosse mise à jour |

## Refusé
| Idée | Date | Raison |
|---|---|---|
| Jeu de rythme | 2026-10-24 | pas pour l'instant |
| Boucle et vitesse réduite | 2026-10-24 | pas pour l'instant |
| Écoute de ton jeu en temps réel | 2026-10-24 | trop fragile |
| Voix payante (ElevenLabs) | 2026-10-23 | tu ne veux pas payer |
| « Demander au prof » dans Mon manche | 2026-10-24 | retiré de l'app (v21) |

## MAJ 01 : restes à faire
| Sujet | Statut | Détail |
|---|---|---|
| Moment à regarder dans chaque vidéo | ouvert | Araignée faite (`VIDEO_MOMENT` dans build_cours.py : simple 0:00-5:50, avancée dès 5:50, donné par Timothée). Les autres vidéos : il faut les minutes de début et de fin. |
| Bilan envoyé au prof | plus tard | « Envoie-moi ton bilan » et le mot du prof (`data/retours.json`) supposent que Claude adapte le cours de Timothée : à repenser pour d'autres utilisateurs. |
| Profil (prénom, guitare, main, goûts) | ouvert | Prévu avec la synchro (lot 5) puis le questionnaire (MAJ 02). |
