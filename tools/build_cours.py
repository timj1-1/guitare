# Génère data/cours.json à partir du cours (12 semaines, 3 séances par semaine).
import json, os

V = lambda t, u: {"t": t, "u": u}

ETIREMENTS = {
    "id": "etirements", "label": "Étirements (2 min)",
    "aide": "Ouvre et ferme les mains, étire doucement chaque doigt et les poignets, 10 secondes chacun, sans jamais forcer.",
}

# Chaque palier : 6 blocs, chacun avec deux moitiés (semaines 1-2 / 3-4 du palier).
# noms courts des paliers (navigation de l'app) : une progression vers l'autonomie
NOMS = {1: "Fondations", 2: "Indépendance", 3: "Liberté"}

PALIERS = [
  {
    "num": 1, "titre": "Les bases propres",
    "but": "Des gestes propres aux deux mains, avant d'aller plus vite ou plus loin.",
    "mission": "Jouer Fragile en entier, proprement, et t'enregistrer.",
    "blocs": [
      {
        "titre": "Échauffement : étirements, araignée et arpèges", "duree": 10,
        "sert": "Rendre chaque doigt précis dans la position « un doigt par case », et préparer la main droite de Fragile.",
        "explication": [
          "L'araignée : index case 5, majeur case 6, annulaire case 7, auriculaire case 8, de la 6e corde à la 1re puis retour. Le doigt reste posé tant que le suivant n'a pas joué, et les doigts levés restent à 1 cm des cordes. Appuie juste derrière la frette (la barrette de métal entre deux cases), main détendue.",
          "Sol7 = Sol avec un Fa en plus : le Mi aigu se joue case 1 au lieu de case 3.",
          "Les arpèges : le pouce (p) joue la basse, l'index (i) la corde de Sol, le majeur (m) la corde de Si et l'annulaire (a) le Mi aigu. Chaque doigt garde sa corde. Joue-les en pincé, lentement, avec le même volume sur chaque note (120 arpèges de Giuliani).",
        ],
        "videos": [V("Exercices d'étirements de la main du manche", "https://www.youtube.com/watch?v=mlLPc915RLs"), V("L'araignée, un exercice pour l'indépendance des doigts", "https://www.youtube.com/watch?v=L7ZORKLDHVc"), V("Arpèges main droite PIMA", "https://www.youtube.com/watch?v=YReUxlS_4sY"), V("Giuliani's 120 Right-Hand Exercises (en anglais)", "https://www.youtube.com/watch?v=L1OscPf4NiA")],
        "positions": [{"label": "Do", "code": "x32010"}, {"label": "Sol7", "code": "320001"}],
        "moities": [
          {"faire": "Étirements (2 min), araignée cases 5 à 8 à 60 bpm (4 min), arpèges p-i-m-a et p-a-m-i sur Do puis Sol7 (4 min).",
           "ex": [ETIREMENTS, {"id": "araignee", "label": "Araignée cases 5 à 8", "tempo": 60}, {"id": "arpeges", "label": "Arpèges p-i-m-a et p-a-m-i sur Do puis Sol7", "tempo": 60}]},
          {"faire": "Étirements (2 min), araignée cases 5 à 8 à 60 bpm (4 min), arpège p-i-m-a-m-i sur Do puis Sol7 (4 min).",
           "ex": [ETIREMENTS, {"id": "araignee", "label": "Araignée cases 5 à 8", "tempo": 60}, {"id": "arpeges", "label": "Arpège p-i-m-a-m-i sur Do puis Sol7", "tempo": 60}]},
        ],
      },
      {
        "titre": "Gamme de Do majeur et main droite", "duree": 20,
        "sert": "La gamme majeure est la base des mélodies, des accords et de l'impro. La butée te donne un son plein et régulier.",
        "explication": [
          "Une gamme majeure suit toujours les mêmes écarts : ton, ton, demi-ton, ton, ton, ton, demi-ton (1 ton = 2 cases). Do majeur n'a aucun dièse : Do Ré Mi Fa Sol La Si Do. Un dièse (#) monte une note d'une case (Fa# est une case au-dessus de Fa), un bémol (b) la descend d'une case (Sib est une case sous Si).",
          "En butée (apoyando), le doigt traverse la corde et se pose sur la corde du dessus : c'est le coup des gammes. En pincé (tirando), il passe sous la corde du dessus et remonte vers la paume : c'est le coup des arpèges. Alterne toujours deux doigts, jamais deux fois le même de suite.",
        ],
        "videos": [V("Gamme de Do majeur en position 1", "https://www.youtube.com/watch?v=LsmIYuWANhg"), V("Comment et pourquoi pincer ou buter", "https://www.youtube.com/watch?v=QT2bkMPGmig"), V("La main droite : le buté", "https://www.youtube.com/watch?v=qQULjVA1oAI")],
        "moities": [
          {"faire": "2 min d'alternance i-m (index puis majeur, chacun son tour) sur cordes à vide, puis la gamme montée et descente à 60 bpm, en disant les notes, en butée, en commençant par l'index.",
           "ex": [{"id": "alternance", "label": "Alternance i-m sur cordes à vide (2 min)"}, {"id": "gamme", "label": "Do majeur en butée, en disant les notes", "tempo": 60}]},
          {"faire": "2 min d'alternance i-m, puis la gamme à 60 bpm : une fois sur deux en commençant par le majeur, puis en pincé.",
           "ex": [{"id": "alternance", "label": "Alternance i-m sur cordes à vide (2 min)"}, {"id": "gamme", "label": "Do majeur en butée, en commençant par le majeur", "tempo": 60}, {"id": "gamme-pince", "label": "Do majeur en pincé", "tempo": 60}]},
        ],
      },
      {
        "titre": "Pentatonique de La mineur", "duree": 5,
        "sert": "C'est la gamme de l'impro. Chaque position apprise agrandit la zone du manche où tu pourras improviser.",
        "explication": [
          "La pentatonique de La mineur n'a que 5 notes : La Do Ré Mi Sol. Elle existe en 5 formes qui se chevauchent : la note la plus aiguë d'une forme est la plus grave de la suivante. Une position, c'est un morceau de la gamme jouable sans bouger la main, sur 4 ou 5 cases.",
          "Les La sont tes notes de repos : La est la note principale de la gamme, sa fondamentale. Une phrase qui finit sur un La sonne terminée, comme un retour à la maison ; sur une autre note, elle reste en suspens. Repère-les dans chaque position : c'est sur eux que tu finiras tes phrases d'impro.",
        ],
        "videos": [V("Pentatonique : les 5 positions expliquées facilement", "https://www.youtube.com/watch?v=OfyoYXtti04"), V("Apprendre vos 5 positions en 10 min", "https://www.youtube.com/watch?v=YH6KGcpHUOg")],
        "moities": [
          {"faire": "La position 1 (case 5), que tu connais déjà, au métronome à 70 bpm, en alternant i-m.",
           "ex": [{"id": "penta1", "label": "Position 1 (case 5), alternance i-m", "tempo": 70}]},
          {"faire": "La position 2 (cases 7 à 10), puis relier 1 et 2 : monte dans la position 1, glisse dans la 2 sans t'arrêter, et redescends.",
           "ex": [{"id": "penta2", "label": "Position 2 (cases 7 à 10)", "tempo": 70}, {"id": "penta12", "label": "Relier les positions 1 et 2", "tempo": 70}]},
        ],
      },
      {
        "titre": "Notes du manche", "duree": 5,
        "sert": "Savoir où tu es sur le manche. La corde de La te donnera le nom de tous tes barrés forme La au palier 2.",
        "explication": [
          "Il y a 7 notes naturelles : Do Ré Mi Fa Sol La Si. Entre deux notes il y a 2 cases, sauf entre Mi-Fa et Si-Do où il n'y en a qu'une. La case 12 redonne la note à vide, une octave plus haut.",
          "Une octave, c'est la même note en plus aigu (sur la même corde, 12 cases plus loin). Pour trouver les octaves : depuis la 6e ou la 5e corde, monte de 2 cordes et avance de 2 cases. Depuis la 4e ou la 3e, avance de 3 cases, parce que tu passes la corde de Si.",
        ],
        "videos": [V("Comment mémoriser toutes les notes sur le manche", "https://www.youtube.com/watch?v=YaM7PLMop5o"), V("Toutes les notes du manche grâce au schéma d'octave", "https://www.youtube.com/watch?v=PJ8_orOw4ss")],
        "moities": [
          {"faire": "Corde de La : 2 min à dire chaque note de la case 0 à 12 puis au hasard, et 3 min à retrouver tous les La par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de La : notes de 0 à 12, puis au hasard (2 min)"}, {"id": "octaves", "label": "Octaves : tous les La du manche (3 min)"}]},
          {"faire": "Corde de Ré : 2 min à dire chaque note de la case 0 à 12 puis au hasard, et 3 min à retrouver tous les Ré par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de Ré : notes de 0 à 12, puis au hasard (2 min)"}, {"id": "octaves", "label": "Octaves : tous les Ré du manche (3 min)"}]},
        ],
      },
      {
        "titre": "Les barrés : comprendre, puis la forme Mi partout", "duree": 15,
        "sert": "Avec deux formes seulement, tu peux jouer n'importe quel accord majeur ou mineur, n'importe où sur le manche. Tu n'es plus limité aux accords ouverts, et un Fa barré rapide est indispensable pour Bamboleo au palier 2.",
        "explication": [
          {"titre": "Comprendre les barrés en 5 idées", "liste": [
            "Le sillet. C'est la petite barre blanche au bout du manche, côté mécaniques. Il bloque les cordes à vide. Dans un barré, ton index couché sur les cordes devient un sillet que tu déplaces où tu veux.",
            "Un barré, c'est un accord ouvert déplacé. Joue Mi majeur avec le majeur, l'annulaire et l'auriculaire, pour libérer l'index. Fais glisser cette forme d'une case et couche l'index derrière : il joue les cordes qui étaient à vide. Toutes les notes montent d'une case, donc l'accord monte aussi.",
            "Pourquoi case 1 = Fa. Entre Mi et Fa, il n'y a qu'une case (un demi-ton). Mi monté d'une case donne Fa, donc l'accord de Mi monté d'une case donne l'accord de Fa.",
            "Le nom de l'accord = la note sous l'index, sur la 6e corde. Cette note s'appelle la fondamentale : c'est elle qui donne son nom à l'accord. Tu connais les notes du Mi grave, donc tu peux trouver tous les accords forme Mi : case 3 = Sol, case 5 = La, case 8 = Do. Les barrés se ressemblent tous parce que c'est la même forme : seule la case change, et donc le nom.",
            "Majeur ou mineur, c'est un seul doigt. Mi mineur, c'est Mi majeur sans le doigt sur la corde de Sol. Barré, c'est pareil : enlève le doigt 2 et l'index joue aussi la corde de Sol. Tu obtiens Fa mineur, Sol mineur, La mineur avec la même forme.",
          ], "ordonnee": True},
          "La 2e forme : la forme La (au palier 2). Même idée, mais à partir de La majeur. Monte la forme de deux cases et couche l'index : tu obtiens Si majeur (de La à Si, il y a deux cases). Ici, la fondamentale est sur la 5e corde, la corde de La que tu apprends au bloc 4. La 6e corde ne se joue pas.",
          "Pourquoi deux formes ? Pour jouer près de l'endroit où ta main se trouve déjà. Do existe en forme La case 3 et en forme Mi case 8 : tu prends celle qui t'évite de sauter sur le manche. Avec ce tableau, tu trouves n'importe quel accord :",
          {"table": [["Accord", "Forme Mi (fondamentale sur la 6e corde)", "Forme La (fondamentale sur la 5e corde)"],
                     ["Fa", "case 1", "case 8"], ["Sol", "case 3", "case 10"], ["La", "case 5", "accord ouvert, ou case 12"],
                     ["Si", "case 7", "case 2"], ["Do", "case 8", "case 3"], ["Ré", "case 10", "case 5"], ["Mi", "accord ouvert, ou case 12", "case 7"]]},
          "Les accords en dièse ou en bémol sont entre les deux : Fa# (Fa dièse) = forme Mi case 2, Sib (Si bémol) = forme La case 1.",
          "Bien jouer un barré : index légèrement tourné côté pouce, tout près de la frette. La force vient du poids du bras, pas du pouce qui écrase. Si une corde ne sonne pas, déplace un peu l'index au lieu d'appuyer plus fort. Plus haut sur le manche, les cases sont plus étroites : le barré y est souvent plus facile qu'en case 1.",
        ],
        "videos": [V("Les noms des accords barrés (FooJayProd)", "https://www.youtube.com/watch?v=mSX-Q9PVvcw"), V("Les accords barrés : principes, conseils et exemples (Terafab)", "https://www.youtube.com/watch?v=4BsSPpe0V2Y"), V("Réussir le Fa et les barrés en position de Mi", "https://www.youtube.com/watch?v=i09S-nNoJDY"), V("Le secret pour faire facilement des accords barrés", "https://www.youtube.com/watch?v=WctfgDPpwHw")],
        "moities": [
          {"faire": "Commence par lire « Comprendre les barrés » (Explication). Puis la forme Mi majeur en case 1 (Fa, que tu maîtrises déjà), en case 3 (Sol) et en case 5 (La), en disant le nom de chaque accord. Enchaîne Fa → Sol → La → Sol → Fa, 4 temps par accord.",
           "positions": [{"label": "Fa (case 1)", "code": "133211"}, {"label": "Sol (case 3)", "code": "355433"}, {"label": "La (case 5)", "code": "577655"}],
           "ex": [{"id": "comprendre", "label": "Lire « Comprendre les barrés en 5 idées »"}, {"id": "majeurs", "label": "Forme Mi : Fa, Sol, La, en disant leur nom"}, {"id": "enchainement", "label": "Enchaînement Fa → Sol → La → Sol → Fa", "tempo": 60}]},
          {"faire": "La version mineure aux mêmes cases (Fa mineur, Sol mineur, La mineur), puis alterne majeur et mineur sur la même case : Sol → Sol mineur → Sol.",
           "positions": [{"label": "Fa mineur", "code": "133111"}, {"label": "Sol mineur", "code": "355333"}, {"label": "La mineur (case 5)", "code": "577555"}, {"label": "Sol (case 3)", "code": "355433"}],
           "ex": [{"id": "mineurs", "label": "Forme Mi mineure : Fa, Sol, La mineurs"}, {"id": "alterne", "label": "Sol → Sol mineur → Sol", "tempo": 60}, {"id": "enchainement", "label": "Enchaînement Fa → Sol → La → Sol → Fa", "tempo": 60}]},
        ],
      },
      {
        "titre": "Morceau : Fragile", "duree": 15, "morceau": True,
        "sert": "Réunir tes arpèges, tes accords et ton rythme dans un vrai morceau. C'est ta mission de fin de palier.",
        "explication": [
          "Main gauche seule, puis les deux mains lentement, puis tu enchaînes. Le pouce joue les basses et i-m-a les cordes aiguës, comme dans tes arpèges d'échauffement.",
        ],
        "videos": [V("Apprendre les accords de Fragile de Sting", "https://www.youtube.com/watch?v=AeNQf3T-CJ0"), V("GuitAstuce : Fragile, tuto", "https://www.youtube.com/watch?v=rxFkOUI49v0")],
        "moities": [
          {"faire": "Les passages qui accrochent, 2 mesures à la fois (une mesure = un groupe de temps, souvent 4, séparé par une barre verticale sur la tab), lentement.",
           "ex": [{"id": "passages", "label": "Fragile : les passages qui accrochent, 2 mesures à la fois"}]},
          {"faire": "Du début à la fin sans t'arrêter, même lentement, puis enregistre-toi.",
           "ex": [{"id": "entier", "label": "Fragile en entier sans t'arrêter"}, {"id": "enregistre", "label": "M'enregistrer"}]},
        ],
      },
    ],
    "bilan": [
      ("Araignée cases 5-8", "70 bpm, aucune note qui frise"),
      ("Do majeur en butée i-m", "60 bpm, 3 fois sans erreur"),
      ("Pentatonique positions 1 et 2 reliées", "70 bpm sans hésiter"),
      ("Notes des cordes Mi grave, La et Ré", "moins de 3 s par note"),
      ("Barrés forme Mi : Fa, Sol, La, majeurs et mineurs", "chaque accord nommé, les 6 cordes sonnent, Fa → Sol → La 4 fois à 60 bpm"),
      ("Mission : Fragile", "en entier, enregistré"),
    ],
  },
  {
    "num": 2, "titre": "Indépendance et rumba",
    "but": "Des doigts indépendants à gauche et ton premier rythme flamenco.",
    "mission": "Jouer Bamboleo en rumba, 8 tours sans arrêt, avec le golpe.",
    "blocs": [
      {
        "titre": "Échauffement : étirements, permutations et liés", "duree": 10,
        "sert": "Obliger l'annulaire et l'auriculaire, les doigts les plus faibles, à bouger seuls. Les liés rendront ton impro fluide au palier 3.",
        "explication": [
          "Les permutations : c'est l'araignée du palier 1, mais en changeant l'ordre des doigts. Les doigts qui ne jouent pas restent près des cordes, jamais crispés en l'air.",
          "Lié ascendant : index posé en case 5, tu joues la corde, puis un autre doigt frappe la case 6, 7 ou 8 d'un coup sec, comme un marteau, sans que la main droite rejoue. Lié descendant : les deux doigts sont posés, tu joues la note du haut, puis tu retires ce doigt en tirant légèrement la corde vers le sol. La 2e note doit sonner aussi fort que la 1re.",
        ],
        "videos": [V("Indépendance des doigts de la main gauche", "https://www.youtube.com/watch?v=Lzm87u2y2VY"), V("Apprendre à jouer les hammer / pull-off", "https://www.youtube.com/watch?v=COzP3U5OG1A"), V("Comment travailler les hammers et les pull-offs", "https://www.youtube.com/watch?v=ODR6WoI_WC4")],
        "moities": [
          {"faire": "Étirements (2 min), permutations 1-3-2-4 puis 1-4-2-3 cases 5 à 8 à 60 bpm (4 min), liés ascendants (4 min).",
           "ex": [ETIREMENTS, {"id": "permutations", "label": "Permutations 1-3-2-4 puis 1-4-2-3", "tempo": 60}, {"id": "lies", "label": "Liés ascendants"}]},
          {"faire": "Étirements (2 min), permutations 1-3-2-4 puis 1-4-2-3 cases 5 à 8 à 60 bpm (4 min), liés descendants (4 min).",
           "ex": [ETIREMENTS, {"id": "permutations", "label": "Permutations 1-3-2-4 puis 1-4-2-3", "tempo": 60}, {"id": "lies", "label": "Liés descendants"}]},
        ],
      },
      {
        "titre": "Gamme majeure en position fixe", "duree": 20,
        "sert": "Une forme sans corde à vide se déplace partout. En la décalant, tu as toutes les gammes majeures avec un seul dessin.",
        "explication": [
          "En position fixe, la main ne bouge pas : un doigt par case sur 4 cases, comme l'araignée. La gamme commence sur le Sol de la 6e corde, case 3. Décale toute la forme et la gamme prend le nom de cette première note.",
        ],
        "videos": [V("Gamme majeure de Sol, première position", "https://www.youtube.com/watch?v=P3PoCM_veUc"), V("Les positions de la gamme majeure", "https://www.youtube.com/watch?v=MrqsX1fzcLs")],
        "moities": [
          {"faire": "Sol majeur : index case 2, auriculaire case 5, montée et descente à 60 bpm en butée, en disant les notes.",
           "ex": [{"id": "gamme", "label": "Sol majeur en position fixe, en butée", "tempo": 60}]},
          {"faire": "La même forme 2 cases plus haut (c'est La majeur), à 70 bpm.",
           "ex": [{"id": "gamme", "label": "La majeur en position fixe, en butée", "tempo": 70}, {"id": "segovia", "label": "Do majeur sur 2 octaves, avec un changement de position à la case 5", "tempo": 60}]},
        ],
      },
      {
        "titre": "Pentatonique : position 3 et mini-impro", "duree": 5,
        "sert": "Avec 3 positions reliées, tu couvres le manche de la case 5 à la case 12. La mini-impro t'apprend à t'en servir pour de vrai.",
        "explication": [
          "Pour la mini-impro : des phrases de 3 à 5 notes, des silences entre elles, et finis tes phrases sur un La.",
        ],
        "videos": [V("Pentatonique : les 5 positions expliquées facilement", "https://www.youtube.com/watch?v=OfyoYXtti04"), V("Improviser n°1 : la pentatonique mineure", "https://www.youtube.com/watch?v=L6MArHsN2Mw")],
        "moities": [
          {"faire": "La position 3 (cases 9 à 12), reliée à la 2.",
           "ex": [{"id": "penta3", "label": "Position 3 (cases 9 à 12)", "tempo": 70}, {"id": "penta23", "label": "Relier les positions 2 et 3", "tempo": 70}]},
          {"faire": "7 min sur les positions 1, 2 et 3 à la suite, puis 3 min d'impro sur la position 1, sur la grille de Bamboleo (la suite d'accords qui tourne en boucle dans le morceau), enregistrée sur ton téléphone.",
           "ex": [{"id": "penta123", "label": "Positions 1, 2 et 3 à la suite (3 min)", "tempo": 70}, {"id": "impro", "label": "Mini-impro sur la grille de Bamboleo (2 min)"}]},
        ],
      },
      {
        "titre": "Notes du manche", "duree": 5,
        "sert": "Connaître les cordes du milieu, celles où passent la plupart des mélodies et des solos.",
        "explication": [
          "Sur la corde de Si, l'octave se décale de 3 cases au lieu de 2 : c'est la seule corde accordée différemment des autres.",
        ],
        "videos": [V("Le manche de la guitare maîtrisé en 17 minutes", "https://www.youtube.com/watch?v=HDZx0XgrHgI"), V("Placer les notes sur le manche facilement", "https://www.youtube.com/watch?v=_m8qu8ogAug")],
        "moities": [
          {"faire": "Corde de Sol : 2 min à dire chaque note de la case 0 à 12 puis au hasard, et 3 min à retrouver tous les Sol par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de Sol : notes de 0 à 12, puis au hasard (2 min)"}, {"id": "octaves", "label": "Octaves : tous les Sol du manche (3 min)"}]},
          {"faire": "Corde de Si : 2 min à dire chaque note de la case 0 à 12 puis au hasard, et 3 min à retrouver tous les Si par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de Si : notes de 0 à 12, puis au hasard (2 min)"}, {"id": "octaves", "label": "Octaves : tous les Si du manche (3 min)"}]},
        ],
      },
      {
        "titre": "Barrés forme La et rumba", "duree": 15,
        "sert": "Avec la forme Mi du palier 1, tu joues chaque accord à deux endroits du manche. La rumba est le rythme de base de la guitare gitane, celui de Bamboleo.",
        "explication": [
          "Forme La : l'index barre les cordes 5 à 1, et la fondamentale (la note qui donne son nom à l'accord) est sur la corde de La. Ne joue pas la 6e corde. Pour le mineur : index case 2, majeur 2e corde case 3, annulaire 4e corde case 4, auriculaire 3e corde case 4.",
          "La rumba se compte sur 8 croches, c'est-à-dire 8 demi-temps : compte « 1 et 2 et 3 et 4 et ». On les groupe 3 + 3 + 2 (1-2-3, 4-5-6, 7-8), avec des accents, des coups joués plus fort, sur 1, 4 et 7. Commence juste avec les accents, sans golpe. Le golpe est une frappe de la main droite qui étouffe les cordes et donne le claquement : ajoute-le toujours au même endroit. La régularité compte plus que la vitesse.",
        ],
        "videos": [V("Réussir le Si et les barrés en position de La", "https://www.youtube.com/watch?v=xrh3k039BKg"), V("Rumba flamenca, la rythmique de base", "https://www.youtube.com/watch?v=REuLvk_UW1o"), V("Apprendre la rumba flamenca en 10 min", "https://www.youtube.com/watch?v=kwKt4t7OPNs")],
        "moities": [
          {"faire": "Sib (Si bémol, une case sous Si) et Si mineur forme La (relis « Comprendre les barrés » au palier 1), enchaînement Fa → Sib → Fa (7 min), puis la rumba sans golpe sur La mineur à 70 bpm (8 min).",
           "positions": [{"label": "Sib", "code": "x13331"}, {"label": "Si mineur", "code": "x24432"}, {"label": "Fa barré", "code": "133211"}],
           "ex": [{"id": "barres", "label": "Sib et Si mineur forme La"}, {"id": "enchainement", "label": "Enchaînement Fa → Sib → Fa"}, {"id": "rumba", "label": "Rumba sans golpe sur La mineur", "tempo": 70}]},
          {"faire": "La rumba avec golpe sur la grille La mineur → Sol → Fa → Mi, à 80 bpm.",
           "positions": [{"label": "La mineur", "code": "x02210"}, {"label": "Sol", "code": "320003"}, {"label": "Fa", "code": "133211"}, {"label": "Mi", "code": "022100"}],
           "ex": [{"id": "barres", "label": "Barrés forme La (révision)"}, {"id": "rumba", "label": "Rumba avec golpe : La mineur → Sol → Fa → Mi", "tempo": 80}]},
        ],
      },
      {
        "titre": "Morceau : Bamboleo", "duree": 15, "morceau": True,
        "sert": "C'est ta mission. Tout le palier s'y retrouve : le Fa barré, la rumba et la cadence andalouse.",
        "explication": [
          "Bamboleo (Gipsy Kings) est construit sur la cadence andalouse, La mineur → Sol → Fa → Mi, la grille la plus célèbre de la musique espagnole. Un tour, c'est une fois la grille entière. C'est ici que ton Fa barré doit devenir rapide.",
        ],
        "videos": [V("Bamboleo, tuto guitare", "https://youtube.com/watch?v=gHorqf4fA_c"), V("Intro de Bamboleo, la guitare gitane pour les nuls", "https://www.youtube.com/watch?v=zE7N5N7kl7M")],
        "positions": [{"label": "La mineur", "code": "x02210"}, {"label": "Sol", "code": "320003"}, {"label": "Fa", "code": "133211"}, {"label": "Mi", "code": "022100"}],
        "moities": [
          {"faire": "Bamboleo, d'abord la grille puis le morceau, de plus en plus vite (de 70 à 90 bpm).",
           "ex": [{"id": "grille", "label": "Bamboleo : la grille", "tempo": 70}, {"id": "morceau", "label": "Bamboleo : le morceau", "tempo": 70}]},
          {"faire": "Bamboleo, d'abord la grille puis le morceau, de plus en plus vite (de 70 à 90 bpm).",
           "ex": [{"id": "grille", "label": "Bamboleo : la grille", "tempo": 80}, {"id": "morceau", "label": "Bamboleo : le morceau", "tempo": 80}]},
        ],
      },
    ],
    "bilan": [
      ("Permutations 1-3-2-4 et 1-4-2-3", "70 bpm, propres"),
      ("Liés ascendants et descendants", "nets sur les 6 cordes, même volume"),
      ("Sol majeur puis La majeur en position fixe", "70 bpm en butée"),
      ("Pentatonique positions 1, 2 et 3 reliées", "sans arrêt"),
      ("Notes de 5 cordes (Mi grave, La, Ré, Sol, Si)", "moins de 3 s par note"),
      ("Mission : Bamboleo en rumba avec golpe", "8 tours à 80 bpm sans arrêt"),
    ],
  },
  {
    "num": 3, "titre": "Écartement, rasgueado et impro",
    "but": "Tout le manche à gauche, le vrai son flamenco à droite.",
    "mission": "Bamboleo avec des rasgueados, puis 1 minute d'impro sur la grille.",
    "blocs": [
      {
        "titre": "Échauffement : étirements, écartement et liés combinés", "duree": 10,
        "sert": "Atteindre des notes éloignées sans bouger la main, et faire travailler un doigt pendant que les autres restent immobiles.",
        "explication": [
          "Vers la case 1, les cases sont plus larges : l'écart entre tes doigts grandit petit à petit. Ne force jamais : si ça tire dans la main, arrête et reprends le lendemain.",
          "1-3-1 en un seul coup de main droite : un lié ascendant puis un descendant. En semaines 11-12, la version d'Abel Carlevaro : pose l'auriculaire sur la corde voisine (case 8) et laisse-le posé pendant tes liés avec les autres doigts.",
        ],
        "videos": [V("Exercices d'étirements de la main du manche", "https://www.youtube.com/watch?v=mlLPc915RLs"), V("Fixer un doigt ?! Exercices pour la main gauche", "https://www.youtube.com/watch?v=7F-AG0J6eV8"), V("Comment travailler les hammers et les pull-offs", "https://www.youtube.com/watch?v=ODR6WoI_WC4")],
        "moities": [
          {"faire": "Étirements (2 min), écartement : l'araignée descend d'une case à chaque passage (5-8, 4-7, 3-6, 2-5, 1-4) à 60 bpm (4 min), liés 1-3-1 et 1-4-1 (4 min).",
           "ex": [ETIREMENTS, {"id": "facile", "label": "Jeu facile : arpèges lents en pincé, sans forcer (3 min)"}, {"id": "ecartement", "label": "Écartement : araignée de 5-8 jusqu'à 1-4", "tempo": 60}, {"id": "lies", "label": "Liés combinés 1-3-1 et 1-4-1"}]},
          {"faire": "Étirements (2 min), écartement à 60 bpm (4 min), liés avec l'auriculaire fixe (4 min).",
           "ex": [ETIREMENTS, {"id": "facile", "label": "Jeu facile : arpèges lents en pincé, sans forcer (3 min)"}, {"id": "ecartement", "label": "Écartement : araignée de 5-8 jusqu'à 1-4", "tempo": 60}, {"id": "lies", "label": "Liés avec l'auriculaire fixe (Carlevaro)"}]},
        ],
      },
      {
        "titre": "Gamme de La mineur naturelle", "duree": 20,
        "sert": "C'est la gamme de Bamboleo. Elle ajoute 2 notes (Si et Fa) à ta pentatonique, pour une impro plus espagnole.",
        "explication": [
          "La mineur utilise exactement les mêmes notes que Do majeur, mais en partant de La : La Si Do Ré Mi Fa Sol La. C'est la « relative » de Do majeur. L'alternance a-m muscle l'annulaire, et les triolets montrent si ton alternance est vraiment régulière. Pour les triolets, dis « tri-o-let » à chaque clic et joue une note par syllabe. Comme 3 est impair, chaque clic tombe sur un doigt différent : impossible de tricher.",
        ],
        "videos": [V("La gamme mineure naturelle", "https://www.youtube.com/watch?v=s39Lt7wEpEU"), V("La gamme de Lam, une petite impro", "https://www.youtube.com/watch?v=JIs7PRgDrBo")],
        "moities": [
          {"faire": "Position fixe, cases 4 à 8, 70 bpm, montée et descente en butée i-m (le coup en butée du palier 1, en alternant index et majeur).",
           "ex": [{"id": "gamme", "label": "La mineur en butée i-m", "tempo": 70}, {"id": "phrygien", "label": "Mi phrygien en butée : Mi Fa Sol La Si Do Ré, la gamme de la cadence andalouse", "tempo": 60}]},
          {"faire": "Position fixe, cases 4 à 8, 70 bpm, en a-m (annulaire-majeur), puis en triolets (3 notes égales par clic du métronome).",
           "ex": [{"id": "gamme-am", "label": "La mineur en a-m", "tempo": 70}, {"id": "triolets", "label": "La mineur en triolets", "tempo": 70}, {"id": "phrygien-tierces", "label": "Mi phrygien en tierces, sur 2 octaves", "tempo": 60}]},
        ],
      },
      {
        "titre": "Pentatonique : positions 4 et 5, puis l'impro", "duree": 5,
        "sert": "Avec les 5 positions, tu peux improviser n'importe où sur le manche, à partir de n'importe quel La.",
        "explication": [
          "Pour l'impro : des phrases courtes de 3 à 5 notes, des silences entre elles, et finis tes phrases sur La ou sur Mi. Glisse des liés dans tes phrases. Quand l'accord de Mi arrive, essaie Sol# (Sol dièse, une case au-dessus de Sol) à la place de Sol : c'est une note de l'accord de Mi, celle qui sonne « espagnol ».",
        ],
        "videos": [V("Maîtriser les 5 positions (Simon Ghnassia)", "https://www.youtube.com/watch?v=H-knhchvGWc"), V("Apprendre la pentatonique, 5e position", "https://www.youtube.com/watch?v=fA-GVxcoemw"), V("3 exercices d'improvisation", "https://www.youtube.com/watch?v=mqwvMdhBYEM")],
        "moities": [
          {"faire": "Positions 4 (cases 0 à 3) et 5 (cases 2 à 5), une octave plus bas que sur le manche : elles sonnent mieux sur une guitare classique. 3 min, puis 2 min d'impro sur la position de ton choix.",
           "ex": [{"id": "penta45", "label": "Positions 4 et 5, une octave plus bas (cases 0 à 5) (3 min)", "tempo": 70}, {"id": "impro", "label": "Impro sur la position de ton choix (2 min)"}]},
          {"faire": "Les 5 positions à la suite (3 min), puis 2 min d'impro sur la grille de Bamboleo.",
           "ex": [{"id": "penta-tout", "label": "Les 5 positions à la suite (3 min)", "tempo": 70}, {"id": "impro", "label": "Impro sur la grille de Bamboleo (2 min)"}]},
        ],
      },
      {
        "titre": "Notes du manche : quiz", "duree": 5,
        "sert": "Connaître tout le manche, pour trouver n'importe quelle note ou n'importe quel accord sans chercher.",
        "explication": [
          "La corde de Mi aigu porte les mêmes notes que le Mi grave, que tu connais déjà.",
        ],
        "videos": [V("Apprenez TOUTES les notes sur le manche en 10 minutes", "https://www.youtube.com/watch?v=oV6d2degxdw"), V("Apprendre les notes de son manche avec efficacité", "https://www.youtube.com/watch?v=jHH9N-l-Jb0")],
        "moities": [
          {"faire": "Quiz sur les 6 cordes, 2 min : une note au hasard, trouve-la sur chaque corde. Puis 3 min sur les cordes vues avant, en revenant sur les notes ratées.",
           "ex": [{"id": "quiz", "label": "Quiz : une note au hasard sur les 6 cordes (2 min)"}, {"id": "revoir", "label": "Revoir les notes ratées, cordes vues avant (3 min)"}]},
          {"faire": "Quiz sur les 6 cordes : une note au hasard, trouve-la sur chaque corde en moins de 3 secondes.",
           "ex": [{"id": "quiz", "label": "Quiz : une note au hasard sur les 6 cordes, moins de 3 s"}]},
        ],
      },
      {
        "titre": "Rasgueado et rumba", "duree": 15,
        "sert": "Le rasgueado est le « roulement » de la guitare flamenca. C'est lui qui donne à Bamboleo son vrai son.",
        "explication": [
          "Main fermée, pouce posé sur la 6e corde. Les doigts s'ouvrent l'un après l'autre vers le sol et frappent les cordes avec l'ongle. Chaque coup doit s'entendre séparément, à intervalles égaux : c'est la régularité qui fait le roulement, pas la vitesse.",
        ],
        "videos": [V("How to play rasgueado (en anglais)", "https://www.youtube.com/watch?v=_1kSB1u4pTY"), V("Le rasgueado en 4 doigts c-a-m-i", "https://www.youtube.com/watch?v=jNOMVXzlfAs")],
        "positions": [{"label": "La mineur", "code": "x02210"}],
        "moities": [
          {"faire": "Rasgueado en 3 doigts (a, m, i) sur La mineur, lentement (7 min), puis la rumba sur la grille (8 min).",
           "ex": [{"id": "rasgueado", "label": "Rasgueado a-m-i sur La mineur (7 min)"}, {"id": "rumba", "label": "Rumba sur la grille (8 min)", "tempo": 80}]},
          {"faire": "Rasgueado en 4 doigts (c, a, m, i), puis placé à la fin de chaque tour de grille dans la rumba.",
           "ex": [{"id": "rasgueado", "label": "Rasgueado c-a-m-i"}, {"id": "rumba", "label": "Rumba avec un rasgueado à chaque fin de tour", "tempo": 80}]},
        ],
      },
      {
        "titre": "Morceaux : Bamboleo complet et Fragile", "duree": 15, "morceau": True,
        "sert": "Ta mission finale, qui réunit tout le parcours : barrés, rumba, rasgueados, pentatonique et liés.",
        "explication": [
          "Bamboleo en rumba avec un rasgueado à la fin de chaque tour, puis 1 minute d'impro sur la grille enregistrée.",
        ],
        "videos": [V("Bamboleo, full tutorial", "https://www.youtube.com/watch?v=SNlXBNy2Tuo"), V("Improviser n°1 : la pentatonique mineure", "https://www.youtube.com/watch?v=L6MArHsN2Mw")],
        "positions": [{"label": "La mineur", "code": "x02210"}, {"label": "Sol", "code": "320003"}, {"label": "Fa", "code": "133211"}, {"label": "Mi", "code": "022100"}],
        "moities": [
          {"faire": "Bamboleo en rumba à 90 bpm avec un rasgueado à la fin de chaque tour, puis 1 minute d'impro.",
           "ex": [{"id": "morceau", "label": "Bamboleo avec rasgueados", "tempo": 90}, {"id": "impro", "label": "1 min d'impro sur la grille"}]},
          {"faire": "Bamboleo en rumba à 90 bpm avec un rasgueado à la fin de chaque tour, puis 1 minute d'impro, enregistré.",
           "ex": [{"id": "morceau", "label": "Bamboleo avec rasgueados", "tempo": 90}, {"id": "impro", "label": "1 min d'impro sur la grille"}, {"id": "enregistre", "label": "M'enregistrer"}]},
        ],
      },
    ],
    "bilan": [
      ("Araignée jusqu'aux cases 1-4", "70 bpm, sans douleur"),
      ("Liés combinés, auriculaire fixe", "l'auriculaire ne bouge pas"),
      ("La mineur en a-m", "70 bpm, en triolets"),
      ("Pentatonique : les 5 positions à la suite", "sans arrêt"),
      ("Notes sur les 6 cordes", "moins de 3 s par note"),
      ("Rasgueado en 4 doigts", "régulier, 4 temps à 70 bpm"),
      ("Mission : Bamboleo + 1 min d'impro", "sans arrêt, enregistré"),
    ],
  },
]

