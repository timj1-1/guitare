# Décisions déjà prises

_Mis à jour le 2026-11-04 (app v49, MAJ 01)._

Les dates viennent des notes du projet et de l'historique du dépôt. « À confirmer » signale une date ou une raison que les notes ne donnent pas.

## Le projet
| Date | Décision | Raison |
|---|---|---|
| 2026-10-22 | Objectif principal : la technique (gammes, indépendance, écartement). Le chant passe après. | Timothée a corrigé ce point lui-même. |
| 2026-10-23 | Une PWA sur GitHub Pages (option B), dépôt public `timj1-1/guitare`. | Gratuite, s'installe sur iPhone et Mac, sans serveur. |
| 2026-10-23 | Le Claude Doc « le cours » fait foi, et l'app le reprend. | Choix de départ. *À confirmer : est-ce toujours vrai, puisque le Doc n'est plus à jour depuis la v37 ?* |
| 2026-10-24 | Renommée « Ma gratte » (v21). | Choix de Timothée. *Raison à confirmer.* |
| permanent | Timothée valide chaque idée avant qu'on écrive du code. | Sa règle de travail. |
| permanent | Un problème signalé sur un cours se corrige dans les 36 cours. | Il prend souvent le cours 1 en exemple (règle du 2026-10-26). |
| permanent | Faire attention aux tokens : regrouper les demandes et ouvrir des fils neufs pour les gros chantiers. | Sa demande. |

## Le cours
| Date | Décision | Raison |
|---|---|---|
| 2026-10-23 | 12 semaines en 3 paliers de 4 semaines, 3 cours par semaine. | Peu de nouveautés à la fois, et chaque notion sert la suivante. |
| 2026-10-23 | Au plus une nouveauté par bloc toutes les 2 semaines, avec une phrase « À quoi ça sert » pour chaque notion. | Il veut un cours digeste et savoir à quoi sert chaque chose. |
| 2026-10-23 | Un bilan par semaine, après le 3e cours. | Son choix : je fais la synthèse, puis j'adapte la semaine suivante. |
| 2026-10-24 | Séances de 1 h 30 (au lieu de 1 h 10) et 5 effets : glissando, vibrato, harmoniques, picado, apagado. | 1 h 10 lui paraissait court, surtout l'échauffement. |
| 2026-10-22 à 26 | Explication écrite + meilleures vidéos dans chaque exercice, jamais regroupées en bas. Chaque mot nouveau est expliqué là où il apparaît. | Il ne veut pas faire défiler la page pour trouver l'explication. |
| 2026-10-26 | Dire « cours 3 » ou « 3e cours de la semaine », jamais « séance C ». Le prof ne donne jamais de durée. | Sa demande. |
| 2026-10-23 | Les morceaux suivent la progression du cours. Lágrima est retirée (trop dure). Les morceaux en plus ne remplacent pas la mission (Fragile). | Jamais trop dur au début. |
| 2026-10-25 | Timothée ne donne pas lui-même le niveau d'un morceau : c'est le prof qui l'analyse au bilan. | Il ne sait pas identifier niveau et techniques. |

