# Ma gratte : résumé (2 novembre 2026)

## Ce que c'est
« Ma gratte » (d'abord appelée « Ma guitare ») est une application web installable (PWA) qui sert de cours de guitare personnel. Elle suit un programme de 12 semaines écrit pour Timothée, avec un prof virtuel qui parle, des exercices à cocher, des jeux et un bilan par semaine.

- En ligne : https://timj1-1.github.io/guitare/
- Code : dépôt public `timj1-1/guitare`, branche `main` (tout ce qui est poussé est publié).
- Pas de serveur, pas de compte : les données restent sur l'appareil.
- Version actuelle : **v48** dans `sw.js` (fusion de la voix Rémy, 2026-10-28). La dernière version avec des changements visibles est la **v47** (2026-10-28).

## Pour qui
Pour Timothée seul, aujourd'hui : 26 ans, guitare classique nylon, droitier, 3 séances de 1 h 30 par semaine depuis le 2026-10-24. Son but principal est d'être solide techniquement (gammes, indépendance et écartement des doigts). Chanter en s'accompagnant vient après. Il aime Sting, le gypsy et le flamenco.

Une version grand public est une idée, pas un projet lancé (voir backlog.md).

## Ce qui marche aujourd'hui
- **Mon cours** : 36 cours (12 semaines × 3), rangés en 3 paliers (Fondations, Indépendance, Liberté). Chaque cours a 6 blocs, des cases à cocher, un ressenti (Galère / Correct / Facile), un tempo et un commentaire. Il y a aussi un minuteur de séance, un métronome, des vidéos lues dans l'app et des schémas. Le prof présente le cours à voix haute. En haut, un manche montre la progression du palier, une case par cours (v47).
- **Mon manche** : manche interactif (accords, barrés, capo, gammes, écoute au micro sur Safari).
- **Mes morceaux** : missions (Fragile, Bamboleo), répertoire conseillé par palier, ses propres morceaux, tablatures (Songsterr d'abord), photos et PDF, morceaux modifiables.
- **Jeux** : 4 jeux à 10 niveaux (Notes du manche, Gammes, Pentatonique, Accords). Il faut 10/10 pour passer au niveau suivant, et le niveau 10 se joue sans fin, avec un record.
- **Mon bilan** : un bilan par semaine après le 3e cours, la progression par thème et les réglages (volumes, vitesse de la voix, thème sombre, gaucher, notation Do Ré Mi ou C D E, rappel de séance). On peut aussi copier ses données d'un appareil à l'autre avec un lien.
- **Voix** : Rémy (voix Microsoft) a les 1 495 phrases de l'app, et Siwis reste la voix d'origine. Une phrase sans fichier est lue par la voix de l'appareil.
- Fonctionne hors ligne, avec un thème sombre et l'accès au clavier.

## Où en est Timothée (2026-11-02)
Il en est au **cours 2, semaine 1, palier 1**. Il a testé toutes les versions jusqu'à la v47. Aucun bilan de semaine n'a encore été envoyé : le premier se fait après le cours 3.

## 3 prochaines priorités (proposées, à valider)
1. **Premier bilan de la semaine 1**, après le cours 3 : il me l'envoie, je l'analyse et j'adapte la semaine 2. C'est ce qui rend le cours personnel.
2. **Choisir ses morceaux en plus de Fragile** : pour jouer ce qu'il aime, et pour que j'ajoute tablatures et passages difficiles.
3. **Mettre à jour le Claude Doc « Le cours »** : utile seulement s'il le lit encore. L'app fait foi, donc c'est la moins urgente (*à confirmer : utilise-t-il encore le Doc ?*).

Autres candidats : reprendre la voix Vivienne (372 sur 1 495), trouver pourquoi le micro fige Chrome sur Mac, la version grand public.

## Questions à Timothée
- Où en es-tu dans le cours (semaine, numéro de cours) ?
- As-tu testé les versions v44 à v47 sur ton iPhone et ton Mac ? Quelque chose ne va pas ?
- Quelles sont tes 3 priorités, parmi celles proposées ici ou d'autres ?
