# Génère data/cours.json à partir du cours (12 semaines, 3 séances par semaine).
import json, os

V = lambda t, u: {"t": t, "u": u}

ETIREMENTS = {
    "id": "etirements", "label": "Étirements (2 min)",
    "aide": "Ouvre et ferme les mains, étire doucement chaque doigt et les poignets, 10 secondes chacun, sans jamais forcer.",
}

# Chaque palier : 6 blocs, chacun avec deux moitiés (semaines 1-2 / 3-4 du palier).
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
        "titre": "Gamme de Do majeur et main droite", "duree": 10,
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
        "titre": "Pentatonique de La mineur", "duree": 10,
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
        "titre": "Notes du manche", "duree": 10,
        "sert": "Savoir où tu es sur le manche. La corde de La te donnera le nom de tous tes barrés forme La au palier 2.",
        "explication": [
          "Il y a 7 notes naturelles : Do Ré Mi Fa Sol La Si. Entre deux notes il y a 2 cases, sauf entre Mi-Fa et Si-Do où il n'y en a qu'une. La case 12 redonne la note à vide, une octave plus haut.",
          "Une octave, c'est la même note en plus aigu (sur la même corde, 12 cases plus loin). Pour trouver les octaves : depuis la 6e ou la 5e corde, monte de 2 cordes et avance de 2 cases. Depuis la 4e ou la 3e, avance de 3 cases, parce que tu passes la corde de Si.",
        ],
        "videos": [V("Comment mémoriser toutes les notes sur le manche", "https://www.youtube.com/watch?v=YaM7PLMop5o"), V("Toutes les notes du manche grâce au schéma d'octave", "https://www.youtube.com/watch?v=PJ8_orOw4ss")],
        "moities": [
          {"faire": "Corde de La : 5 min à dire chaque note de la case 0 à 12 puis au hasard, et 5 min à retrouver tous les La par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de La : notes de 0 à 12, puis au hasard (5 min)"}, {"id": "octaves", "label": "Octaves : tous les La du manche (5 min)"}]},
          {"faire": "Corde de Ré : 5 min à dire chaque note de la case 0 à 12 puis au hasard, et 5 min à retrouver tous les Ré par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de Ré : notes de 0 à 12, puis au hasard (5 min)"}, {"id": "octaves", "label": "Octaves : tous les Ré du manche (5 min)"}]},
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
        "titre": "Gamme majeure en position fixe", "duree": 10,
        "sert": "Une forme sans corde à vide se déplace partout. En la décalant, tu as toutes les gammes majeures avec un seul dessin.",
        "explication": [
          "En position fixe, la main ne bouge pas : un doigt par case sur 4 cases, comme l'araignée. La gamme commence sur le Sol de la 6e corde, case 3. Décale toute la forme et la gamme prend le nom de cette première note.",
        ],
        "videos": [V("Gamme majeure de Sol, première position", "https://www.youtube.com/watch?v=P3PoCM_veUc"), V("Les positions de la gamme majeure", "https://www.youtube.com/watch?v=MrqsX1fzcLs")],
        "moities": [
          {"faire": "Sol majeur : index case 2, auriculaire case 5, montée et descente à 60 bpm en butée, en disant les notes.",
           "ex": [{"id": "gamme", "label": "Sol majeur en position fixe, en butée", "tempo": 60}]},
          {"faire": "La même forme 2 cases plus haut (c'est La majeur), à 70 bpm.",
           "ex": [{"id": "gamme", "label": "La majeur en position fixe, en butée", "tempo": 70}]},
        ],
      },
      {
        "titre": "Pentatonique : position 3 et mini-impro", "duree": 10,
        "sert": "Avec 3 positions reliées, tu couvres le manche de la case 5 à la case 12. La mini-impro t'apprend à t'en servir pour de vrai.",
        "explication": [
          "Pour la mini-impro : des phrases de 3 à 5 notes, des silences entre elles, et finis tes phrases sur un La.",
        ],
        "videos": [V("Pentatonique : les 5 positions expliquées facilement", "https://www.youtube.com/watch?v=OfyoYXtti04"), V("Improviser n°1 : la pentatonique mineure", "https://www.youtube.com/watch?v=L6MArHsN2Mw")],
        "moities": [
          {"faire": "La position 3 (cases 9 à 12), reliée à la 2.",
           "ex": [{"id": "penta3", "label": "Position 3 (cases 9 à 12)", "tempo": 70}, {"id": "penta23", "label": "Relier les positions 2 et 3", "tempo": 70}]},
          {"faire": "7 min sur les positions 1, 2 et 3 à la suite, puis 3 min d'impro sur la position 1, sur la grille de Bamboleo (la suite d'accords qui tourne en boucle dans le morceau), enregistrée sur ton téléphone.",
           "ex": [{"id": "penta123", "label": "Positions 1, 2 et 3 à la suite (7 min)", "tempo": 70}, {"id": "impro", "label": "Mini-impro sur la grille de Bamboleo (3 min)"}]},
        ],
      },
      {
        "titre": "Notes du manche", "duree": 10,
        "sert": "Connaître les cordes du milieu, celles où passent la plupart des mélodies et des solos.",
        "explication": [
          "Sur la corde de Si, l'octave se décale de 3 cases au lieu de 2 : c'est la seule corde accordée différemment des autres.",
        ],
        "videos": [V("Le manche de la guitare maîtrisé en 17 minutes", "https://www.youtube.com/watch?v=HDZx0XgrHgI"), V("Placer les notes sur le manche facilement", "https://www.youtube.com/watch?v=_m8qu8ogAug")],
        "moities": [
          {"faire": "Corde de Sol : 5 min à dire chaque note de la case 0 à 12 puis au hasard, et 5 min à retrouver tous les Sol par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de Sol : notes de 0 à 12, puis au hasard (5 min)"}, {"id": "octaves", "label": "Octaves : tous les Sol du manche (5 min)"}]},
          {"faire": "Corde de Si : 5 min à dire chaque note de la case 0 à 12 puis au hasard, et 5 min à retrouver tous les Si par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de Si : notes de 0 à 12, puis au hasard (5 min)"}, {"id": "octaves", "label": "Octaves : tous les Si du manche (5 min)"}]},
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
           "ex": [ETIREMENTS, {"id": "ecartement", "label": "Écartement : araignée de 5-8 jusqu'à 1-4", "tempo": 60}, {"id": "lies", "label": "Liés combinés 1-3-1 et 1-4-1"}]},
          {"faire": "Étirements (2 min), écartement à 60 bpm (4 min), liés avec l'auriculaire fixe (4 min).",
           "ex": [ETIREMENTS, {"id": "ecartement", "label": "Écartement : araignée de 5-8 jusqu'à 1-4", "tempo": 60}, {"id": "lies", "label": "Liés avec l'auriculaire fixe (Carlevaro)"}]},
        ],
      },
      {
        "titre": "Gamme de La mineur naturelle", "duree": 10,
        "sert": "C'est la gamme de Bamboleo. Elle ajoute 2 notes (Si et Fa) à ta pentatonique, pour une impro plus espagnole.",
        "explication": [
          "La mineur utilise exactement les mêmes notes que Do majeur, mais en partant de La : La Si Do Ré Mi Fa Sol La. C'est la « relative » de Do majeur. L'alternance a-m muscle l'annulaire, et les triolets montrent si ton alternance est vraiment régulière. Pour les triolets, dis « tri-o-let » à chaque clic et joue une note par syllabe. Comme 3 est impair, chaque clic tombe sur un doigt différent : impossible de tricher.",
        ],
        "videos": [V("La gamme mineure naturelle", "https://www.youtube.com/watch?v=s39Lt7wEpEU"), V("La gamme de Lam, une petite impro", "https://www.youtube.com/watch?v=JIs7PRgDrBo")],
        "moities": [
          {"faire": "Position fixe, cases 4 à 8, 70 bpm, montée et descente en butée i-m (le coup en butée du palier 1, en alternant index et majeur).",
           "ex": [{"id": "gamme", "label": "La mineur en butée i-m", "tempo": 70}]},
          {"faire": "Position fixe, cases 4 à 8, 70 bpm, en a-m (annulaire-majeur), puis en triolets (3 notes égales par clic du métronome).",
           "ex": [{"id": "gamme-am", "label": "La mineur en a-m", "tempo": 70}, {"id": "triolets", "label": "La mineur en triolets", "tempo": 70}]},
        ],
      },
      {
        "titre": "Pentatonique : positions 4 et 5, puis l'impro", "duree": 10,
        "sert": "Avec les 5 positions, tu peux improviser n'importe où sur le manche, à partir de n'importe quel La.",
        "explication": [
          "Pour l'impro : des phrases courtes de 3 à 5 notes, des silences entre elles, et finis tes phrases sur La ou sur Mi. Glisse des liés dans tes phrases. Quand l'accord de Mi arrive, essaie Sol# (Sol dièse, une case au-dessus de Sol) à la place de Sol : c'est une note de l'accord de Mi, celle qui sonne « espagnol ».",
        ],
        "videos": [V("Maîtriser les 5 positions (Simon Ghnassia)", "https://www.youtube.com/watch?v=H-knhchvGWc"), V("Apprendre la pentatonique, 5e position", "https://www.youtube.com/watch?v=fA-GVxcoemw"), V("3 exercices d'improvisation", "https://www.youtube.com/watch?v=mqwvMdhBYEM")],
        "moities": [
          {"faire": "Positions 4 (cases 12 à 15) et 5 (cases 14 à 17) pendant 6 min, puis 4 min d'impro sur la position de ton choix.",
           "ex": [{"id": "penta45", "label": "Positions 4 et 5 (6 min)", "tempo": 70}, {"id": "impro", "label": "Impro sur la position de ton choix (4 min)"}]},
          {"faire": "Les 5 positions à la suite (5 min), puis 5 min d'impro sur la grille de Bamboleo.",
           "ex": [{"id": "penta-tout", "label": "Les 5 positions à la suite (5 min)", "tempo": 70}, {"id": "impro", "label": "Impro sur la grille de Bamboleo (5 min)"}]},
        ],
      },
      {
        "titre": "Notes du manche : Mi aigu et quiz", "duree": 10,
        "sert": "Connaître tout le manche, pour trouver n'importe quelle note ou n'importe quel accord sans chercher.",
        "explication": [
          "La corde de Mi aigu porte les mêmes notes que le Mi grave, que tu connais déjà.",
        ],
        "videos": [V("Apprenez TOUTES les notes sur le manche en 10 minutes", "https://www.youtube.com/watch?v=oV6d2degxdw"), V("Apprendre les notes de son manche avec efficacité", "https://www.youtube.com/watch?v=jHH9N-l-Jb0")],
        "moities": [
          {"faire": "La corde de Mi aigu, puis tous les Mi par les octaves.",
           "ex": [{"id": "corde", "label": "Corde de Mi aigu (5 min)"}, {"id": "octaves", "label": "Octaves : tous les Mi du manche (5 min)"}]},
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

FRAGILE_ENTRETIEN = {"id": "fragile", "label": "Fragile une fois en entier, pour l'entretenir"}


# Jeux du manche, selon la corde travaillée à ce moment du parcours (cordes : 6 = Mi grave … 1 = Mi aigu).
JEUX_NOTES = {
    (1, 0): {"corde": 5, "vues": [6, 5], "note": "La", "octave": [6, 5]},
    (1, 1): {"corde": 4, "vues": [6, 5, 4], "note": "Ré", "octave": [6, 5, 4]},
    (2, 0): {"corde": 3, "vues": [6, 5, 4, 3], "note": "Sol", "octave": [6, 5, 4, 3]},
    (2, 1): {"corde": 2, "vues": [6, 5, 4, 3, 2], "note": "Si", "octave": [6, 5, 4, 3]},
    (3, 0): {"corde": 1, "vues": [6, 5, 4, 3, 2, 1], "note": "Mi", "octave": [6, 5, 4, 3]},
}


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


def bloc_for(palier, b, bi, moitie, seance):
    m = b["moities"][moitie]
    ex = [dict(e) for e in m["ex"]]
    for e in ex:
        j = jeux_for(palier, moitie, e)
        if j: e["jeux"] = j
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
    return {
        "id": f"b{bi + 1}", "titre": f"{bi + 1}. {titre}", "duree": b["duree"],
        "sert": b["sert"], "faire": faire, "explication": b["explication"],
        "videos": b["videos"], "positions": m.get("positions", b.get("positions", [])),
        "exercices": ex,
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
                c["bilan"] = {"titre": f"Bilan du palier {p['num']}", "regle": "5 tests réussis : tu passes au palier suivant. Sinon, une semaine de plus sur ce qui manque.",
                              "tests": [{"id": f"t{i + 1}", "label": t, "objectif": o} for i, (t, o) in enumerate(p["bilan"])]}
            cours.append(c)

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
            else:
                c[k] = v

out = {
    "version": 1,
    "maj": __import__("datetime").datetime.now().strftime("%Y-%m-%dT%H:%M"),
    "seance_type": [
        {"bloc": "Échauffement et technique", "duree": 10}, {"bloc": "Gamme", "duree": 10},
        {"bloc": "Pentatonique", "duree": 10}, {"bloc": "Notes du manche", "duree": 10},
        {"bloc": "Barrés et rythme", "duree": 15}, {"bloc": "Morceau", "duree": 15},
    ],
    "paliers": [{"num": p["num"], "titre": p["titre"], "but": p["but"], "mission": p["mission"]} for p in PALIERS],
    "cours": cours,
}
root = os.path.join(os.path.dirname(__file__), "..")
os.makedirs(os.path.join(root, "data"), exist_ok=True)
with open(os.path.join(root, "data", "cours.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(cours), "cours")
