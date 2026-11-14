import type { ReactNode } from "react";

/* The staff figures in the department banners (Gregg, 14 Nov 2026). Each person is "one of these mini people", built
   exactly like the home page's crew in red (tools/grand-entrance/make-scene.js): the same body, arms, hands, head, eyes
   and shading, with only their own features changed, read from photos Gregg supplied (skin colours sampled from them).
   The photos are not stored in the site. They stand waist-up in the open doorway of a little gold-and-teal store
   front, after the home page's entrance, all in the black company polo with the real logo (sfb-logo.svg).
     Office (orange banners): one person, hair worn out, centre-parted, gold hoops.
     Marketing (yellow banners): two people side by side ("same concept ... two people on the marketing team"): on the
       left, bald, deep brown skin, large black rectangular glasses, a beard under the chin and a wide smile; on the
       right, long spiral ringlets from dark brown to caramel with a curly fringe, rosy cheeks, freckles, full lips and
       small gold hoops.
   Motion is CSS (.of-* in styles/staff-theme.css): each waves a few times and rests, and blinks; a second person waves
   on their own beat (.of-alt); nothing moves for anyone who asks for reduced motion. */

const SHIRT = "#1F1F25";
const SHIRT_D = "#121216";
const TRIM = "#34343D";

/** One hand, open, palm to the viewer (the crew's hand). */
const Hand = ({ side, skin, sk }: { side: 1 | -1; skin: string; sk: string }) => (
  <>
    <g stroke={skin} strokeWidth="1.2" strokeLinecap="round">
      <path d="M-1.5 3.4L-2 6.2M-.5 3.4L-.7 7M.5 3.4L.7 7M1.5 3.4L2 6.2" />
      <path d={"M" + side * 1.9 + " 1.2L" + side * 3.5 + " 3.6"} />
    </g>
    <ellipse cx="0" cy="2.5" rx="2.3" ry="2.5" fill={skin} />
    <path d="M-1.3 3.4Q0 4.3 1.3 3.4" stroke={sk} strokeWidth=".5" fill="none" />
  </>
);

/** The crew's short sleeve, in the black polo. */
const Sleeve = () => (
  <>
    <path d="M-3 -1.2Q-3.6 3.4 -3.3 5.8L3.3 5.8Q3.6 3.4 3 -1.2Q0 -2.8 -3 -1.2Z" fill={SHIRT} />
    <path d="M-3.3 5.8H3.3" stroke={TRIM} strokeWidth="1" />
  </>
);

type Look = {
  skin: string;
  sk: string; // the skin a shade darker
  /** which arm waves: -1 the viewer's left, 1 the viewer's right */
  wave: 1 | -1;
  /** hair behind the head and shoulders */
  back?: ReactNode;
  /** anything over the polo, under the arms (a necklace) */
  overShirt?: ReactNode;
  /** hair falling in front of the shoulders */
  locks?: ReactNode;
  /** the head's own features, drawn over the face: hair, brows, eyes, nose, mouth, cheeks, glasses */
  face: ReactNode;
  /** earrings or studs, drawn on the ears */
  ears?: ReactNode;
  /** where the logo sits on the chest, and its width (moved when long hair falls in front) */
  logoY?: number;
  logoX?: number;
  logoW?: number;
};

