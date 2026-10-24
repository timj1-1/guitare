// Les harmoniques naturelles : le doigt effleure la corde pile au-dessus des frettes 5, 7 et 12
export default function Harmoniques() {
  const T = "var(--cds-text-primary)", T2 = "var(--cds-text-secondary)", A = "var(--cds-chart-axis)", G = "var(--cds-chart-grid)", C1 = "var(--cds-chart-categorical-1)", C2 = "var(--cds-chart-categorical-2)";
  const X0 = 96, FW = 50, wire = f => X0 + f * FW, mid = f => wire(f) - FW / 2;
  const S = ["Mi aigu", "Si", "Sol", "Ré", "La", "Mi grave"], y = i => 96 + i * 26;
  const NOM = { 12: ["Mi", "Si", "Sol", "Ré", "La", "Mi"], 7: ["Si", "Fa♯", "Ré", "La", "Mi", "Si"], 5: ["Mi", "Si", "Sol", "Ré", "La", "Mi"] };
  const COUL = { 12: C1, 7: C2, 5: C1 };
  const losange = (x, yy, r) => `M${x} ${yy - r}L${x + r} ${yy}L${x} ${yy + r}L${x - r} ${yy}Z`;
  return (
    <svg viewBox="0 0 720 330" role="img" aria-label="Les harmoniques naturelles aux cases 5, 7 et 12" fontSize="13">
      <text data-claude-text-id="title" x="20" y="20">Les harmoniques naturelles : cases 12, 7 et 5</text>
      <text data-claude-text-id="sub" x="20" y="38">Le doigt gauche effleure la corde pile au-dessus de la frette, sans appuyer. La main droite pince, puis le doigt gauche se lève.</text>
      {S.map((n, i) => <g key={n}><line x1={wire(0)} y1={y(i)} x2={wire(12)} y2={y(i)} stroke={A} strokeWidth={1 + i * 0.3} /><text x={wire(0) - 10} y={y(i) + 4} textAnchor="end" fontSize="11" fill={T2}>{n}</text></g>)}
      {Array.from({ length: 13 }, (_, f) => <line key={f} x1={wire(f)} y1={y(0)} x2={wire(f)} y2={y(5)} stroke={G} strokeWidth={f ? 1.5 : 4} />)}
      {[3, 5, 7, 9].map(f => <circle key={f} cx={mid(f)} cy={(y(2) + y(3)) / 2} r="4" fill={G} />)}
      {[1, 4].map(i => <circle key={i} cx={mid(12)} cy={(y(i - 1) + y(i)) / 2} r="4" fill={G} />)}
      {[3, 5, 7, 9, 12].map(f => <text key={f} x={mid(f)} y={y(5) + 22} textAnchor="middle" fontSize="11" fill={T2}>{f}</text>)}
      {[5, 7, 12].map(f => <g key={f}>
        <text x={wire(f)} y={y(0) - 18} textAnchor="middle" fontSize="12" fontWeight="700" fill={T}>frette {f}</text>
        {NOM[f].map((n, i) => <g key={i}><path d={losange(wire(f), y(i), 12)} fill={COUL[f]} /><text x={wire(f)} y={y(i) + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">{n}</text></g>)}
      </g>)}
      <text x="20" y="290" fontSize="12" fill={T}>Case 12 : la corde à vide, une octave plus haut. Case 5 : deux octaves plus haut, son plus faible.</text>
      <text x="20" y="308" fontSize="12" fill={T}>Case 7 : la note de la case 7, une octave plus haut. Sur le Mi grave, c'est un Si.</text>
      <text x="20" y="326" fontSize="12" fill={T2}>Si ça ne sonne pas : ton doigt est à côté du fil de la frette, ou il appuie trop.</text>
    </svg>
  );
}