# « Pourquoi c'est utile, et quand tu t'en serviras » : une liste par bloc, dans l'ordre des paliers.
QUAND = {
    1: [
        [
            "L'araignée t'apprend la règle « un doigt par case ». C'est la position de main de toutes tes gammes (blocs 2 et 3) et de presque tous les solos : sans elle, la main se déplace tout le temps et des notes sautent.",
            "Elle rend l'annulaire et l'auriculaire aussi précis que l'index. C'est exactement ce qui manque pour les barrés, où l'auriculaire doit tenir sa case pendant que l'index appuie.",
            "Les arpèges p-i-m-a, c'est le geste de main droite de Fragile, et de tous les morceaux joués en arpège plutôt qu'en grattant : ballades, guitare classique, accompagnements doux.",
            "Quand t'en servir : au début de chaque séance. Les mains chaudes se crispent moins, et tu évites les petites douleurs.",
        ],
        [
            "La gamme majeure est l'alphabet de la musique. Les mélodies que tu connais sont faites de ses notes, et les accords aussi : Do majeur, ce sont les notes 1, 3 et 5 de la gamme de Do (Do, Mi, Sol).",
            "Tu t'en serviras pour jouer une mélodie, pour comprendre pourquoi un accord porte son nom, et au palier 3 pour la gamme de La mineur, qui a exactement les mêmes notes.",
            "La butée sert quand une note doit chanter avec un son plein : une gamme, un solo, la mélodie d'un morceau. Le pincé sert pour les arpèges et les accompagnements, quand plusieurs cordes doivent sonner ensemble : la butée couperait la corde du dessus.",
            "Alterner index et majeur, c'est ce qui te permettra d'aller vite plus tard. Le picado, les traits rapides du flamenco, ce n'est rien d'autre que cette alternance en butée, très vite.",
        ],
        [
            "La pentatonique est la gamme la plus utilisée pour improviser, en blues, en rock, en pop comme en rumba. Une grande partie des solos de guitare que tu connais en sortent.",
            "Elle n'a que 5 notes, sans les 2 notes « délicates » de la gamme complète : sur un morceau en La mineur, presque tout ce que tu joues sonne juste. C'est pour ça qu'on commence l'impro avec elle.",
            "Tu t'en serviras au palier 2 pour ta mini-impro sur Bamboleo, et au palier 3 pour ta minute d'impro.",
            "Chaque nouvelle position t'ouvre une nouvelle zone du manche : tu n'es plus coincé dans 4 cases quand tu improvises.",
        ],
        [
            "Connaître le nom de chaque case, c'est ce qui te permet de trouver un accord barré (son nom est la note sous l'index), de repérer d'où part une gamme, et de jouer une mélodie sans tablature.",
            "La corde de Mi grave donne le nom des barrés forme Mi, la corde de La celui des barrés forme La. Ce bloc prépare donc directement tes barrés.",
            "Les octaves te servent de raccourci : à partir d'une note que tu connais, tu la retrouves partout sur le manche, sans tout apprendre par cœur.",
            "En impro, c'est ce qui te permet de savoir où sont tes La, tes notes de repos.",
        ],
        [
            "Les accords ouverts (Do, Ré, Mi, Sol, La…) n'existent qu'à un seul endroit du manche. Dès qu'un morceau demande Fa, Si, Si bémol ou Fa dièse mineur, il n'y a pas de version ouverte simple : il faut un barré.",
            "Tu en croises partout : Fa dans Let It Be des Beatles (Do, Sol, La mineur, Fa) et dans Bamboleo (La mineur, Sol, Fa, Mi), Si mineur et Fa dièse dans Hotel California des Eagles.",
            "Changer de tonalité : si un morceau est trop aigu ou trop grave, pour chanter ou pour jouer avec quelqu'un, tu décales simplement tous tes barrés de quelques cases. Même forme, autre accord.",
            "Rester au même endroit du manche : au lieu de sauter d'un accord ouvert à l'autre, tu enchaînes des barrés proches. C'est plus fluide, et le son est plus homogène.",
            "En rumba et en musique gitane, on joue beaucoup en barré : il suffit de relâcher un peu la main gauche pour étouffer les cordes et faire des coups secs.",
        ],
        [
            "Un morceau, c'est là que les exercices deviennent de la musique : tu vérifies que tes arpèges, tes changements d'accords et ton rythme tiennent quand tout arrive en même temps.",
            "Fragile est un classique de la guitare nylon : des arpèges et des accords qui s'enchaînent sans casser le rythme. C'est exactement le travail de tes blocs 1 et 2.",
            "T'enregistrer te sert à t'entendre de l'extérieur. À l'écoute, on remarque une note étouffée ou un tempo qui accélère, qu'on ne sent pas en jouant.",
        ],
    ],
    2: [
        [
            "Dans un vrai morceau, les doigts ne jouent jamais dans l'ordre 1, 2, 3, 4. Les permutations préparent ta main à tous les ordres possibles, comme dans une mélodie.",
            "L'annulaire et l'auriculaire sont en partie reliés par les tendons : c'est pour ça qu'ils sont maladroits. Ces exercices les rendent indépendants.",
            "Les liés servent à jouer deux notes avec une seule attaque de la main droite : le son est plus fluide, et on peut aller plus vite. On les entend dans presque tous les solos, et dans les ornements de la guitare flamenca et gitane.",
            "Tu t'en serviras dans ton impro du palier 3, et pour les petits ornements de Bamboleo.",
        ],
        [
            "Une gamme sans corde à vide se transporte : le même dessin donne Sol majeur en case 2, La majeur en case 4, Do majeur en case 7. Tu apprends une seule forme, et tu as les 12 gammes majeures.",
            "C'est utile dès qu'un morceau n'est pas en Do : pour jouer sa mélodie, improviser dessus ou comprendre ses accords.",
            "C'est aussi un exercice de précision : un doigt par case, la main immobile, comme l'araignée.",
        ],
        [
            "Plus tu as de positions reliées, plus tu peux voyager sur le manche pendant une impro, au lieu de tourner en rond dans 4 cases.",
            "La mini-impro t'apprend à faire des phrases : quelques notes, un silence, une fin sur une note de repos. C'est ce qui fait qu'une impro sonne comme de la musique, et pas comme une gamme récitée.",
            "Tu t'en serviras sur Bamboleo, et sur n'importe quel morceau en La mineur.",
        ],
        [
            "Les cordes de Sol et de Si sont celles où passent la plupart des mélodies et des solos.",
            "La corde de Si est la seule accordée différemment de ses voisines : c'est pour ça que les octaves et les formes se décalent d'une case à cet endroit. Le savoir t'évite de te perdre.",
            "Avec 5 cordes connues, tu peux nommer presque toutes les notes d'un accord, et retrouver vite où jouer une mélodie.",
        ],
        [
            "La forme La te donne une 2e place pour chaque accord : Do en case 3 avec la forme La, ou en case 8 avec la forme Mi. Tu prends celle qui est la plus proche de l'accord d'avant.",
            "Elle est indispensable pour des accords comme Si bémol, Si mineur ou Do dièse mineur, très fréquents dans les chansons.",
            "La rumba est le rythme de la guitare gitane, celui des Gipsy Kings : c'est ce qui fait danser un morceau. Tu peux l'utiliser pour accompagner presque n'importe quelle chanson avec une couleur espagnole.",
            "La cadence andalouse (La mineur, Sol, Fa, Mi) est la grille la plus jouée de la musique espagnole. Tu la retrouves dans le flamenco, dans Bamboleo, et même dans Hit the Road Jack.",
        ],
        [
            "Bamboleo réunit tout le palier : le Fa barré rapide, la rumba avec le golpe et la cadence andalouse.",
            "Une fois Bamboleo en place, beaucoup d'autres rumbas s'ouvrent à toi : elles utilisent les mêmes accords et le même rythme.",
            "C'est aussi ton test de régularité : 8 tours sans t'arrêter, c'est ce qu'il faut pour accompagner quelqu'un qui chante ou qui joue la mélodie.",
        ],
    ],
    3: [
        [
            "Beaucoup d'accords et de gammes demandent d'atteindre 4 ou 5 cases sans bouger la main, surtout près de la tête du manche, où les cases sont les plus larges. L'écartement te le permet sans te crisper.",
            "Il rend aussi les barrés plus faciles : l'auriculaire atteint sa case sans tirer sur la main.",
            "Les liés avec un doigt fixe t'apprennent à faire travailler un doigt pendant que les autres tiennent leur place. C'est ce qui se passe dans tous les morceaux où une basse ou un accord reste tenu pendant la mélodie.",
        ],
        [
            "C'est la gamme des morceaux en La mineur, comme Bamboleo : ton impro peut utiliser toutes les notes du morceau, pas seulement les 5 de la pentatonique.",
            "Elle a les mêmes notes que Do majeur : en connaissant l'une, tu connais l'autre. On dit que La mineur est la « relative » de Do majeur, et c'est pour ça que ces deux tonalités vont si bien ensemble.",
            "L'alternance a-m et les triolets préparent ta main droite aux traits rapides et aux rythmes en trois de la musique espagnole.",
        ],
        [
            "Avec les 5 positions, il n'y a plus d'endroit du manche où tu es perdu : tu improvises en bas, au milieu ou en haut, et tu passes de l'un à l'autre.",
            "C'est la carte de toute la pentatonique de La : après la case 12, les positions recommencent.",
            "Le même dessin, déplacé, te donne la pentatonique de n'importe quelle note : la position 1 en case 0, c'est Mi mineur ; en case 3, c'est Sol mineur.",
        ],
        [
            "Connaître les 6 cordes, c'est savoir où tu es partout : trouver un accord, une note de mélodie ou le départ d'une gamme sans compter les cases.",
            "Le quiz en moins de 3 secondes, c'est la vitesse qu'il faut pour que ça te serve pendant que tu joues, et pas seulement quand tu prends le temps de réfléchir.",
        ],
        [
            "Le rasgueado, c'est le roulement des doigts de la guitare flamenca : il donne de la puissance et marque les accents et les fins de phrase.",
            "Tu l'utilises à la fin d'un tour de grille, sur un accent, ou pour finir un morceau en beauté. Dans Bamboleo, il remplace un coup simple pour donner du relief.",
            "Il travaille aussi l'indépendance des doigts de la main droite, comme les permutations pour la main gauche.",
        ],
        [
            "C'est la synthèse des 12 semaines : barrés, rumba, rasgueado, pentatonique et liés dans un seul morceau.",
            "L'impro sur la grille te prouve que tu sais utiliser tes gammes en musique, et pas seulement les réciter.",
            "Fragile en entretien garde tes arpèges vivants : ce qu'on ne joue plus, on finit par le perdre.",
        ],
    ],
}