/** One person, waist-up: the crew's neck, black polo, arms (one resting, one waving) and head, with their own look. */
function Person({ x, look, alt }: { x: number; look: Look; alt?: boolean }) {
  const { skin, sk, wave } = look;
  const rest = -wave as 1 | -1;
  return (
    <g transform={"translate(" + x + " 0)"}>
      <g className={"of-body" + (alt ? " of-alt" : "")}>
        {look.back}
        <rect x="-2.5" y="-50.6" width="5" height="4" rx="1.6" fill={sk} />
        <path d="M-11 -25.2Q-12 -36 -10.2 -44.2Q-7.4 -47.6 -3.4 -47.8H3.4Q7.4 -47.6 10.2 -44.2Q12 -36 11 -25.2Z" fill={SHIRT} />
        <path d="M4.6 -47.5Q8.9 -46.4 10.2 -44.2Q12 -36 11 -25.2H7.2Q8.6 -34 7.5 -41Z" fill={SHIRT_D} opacity=".7" />
        <path d="M-3.2 -47.8L0 -44.2L3.2 -47.8Z" fill={sk} />
        <path d="M-3.8 -48.1L0 -46.4L-1.2 -43.4L-4.9 -46.3ZM3.8 -48.1L0 -46.4L1.2 -43.4L4.9 -46.3Z" fill="#2E2E36" />
        <path d="M0 -44.2V-39.6" stroke={TRIM} strokeWidth=".8" />
        <circle cx="0" cy="-42.4" r=".55" fill="#0B0B0D" />
        <circle cx="0" cy="-40.4" r=".55" fill="#0B0B0D" />
        {/* the company logo on the chest, as on the real polo: the cornucopia and the name */}
        <image href="/assets/img/sfb-logo.svg" x={look.logoX ?? -10.1} y={look.logoY ?? -39.7} width={look.logoW ?? 9} height={((look.logoW ?? 9) * 4.1) / 9} preserveAspectRatio="xMidYMid meet" />
        <rect x="-7.2" y="-26.4" width="14.4" height="2" fill="#141418" />
        <rect x="-1.2" y="-26.6" width="2.4" height="2.4" rx=".4" fill="#C9A14A" />
        {look.overShirt}

        {/* the arm at rest */}
        <g transform={"translate(" + rest * 8.8 + " -44.6)"}>
          <g transform={"rotate(" + -rest * 10 + ")"}>
            <path d="M0 5L0 9.5" stroke={skin} strokeWidth="3.6" strokeLinecap="round" />
            <g transform="translate(0 9.5)">
              <g transform={"rotate(" + rest * 8 + ")"}>
                <path d="M0 0L0 8.6" stroke={skin} strokeWidth="3.3" strokeLinecap="round" />
                <g transform="translate(0 8.6)">
                  <Hand side={rest} skin={skin} sk={sk} />
                </g>
              </g>
            </g>
            <Sleeve />
          </g>
        </g>

        {/* the waving arm: shoulder, elbow and wrist each turn, as the crew wave */}
        <g transform={"translate(" + wave * 8.8 + " -44.6)"}>
          <g transform={"rotate(" + -wave * 140 + ")"}>
            <g className="of-sh">
              <path d="M0 5L0 9.5" stroke={skin} strokeWidth="3.6" strokeLinecap="round" />
              <g transform="translate(0 9.5)">
                <g transform={"rotate(" + -wave * 46 + ")"}>
                  <g className="of-el">
                    <path d="M0 0L0 8.6" stroke={skin} strokeWidth="3.3" strokeLinecap="round" />
                    <g transform="translate(0 8.6)">
                      <g className="of-wr">
                        <Hand side={wave} skin={skin} sk={sk} />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
              <Sleeve />
            </g>
          </g>
        </g>

        {look.locks}
        {/* head: ears, the face with its shaded side, then their own features */}
        <g>
          <ellipse cx="-7.2" cy="-55" rx="1.5" ry="2.1" fill={skin} />
          <ellipse cx="7.2" cy="-55" rx="1.5" ry="2.1" fill={sk} />
          {look.ears}
          <ellipse cx="0" cy="-55.4" rx="7.3" ry="7.7" fill={skin} />
          <path d="M3.4 -62.2Q7.8 -59 7.3 -54.4Q6.7 -49.2 2 -47.8Q5.6 -51.4 5.4 -55.4Q5.2 -59.6 3.4 -62.2Z" fill={sk} opacity=".45" />
          {look.face}
        </g>
      </g>
    </g>
  );
}

/** The crew's eyes (they blink). */
const Eyes = ({ lashes }: { lashes?: boolean }) => (
  <g className="of-eyes">
    <ellipse cx="-2.5" cy="-56.4" rx=".95" ry="1.1" fill="#24161A" />
    <ellipse cx="2.5" cy="-56.4" rx=".95" ry="1.1" fill="#24161A" />
    <circle cx="-2.15" cy="-56.8" r=".33" fill="#FFFFFF" />
    <circle cx="2.85" cy="-56.8" r=".33" fill="#FFFFFF" />
    {lashes ? <path d="M-3.4 -57.2L-4 -57.7M-3.1 -57.5L-3.5 -58.1M3.4 -57.2L4 -57.7M3.1 -57.5L3.5 -58.1" stroke="#24161A" strokeWidth=".3" strokeLinecap="round" /> : null}
  </g>
);

