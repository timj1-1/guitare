// Le glissando : deux glissés qui relient la position 1 à la position 2 de la pentatonique de La mineur
export default function Glissando() {
  const X0 = 110, FW = 64, F0 = 3, F1 = 11;
  const wire = f => X0 + (f - F0) * FW, mid = f => wire(f) - FW / 2;
  const S = ["Mi aigu", "Si", "Sol", "Ré", "La", "Mi grave"], y = i => 92 + i * 24;
  const T = "var(--cds-text-primary)", T2 = "var(--cds-text-secondary)", A = "var(--cds-chart-axis)", G = "var(--cds-chart-grid)", C1 = "var(--cds-chart-categorical-1)";
  const slides = [[2, 5, 7, "Do", "Ré"], [1, 8, 10, "Sol", "La"]];
  return (
    <svg viewBox="0 0 720 330" role="img" aria-label="Le glissando entre les positions 1 et 2 de la pentatonique" fontSize="13">
      <defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={C1} /></marker></defs>
      <text data-claude-text-id="title" x="20" y="20">Le glissando : glisser sans relever le doigt</text>
      <text data-claude-text-id="sub" x="20" y="38">La main droite joue seulement la 1re note. Le doigt garde la même pression jusqu'à la case d'arrivée.</text>
      <rect x={wire(4)} y="62" width={FW * 4} height="10" rx="3" fill="var(--cds-chart-reference-tint)" />
      <text x={wire(4) + 6} y="58" fontSize="11" fill={T2}>position 1 (cases 5 à 8)</text>
      <rect x={wire(6)} y="74" width={FW * 4} height="10" rx="3" fill="var(--cds-chart-reference-tint)" />
      <text x={wire(10)} y="58" fontSize="11" fill={T2} textAnchor="end">position 2 (cases 7 à 10)</text>
      {S.map((n, i) => <g key={n}><line x1={wire(F0)} y1={y(i)} x2={wire(F1)} y2={y(i)} stroke={A} strokeWidth={1 + i * 0.3} /><text x={wire(F0) - 10} y={y(i) + 4} textAnchor="end" fontSize="11" fill={T2}>{n}</text></g>)}
      {Array.from({ length: F1 - F0 + 1 }, (_, k) => F0 + k).map(f => <line key={f} x1={wire(f)} y1={y(0)} x2={wire(f)} y2={y(5)} stroke={G} strokeWidth="1.5" />)}
      {[5, 7, 9].map(f => <text key={f} x={mid(f)} y={y(5) + 22} textAnchor="middle" fontSize="11" fill={T2}>{f}</text>)}
      {slides.map(([s, a, b, na, nb]) => <g key={s}>
        <path d={`M${mid(a) + 15} ${y(s)}L${mid(b) - 17} ${y(s)}`} stroke={C1} strokeWidth="3" fill="none" markerEnd="url(#ar)" />
        <circle cx={mid(a)} cy={y(s)} r="12" fill={C1} /><text x={mid(a)} y={y(s) + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{na}</text>
        <circle cx={mid(b)} cy={y(s)} r="12" fill="var(--cds-bg-primary)" stroke={C1} strokeWidth="2.5" /><text x={mid(b)} y={y(s) + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={T}>{nb}</text>
      </g>)}
      <text x="20" y="250" fontSize="13" fontWeight="600" fill={T}>En tablature, le glissando s'écrit avec un trait oblique :</text>
      <line x1="30" y1="272" x2="230" y2="272" stroke={A} /><line x1="30" y1="296" x2="230" y2="296" stroke={A} />
      <text x="20" y="276" fontSize="11" fill={T2} textAnchor="end">Si</text><text x="20" y="300" fontSize="11" fill={T2} textAnchor="end">Sol</text>
      <rect x="122" y="264" width="56" height="16" fill="var(--cds-bg-primary)" /><text x="150" y="276" textAnchor="middle" fontWeight="700" fill={T}>8 ╱ 10</text>
      <rect x="56" y="288" width="48" height="16" fill="var(--cds-bg-primary)" /><text x="80" y="300" textAnchor="middle" fontWeight="700" fill={T}>5 ╱ 7</text>
      <text x="270" y="276" fontSize="12" fill={T2}>Le doigt reste sur sa corde : c'est le « doigt guide »</text>
      <text x="270" y="294" fontSize="12" fill={T2}>qui emmène toute la main dans la position suivante.</text>
      <text x="270" y="312" fontSize="12" fill={T2}>Le pouce glisse avec la main, les yeux visent l'arrivée.</text>
    </svg>
  );
}