FRAGILE_ENTRETIEN = {"id": "fragile", "label": "Fragile une fois en entier, pour l'entretenir", "theme": "morceaux"}


# Jeux du manche, selon la corde travaillée à ce moment du parcours (cordes : 6 = Mi grave … 1 = Mi aigu).
JEUX_NOTES = {
    (1, 0): {"corde": 5, "vues": [6, 5], "note": "La", "octave": [6, 5]},
    (1, 1): {"corde": 4, "vues": [6, 5, 4], "note": "Ré", "octave": [6, 5, 4]},
    (2, 0): {"corde": 3, "vues": [6, 5, 4, 3], "note": "Sol", "octave": [6, 5, 4, 3]},
    (2, 1): {"corde": 2, "vues": [6, 5, 4, 3, 2], "note": "Si", "octave": [6, 5, 4, 3]},
    (3, 0): {"corde": 1, "vues": [6, 5, 4, 3, 2, 1], "note": "Mi", "octave": [6, 5, 4, 3]},
}


# Schémas du cours (data/schemas.json, repris du Claude Doc), par palier puis par bloc.
SCHEMAS = {
    1: [["araignee", "main-droite"], ["do-majeur", "butee-pince"], ["penta-1", "penta-2"], ["notes-manche", "octaves"], ["forme-mi", "forme-la"], ["main-droite"]],
    2: [["permutations", "lies"], ["sol-majeur"], ["penta-3", "penta-1"], ["notes-manche", "octaves"], ["sib-sim", "rumba", "cadence-andalouse"], ["cadence-andalouse"]],
    3: [["ecartement", "lies"], ["la-mineur"], ["penta-4-5", "penta-5-positions"], ["notes-manche", "octaves"], ["rasgueado", "rumba"], ["cadence-andalouse", "penta-1"]],
}

