// L'apagado : le son de l'accord est coupé net juste après le coup
export default function Apagado() {
  const T = "var(--cds-text-primary)", T2 = "var(--cds-text-secondary)", A = "var(--cds-chart-axis)", G = "var(--cds-chart-grid)", C1 = "var(--cds-chart-categorical-1)";
  const x0 = 120, x1 = 660, yb = 160, yh = 82, xc = 290;
  const amp = x => yb - (yb - yh) * Math.exp(-(x - x0) / 170);
  let dec = `M${x0} ${yb}L${x0} ${yh}`; for (let x = x0; x <= x1; x += 6) dec += `L${x} ${amp(x).toFixed(1)}`;
  let cut = `M${x0} ${yb}L${x0} ${yh}`; for (let x = x0; x <= xc; x += 6) cut += `L${x} ${amp(x).toFixed(1)}`; cut += `L${xc} ${yb}Z`;
  const tb = k => 150 + k * 120;
  return (
    <svg viewBox="0 0 720 330" role="img" aria-label="L'apagado : arrêter net le son d'un accord" fontSize="13">
      <text data-claude-text-id="title" x="20" y="20">L'apagado : arrêter net le son, juste après l'accord</text>
      <text data-claude-text-id="sub" x="20" y="38">C'est le « tchak » de la rumba et du flamenco : une coupure franche qui donne le groove.</text>
      <line x1={x0} y1={yb} x2={x1} y2={yb} stroke={A} strokeWidth="1.5" />
      <text x={x0 - 10} y={yb + 4} textAnchor="end" fontSize="11" fill={T2}>le son</text>
      <path d={dec} stroke={A} strokeWidth="1.8" strokeDasharray="5 4" fill="none" />
      <path d={cut} fill={C1} fillOpacity="0.85" />
      <line x1={xc} y1={yh - 14} x2={xc} y2={yb + 8} stroke={T} strokeWidth="1.5" />
      <text x={xc + 8} y={yh - 4} fontSize="12" fontWeight="700" fill={T}>apagado</text>
      <text x={x0} y={yb + 22} fontSize="11" fill={T2}>coup</text>
      <text x="470" y="128" fontSize="11" fill={T2}>sans apagado, l'accord résonne</text>
      <text x="20" y="214" fontSize="13" fontWeight="600" fill={T}>L'exercice : La mineur à 70 bpm, un coup puis l'arrêt sur les temps 2 et 4</text>
      {[1, 2, 3, 4].map(k => <g key={k}>
        <rect x={tb(k - 1)} y="228" width="110" height="38" rx="8" fill={k % 2 ? "none" : "var(--cds-chart-reference-tint)"} stroke={G} />
        <text x={tb(k - 1) + 55} y={k % 2 ? 252 : 245} textAnchor="middle" fontSize={k % 2 ? 12 : 12} fontWeight={k % 2 ? 400 : 700} fill={k % 2 ? T2 : T}>{k % 2 ? String(k) : `${k} : coup`}</text>
        {k % 2 ? null : <text x={tb(k - 1) + 55} y="260" textAnchor="middle" fontSize="11" fill={T}>+ arrêt net</text>}
      </g>)}
      <text x="20" y="294" fontSize="12" fill={T}>Main droite : la tranche de la main, côté petit doigt, retombe sur les cordes (plus de force).</text>
      <text x="20" y="312" fontSize="12" fill={T}>Main gauche : relâche l'accord, ou pose l'auriculaire à plat en travers des cordes sans appuyer (plus rapide).</text>
    </svg>
  );
}
