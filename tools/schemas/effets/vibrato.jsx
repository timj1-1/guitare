// Le vibrato classique : le doigt pousse et tire dans l'axe de la corde ; la hauteur de la note ondule
export default function Vibrato() {
  const T = "var(--cds-text-primary)", T2 = "var(--cds-text-secondary)", A = "var(--cds-chart-axis)", G = "var(--cds-chart-grid)", C1 = "var(--cds-chart-categorical-1)", C2 = "var(--cds-chart-categorical-2)";
  const X0 = 170, FW = 90, wire = f => X0 + (f - 5) * FW;
  const yS = 110, x7 = wire(7) - 20;
  const beat = k => 120 + k * 70, yW = 250;
  let wave = `M${beat(0)} ${yW}L${beat(4)} ${yW}`;
  for (let x = beat(4); x <= beat(8); x += 2) wave += `L${x} ${(yW - 9 * Math.sin(((x - beat(4)) / 35) * Math.PI * 2)).toFixed(1)}`;
  return (
    <svg viewBox="0 0 720 320" role="img" aria-label="Le vibrato à la guitare classique" fontSize="13">
      <defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={C1} /></marker>
        <marker id="ag" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill={A} /></marker></defs>
      <text data-claude-text-id="title" x="20" y="20">Le vibrato classique : dans l'axe de la corde</text>
      <text data-claude-text-id="sub" x="20" y="38">Le doigt reste posé, près de la frette, et roule vers la tête puis vers la rosace. Le bras accompagne, le pouce reste léger.</text>
      <line x1={wire(5)} y1={yS} x2={wire(9)} y2={yS} stroke={A} strokeWidth="1.8" />
      {[5, 6, 7, 8, 9].map(f => <line key={f} x1={wire(f)} y1={yS - 26} x2={wire(f)} y2={yS + 26} stroke={G} strokeWidth="2" />)}
      {[6, 7, 8].map(f => <text key={f} x={wire(f) - FW / 2} y={yS + 44} textAnchor="middle" fontSize="11" fill={T2}>case {f}</text>)}
      <text x={wire(5) - 10} y={yS + 4} textAnchor="end" fontSize="11" fill={T2}>corde de Sol</text>
      <circle cx={x7} cy={yS} r="13" fill={C1} /><text x={x7} y={yS + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">2</text>
      <path d={`M${x7 - 62} ${yS - 34}L${x7 + 62} ${yS - 34}`} stroke={C1} strokeWidth="3" markerStart="url(#ar)" markerEnd="url(#ar)" fill="none" />
      <text x={x7 - 70} y={yS - 30} textAnchor="end" fontSize="11" fill={T}>vers la tête</text>
      <text x={x7 + 70} y={yS - 30} fontSize="11" fill={T}>vers la rosace</text>
      <path d={`M${wire(9) + 60} ${yS - 26}L${wire(9) + 60} ${yS + 26}`} stroke={A} strokeWidth="2" markerStart="url(#ag)" markerEnd="url(#ag)" />
      <path d={`M${wire(9) + 48} ${yS - 12}L${wire(9) + 72} ${yS + 12}M${wire(9) + 72} ${yS - 12}L${wire(9) + 48} ${yS + 12}`} stroke="var(--cds-chart-categorical-1)" strokeWidth="2.5" />
      <text x={wire(9) + 60} y={yS + 44} textAnchor="middle" fontSize="11" fill={T2}>pas sur le côté</text>
      <text x={wire(9) + 60} y={yS + 58} textAnchor="middle" fontSize="11" fill={T2}>(guitare électrique)</text>
      <text x="20" y="200" fontSize="13" fontWeight="600" fill={T}>La hauteur de la note, à 60 bpm :</text>
      <path d={wave} stroke={C2} strokeWidth="2.5" fill="none" />
      {Array.from({ length: 9 }, (_, k) => <line key={k} x1={beat(k)} y1={yW + 20} x2={beat(k)} y2={yW + 28} stroke={A} strokeWidth="1.5" />)}
      <text x={(beat(0) + beat(4)) / 2} y={yW + 46} textAnchor="middle" fontSize="11" fill={T2}>4 temps sans vibrato</text>
      <text x={(beat(4) + beat(8)) / 2} y={yW + 46} textAnchor="middle" fontSize="11" fill={T2}>4 temps avec : 2 oscillations par clic</text>
      <text x={beat(0) - 12} y={yW + 27} textAnchor="end" fontSize="11" fill={T2}>clic</text>
    </svg>
  );
}
