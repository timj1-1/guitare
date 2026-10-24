// Le picado : l'index et le majeur alternent en butée, 2 notes par clic
export default function Picado() {
  const T = "var(--cds-text-primary)", T2 = "var(--cds-text-secondary)", A = "var(--cds-chart-axis)", C1 = "var(--cds-chart-categorical-1)", C2 = "var(--cds-chart-categorical-2)";
  const x = k => 170 + k * 64;
  const doigt = k => (k % 2 ? "m" : "i"), coul = k => (k % 2 ? C2 : C1);
  const ligne = (yy, n) => <g><line x1="150" y1={yy} x2="680" y2={yy} stroke={A} strokeWidth="1.6" /><text x="140" y={yy + 4} textAnchor="end" fontSize="11" fill={T2}>{n}</text></g>;
  const note = (k, yy) => <g key={k + "-" + yy}><circle cx={x(k)} cy={yy} r="13" fill={coul(k)} /><text x={x(k)} y={yy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{doigt(k)}</text></g>;
  const butee = (k, y1, y2) => <path key={"b" + k + y1} d={`M${x(k) + 8} ${y1 + 11}Q${x(k) + 18} ${(y1 + y2) / 2} ${x(k) + 10} ${y2 - 3}`} stroke={coul(k)} strokeWidth="2" fill="none" markerEnd="url(#ar)" />;
  return (
    <svg viewBox="0 0 720 320" role="img" aria-label="Le picado : index et majeur alternés en butée" fontSize="13">
      <defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={A} /></marker></defs>
      <text data-claude-text-id="title" x="20" y="20">Le picado : i et m chacun son tour, en butée</text>
      <text data-claude-text-id="sub" x="20" y="38">Après chaque note, le doigt traverse la corde et se pose sur la corde voisine, côté graves. Petits gestes, la main ne bouge pas.</text>
      <text x="20" y="70" fontSize="13" fontWeight="600" fill={T}>1. Corde de Mi aigu à vide, 2 notes par clic</text>
      {ligne(100, "Mi aigu")}{ligne(140, "Si")}
      {Array.from({ length: 8 }, (_, k) => [note(k, 100), butee(k, 100, 140)])}
      {[0, 2, 4, 6].map(k => <g key={"c" + k}><line x1={x(k) - 14} y1="160" x2={x(k + 1) + 14} y2="160" stroke={A} strokeWidth="1.5" /><text x={(x(k) + x(k + 1)) / 2} y="176" textAnchor="middle" fontSize="11" fill={T2}>clic</text></g>)}
      <text x="20" y="214" fontSize="13" fontWeight="600" fill={T}>2. En changeant de corde, on continue d'alterner</text>
      {ligne(244, "Mi aigu")}{ligne(280, "Si")}
      {[0, 1, 2, 3].map(k => note(k, 280))}{[4, 5, 6, 7].map(k => note(k, 244))}
      <text x="20" y="314" fontSize="12" fill={T2}>Jamais deux fois le même doigt de suite, même quand la corde change. La régularité d'abord, la vitesse ensuite.</text>
    </svg>
  );
}
