// Price seal, after the company's "1 FOR $x · TRY ME" posts. Decorative: the same price must also be present as text
// for screen readers (deal cards add a visually hidden line).

const SCALLOP = (() => {
  const n = 18, rIn = 41, rOut = 53, c = 50, step = (Math.PI * 2) / n;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = i * step - Math.PI / 2, a1 = (i + 1) * step - Math.PI / 2, am = (i + 0.5) * step - Math.PI / 2;
    const p0 = [c + rIn * Math.cos(a0), c + rIn * Math.sin(a0)];
    const p1 = [c + rIn * Math.cos(a1), c + rIn * Math.sin(a1)];
    const q = [c + rOut * Math.cos(am), c + rOut * Math.sin(am)];
    if (i === 0) d += "M" + p0[0].toFixed(2) + " " + p0[1].toFixed(2);
    d += "Q" + q[0].toFixed(2) + " " + q[1].toFixed(2) + " " + p1[0].toFixed(2) + " " + p1[1].toFixed(2);
  }
  return d + "Z";
})();

export function PriceSeal({ price, qty = "1 FOR", tryMe = true }: { price: number | string; qty?: string; tryMe?: boolean }) {
  const amt = Number(price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="seal" aria-hidden="true">
      <svg className="seal-bg" viewBox="0 0 100 100" focusable="false">
        <path d={SCALLOP} fill="#D3202D" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
      <div className="seal-in">
        <span className="seal-qty">{qty}</span>
        <span className="seal-price">${amt}</span>
      </div>
      {tryMe && <span className="seal-try">TRY ME</span>}
    </div>
  );
}
