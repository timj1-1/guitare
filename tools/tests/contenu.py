"""Contrôle du contenu des cours (data/cours.json), sans navigateur.

Usage (depuis la racine du dépôt) :
  python3 tools/tests/contenu.py            -> rapport
  python3 tools/tests/contenu.py --photo    -> enregistre la liste des exercices (référence)

Vérifie :
- qu'aucun exercice de la référence n'a disparu de son cours (sinon les cases cochées seraient perdues) ;
- la durée totale de chaque cours (au plus 90 min) ;
- les tournures personnelles à éviter (prénom, « tu connais déjà »…).
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
REF = pathlib.Path(__file__).with_name("exercices-reference.json")
# Fragile et Bamboleo restent les morceaux de référence du cours : ils ne sont pas interdits ici.
INTERDITS = [r"Timoth[ée]e", r"que tu (?:connais|ma[iî]trises) d[ée]j[àa]"]


def cles(data):
    return {c["id"]: sorted(b["id"] + "/" + e["id"] for b in c["blocs"] for e in b["exercices"]) for c in data["cours"]}


def textes(x, chemin=""):
    if isinstance(x, str):
        yield chemin, x
    elif isinstance(x, dict):
        for k, v in x.items():
            yield from textes(v, f"{chemin}.{k}")
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from textes(v, f"{chemin}[{i}]")


def main():
    data = json.loads((ROOT / "data/cours.json").read_text(encoding="utf-8"))
    if "--photo" in sys.argv:
        REF.write_text(json.dumps(cles(data), ensure_ascii=False, indent=0), encoding="utf-8")
        print("Référence enregistrée :", REF)
        return 0
    problemes = 0
    if REF.exists():
        ref = json.loads(REF.read_text(encoding="utf-8"))
        now = cles(data)
        for cid, ks in ref.items():
            manque = sorted(set(ks) - set(now.get(cid, [])))
            if manque:
                problemes += 1
                print(f"[exercices] {cid} : disparus {manque}")
    for c in data["cours"]:
        total = sum(b.get("duree", 0) for b in c["blocs"])
        if total > 90:
            problemes += 1
            print(f"[durée] cours {c['num']} : {total} min")
    vus = {}
    for c in data["cours"]:
        for chemin, t in textes(c):
            for motif in INTERDITS:
                if re.search(motif, t):
                    vus.setdefault(motif, []).append(f"cours {c['num']}{chemin}")
    for motif, ou in vus.items():
        problemes += 1
        print(f"[langage] « {motif} » : {len(ou)} fois, ex. {ou[:3]}")
    print("OK" if not problemes else f"{problemes} point(s) à revoir")
    return 1 if problemes else 0


if __name__ == "__main__":
    sys.exit(main())
