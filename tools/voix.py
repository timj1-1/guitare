"""Enregistre la voix de l'app : chaque phrase lue à voix haute devient voix/<empreinte>.mp3.

L'empreinte = les 16 premiers caractères du SHA-1 du texte exact (espaces normalisés),
comme dans sons.js. Une phrase sans fichier est lue par la voix de l'appareil.

Voix : Kokoro-82M (licence Apache 2.0), voix française ff_siwis, modèle quantifié du paquet npm expo-kokoro.
Préparer une fois (hors du dépôt) :
    npm pack expo-kokoro && tar xzf expo-kokoro-*.tgz        # -> package/build/kokoro-quantized.onnx et voices/ff_siwis.bin
    python3 -m venv venv && venv/bin/pip install kokoro-onnx lameenc
Puis, après chaque build_cours.py :
    venv/bin/python tools/voix.py --modele package/build/kokoro-quantized.onnx --voix package/build/voices/ff_siwis.bin
Options : --verifier (montre la prononciation sans rien enregistrer), --dire "texte" (une seule phrase, dans /tmp).
"""
import argparse, hashlib, json, os, re, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "voix"

norm = lambda t: re.sub(r"\s+", " ", str(t)).strip()
empreinte = lambda t: hashlib.sha1(norm(t).encode("utf-8")).hexdigest()[:16]

# ---------- Les phrases ----------
def phrases_cours():
    d = json.loads((ROOT / "data/cours.json").read_text(encoding="utf-8"))
    out = []
    for c in d["cours"]:
        for b in c["blocs"]:
            for segs in b.get("voix", {}).values():
                out += segs
    return out

FR = ["Do", "Do♯", "Ré", "Ré♯", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "La♯", "Si"]
NATURALS = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"]
OPEN = {6: 40, 5: 45, 4: 50, 3: 55, 2: 59, 1: 64}
NOM_CORDE = {6: "Mi grave", 5: "La", 4: "Ré", 3: "Sol", 2: "Si", 1: "Mi aigu"}
FRETS = 12
corde = lambda s: "la corde de " + NOM_CORDE[s]
nom = lambda s, f: FR[(OPEN[s] + f) % 12]

def bravo(score, total):
    p = score / total
    return "Parfait !" if p == 1 else "Très bien !" if p >= 0.8 else "C'est en train de rentrer." if p >= 0.5 else "On continue, ça va venir."

def phrases_jeux():
    """Les mêmes textes que jeux.js (à garder identiques)."""
    P = []
    S = list(NOM_CORDE)
    for v in ("Trouve", "Joue"):
        P += [f"{v} tous les {n} sur {corde(s)}" for n in NATURALS for s in S]
        P += [f"{v} tous les {n} du manche" for n in NATURALS]
        P += [f"{v} l'octave de ce {n}" for n in NATURALS]
    P += [f"Quelle est cette note, sur {corde(s)} ?" for s in S]
    P += [f"Joue un {n} sur {corde(s)}" for n in NATURALS for s in S]
    P += [f"Joue tous les {n} du manche : commence par {corde(6)}" for n in NATURALS]
    P += [f"Joue tous les {n} du manche : maintenant {corde(s)}" for n in NATURALS for s in S if s != 6]
    P += [f"Oui, {n} !" for n in NATURALS] + [f"Non, c'est un {n}." for n in NATURALS]
    P += [f"Oui ! Corde suivante : {corde(s)}." for s in S if s != 6] + [f"Oui ! Encore {k}." for k in range(1, 21)]
    P += ["Trouvé !", "Parfait, sans erreur !", "Il ne reste que trois choix."]
    P += [f"C'est bien un {n}, mais pas l'octave deux cordes plus loin vers l'aigu." for n in NATURALS]
    P += [f"Ça, c'est un {x}." for x in FR] + [f"J'entends un {x}, pas un {n}." for x in FR for n in NATURALS if x != n]
    P += [f"C'est la note de départ. Joue maintenant son octave, sur {corde(s)}." for s in S]
    P += [f"C'est bien un {n}, mais pas la bonne octave." for n in NATURALS] + [f"C'est bien un {n}, mais pas sur {corde(s)}." for n in NATURALS for s in S]
    for s in S:
        vide = NOM_CORDE[s].replace(" grave", "").replace(" aigu", "")
        P += [f"Repère : à vide, {corde(s)} donne un {vide}. Cette case est la case {f}." for f in range(FRETS + 1)]
        P += [f"Indice : cherche sur {corde(s)}.", f"Indice : sur {corde(s)}, tout près du sillet : case 0 ou 1."]
        P += [f"Indice : sur {corde(s)}, entre la case {f - 1} et la case {min(FRETS, f + 1)}." for f in range(1, FRETS + 1)]
        P += [f"C'était un {nom(s, f)}, case {f} de la corde {NOM_CORDE[s]}." for f in range(FRETS + 1) if nom(s, f) in NATURALS]
        P += [f"Voilà : case {f} sur {corde(s)}." for f in range(FRETS + 1)]
    P += [f"Voilà les {k} qui restaient. Regarde-les bien." for k in range(2, 21)]
    for total in (3, 5, 8, 10):
        P.append(bravo(total, total))
        for score in range(total + 1):
            P.append(f"{bravo(score, total)} {score} bonnes réponses sur {total}.")
            P.append(f"{bravo(score, total)} {score} tours sur {total} sans faute.")
    P += ["On continue, ça va venir.", "C'est en train de rentrer.", "Très bien !"]
    return P