## L'app
| Date | Décision | Raison |
|---|---|---|
| 2026-10-23 | Design : en-tête du cours en bois, progression dessinée comme un manche, une seule chose audacieuse. | Refonte avec des skills de design (PR #1). |
| 2026-10-23 | Vrais enregistrements de guitare, jamais de synthèse. Même son partout, Manouche par défaut (v35). | La synthèse était jugée « métallique », puis « étouffée ». |
| 2026-10-24 | Onglet Jeux : 10 niveaux par jeu, même moteur. Refusés : jeu de rythme, boucle et vitesse réduite, écoute en temps réel. | Spécification validée. Les refus : pas pour l'instant, ou trop fragile. |
| 2026-10-28 | 10/10 pour passer au niveau suivant (au lieu de 8/10). | v44. *Raison à confirmer.* |
| 2026-10-28 | Ordre Galère / Correct / Facile partout, Galère à gauche. | Sa demande (v45). |
| 2026-10-28 | « Recommencer » ne change pas de couleur après une erreur. | Sa demande (v46). |
| 2026-10-28 | Le manche en haut du cours montre la progression du palier, une case par cours. | « Les couleurs qui avancent avec les cours », confirmé (v47). |
| 2026-10-25 | Tablatures : Songsterr d'abord, pas d'Ultimate Guitar sauf en dernier recours (v43). | Il préfère Songsterr. |
| 2026-10-25 | Pas de mise en ligne des données : chaque appareil garde les siennes, et un lien les copie de l'un à l'autre. | Pas de serveur. **Remis en cause par MAJ 01 (§14) : synchro automatique prévue (Firebase recommandé, choix en attente).** |
| 2026-10-26 | Polices dans le dépôt, sons non embarqués dans Mon manche (v39). | App plus légère et hors ligne dès la première ouverture (audit). |
| 2026-10-26 | Le son acier reste téléchargé à l'installation. | Il sert au son Manouche, qui est le son par défaut. |
| 2026-10-27 | Pas de réécriture de l'historique Git, même si le dépôt pèse lourd. | Ce serait destructif. |
| 2026-10-27 | Pas de découpe de jeux.js, niveaux.js et app.js pour l'instant. | Gros fichiers sans tests automatiques. |
| 2026-10-25 | Micro coupé sur Chrome pour Mac. | La page se fige, pour une cause inconnue. |

## La voix
| Date | Décision | Raison |
|---|---|---|
| 2026-10-23 | Voix neuronale plutôt que la voix de l'appareil. Kokoro, puis voix Microsoft Azure. Pas d'offre payante. | La voix de l'appareil était « horrible », Kokoro trop robotique, et il refuse de payer (pas d'ElevenLabs). |
| 2026-10-25 | Deux voix gardées : Rémy et Vivienne (sa préférée). Les versions HD, Céleste et Yvette sont annulées. | Le quota gratuit est de 500 000 caractères par mois. |
| 2026-10-28 | Rémy terminée (1 495 phrases, PR #4). Vivienne en pause à 372. | Elle reprend quand il le demande. |
| permanent | La clé Azure n'apparaît jamais dans le chat, le dépôt ni la mémoire. | Sécurité. |

## MAJ 01 (validée le 2026-11-04)
| Date | Décision | Raison |
|---|---|---|
| 2026-11-04 | Le prof tutoie et reste proche de l'utilisateur. Plus de prénom en dur ni de « tu connais déjà » fondé sur le niveau de Timothée ; le prénom viendra d'un questionnaire (plus tard). | App destinée à des bêta-testeurs puis au grand public. Dans ses cahiers des charges, « l'utilisateur » s'adresse à Claude. |
| 2026-11-04 | Chaque exercice porte sa durée, son type (Découverte, Révision, Approfondissement, Pratique), ses vidéos et ses schémas. Les vidéos non essentielles vont dans « Pour aller plus loin, hors séance ». « Lire » devient « Relire » après la première lecture. | Cours 1 trop long (2 h), ressources à trouver dans l'exercice. |
| 2026-11-04 | Araignée en deux exercices travaillés ensemble dès le cours 1 : la variante simple puis l'avancée (pas de verrou). Chacune a son tempo et son record ; vidéo : simple 0:00-5:50, avancée dès 5:50. Exercice combiné au palier 2. | Q3, puis Timothée le 2026-11-04 : « les deux variantes en même temps, explicite dans l'explication ». |
| 2026-11-04 | « Propre » : 3/3 reste affiché, l'utilisateur choisit de monter (+4 bpm). Record = tempo le plus haut d'un exercice, tous cours confondus. | Q4. |
| 2026-11-04 | Pas de Galère/Correct/Facile sur le jeu facile, les étirements et « Lire « Comprendre les barrés » » (les autres exercices de barrés les gardent). | Q4. |
| 2026-11-04 | Pause : fenêtre à valider après 25 min de pratique effective, 15 min sur les blocs physiques (échauffement, barrés), entre deux exercices. | Q5. |
| 2026-11-04 | Un seul bloc ouvert ; un bloc fini se ferme et le suivant s'ouvre. « Écouter » d'un bloc lit aussi « Pourquoi c'est utile » et les explications ; « Écouter tout le cours » lit tout, avec Pause et « Bloc suivant ». | §8.1, §9, Q6. |
| 2026-11-04 | Forme La, tableau des barrés et dièses passent au palier 2 ; le Mi grave n'est révisé dans les jeux qu'au palier 3. | §5, §11.2. |