/** The little store front behind them, after the home page's entrance: gold and teal glass up top, the cream canopy with
 *  the mark, shop windows either side, sliding doors pushed open, and warm light and stocked shelves inside. It fades
 *  in from the banner on its left. Coordinates are the people's own; the doorway spans doorL to doorR. */
function StoreFront({ id, left, width, doorL, doorR }: { id: string; left: number; width: number; doorL: number; doorR: number }) {
  const right = left + width;
  const panes: number[] = [];
  for (let x = left; x < right; x += 8) panes.push(x);
  const lamps: number[] = [];
  for (let x = left + 6; x < right - 6; x += 15) lamps.push(x);
  const g = (n: string) => id + "-" + n;
  const lw = doorL + 0.1 - left, rw = right - (doorR - 0.1);
  return (
    <>
      <defs>
        <linearGradient id={g("gold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FBEBB4" />
          <stop offset=".35" stopColor="#E9C460" />
          <stop offset=".68" stopColor="#C99A35" />
          <stop offset="1" stopColor="#F1D684" />
        </linearGradient>
        <linearGradient id={g("teal")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C2ECE4" />
          <stop offset=".42" stopColor="#5BBAAE" />
          <stop offset=".75" stopColor="#2F918A" />
          <stop offset="1" stopColor="#7FCFC3" />
        </linearGradient>
        <linearGradient id={g("glass")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6FAFAA" />
          <stop offset=".5" stopColor="#2F6F72" />
          <stop offset="1" stopColor="#4E9692" />
        </linearGradient>
        <radialGradient id={g("warm")} cx=".5" cy=".3" r=".8">
          <stop offset="0" stopColor="#FFF8E4" />
          <stop offset=".7" stopColor="#F7E2AE" />
          <stop offset="1" stopColor="#E9C77E" />
        </radialGradient>
        <pattern id={g("stock")} patternUnits="userSpaceOnUse" x="0" y="0" width="10.5" height="3.4">
          <rect width="10.5" height="3.4" fill="#E8D3A2" />
          <rect x=".3" y=".7" width="1.3" height="2.1" fill="#D3202D" />
          <rect x="1.9" y=".4" width="1.5" height="2.4" fill="#F2C14E" />
          <rect x="3.7" y="1" width="1" height="1.8" fill="#2A8A45" />
          <rect x="5" y=".7" width="1.5" height="2.1" fill="#E3336F" />
          <rect x="6.8" y=".4" width="1.3" height="2.4" fill="#F7F3EA" />
          <rect x="8.4" y="1" width="1" height="1.8" fill="#3A86A8" />
          <rect x="9.6" y=".7" width=".8" height="2.1" fill="#E07B2E" />
        </pattern>
        <linearGradient id={g("fade")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset=".26" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>
        <mask id={g("scene")} maskUnits="userSpaceOnUse" x={left} y="-82" width={width} height="58">
          <rect x={left} y="-82" width={width} height="58" fill={"url(#" + g("fade") + ")"} />
        </mask>
      </defs>
      <g mask={"url(#" + g("scene") + ")"}>
        <rect x={left} y="-82" width={width} height="58" fill="#F3ECDD" />
        {panes.map((x, i) => (
          <rect key={x} x={x} y="-82" width="8" height="7.4" fill={"url(#" + g(i % 3 === 1 ? "teal" : "gold") + ")"} stroke="#F7F3EA" strokeWidth=".8" />
        ))}
        <rect x={left} y="-75" width={width} height="3.2" fill="#F5EFE2" />
        <rect x={left} y="-71.8" width={width} height=".9" fill="#CDBF9F" />
        <image href="/assets/img/sfb-mark.svg" x={(doorL + doorR) / 2 - 1.8} y="-74.9" width="3.6" height="3" />
        <rect x={left} y="-70.9" width={width} height="47" fill={"url(#" + g("warm") + ")"} />
        {lamps.map((x) => (
          <rect key={x} x={x} y="-69.8" width="6" height=".8" rx=".4" fill="#FFFDF2" />
        ))}
        {[-64, -55, -46, -37, -28].map((y) => (
          <g key={y}>
            <rect x={left + 2} y={y} width={width - 4} height="3.4" fill={"url(#" + g("stock") + ")"} />
            <rect x={left + 2} y={y + 3.4} width={width - 4} height=".8" fill="#B8975F" />
          </g>
        ))}
        <rect x={left} y="-70.9" width={lw} height="47" fill={"url(#" + g("glass") + ")"} opacity=".58" />
        <rect x={doorR - 0.1} y="-70.9" width={rw} height="47" fill={"url(#" + g("glass") + ")"} opacity=".58" />
        <g fill="#F7F3EA">
          <rect x={left + lw / 3 - 0.6} y="-70.9" width="1.2" height="47" />
          <rect x={left + (lw * 2) / 3 - 0.6} y="-70.9" width="1.2" height="47" />
          <rect x={doorR + rw / 2 - 0.6} y="-70.9" width="1.2" height="47" />
          <rect x={left} y="-47.4" width={lw} height="1" />
          <rect x={doorR - 0.1} y="-47.4" width={rw} height="1" />
          <rect x={doorL - 0.8} y="-71.2" width="1.6" height="47.2" />
          <rect x={doorR - 0.8} y="-71.2" width="1.6" height="47.2" />
        </g>
        <rect x={doorL - 7.2} y="-70.4" width="6.6" height="46.4" fill={"url(#" + g("teal") + ")"} opacity=".5" />
        <rect x={doorR + 0.6} y="-70.4" width="6.6" height="46.4" fill={"url(#" + g("teal") + ")"} opacity=".5" />
        <rect x={doorL - 2.8} y="-52" width=".9" height="6" rx=".45" fill="#F7F3EA" />
        <rect x={doorR + 1.9} y="-52" width=".9" height="6" rx=".45" fill="#F7F3EA" />
      </g>
    </>
  );
}

/* ---------------- the office: one person ---------------- */

const OFFICE_HAIR = "#1E1714";
const OFFICE: Look = {
  skin: "#C8825F",
  sk: "#A86D50",
  wave: -1,
  // hair worn out: the long fall behind her head and shoulders
  back: <path d="M-8.8 -57.6Q-11.6 -49 -11.2 -40.2Q-9 -38.8 -6.8 -40.4H6.8Q9 -38.8 11.2 -40.2Q11.6 -49 8.8 -57.6Q8.2 -66.2 0 -66.2Q-8.2 -66.2 -8.8 -57.6Z" fill={OFFICE_HAIR} />,
  locks: (
    <>
      <path d="M-7.2 -58.4Q-9.4 -52 -9.2 -45.6Q-9 -41.6 -7.6 -40.4Q-6.4 -40.4 -6 -41.8Q-6.6 -45 -6.4 -48.6Q-6 -53.2 -5.6 -56.2Z" fill={OFFICE_HAIR} />
      <path d="M7.2 -58.4Q9.4 -52 9.2 -45.6Q9 -41.6 7.6 -40.4Q6.4 -40.4 6 -41.8Q6.6 -45 6.4 -48.6Q6 -53.2 5.6 -56.2Z" fill={OFFICE_HAIR} />
    </>
  ),
  ears: (
    <g fill="none" stroke="#E2B547" strokeWidth=".45">
      <circle cx="-7.4" cy="-53" r=".7" />
      <circle cx="7.4" cy="-53" r=".7" />
    </g>
  ),
  face: (
    <>
      <path d="M-7.7 -54.8Q-8.5 -65.2 0 -65Q8.5 -65.2 7.7 -54.8Q7.1 -59.6 4.3 -61.4Q1.6 -62.4 0 -61.3Q-1.6 -62.4 -4.3 -61.4Q-7.1 -59.6 -7.7 -54.8Z" fill={OFFICE_HAIR} />
      <path d="M0 -64.8V-61.6" stroke="#5A4740" strokeWidth=".4" strokeLinecap="round" />
      <path d="M-4.4 -59.3Q-2.7 -60.1 -1.1 -59.5M1.1 -59.5Q2.7 -60.1 4.4 -59.3" stroke={OFFICE_HAIR} strokeWidth="1.05" fill="none" strokeLinecap="round" />
      <Eyes />
      <path d="M-1.1 -54Q0 -53 1.1 -54" stroke="#A86D50" strokeWidth=".8" fill="none" strokeLinecap="round" />
      <path d="M-2.3 -51.6Q0 -50.9 2.3 -51.6Q1.6 -50 0 -49.9Q-1.6 -50 -2.3 -51.6Z" fill="#C9776C" />
      <path d="M-2.6 -51.6Q0 -51.2 2.6 -51.6" stroke="#7A3E36" strokeWidth=".7" fill="none" strokeLinecap="round" />
      <circle cx="-4.4" cy="-53.2" r="1.5" fill="#E5736A" opacity=".22" />
      <circle cx="4.4" cy="-53.2" r="1.5" fill="#E5736A" opacity=".22" />
    </>
  ),
};

export function OfficeFigure() {
  return (
    <svg className="sec-figure" viewBox="-50 -82 92 58" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
      <StoreFront id="of" left={-50} width={92} doorL={-16.6} doorR={16.6} />
      <Person x={0} look={OFFICE} />
    </svg>
  );
}

/* ---------------- marketing: two people side by side ---------------- */

// on the left (second pass, Gregg: "leave him bald", "his skin tone is a match", "his glasses and face shape"): deep
// brown skin sampled from his photo, a bald head with a soft shine, a broad full face and jaw, large black rectangular
// glasses with a heavier top rim, a wide smile showing his teeth, a thin moustache, a short beard under the chin, a stud
const HIM_SKIN = "#80533F", HIM_SK = "#684232", BEARD = "#17100D";
const HIM: Look = {
  skin: HIM_SKIN,
  sk: HIM_SK,
  wave: -1,
  ears: <circle cx="7.5" cy="-53.4" r=".42" fill="#D9D9DE" />,
  face: (
    <>
      {/* the broad, full lower face and jaw */}
      <path d="M-7.25 -56.4Q-7.5 -49.8 -3.9 -47.8Q0 -46.7 3.9 -47.8Q7.5 -49.8 7.25 -56.4Z" fill={HIM_SKIN} />
      <path d="M3.9 -47.8Q7.5 -49.8 7.25 -56.4Q6.2 -51 2.6 -48.1Z" fill={HIM_SK} opacity=".5" />
      {/* a slightly higher forehead, and the bald head's shine */}
      <path d="M-7.2 -57Q-7.5 -65 0 -65.1Q7.5 -65 7.2 -57Z" fill={HIM_SKIN} />
      <path d="M3.6 -64.2Q7.4 -61.6 7.2 -57Q6.4 -60.6 3 -63.2Z" fill={HIM_SK} opacity=".45" />
      <ellipse cx="-1.8" cy="-62.6" rx="2.7" ry="1.1" fill="#FFFFFF" opacity=".16" transform="rotate(-12 -1.8 -62.6)" />
      <path d="M-4.4 -59.4Q-2.7 -60.3 -1.1 -59.7M1.1 -59.7Q2.7 -60.3 4.4 -59.4" stroke="#17100D" strokeWidth="1.05" fill="none" strokeLinecap="round" />
      <Eyes />
      <path d="M-3.4 -55.5Q-2.5 -55 -1.6 -55.5M1.6 -55.5Q2.5 -55 3.4 -55.5" stroke={HIM_SK} strokeWidth=".4" fill="none" strokeLinecap="round" />
      {/* glasses: two wide rectangular lenses, thin black rims with a heavier top, a bridge and the arms to the ears */}
      <g fill="#FFFFFF" fillOpacity=".1" stroke="#0B0A0C" strokeWidth=".5">
        <rect x="-5.3" y="-58.2" width="4.75" height="3.1" rx=".55" />
        <rect x=".55" y="-58.2" width="4.75" height="3.1" rx=".55" />
      </g>
      <path d="M-5.2 -58.1H-.65M.65 -58.1H5.2M-.55 -57.3Q0 -57.7 .55 -57.3M-5.3 -57.7L-7.2 -57.2M5.3 -57.7L7.2 -57.2" stroke="#0B0A0C" strokeWidth=".8" fill="none" strokeLinecap="round" />
      <path d="M-4.6 -57.7L-3.8 -56.9" stroke="#FFFFFF" strokeWidth=".3" opacity=".35" strokeLinecap="round" />
      <path d="M-1.2 -53.7Q0 -52.7 1.2 -53.7" stroke={HIM_SK} strokeWidth=".85" fill="none" strokeLinecap="round" />
      <path d="M-2.5 -52.5Q0 -53.2 2.5 -52.5" stroke={BEARD} strokeWidth=".5" fill="none" strokeLinecap="round" />
      {/* the wide smile with his teeth */}
      <path d="M-3.2 -51.7Q0 -48 3.2 -51.7Q0 -51 -3.2 -51.7Z" fill="#3A1214" />
      <path d="M-2.75 -51.5Q0 -50.9 2.75 -51.5L2.35 -50.65Q0 -50.15 -2.35 -50.65Z" fill="#FFF8EE" />
      <path d="M-1.8 -49.3Q0 -47.6 1.8 -49.3Q1 -48.6 0 -48.5Q-1 -48.6 -1.8 -49.3Z" fill={BEARD} />
      <path d="M-3.6 -48.3Q0 -45.9 3.6 -48.3Q2.6 -46.5 0 -46.3Q-2.6 -46.5 -3.6 -48.3Z" fill={BEARD} opacity=".9" />
    </>
  ),
};

// on the right (second pass, Gregg: "the girl's curly hair be accurate", "no chain", "small gold hoops", "lips
// proportional to her face"): long hair in tight spiral ringlets, dark brown at the roots warming to chestnut and
// caramel at the ends, a side part on her right with a curly fringe falling over the other side of her forehead; light
// warm skin, rosy cheeks, freckles, soft brows, full lips sized to her face, small gold hoops
const HER_SKIN = "#DDA68D", HER_SK = "#BB8B76";
type Pt = [number, number];
/** A curly outline, drawn the way a cartoon draws a head of curls (Gregg's reference, 14 Nov 2026): each short edge
 *  between two points bulges outward into a curl, so the whole mass reads as one head of hair made of curls. Long
 *  edges (where the hair runs off the picture) stay straight. */
const curly = (pts: Pt[], bulge = 0.42) => {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let d = "M" + pts[0][0] + " " + pts[0][1];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len > 6) {
      d += "L" + b[0] + " " + b[1];
      continue;
    }
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    let nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
    if ((mx - cx) * nx + (my - cy) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    d += "Q" + (mx + nx * len * bulge).toFixed(2) + " " + (my + ny * len * bulge).toFixed(2) + " " + b[0] + " " + b[1];
  }
  return d + "Z";
};
/** A corkscrew curl (Gregg's reference, 14 Nov 2026): a strand that loops round and round as it falls, following a curve
 *  from (ax, ay) through (cx, cy) to (bx, by). Drawn twice: dark brown, then a copper highlight a quarter turn on, so each
 *  loop catches the light like a real spiral curl. */
const coil = (ax: number, ay: number, cx: number, cy: number, bx: number, by: number, turns: number, r: number, key: string) => {
  const path = (shift: number) => {
    let d = "";
    const n = Math.ceil(turns * 14);
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      const x = u * u * ax + 2 * u * t * cx + t * t * bx, y = u * u * ay + 2 * u * t * cy + t * t * by;
      let dx = 2 * u * (cx - ax) + 2 * t * (bx - cx), dy = 2 * u * (cy - ay) + 2 * t * (by - cy);
      const m = Math.hypot(dx, dy) || 1;
      dx /= m;
      dy /= m;
      const ang = t * turns * Math.PI * 2 + shift;
      const side = Math.sin(ang) * r, along = Math.cos(ang) * r * 0.75; // along > step, so the strand loops back on itself
      d += (i ? "L" : "M") + (x - dy * side + dx * along).toFixed(2) + " " + (y + dx * side + dy * along).toFixed(2);
    }
    return d;
  };
  return (
    <g key={key}>
      <path d={path(0)} stroke={CURL_LINE} strokeWidth=".45" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
    </g>
  );
};
type Coil = [number, number, number, number, number, number, number, number];
const coils = (list: Coil[], k: string) => list.map(([ax, ay, cx, cy, bx, by, turns, r], i) => coil(ax, ay, cx, cy, bx, by, turns, r, k + i));
const flip = (list: Coil[]): Coil[] => list.map(([ax, ay, cx, cy, bx, by, turns, r]) => [-ax, ay, -cx, cy, -bx, by, turns, r]);
// coils behind her, falling past her shoulders and flaring a little (left side; the right mirrors it)
const BACK_COILS: Coil[] = [
  [-8.4, -62, -11.6, -52, -13.4, -26, 13, 0.8], [-9.6, -59, -12.6, -48, -14, -30, 11, 0.75], [-7.2, -63.6, -10.4, -55, -12, -24, 14, 0.8],
];
// coils falling in front of her shoulders, either side of her face (left side; the right mirrors it)
const FRONT_COILS: Coil[] = [
  [-7.6, -60, -10.6, -50, -12.4, -25, 13, 0.85], [-7.4, -57, -9.4, -46, -10.4, -24, 12, 0.8], [-7, -53, -7.8, -42, -8.2, -26, 10, 0.75], [-8.6, -58.6, -12.2, -46, -13, -32, 10, 0.7],
];
// coils over the top of her head from the side part, following its shape and running into the lengths
// (Gregg: "give her a middle part") the curls run from the centre parting down each side alike
const TOP_LEFT: Coil[] = [
  [-.4, -66.4, -6, -67, -8.2, -58.6, 5, 0.55], [-.5, -65.4, -5.2, -65.6, -7.2, -60.4, 4, 0.5], [-.6, -64.4, -4, -64.2, -6, -61.8, 3, 0.45],
];
const TOP_COILS: Coil[] = [...TOP_LEFT, ...TOP_LEFT.map(([ax, ay, cx, cy, bx, by, t, r]) => [-ax, ay, -cx, cy, -bx, by, t, r] as Coil)];
// a few springy curls framing her forehead either side of the part
const FRINGE_COILS: Coil[] = [
  [-3.4, -63.2, -4.2, -61.4, -4.6, -59.6, 2.2, 0.5], [-5.4, -62, -6, -60.4, -6.2, -58.6, 2, 0.5],
  [3.4, -63.2, 4.2, -61.4, 4.6, -59.6, 2.2, 0.5], [5.4, -62, 6, -60.4, 6.2, -58.6, 2, 0.5],
];
const EDGE = 0.28; // how far each curl bulges along the hair's edge
const HER_GRAD = "#5C3524"; // one tone of brown (Gregg: "just leave her hair one tone of brown")
const CURL_LINE = "#3E2318";
const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y] as Pt).reverse();
// the whole mass behind her, close to her head on top and falling past her shoulders
// (Gregg: hair should not run off the screen) it ends in curls just above the bottom of the banner
const HAIR_BACK: Pt[] = [[-9.6, -28.9], [-11.2, -28.3], [-12.5, -28.8], [-13.1, -31.2], [-12.9, -36], [-12.5, -42], [-12, -48], [-11.2, -53.5], [-10.2, -58], [-8.6, -62], [-6.4, -64.6], [-3.6, -65.9], [-0.6, -66.3], [2.6, -66.1], [5.4, -65], [7.8, -62.8], [9.6, -59.8], [10.8, -55.8], [11.5, -50.8], [12, -45.4], [12.5, -40], [12.9, -34], [13.1, -31.2], [12.5, -28.8], [11.2, -28.3], [9.6, -28.9]];
// the hair falling in front of her shoulders, either side of her face (the right side mirrors the left)
const HAIR_FRONT_L: Pt[] = [[-7.6, -59.8], [-9.3, -58.8], [-10.7, -55.8], [-11.5, -51.8], [-11.9, -47.2], [-12.2, -42.2], [-12.5, -37.2], [-12.8, -32.6], [-12.7, -29.8], [-11.4, -28.4], [-9.7, -28.6], [-8.2, -29.4], [-7.3, -31.2], [-6.9, -33], [-6.7, -38], [-6.6, -43], [-6.7, -48], [-6.9, -52.6], [-7.1, -56.4]];
// the top of her head, alike on both sides of a centre part: close to her scalp, the hairline curling down at the temples
const HAIR_TOP: Pt[] = [[-7.9, -56.8], [-8.2, -60.2], [-7.4, -63.2], [-5.4, -65.4], [-2.8, -66.4], [0, -66.7], [2.8, -66.4], [5.4, -65.4], [7.4, -63.2], [8.2, -60.2], [7.9, -56.8], [6.9, -57.6], [6.2, -59.4], [5.2, -60.8], [3.8, -62], [2, -62.8], [0, -63.1], [-2, -62.8], [-3.8, -62], [-5.2, -60.8], [-6.2, -59.4], [-6.9, -57.6]];


const HER: Look = {
  skin: HER_SKIN,
  sk: HER_SK,
  wave: 1,
  logoY: -38.4,
  logoX: -6.1,
  logoW: 5.8,
  back: (
    <>
      {/* every curl line stays inside the hair's outline, so nothing pokes out */}
      <clipPath id="mk-clip-back">
        <path d={curly(HAIR_BACK, EDGE)} />
      </clipPath>
      <path d={curly(HAIR_BACK, EDGE)} fill={HER_GRAD} stroke={CURL_LINE} strokeWidth=".3" strokeLinejoin="round" />
      <g clipPath="url(#mk-clip-back)">
        {coils(BACK_COILS, "bl")}
        {coils(flip(BACK_COILS), "br")}
      </g>
    </>
  ),
  locks: (
    <>
      <clipPath id="mk-clip-front">
        <path d={curly(HAIR_FRONT_L, EDGE) + curly(mirror(HAIR_FRONT_L), EDGE)} />
      </clipPath>
      <path d={curly(HAIR_FRONT_L, EDGE)} fill={HER_GRAD} stroke={CURL_LINE} strokeWidth=".3" strokeLinejoin="round" />
      <path d={curly(mirror(HAIR_FRONT_L), EDGE)} fill={HER_GRAD} stroke={CURL_LINE} strokeWidth=".3" strokeLinejoin="round" />
      {/* corkscrew curls down the hair in front of her shoulders, kept inside it */}
      <g clipPath="url(#mk-clip-front)">
        {coils(FRONT_COILS, "fl")}
        {coils(flip(FRONT_COILS), "fr")}
      </g>
    </>
  ),
  face: (
    <>
      {/* the top of her hair, from the same curls: a centre part, and curls framing her forehead */}
      <clipPath id="mk-clip-top">
        <path d={curly(HAIR_TOP, 0.4)} />
      </clipPath>
      <path d={curly(HAIR_TOP, 0.4)} fill={HER_GRAD} stroke={CURL_LINE} strokeWidth=".3" strokeLinejoin="round" />
      <g clipPath="url(#mk-clip-top)">
        {coils(TOP_COILS, "t")}
        {coils(FRINGE_COILS, "f")}
      </g>
      <path d="M0 -66.7Q.15 -65 0 -63.1" stroke={CURL_LINE} strokeWidth=".32" fill="none" strokeLinecap="round" />
      {/* small gold hoops, just below the hair */}
      <g fill="none" stroke="#E2B547" strokeWidth=".38">
        <circle cx="-7" cy="-52.6" r=".55" />
        <circle cx="7" cy="-52.6" r=".55" />
      </g>
      <path d="M-4.4 -58.8Q-2.8 -59.8 -1.2 -59.2M1.2 -59.2Q2.8 -59.8 4.4 -58.8" stroke="#7A5442" strokeWidth=".75" fill="none" strokeLinecap="round" />
      <Eyes lashes />
      <path d="M-1 -54Q0 -53.2 1 -54" stroke={HER_SK} strokeWidth=".7" fill="none" strokeLinecap="round" />
      <g fill="#B37660" opacity=".5">
        <circle cx="-3.1" cy="-54.1" r=".13" /><circle cx="-2.3" cy="-53.6" r=".12" /><circle cx="-3.8" cy="-53.4" r=".11" />
        <circle cx="3.1" cy="-54.1" r=".13" /><circle cx="2.3" cy="-53.6" r=".12" /><circle cx="3.8" cy="-53.4" r=".11" />
        <circle cx="-.5" cy="-54.6" r=".1" /><circle cx=".55" cy="-54.55" r=".1" />
      </g>
      {/* full lips, sized to her face */}
      <path d="M-2 -51.85Q-1 -52.5 0 -52.15Q1 -52.5 2 -51.85Q1 -51.66 0 -51.7Q-1 -51.66 -2 -51.85Z" fill="#C66E68" />
      <path d="M-1.85 -51.8Q0 -51.62 1.85 -51.8Q1.4 -50.55 0 -50.45Q-1.4 -50.55 -1.85 -51.8Z" fill="#DD857C" />
      <ellipse cx=".25" cy="-51.05" rx=".7" ry=".2" fill="#F2AAA2" opacity=".7" />
      <circle cx="-4.4" cy="-53.3" r="1.6" fill="#EE8A84" opacity=".3" />
      <circle cx="4.4" cy="-53.3" r="1.6" fill="#EE8A84" opacity=".3" />
    </>
  ),
};

export function MarketingFigure() {
  return (
    <svg className="sec-figure is-pair" viewBox="-46 -82 88 58" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
      <StoreFront id="mk" left={-46} width={88} doorL={-28} doorR={28} />
      <Person x={-13.8} look={HIM} />
      <Person x={13.8} look={HER} alt />
    </svg>
  );
}