PHRASES_APP = [
    "D'accord, je lis les consignes des jeux.",
]

# ---------- Prononciation ----------
ORD = {"1re": "première", "1er": "premier", "2e": "deuxième", "3e": "troisième", "4e": "quatrième", "5e": "cinquième", "6e": "sixième"}
CHIFFRES = "zéro un deux trois quatre cinq six sept huit neuf".split()
RESPELL = [  # mots que la voix française lirait mal (ou en anglais)
    (r"\bLet It Be\b", "Lètte itte bi"), (r"\bHotel California\b", "Hôtel Kalifornia"),
    (r"\bHit the Road Jack\b", "Hite ze Rôde Djak"), (r"\bGipsy Kings\b", "Djipsi Kinngz"),
    (r"\bGiuliani\b", "Djouliani"), (r"\bSting\b", "Stinng"), (r"\bgolpe\b", "golpé"), (r"\bgolpes\b", "golpés"),
    (r"\b([Rr])asgueado", r"\1asguéado"), (r"\b([Rr])ythm", r"\1itm"), (r"\bblues\b", "blouze"),
    (r"\bBeatles\b", "Bitteulz"), (r"\bEagles\b", "Iguelze"), (r"\bBamboleo\b", "Bambolé-o"), (r"\btri-o-let\b", "tri, o, lè"),
    (r"\bbpm\b", "BPM"), (r"\bDo\b", "Dau"), (r"\bdo\b", "dau"), (r"\bSol7\b", "Sol sept"), (r"\bMi7\b", "Mi sept"), (r"\bLa7\b", "La sept"),
]