# Thèmes des barres de progression de « Mon bilan ».
THEMES = [
    {"id": "technique", "label": "Technique main gauche"},
    {"id": "arpeges", "label": "Arpèges et main droite"},
    {"id": "gammes", "label": "Gammes"},
    {"id": "penta", "label": "Pentatonique et impro"},
    {"id": "manche", "label": "Notes du manche"},
    {"id": "barres", "label": "Barrés"},
    {"id": "accords", "label": "Accords et enchaînements"},
    {"id": "rythme", "label": "Rythmes : rumba et rasgueado"},
    {"id": "morceaux", "label": "Morceaux"},
]
THEME_OF = {
    "etirements": "technique", "araignee": "technique", "permutations": "technique", "lies": "technique", "ecartement": "technique",
    "arpeges": "arpeges", "alternance": "arpeges",
    "gamme": "gammes", "gamme-pince": "gammes", "gamme-am": "gammes", "triolets": "gammes",
    "impro": "penta", "corde": "manche", "octaves": "manche", "quiz": "manche",
    "comprendre": "barres", "majeurs": "barres", "mineurs": "barres", "barres": "barres",
    "enchainement": "accords", "alterne": "accords", "grille": "accords",
    "rumba": "rythme", "rasgueado": "rythme",
}


def theme_of(e):
    if e["id"] in THEME_OF:
        return THEME_OF[e["id"]]
    if e["id"].startswith("penta"):
        return "penta"
    return "morceaux"


