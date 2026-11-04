"""MAJ 01 §4.1 : schéma unique de la pentatonique de La mineur, position 1, avec le nom des cordes,
les cases, des petits ronds et le nom de chaque note dans son rond. Ajoute « penta-1-notes » à data/schemas.json.

Usage (depuis la racine du dépôt) : python3 tools/schemas/penta_notes.py
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
CORDES = ["Mi aigu", "Si", "Sol", "Ré", "La", "Mi grave"]          # en haut : Mi aigu, comme une tablature
NOTES = {  # corde (du haut) -> [(case, note)]
    0: [(5, "La"), (8, "Do")], 1: [(5, "Mi"), (8, "Sol")], 2: [(5, "Do"), (7, "Ré")],
    3: [(5, "Sol"), (7, "La")], 4: [(5, "Ré"), (7, "Mi")], 5: [(5, "La"), (8, "Do")],
}
DOIGT = {5: "index", 6: "majeur", 7: "annulaire", 8: "auriculaire"}

X0, PAS, Y0, DY = 100, 120, 40, 34      # 1re frette (avant la case 5), largeur d'une case, 1re corde, écart
W = X0 + 4 * PAS + 20
H = Y0 + 5 * DY + 92


def svg():
    t = [f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Pentatonique de La mineur, position 1, avec le nom des notes" font-size="13">']
    for i in range(5):  # frettes
        x = X0 + i * PAS
        t.append(f'<line x1="{x}" y1="{Y0}" x2="{x}" y2="{Y0 + 5 * DY}" stroke="var(--cds-chart-grid)" stroke-width="1.5"/>')
    for k, nom in enumerate(CORDES):  # cordes, plus épaisses vers le grave
        y = Y0 + k * DY
        t.append(f'<line x1="{X0}" y1="{y}" x2="{X0 + 4 * PAS}" y2="{y}" stroke="var(--cds-chart-axis)" stroke-width="{1 + k * 0.3:.1f}"/>')
        t.append(f'<text x="{X0 - 10}" y="{y + 4}" text-anchor="end" font-size="12" fill="var(--cds-text-secondary)">{nom}</text>')
    for case in range(5, 9):  # numéros de case et doigts
        x = X0 + (case - 5) * PAS + PAS / 2
        t.append(f'<text x="{x}" y="{Y0 + 5 * DY + 26}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--cds-text-secondary)">case {case}</text>')
        t.append(f'<text x="{x}" y="{Y0 + 5 * DY + 42}" text-anchor="middle" font-size="11" fill="var(--cds-text-secondary)">{DOIGT[case]}</text>')
    for k, notes in NOTES.items():
        y = Y0 + k * DY
        for case, note in notes:
            x = X0 + (case - 5) * PAS + PAS / 2
            plein = note == "La"
            fond = "var(--cds-chart-categorical-1)" if plein else "var(--cds-bg-primary, white)"
            encre = "var(--cds-bg-primary, white)" if plein else "var(--cds-text-primary, currentColor)"
            t.append(f'<circle cx="{x}" cy="{y}" r="14" fill="{fond}" stroke="var(--cds-chart-categorical-1)" stroke-width="1.75"/>')
            t.append(f'<text x="{x}" y="{y + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="{encre}">{note}</text>')
    yl = Y0 + 5 * DY + 72
    t.append(f'<circle cx="20" cy="{yl - 4}" r="8" fill="var(--cds-chart-categorical-1)"/>')
    t.append(f'<text x="34" y="{yl}" font-size="11.5" fill="var(--cds-text-secondary)">La, la note de repos</text>')
    t.append(f'<circle cx="200" cy="{yl - 4}" r="8" fill="var(--cds-bg-primary, white)" stroke="var(--cds-chart-categorical-1)" stroke-width="1.75"/>')
    t.append(f'<text x="214" y="{yl}" font-size="11.5" fill="var(--cds-text-secondary)">les autres notes de la gamme</text>')
    t.append("</svg>")
    return "".join(t)


if __name__ == "__main__":
    p = ROOT / "data/schemas.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    d["penta-1-notes"] = {
        "titre": "Pentatonique de La mineur, position 1, avec le nom des notes",
        "sous": "Chaque rond est une note à jouer, avec son nom dedans. Un doigt par case : index case 5, auriculaire case 8. Mi aigu en haut, comme une tablature.",
        "w": W, "h": H, "svg": svg(), "source": "maj01-penta-notes",
    }
    p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("penta-1-notes ajouté")