def pron(t):
    t = norm(t)
    t = t.replace("(1-2-3, 4-5-6, 7-8)", "(1 2 3, 4 5 6, 7 8)")
    t = re.sub(r"(\w)(♯|#)", r"\1 dièse", t)
    t = re.sub(r"\bSib\b", "Si bémol", t)
    t = re.sub(r"\b(\w+) (dièse|bémol) \(\1 \2\)", r"\1 \2", t)           # « Fa dièse (Fa dièse) »
    t = re.sub(r"\b(\w+) (dièse|bémol) \(\1 \2, ", r"\1 \2 (", t)
    t = re.sub(r" \((#|b)\)", "", t)
    for a, b in RESPELL:
        t = re.sub(a, b, t)
    for a, b in ORD.items():
        t = re.sub(rf"\b{a}\b", b, t)
    t = re.sub(r"\b(\d+) min\b", lambda m: m[1] + (" minute" if m[1] == "1" else " minutes"), t)
    t = re.sub(r"\b\d+(?:-\d+){2,}\b", lambda m: ", ".join(m[0].split("-")), t)  # 1-3-2-4
    t = re.sub(r"\b(\d+)-(\d+)\b", r"\1 à \2", t)                                  # 5-8
    t = re.sub(r"\b([a-z])(?:-([a-z]))+\b", lambda m: ", ".join(m[0].split("-")), t)  # p-i-m-a
    t = t.replace(" + ", " plus ").replace(" = ", ", c'est ").replace("→", ",").replace("…", "...")
    t = re.sub(r"[«»“”\"]", "", t)
    t = re.sub(r"\s*\(\s*", ", ", t)
    t = re.sub(r"\s*\)\s*", ", ", t)
    t = re.sub(r",\s*([.,:;!?])", r"\1", t)
    t = re.sub(r"\s+,", ",", t)
    t = re.sub(r"(^|[.:!?] ),\s*", r"\1", t)
    t = re.sub(r"\s+([.,!?])", r"\1", t)
    t = re.sub(r"\s+", " ", t).strip(" ,")
    return t

# ---------- Synthèse ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--modele"); ap.add_argument("--voix")
    ap.add_argument("--verifier", action="store_true"); ap.add_argument("--dire")
    ap.add_argument("--debit", type=float, default=1.0); ap.add_argument("--kbps", type=int, default=40)
    a = ap.parse_args()

    textes = list(dict.fromkeys(norm(t) for t in phrases_cours() + phrases_jeux() + PHRASES_APP if norm(t)))
    if a.dire: textes = [norm(a.dire)]

    from kokoro_onnx.tokenizer import Tokenizer
    tok = Tokenizer()
    flag = re.compile(r"\((?:en|fr|es|it|de)[^)]*\)")
    def phon(t):
        p = tok.phonemize(pron(t), "fr-fr")
        return p, bool(flag.search(p))

    if a.verifier:
        for t in textes:
            p, bad = phon(t)
            if bad or pron(t) != t: print(("!! " if bad else "   ") + pron(t), "\n     ", p)
        print(len(textes), "phrases")
        return

    import numpy as np, lameenc
    from kokoro_onnx import Kokoro
    vec = np.fromfile(a.voix, dtype=np.float32).reshape(-1, 1, 256)
    npz = Path(tempfile.gettempdir()) / "voix-kokoro.npz"
    np.savez(npz, ff_siwis=vec)
    k = Kokoro(a.modele, str(npz))

    OUT.mkdir(exist_ok=True)
    garder = {empreinte(t) + ".mp3" for t in textes}
    if not a.dire:
        for f in OUT.glob("*.mp3"):
            if f.name not in garder: f.unlink()
    faits = 0
    for i, t in enumerate(textes):
        dest = (Path(tempfile.gettempdir()) / "essai.mp3") if a.dire else OUT / (empreinte(t) + ".mp3")
        if dest.exists() and not a.dire: continue
        p, bad = phon(t)
        p = flag.sub("", p)
        if bad: print("prononciation à vérifier :", t, file=sys.stderr)
        samples, sr = k.create(p, voice=vec, speed=a.debit, lang="fr-fr", is_phonemes=True)
        pcm = np.concatenate([np.zeros(int(sr * 0.04)), samples, np.zeros(int(sr * 0.12))])
        pcm = (np.clip(pcm, -1, 1) * 32767).astype("<i2")
        enc = lameenc.Encoder(); enc.set_bit_rate(a.kbps); enc.set_in_sample_rate(sr); enc.set_channels(1); enc.set_quality(2)
        dest.write_bytes(enc.encode(pcm.tobytes()) + enc.flush())
        faits += 1
        if faits % 25 == 0: print(f"{i + 1}/{len(textes)}", flush=True)
    if not a.dire:
        (OUT / "textes.json").write_text(json.dumps({empreinte(t): t for t in textes}, ensure_ascii=False, indent=0), encoding="utf-8")
    print("fini :", faits, "nouveaux fichiers,", len(textes), "phrases", flush=True)

if __name__ == "__main__":
    main()