def jeux_for(palier, moitie, e):
    cfg = JEUX_NOTES.get((palier["num"], moitie))
    if e["id"] == "corde" and cfg:
        return [{"mode": "trouve", "cordes": [cfg["corde"]], "label": "Trouve les notes"},
                {"mode": "nomme", "cordes": [cfg["corde"]], "label": "Quelle note ?"},
                {"mode": "nomme", "cordes": cfg["vues"], "label": "Révision : toutes mes cordes"}]
    if e["id"] == "octaves" and cfg:
        return [{"mode": "partout", "note": cfg["note"], "label": f"Tous les {cfg['note']}"},
                {"mode": "octave", "cordes": cfg["octave"], "label": "Octaves"}]
    if e["id"] == "quiz":
        return [{"mode": "quiz", "label": "Quiz : une note, toutes les cordes"},
                {"mode": "nomme", "cordes": [6, 5, 4, 3, 2, 1], "label": "Quelle note ? (6 cordes)"}]
    return None


QUAND_TITRE = "Pourquoi c'est utile, et quand tu t'en serviras"


def voix_explication(b):
    """Ce que lit le bouton « Écouter » de « Explication et vidéos » : un segment par paragraphe ou par point."""
    seg = []
    for t in b["explication"]:
        if isinstance(t, str):
            seg.append(t)
            continue
        if t.get("titre"):
            seg.append(t["titre"] + ".")
        seg += t.get("liste", [])
        if t.get("table"):
            head, *rows = t["table"]
            cols = [h.split(" (")[0] for h in head[1:]]
            for r in rows:
                seg.append(r[0] + " : " + ", ".join(f"{c.lower()} {v}" for c, v in zip(cols, r[1:])) + ".")
    n = len(b["videos"])
    if n:
        seg.append("Il y a aussi une vidéo juste en dessous, pour voir le geste." if n == 1 else f"Il y a aussi {n} vidéos juste en dessous, pour voir le geste.")
    return seg


def bloc_for(palier, b, bi, moitie, seance):
    m = b["moities"][moitie]
    ex = [dict(e) for e in m["ex"]]
    for e in ex:
        j = jeux_for(palier, moitie, e)
        if j: e["jeux"] = j
        e.setdefault("theme", theme_of(e))
    faire = m["faire"]
    titre = b["titre"]
    if b.get("morceau"):
        if palier["num"] == 1:
            if seance == "C":
                faire = "Au choix : Fragile, ou un morceau que tu aimes. " + faire
        else:
            if seance == "A":
                faire = "Fragile une fois en entier pour l'entretenir, puis Bamboleo. " + faire
                ex = [FRAGILE_ENTRETIEN] + ex
            elif seance == "C":
                faire = "Au choix : Bamboleo, Fragile ou un morceau que tu aimes. " + faire
    quand = QUAND[palier["num"]][bi]
    return {
        "id": f"b{bi + 1}", "titre": f"{bi + 1}. {titre}", "duree": b["duree"],
        "sert": b["sert"], "quand": quand, "faire": faire, "explication": b["explication"],
        "videos": b["videos"], "positions": m.get("positions", b.get("positions", [])),
        "schemas": SCHEMAS[palier["num"]][bi],
        "exercices": ex,
        "voix": {
            "consigne": [titre + ".", b["sert"], "À faire : " + faire],
            "quand": [QUAND_TITRE + "."] + quand,
            "explication": voix_explication(b),
        },
    }


cours = []
num = 0
for p in PALIERS:
    for wk in range(4):
        semaine = (p["num"] - 1) * 4 + wk + 1
        moitie = 0 if wk < 2 else 1
        for seance in "ABC":
            num += 1
            c = {
                "id": f"c{num}", "num": num, "semaine": semaine, "palier": p["num"], "seance": seance,
                "titre": f"Semaine {semaine} · Séance {seance}",
                "blocs": [bloc_for(p, b, i, moitie, seance) for i, b in enumerate(p["blocs"])],
            }
            if wk == 3 and seance == "C":
                n = len(p["bilan"]); ok = n - 1
                c["bilan"] = {"titre": f"Bilan du palier {p['num']}", "regle": f"{ok} tests sur {n} réussis : tu passes au palier suivant. Sinon, une semaine de plus sur ce qui manque. Un test compte comme réussi quand tu l'as fait à l'objectif, deux fois de suite.",
                              "tests": [{"id": f"t{i + 1}", "label": t, "objectif": o} for i, (t, o) in enumerate(p["bilan"])]}
            cours.append(c)

# ---------- Répertoire : morceaux au choix par palier (il choisit dans l'app, bloc Morceau) ----------
# vidéos choisies sur leur titre (YouTube n'est pas joignable d'ici pour les vérifier)
YT = lambda v: "https://www.youtube.com/watch?v=" + v
def piece(id, style, titre, artiste, travaille, pourquoi, ecouter, tuto=None):
    return {"id": id, "style": style, "titre": titre, "artiste": artiste, "travaille": travaille, "pourquoi": pourquoi,
            "ecouter": YT(ecouter), **({"tuto": YT(tuto)} if tuto else {})}
REPERTOIRE = {
    1: [
        piece("sos", "Chanson française", "Tous les cris, les S.O.S.", "Daniel Balavoine", "Accords, enchaînements, accompagnement régulier.",
              "Ton morceau : tu l'as déjà commencé, ce palier sert à le jouer vraiment propre.", "urWV2OjAmUQ"),
        piece("tarrega-mim", "Classique, arpèges", "Étude en Mi mineur", "Francisco Tárrega", "Arpège p-i-m-a régulier, mélodie jouée par l'annulaire.",
              "La même main droite que Fragile, sur des accords ouverts simples.", "5EdL4_J9Se0", "hUNcojDqvhI"),
        piece("sevillanas", "Flamenco", "Sevillanas : le rythme de base", "Traditionnel", "Compter en 3 temps, premiers accents de la main droite.",
              "Une entrée douce dans le flamenco, avant la rumba du palier 2.", "KGxuvqcVnEU"),
        piece("fields", "Pop", "Fields of Gold", "Sting", "Arpèges sur une autre grille d'accords.",
              "Si Fragile te plaît : le même style, un autre morceau.", "KLVq0IAzh1A"),
    ],
    2: [
        piece("romance", "Classique, arpèges", "Romance anonyme (Jeux interdits), 1re partie", "Anonyme", "Arpèges en triolets, mélodie sur la corde aiguë, un barré haut sur le manche.",
              "L'étude idéale de ce palier : les arpèges du palier 1 et les barrés du palier 2.", "vBgDq5N6lCs"),
        piece("cestecrit", "Chanson française", "C'est écrit", "Francis Cabrel", "Accompagnement en arpèges, enchaînements d'accords avec barrés.",
              "Ton morceau : il demande des barrés sûrs, c'est le bon moment.", "IkAhYtcDkc4", "XJX5Jjrzoy0"),
        piece("djobi", "Rumba", "Djobi Djoba", "Gipsy Kings", "Rumba avec golpe, barrés, cadence andalouse.",
              "Le même rythme que Bamboleo, pour varier.", "znxb6KtOo_c"),
        piece("pompe", "Gypsy", "La pompe manouche sur Minor Swing", "Django Reinhardt", "Main droite alternée basse et accord, accords sans corde à vide.",
              "La base du jazz manouche, avant un vrai thème au palier 3.", "VbBBpfOZ0z0"),
    ],
    3: [
        piece("malaguena", "Flamenco", "Malagueña (version flamenco)", "Traditionnel", "Mélodie au pouce, rasgueados, Mi phrygien.",
              "Tout le palier dans un morceau : la gamme de la cadence andalouse et le rasgueado.", "I3jWsoQ8W8g", "FR2lh1-thI0"),
        piece("lagrima", "Classique", "Lágrima", "Francisco Tárrega", "Changements de position, barrés, son chanté.",
              "L'étude du palier : écartement et déplacements sur le manche.", "jRA9lolwg90", "pfbZ1UhR-t0"),
        piece("yeuxnoirs", "Gypsy", "Les Yeux noirs (thème)", "Django Reinhardt", "Mineure harmonique, pompe manouche.",
              "Ta gamme mineure du palier 3, dans le style que tu aimes.", "39k4pNjusq8"),
        piece("shape", "Pop", "Shape of My Heart", "Sting", "Arpèges plus riches, accords en position, sons tenus.",
              "La suite naturelle de Fragile, un cran plus dur.", "NlwIDxCjL-8"),
    ],
}
# après le palier 3 : un palier 4 « Bossa » proposé (accords 7e, pouce régulier contre doigts décalés)
BOSSA = [
    piece("ipanema", "Bossa nova", "Garota de Ipanema", "João Gilberto, Stan Getz", "Accords majeur 7 et mineur 7, rythme bossa.",
          "Le standard pour commencer la bossa, en accompagnement.", "otGz6hz-AXo"),
    piece("corcovado", "Bossa nova", "Corcovado", "João Gilberto, Stan Getz", "Accords enrichis, rythme bossa plus lent.",
          "Le deuxième standard, tout en douceur.", "kjilv-saThE"),
]

# ---------- Le prof qui parle : intro au démarrage de la séance, bilan à « Terminer le cours » ----------
GENRE = ["d'échauffement", "de gamme", "de pentatonique", "de notes du manche", "de barrés et de rythme", "de morceau"]
ORDINAL = {"A": "la première", "B": "la deuxième", "C": "la dernière"}
lower1 = lambda t: t[:1].lower() + t[1:]
court = lambda b: b["titre"].split(". ", 1)[-1]
num_fr = lambda n: {1: "une", 2: "deux", 3: "trois"}.get(n, str(n))

def intro(c, prev):
    p = next(x for x in PALIERS if x["num"] == c["palier"])
    wk = (c["semaine"] - 1) % 4
    bilan_num = (c["palier"]) * 12
    nouveau = c["seance"] == "A" and wk in (0, 2)
    salut = {"A": "Bonjour Timothée !", "B": "Re-bonjour Timothée !", "C": "Salut Timothée !"}[c["seance"]]
    I = [f"{salut} Bienvenue au cours {c['num']}, {ORDINAL[c['seance']]} séance de la semaine {c['semaine']}."]
    if wk == 0 and c["seance"] == "A":
        I.append(f"On attaque le palier {p['num']} : {NOMS[p['num']]}. Le but : {lower1(p['but'])}")
        I.append(f"Ta mission d'ici la fin du palier, dans quatre semaines : {lower1(p['mission'])}")
    elif c.get("bilan"):
        n = len(c["bilan"]["tests"])
        I.append(f"Aujourd'hui, c'est le jour du bilan du palier {p['num']}, {NOMS[p['num']]} ! {n} tests t'attendent à la fin du cours. Avec {n - 1} tests réussis, tu passes au palier suivant.")
    elif c["seance"] == "A":
        I.append(f"On est dans le palier {p['num']}, {NOMS[p['num']]}, semaine {wk + 1} sur 4. Je te rappelle le but : {lower1(p['but'])}")
        I.append(f"C'est la dernière semaine avant le bilan du palier, au cours {bilan_num}." if wk == 3
                 else f"Le bilan du palier arrive dans {num_fr(3 - wk)} semaine{'s' if 3 - wk > 1 else ''}, au cours {bilan_num}. Ta mission : {lower1(p['mission'])}")
    else:
        I.append(f"On est toujours dans le palier {p['num']}, {NOMS[p['num']]}. Ta mission : {lower1(p['mission'])}")
    return I, nouveau, wk

def plan(c):
    parts = [f"{b['duree']} minutes {GENRE[i]}" for i, b in enumerate(c["blocs"])]
    return "Le déroulé, environ une heure dix : " + ", ".join(parts[:-1]) + ", et " + parts[-1] + "."

def voix_prof(c, prev, nxt, avant=None, avant3=None):
    I, nouveau, wk = intro(c, prev)
    suite = []  # après le mot du prof et les difficultés du dernier cours (ajoutés par l'app)
    # les exercices nouveaux d'un bloc, par rapport au même bloc deux semaines plus tôt
    def ex1(b, ref):
        labels = [e["label"] for e in b["exercices"] if not e["label"].lower().startswith("étirements")]
        if ref:
            old = {e["label"] for rb in ref["blocs"] if rb["id"] == b["id"] for e in rb["exercices"]}
            labels = [l for l in labels if l not in old] or labels
        return ", puis ".join(labels[:2])
    if nouveau and wk == 0:
        suite.append("Aujourd'hui, il y a du nouveau dans chaque bloc. Voilà ce qu'on travaille, et pourquoi.")
        suite += [f"{court(b)} : {b['sert']}" for b in c["blocs"]]
    elif nouveau:
        suite.append("Aujourd'hui, de nouveaux exercices arrivent dans chaque bloc. Les voici.")
        suite += [f"{court(b)} : {ex1(b, avant)}." for b in c["blocs"] if ex1(b, avant)]
    elif c["seance"] == "A":
        suite.append("Rappel de la semaine dernière : tu as découvert de nouveaux exercices dans chaque bloc. Cette semaine, on les consolide : le même contenu, un peu plus propre et un peu plus vite.")
        suite.append(f"En gamme : {ex1(c['blocs'][1], avant3)}. En barrés et rythme : {ex1(c['blocs'][4], avant3)}.")
    else:
        suite.append("Pas de nouveauté aujourd'hui : on reprend les exercices de la dernière fois, pour qu'ils deviennent automatiques. C'est la répétition qui fait progresser.")
    suite.append(plan(c))
    suite.append("Prends ta guitare, vérifie l'accord, et on commence par l'échauffement. Allez, c'est parti !")
    fin = [f"Cours {c['num']} terminé, bravo !"]
    if c.get("bilan"):
        pn = c["palier"]
        apres = (f"Envoie-moi tes résultats : je te dirai si tu passes au palier {pn + 1}, {NOMS[pn + 1]}." if pn < 3
                 else "C'était le dernier bilan du cours. Envoie-moi tes résultats, et on choisira ensemble la suite.")
        suite_fin = f"C'était le bilan du palier {pn}. {apres}"
    elif nxt:
        n_wk = (nxt["semaine"] - 1) % 4
        if nxt["seance"] == "A" and n_wk in (0, 2):
            suite_fin = f"Au prochain cours, le cours {nxt['num']}, il y a du nouveau dans chaque bloc. J'ai hâte !"
        else:
            suite_fin = f"Au prochain cours, le cours {nxt['num']}, on continue sur la même lancée."
    else:
        suite_fin = ""
    return {"intro": I, "intro_suite": suite, "fin": fin, "fin_suite": [suite_fin] if suite_fin else []}

# morceaux du bilan parlé, assemblés par l'app selon ce que tu as fait (app.js : bilanParle)
PROF = {
    "tout": "Tu as fait tous les exercices. Super travail !",
    "presque": "Tu as fait presque tous les exercices, c'est très bien.",
    "moitie": "Tu as fait plus de la moitié des exercices.",
    "peu": "Tu as fait une partie des exercices. Ce n'est pas grave : ce qui compte, c'est de revenir régulièrement.",
    "minutes": {str(n): f"Tu as joué environ {n} minutes." for n in range(5, 125, 5)},
    "facile": "Ce qui a été facile :",
    "galere": "Ce qui t'a donné du mal :",
    "galere_fin": "Pas d'inquiétude : j'en tiens compte pour la suite. Au prochain cours, on le reprend doucement, au tempo de départ.",
    "rien_galere": "Rien ne t'a vraiment posé de problème : c'est bon signe, on pourra bientôt monter le tempo.",
    "tempo": {str(k): f"Ton tempo a monté sur {k} exercice{'s' if k > 1 else ''}." for k in range(1, 13)},
    "envoie": "Dernière chose : copie ton bilan et envoie-le-moi. Je lis tout, et j'adapte le prochain cours.",
    "intro_galere": "Au dernier cours, ce qui t'a donné du mal :",
    "intro_galere_fin": "On y va doucement aujourd'hui, au tempo de départ, en visant un son propre.",
}

# Adaptations après tes bilans : data/adaptations.json, rangées par cours.
# {"c4": {"mot": "…", "blocs": {"b2": {"faire": "…", "exercices": [...]}}}}
ADAPT = os.path.join(os.path.dirname(__file__), "..", "data", "adaptations.json")
if os.path.exists(ADAPT):
    with open(ADAPT, encoding="utf-8") as f:
        adapt = json.load(f).get("cours", {})
    for c in cours:
        a = adapt.get(c["id"])
        if not a:
            continue
        for k, v in a.items():
            if k == "blocs":
                for b in c["blocs"]:
                    b.update(v.get(b["id"], {}))
                    b["voix"]["consigne"] = [b["titre"].split(". ", 1)[-1] + ".", b["sert"], "À faire : " + b["faire"]]
            else:
                c[k] = v

for i, c in enumerate(cours):
    same_pal = lambda j: cours[j] if j >= 0 and cours[j]["palier"] == c["palier"] else None
    c["prof"] = voix_prof(c, cours[i - 1] if i else None, cours[i + 1] if i + 1 < len(cours) else None, same_pal(i - 6), same_pal(i - 9))

out = {
    "version": 1,
    "prof": PROF,
    "maj": __import__("datetime").datetime.now().strftime("%Y-%m-%dT%H:%M"),
    "seance_type": [
        {"bloc": "Échauffement et technique", "duree": 10}, {"bloc": "Gamme", "duree": 10},
        {"bloc": "Pentatonique", "duree": 10}, {"bloc": "Notes du manche", "duree": 10},
        {"bloc": "Barrés et rythme", "duree": 15}, {"bloc": "Morceau", "duree": 15},
    ],
    "themes": THEMES,
    "paliers": [{"num": p["num"], "nom": NOMS[p["num"]], "titre": p["titre"], "but": p["but"], "mission": p["mission"],
                 "repertoire": REPERTOIRE[p["num"]]} for p in PALIERS],
    "bossa": BOSSA,
    "cours": cours,
}
root = os.path.join(os.path.dirname(__file__), "..")
os.makedirs(os.path.join(root, "data"), exist_ok=True)
with open(os.path.join(root, "data", "cours.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(cours), "cours")
