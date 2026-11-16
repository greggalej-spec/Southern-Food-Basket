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
const Sleeve = ({ fill = SHIRT, trim = TRIM, shirtSleeve }: { fill?: string; trim?: string; shirtSleeve?: boolean }) =>
  shirtSleeve ? (
    // a flutter sleeve: it flares a little and ends in a softly waved hem
    <>
      <path d="M-3.1 -1.3Q-4.5 2.4 -4.4 5.3Q-3.3 6.4 -2.2 5.8Q-1.1 6.6 0 5.9Q1.1 6.6 2.2 5.8Q3.3 6.4 4.4 5.3Q4.5 2.4 3.1 -1.3Q0 -2.9 -3.1 -1.3Z" fill={fill} stroke={trim} strokeWidth=".22" strokeLinejoin="round" />
      <path d="M-1.6 .4Q-2.3 3.2 -2.2 5.6M1.6 .4Q2.3 3.2 2.2 5.6" stroke={trim} strokeWidth=".2" fill="none" strokeLinecap="round" opacity=".8" />
    </>
  ) : (
    <>
      <path d="M-3 -1.2Q-3.6 3.4 -3.3 5.8L3.3 5.8Q3.6 3.4 3 -1.2Q0 -2.8 -3 -1.2Z" fill={fill} />
      <path d="M-3.3 5.8H3.3" stroke={trim} strokeWidth="1" />
    </>
  );

const BLOUSE = "#FBFAF6", BLOUSE_D = "#E2DDD3", BLOUSE_EDGE = "#CFC8BB";

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
  /** a slimmer build: narrower shoulders, a waist, the arms set in to match (2 is slimmer still) */
  slim?: boolean | 2;
  /** a white open-collar blouse instead of the company polo: no logo, buttons or belt */
  blouse?: boolean;
  /** draw the head narrower than the crew's (1 is theirs): an oval face */
  headW?: number;
  /** a suit jacket worn open over a white shirt and tie, with long sleeves to the wrist */
  suit?: { jacket: string; tie: string; flower?: boolean };
};

/** One person, waist-up: the crew's neck, black polo, arms (one resting, one waving) and head, with their own look. */
function Person({ x, look, alt }: { x: number; look: Look; alt?: boolean }) {
  const { skin, sk, wave, slim, blouse, suit } = look;
  const shirt = suit ? suit.jacket : blouse ? BLOUSE : SHIRT, shade = suit ? suit.jacket : blouse ? BLOUSE_D : SHIRT_D, trim = suit ? suit.jacket : blouse ? BLOUSE_EDGE : TRIM;
  const arm = suit ? suit.jacket : skin; // a suit's sleeves run to the wrist
  const rest = -wave as 1 | -1;
  const sx = slim === 2 ? 7.4 : slim ? 8.1 : 8.8; // where the arms join the shoulders
  return (
    <g transform={"translate(" + x + " 0)"}>
      <g className={"of-body" + (alt ? " of-alt" : "")}>
        {look.back}
        <rect x="-2.5" y="-50.6" width="5" height="4" rx="1.6" fill={sk} />
        {slim === 2 ? (
          <>
            <path d="M-8 -25.2Q-7.3 -30.6 -7.6 -35.6Q-8.6 -40.8 -8.6 -44.2Q-6.6 -47.6 -3.3 -47.8H3.3Q6.6 -47.6 8.6 -44.2Q8.6 -40.8 7.6 -35.6Q7.3 -30.6 8 -25.2Z" fill={shirt} />
            <path d="M4.2 -47.5Q7.6 -46.4 8.6 -44.2Q8.6 -40.8 7.6 -35.6Q7.3 -30.6 8 -25.2H5.8Q6.4 -32 6.1 -38Q6.1 -42 4.2 -47.5Z" fill={shade} opacity=".7" />
          </>
        ) : slim ? (
          <>
            <path d="M-9 -25.2Q-8.2 -31 -8.6 -36Q-9.6 -41 -9.4 -44.2Q-7 -47.6 -3.4 -47.8H3.4Q7 -47.6 9.4 -44.2Q9.6 -41 8.6 -36Q8.2 -31 9 -25.2Z" fill={shirt} />
            <path d="M4.4 -47.5Q8.2 -46.4 9.4 -44.2Q9.6 -41 8.6 -36Q8.2 -31 9 -25.2H6.4Q7.2 -32 6.9 -38Q6.9 -42 4.4 -47.5Z" fill={shade} opacity=".7" />
          </>
        ) : (
          <>
            <path d="M-11 -25.2Q-12 -36 -10.2 -44.2Q-7.4 -47.6 -3.4 -47.8H3.4Q7.4 -47.6 10.2 -44.2Q12 -36 11 -25.2Z" fill={shirt} />
            <path d="M4.6 -47.5Q8.9 -46.4 10.2 -44.2Q12 -36 11 -25.2H7.2Q8.6 -34 7.5 -41Z" fill={shade} opacity=".7" />
          </>
        )}
        {suit ? (
          <>
            {/* the jacket's padded shoulders: a firm line from the collar out to the top of each sleeve, squared off
                where the sleeve meets it, so the jacket and both sleeves read as one piece */}
            <path d={"M-3.6 -47.9Q" + -(sx + 1.2) + " -47.7 " + -(sx + 1.9) + " -45.6Q" + -(sx + 2.2) + " -44 " + -(sx + 1.6) + " -42.4L" + -(sx - 1.2) + " -40.8L-5 -44ZM3.6 -47.9Q" + (sx + 1.2) + " -47.7 " + (sx + 1.9) + " -45.6Q" + (sx + 2.2) + " -44 " + (sx + 1.6) + " -42.4L" + (sx - 1.2) + " -40.8L5 -44Z"} fill={shirt} />
            {/* the jacket over a white shirt: its collar points, the tie and the lapels */}
            <path d="M-4.2 -47.8L0 -33.8L4.2 -47.8Z" fill="#F3F0EB" />
            <path d="M-3 -47.9L0 -46L3 -47.9Z" fill={sk} />
            <path d="M-3.3 -48.1L-.1 -45.6L-1.7 -44.3L-3.9 -46.4Z" fill="#FBFAF7" stroke="#CFCAC2" strokeWidth=".22" strokeLinejoin="round" />
            <path d="M3.3 -48.1L.1 -45.6L1.7 -44.3L3.9 -46.4Z" fill="#FBFAF7" stroke="#CFCAC2" strokeWidth=".22" strokeLinejoin="round" />
            <path d="M-.85 -45.7H.85L.55 -44.2H-.55Z" fill={suit.tie} />
            <path d="M-.55 -44.2L-1.15 -36.6L0 -35.2L1.15 -36.6L.55 -44.2Z" fill={suit.tie} />
            <path d="M.2 -44L.6 -37" stroke="#FFFFFF" strokeWidth=".25" opacity=".22" strokeLinecap="round" />
            <path d="M-4.2 -47.8L-6 -45.4L-4.4 -44.6L0 -33.8L4.4 -44.6L6 -45.4L4.2 -47.8" stroke="#34323C" strokeWidth=".32" fill="none" strokeLinejoin="round" />
            <circle cx="0" cy="-32.4" r=".5" fill="#121116" stroke="#3A3842" strokeWidth=".18" />
            {suit.flower ? (
              <g transform="translate(5.6 -42.4)">
                <path d="M-.3 .6L-1.1 1.8M.3 .6L1 1.6" stroke="#4E7E4A" strokeWidth=".35" strokeLinecap="round" />
                <circle cx="-.55" cy="-.2" r=".65" fill="#FAF8F2" stroke="#D3CEC4" strokeWidth=".14" />
                <circle cx=".55" cy="-.2" r=".65" fill="#FAF8F2" stroke="#D3CEC4" strokeWidth=".14" />
                <circle cx="0" cy="-.75" r=".65" fill="#FAF8F2" stroke="#D3CEC4" strokeWidth=".14" />
                <circle cx="0" cy=".3" r=".65" fill="#FAF8F2" stroke="#D3CEC4" strokeWidth=".14" />
                <circle cx="0" cy="-.2" r=".35" fill="#EDE6D6" />
              </g>
            ) : null}
            <path d="M-6 -29.8H-3.4M3.4 -29.8H6" stroke="#34323C" strokeWidth=".3" strokeLinecap="round" />
          </>
        ) : blouse ? (
          <>
            {/* a wrap blouse: the right side crosses over the left in a soft diagonal, with a few drape folds
                gathering toward the waist, and a slim gold belt */}
            <path d="M-3.3 -47.8L0 -40.4L3.3 -47.8Z" fill={skin} />
            <path d="M-3.3 -47.8L-.4 -41.2" stroke={BLOUSE_EDGE} strokeWidth=".3" strokeLinecap="round" />
            <path d="M3.4 -47.9Q1.6 -43.6 -.8 -39.8Q-3.6 -35.6 -6.4 -32.6" stroke={BLOUSE_D} strokeWidth=".9" fill="none" strokeLinecap="round" opacity=".55" />
            <path d="M3.3 -47.8Q1.4 -43.4 -1 -39.6Q-3.8 -35.4 -6.6 -32.4" stroke={BLOUSE_EDGE} strokeWidth=".32" fill="none" strokeLinecap="round" />
            <path d="M4.6 -41.6Q1.6 -37.4 -3.2 -33M5.8 -38.6Q3 -35.2 -.6 -32.6M-5.4 -40.8Q-5.2 -37 -4.8 -34.4" stroke={BLOUSE_D} strokeWidth=".3" fill="none" strokeLinecap="round" />
            {/* tucked into tan high-waisted trousers: a front crease, a slant pocket each side, the right side in shade */}
            <path d="M-7.5 -32Q-7.7 -28.4 -8.4 -24H8.4Q7.7 -28.4 7.5 -32Q0 -31.4 -7.5 -32Z" fill="#C9A47A" />
            <path d="M4.6 -31.7Q6.2 -28 6.2 -24H8.4Q7.7 -28.4 7.5 -32Q6 -31.8 4.6 -31.7Z" fill="#A9845C" opacity=".6" />
            <path d="M-3.6 -30.6V-24M3.6 -30.6V-24" stroke="#B08A60" strokeWidth=".28" />
            <path d="M-6.9 -30.6Q-5.8 -29.4 -5.4 -27.4M6.9 -30.6Q5.8 -29.4 5.4 -27.4" stroke="#A47E55" strokeWidth=".28" fill="none" strokeLinecap="round" />
            <path d="M0 -30.6V-27.2" stroke="#A47E55" strokeWidth=".25" />
            {/* the blouse puffs softly over the waistband */}
            <path d="M-7.6 -33.4Q-5.6 -32.2 -3.6 -33.1Q-1.8 -32.3 0 -33Q1.8 -32.3 3.6 -33.1Q5.6 -32.2 7.6 -33.4" stroke={BLOUSE_D} strokeWidth=".3" fill="none" strokeLinecap="round" />
            {/* a cognac leather belt with a gold buckle */}
            <path d="M-7.55 -33.2Q0 -32.5 7.55 -33.2L7.5 -31.8Q0 -31.1 -7.5 -31.8Z" fill="#7A4626" />
            <path d="M-7.55 -33.2Q0 -32.5 7.55 -33.2" stroke="#9A6038" strokeWidth=".2" fill="none" />
            <rect x="3.6" y="-33" width=".6" height="1.6" rx=".15" fill="#6A3B1F" />
            <rect x="-1.05" y="-33.35" width="2.1" height="2" rx=".4" fill="none" stroke="#E2C27A" strokeWidth=".42" />
            <path d="M0 -33V-31.7" stroke="#E2C27A" strokeWidth=".28" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M-3.2 -47.8L0 -44.2L3.2 -47.8Z" fill={sk} />
            <path d="M-3.8 -48.1L0 -46.4L-1.2 -43.4L-4.9 -46.3ZM3.8 -48.1L0 -46.4L1.2 -43.4L4.9 -46.3Z" fill="#2E2E36" />
            <path d="M0 -44.2V-39.6" stroke={TRIM} strokeWidth=".8" />
            <circle cx="0" cy="-42.4" r=".55" fill="#0B0B0D" />
            <circle cx="0" cy="-40.4" r=".55" fill="#0B0B0D" />
            {/* the company logo on the chest, as on the real polo: the cornucopia and the name */}
            <image href="/assets/img/sfb-logo.svg" x={look.logoX ?? -10.1} y={look.logoY ?? -39.7} width={look.logoW ?? 9} height={((look.logoW ?? 9) * 4.1) / 9} preserveAspectRatio="xMidYMid meet" />
            <rect x="-7.2" y="-26.4" width="14.4" height="2" fill="#141418" />
            <rect x="-1.2" y="-26.6" width="2.4" height="2.4" rx=".4" fill="#C9A14A" />
          </>
        )}
        {look.overShirt}

        {/* the arm at rest */}
        <g transform={"translate(" + rest * sx + " -44.6)"}>
          <g transform={"rotate(" + -rest * 10 + ")"}>
            <path d={suit ? "M0 0L0 9.5" : "M0 5L0 9.5"} stroke={arm} strokeWidth={suit ? 3.9 : 3.6} strokeLinecap="round" />
            <g transform="translate(0 9.5)">
              <g transform={"rotate(" + rest * 8 + ")"}>
                <path d={suit ? "M0 0L0 7.4" : "M0 0L0 8.6"} stroke={arm} strokeWidth="3.3" strokeLinecap="round" />
                {suit ? <path d="M0 7.2L0 8.6" stroke="#F3F0EB" strokeWidth="3" /> : null}
                <g transform="translate(0 8.6)">
                  <Hand side={rest} skin={skin} sk={sk} />
                </g>
              </g>
            </g>
            {suit ? null : <Sleeve fill={shirt} trim={trim} shirtSleeve={blouse} />}
          </g>
        </g>

        {/* the waving arm: shoulder, elbow and wrist each turn, as the crew wave */}
        <g transform={"translate(" + wave * sx + " -44.6)"}>
          <g transform={"rotate(" + -wave * 140 + ")"}>
            <g className="of-sh">
              <path d={suit ? "M0 0L0 9.5" : "M0 5L0 9.5"} stroke={arm} strokeWidth={suit ? 3.9 : 3.6} strokeLinecap="round" />
              <g transform="translate(0 9.5)">
                <g transform={"rotate(" + -wave * 46 + ")"}>
                  <g className="of-el">
                    <path d={suit ? "M0 0L0 7.4" : "M0 0L0 8.6"} stroke={arm} strokeWidth="3.3" strokeLinecap="round" />
                    {suit ? <path d="M0 7.2L0 8.6" stroke="#F3F0EB" strokeWidth="3" /> : null}
                    <g transform="translate(0 8.6)">
                      <g className="of-wr">
                        <Hand side={wave} skin={skin} sk={sk} />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
              {suit ? null : <Sleeve fill={shirt} trim={trim} shirtSleeve={blouse} />}
            </g>
          </g>
        </g>

        {suit ? (
          <>
            <path d="M-4.2 -47.8L-6 -45.4L-4.4 -44.6L0 -33.8L4.4 -44.6L6 -45.4L4.2 -47.8" stroke="#34323C" strokeWidth=".32" fill="none" strokeLinejoin="round" />
          </>
        ) : null}
        {look.locks}
        {/* head: ears, the face with its shaded side, then their own features */}
        <g transform={look.headW ? "translate(0 -55.4) scale(" + look.headW + " 1) translate(0 55.4)" : undefined}>
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

/* ---------------- the Managing Director: Mellisa ---------------- */

// From a photo Gregg supplied (16 Nov 2026: "make her look really pretty ... a white shirt and look slim, she doesn't
// need to be in uniform"): fair warm skin sampled from the photo, long straight hair parted in the centre, near-black at
// the roots and warming to auburn at the ends, falling over both shoulders; softly arched brows, winged liner, a mauve-pink
// lip, small stud earrings and a fine chain at the neck; a white open-collar blouse on the slimmest build.
const MEL_SKIN = "#E4B79B", MEL_SK = "#C99476";
const MEL_ROOT = "#24160F", MEL_END = "#7A3E24", MEL_LIGHT = "#A2603A";
const MEL_HAIR = "url(#md-hair)";

const MelEyes = () => (
  <g className="of-eyes">
    <ellipse cx="-2.5" cy="-56.3" rx="1" ry="1.05" fill="#24161A" />
    <ellipse cx="2.5" cy="-56.3" rx="1" ry="1.05" fill="#24161A" />
    <circle cx="-2.15" cy="-56.7" r=".33" fill="#FFFFFF" />
    <circle cx="2.85" cy="-56.7" r=".33" fill="#FFFFFF" />
    {/* a fine lash line along the upper lid with a small flick at the outer corner */}
    <path d="M-1.5 -56.9Q-2.5 -57.65 -3.5 -56.95Q-3.75 -57.1 -3.95 -57.35M1.5 -56.9Q2.5 -57.65 3.5 -56.95Q3.75 -57.1 3.95 -57.35" stroke="#140C0E" strokeWidth=".3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

const MELLISA: Look = {
  skin: MEL_SKIN,
  sk: MEL_SK,
  wave: -1,
  slim: 2,
  blouse: true,
  headW: 0.88,
  // the long fall of hair behind her head and shoulders, down to her chest
  back: <path d="M-8.7 -57.4Q-10.6 -48.6 -10.7 -39.4Q-10.6 -34.8 -9.2 -33.2Q-6.6 -32.6 -6.2 -35H6.2Q6.6 -32.6 9.2 -33.2Q10.6 -34.8 10.7 -39.4Q10.6 -48.6 8.7 -57.4Q8.1 -66.6 0 -66.6Q-8.1 -66.6 -8.7 -57.4Z" fill={MEL_HAIR} />,
  // a fine chain resting in the open neck
  overShirt: (
    <>
      <path d="M-3 -47.4Q0 -43.4 3 -47.4" stroke="#E6E8EC" strokeWidth=".32" fill="none" />
      <path d="M0 -44.4L.45 -43.75L0 -43.1L-.45 -43.75Z" fill="#F2F3F6" stroke="#BFC4CC" strokeWidth=".14" />
    </>
  ),
  // the hair falling in front of both shoulders, with a few lighter strands
  locks: (
    <>
      <path d="M-7.3 -59.2Q-9.7 -52.4 -9.7 -45.4Q-9.8 -39.4 -8.9 -35Q-7.9 -33.2 -6.7 -34.6Q-6 -38.4 -6 -42.8Q-6 -48 -5.6 -52.6Q-5.4 -56.2 -5.9 -58.2Z" fill={MEL_HAIR} />
      <path d="M7.3 -59.2Q9.7 -52.4 9.7 -45.4Q9.8 -39.4 8.9 -35Q7.9 -33.2 6.7 -34.6Q6 -38.4 6 -42.8Q6 -48 5.6 -52.6Q5.4 -56.2 5.9 -58.2Z" fill={MEL_HAIR} />
      <path d="M-7.6 -54Q-8.4 -46 -7.8 -37.6M7.6 -54Q8.4 -46 7.8 -37.6" stroke={MEL_LIGHT} strokeWidth=".35" fill="none" strokeLinecap="round" opacity=".7" />
    </>
  ),
  ears: (
    <g fill="#F4F3EE" stroke="#BFC4CC" strokeWidth=".18">
      <circle cx="-7.45" cy="-53.5" r=".3" />
      <circle cx="7.45" cy="-53.5" r=".3" />
    </g>
  ),
  face: (
    <>
      {/* centre part: the hair sweeps down either side of her forehead */}
      <path d="M-7.8 -54.2Q-8.9 -65.6 0 -65.6Q8.9 -65.6 7.8 -54.2Q7.3 -59.6 4.6 -61.5Q2.2 -62.6 0.3 -61.6Q0 -62.4 -0.3 -61.6Q-2.2 -62.6 -4.6 -61.5Q-7.3 -59.6 -7.8 -54.2Z" fill={MEL_HAIR} />
      <path d="M0 -65.4V-62" stroke="#C2917A" strokeWidth=".4" strokeLinecap="round" />
      <path d="M-1.6 -64.6Q-5 -63.6 -6.6 -59.4M1.6 -64.6Q5 -63.6 6.6 -59.4" stroke="#4A2A1C" strokeWidth=".3" fill="none" strokeLinecap="round" opacity=".7" />
      {/* softly arched brows */}
      <path d="M-4.5 -58.9Q-3.4 -60.3 -1.3 -59.6M1.3 -59.6Q3.4 -60.3 4.5 -58.9" stroke="#3A2620" strokeWidth=".8" fill="none" strokeLinecap="round" />
      <MelEyes />
      <path d="M-.9 -53.8Q0 -53.1 .9 -53.8" stroke={MEL_SK} strokeWidth=".7" fill="none" strokeLinecap="round" />
      {/* mauve-pink lips, closed in a soft smile */}
      <path d="M-2.2 -51.3Q-1 -52 0 -51.5Q1 -52 2.2 -51.3Q1.2 -50.9 0 -50.9Q-1.2 -50.9 -2.2 -51.3Z" fill="#AE5470" />
      <path d="M-2.1 -51.2Q0 -50.8 2.1 -51.2Q1.4 -49.7 0 -49.6Q-1.4 -49.7 -2.1 -51.2Z" fill="#C26A82" />
      <path d="M-2.3 -51.25Q0 -50.9 2.3 -51.25" stroke="#7C3149" strokeWidth=".32" fill="none" strokeLinecap="round" />
      <path d="M-.7 -50.3Q0 -50.1 .7 -50.3" stroke="#E7A7B6" strokeWidth=".25" fill="none" strokeLinecap="round" opacity=".8" />
      <circle cx="-4.5" cy="-53.4" r="1.4" fill="#E8828A" opacity=".15" />
      <circle cx="4.5" cy="-53.4" r="1.4" fill="#E8828A" opacity=".15" />
    </>
  ),
};

// Jameel Mohammed, her brother and the other Managing Director (Gregg, 16 Nov 2026, from his photo; second pass: lighter skin, no flower,
// slimmer, hair and beard redone, hair then set snug on his head): warm light-brown skin, dark hair swept back, a short
// beard along the jaw with clear cheeks, strong brows and a big smile; a black suit buttoned once, white shirt, red tie.
const BRO_SKIN = "#CC9375", BRO_SK = "#AF785C", BRO_HAIR = "#2A1D17", BRO_BEARD = "#2E2019";
const BROTHER: Look = {
  skin: BRO_SKIN,
  sk: BRO_SK,
  wave: 1,
  slim: true,
  suit: { jacket: "#1D1B21", tie: "#B0212C" },
  face: (
    <>
      {/* hair sitting snug on his head: some height on top, close at the sides and running down into his sideburns,
          the temples set slightly back, the strands swept back */}
      <path d="M-7.45 -55.3Q-8 -58 -8.1 -60.6Q-8.4 -65 -5.2 -66.9Q-2.4 -68.2 .6 -68Q4.6 -67.8 7 -65.8Q8.4 -63.8 8.1 -60.6Q8 -58 7.45 -55.3L6.6 -55.5Q6.7 -57.6 6.5 -59Q6 -60.6 4.6 -61Q2.4 -61.8 0 -61.6Q-2.4 -61.8 -4.6 -61Q-6 -60.6 -6.5 -59Q-6.7 -57.6 -6.6 -55.5Z" fill={BRO_HAIR} />
      <path d="M-4.4 -63.4Q-1.6 -66.4 2.4 -66.8M-6.4 -61.6Q-3.8 -64.6 .4 -65.2M2.6 -64.4Q5.4 -64.6 7 -62.6" stroke="#45332A" strokeWidth=".32" fill="none" strokeLinecap="round" opacity=".75" />
      {/* a beard kept short along the jaw and chin, the cheeks clear above it, and a thin moustache */}
      <path d="M-7.3 -55.4Q-7.3 -50.2 -4.6 -47.5Q-2.4 -46.3 0 -46.3Q2.4 -46.3 4.6 -47.5Q7.3 -50.2 7.3 -55.4Q6.8 -53.6 5.9 -51.9Q4.8 -50.4 3.4 -50.1Q1.8 -49.8 0 -49.8Q-1.8 -49.8 -3.4 -50.1Q-4.8 -50.4 -5.9 -51.9Q-6.8 -53.6 -7.3 -55.4Z" fill={BRO_BEARD} />
      <path d="M-2.9 -52.6Q0 -53.2 2.9 -52.6" stroke={BRO_BEARD} strokeWidth=".6" fill="none" strokeLinecap="round" />
      <path d="M-3.1 -52.4Q-3.6 -51.4 -3.3 -50.6M3.1 -52.4Q3.6 -51.4 3.3 -50.6" stroke={BRO_BEARD} strokeWidth=".5" fill="none" strokeLinecap="round" />
      <path d="M-4.5 -59.3Q-2.8 -60.4 -1.1 -59.7M1.1 -59.7Q2.8 -60.4 4.5 -59.3" stroke={BRO_HAIR} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <Eyes />
      <path d="M-1.2 -54Q0 -53.1 1.2 -54" stroke={BRO_SK} strokeWidth=".85" fill="none" strokeLinecap="round" />
      {/* a big smile with his teeth */}
      <path d="M-3 -51.9Q0 -48.3 3 -51.9Q0 -51.2 -3 -51.9Z" fill="#3A1214" />
      <path d="M-2.6 -51.7Q0 -51.1 2.6 -51.7L2.2 -50.9Q0 -50.4 -2.2 -50.9Z" fill="#FFF8EE" />
    </>
  ),
};

export function DirectorFigure() {
  return (
    <svg className="sec-figure is-pair" viewBox="-46 -82 88 58" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="md-hair" gradientUnits="userSpaceOnUse" x1="0" y1="-66" x2="0" y2="-33">
          <stop offset="0" stopColor={MEL_ROOT} />
          <stop offset=".45" stopColor="#3A2016" />
          <stop offset="1" stopColor={MEL_END} />
        </linearGradient>
      </defs>
      <StoreFront id="md" left={-46} width={88} doorL={-28} doorR={28} />
      <Person x={-13.8} look={MELLISA} />
      <Person x={13.8} look={BROTHER} alt />
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
const coil = (ax: number, ay: number, cx: number, cy: number, bx: number, by: number, turns: number, r: number, key: string, line = CURL_LINE) => {
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
      <path d={path(0)} stroke={line} strokeWidth=".45" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
    </g>
  );
};
type Coil = [number, number, number, number, number, number, number, number];
const coils = (list: Coil[], k: string, line?: string) => list.map(([ax, ay, cx, cy, bx, by, turns, r], i) => coil(ax, ay, cx, cy, bx, by, turns, r, k + i, line));
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
  slim: 2,
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

/* ---------------- HR: Faith ---------------- */

// (Gregg, 14 Nov 2026: "This is Faith, she is for the HR console, she wants a side part with short curly hair ... the same
// way you did the others, black shirt with logo and background"): warm brown skin sampled from her photo, a round full
// face with a big forehead, dark curly hair a little past her shoulders with a side part, big black frames lifting a
// little at the outer corners with silver at the hinges, arched brows, full lips, small gold hoops
const FAITH_SKIN = "#AE6F50", FAITH_SK = "#8E5A40";
const FAITH_HAIR = "#33241E", FAITH_LINE = "#170E0B";
// (second pass, Gregg: "make her forehead bigger and match her head shape, and her hair reaches a little past her
// shoulders") her head is taller with the hairline set well back, and the curls fall a little past her shoulders
// the hair behind her head and shoulders
const FAITH_BACK: Pt[] = [[-7, -46], [-9.6, -43.8], [-10.9, -44.8], [-11.4, -48], [-11.3, -52.6], [-10.9, -57], [-10.1, -61], [-8.5, -64.6], [-6.1, -67.3], [-3, -68.5], [0.6, -68.7], [4, -68.3], [6.8, -66.7], [9, -64.3], [10.4, -60.9], [11.3, -56.8], [11.8, -52.2], [11.9, -47.6], [11.5, -44.4], [9.8, -43.6], [7.4, -46]];
const FAITH_TOP: Pt[] = [[-7.6, -57.6], [-9.18, -60.6], [-8.5, -65.2], [-5.8, -68.4], [-3.7, -69.5], [-3.05, -68.9], [-2.4, -69.65], [0.4, -69.8], [3.8, -69.2], [6.4, -66.9], [8.96, -64.1], [9.63, -60.8], [9.3, -57.2], [7.3, -58.4], [6.8, -61.6], [5.6, -63.3], [3.8, -64.7], [1.6, -65.3], [-1, -65.5], [-3, -65.3], [-4.8, -64.7], [-6.2, -63.3], [-7, -61.6], [-7.3, -59.2]];
// curls framing either side of her face and falling over her shoulders (the side away from the part a little fuller)
const FAITH_SIDE_L: Pt[] = [[-7.2, -61], [-9.86, -59.4], [-11.2, -56.4], [-11.76, -52.8], [-11.87, -49], [-11.65, -45.6], [-10.53, -43.4], [-8.96, -43.6], [-7.4, -45.8], [-7.1, -49.4], [-6.9, -53], [-7, -57]];
const FAITH_SIDE_R: Pt[] = [[7.2, -61.4], [10.08, -59.8], [11.65, -56.8], [12.32, -53], [12.54, -49], [12.32, -45.4], [11.2, -43], [9.41, -43.2], [7.6, -45.6], [7.2, -49.4], [7, -53], [7.1, -57.2]];
const FAITH_TOP_COILS: Coil[] = [
  [-3, -69.6, -6.8, -69.4, -9.18, -60, 4, 0.54],
  [-3.2, -68.4, -6, -68.0, -7.2, -61.4, 3, 0.49],
  [-2.8, -69.8, 4.6, -70.6, 9.52, -59.6, 5, 0.59],
  [-2.6, -68.6, 3.6, -69.0, 7.4, -60.8, 4, 0.54],
  [-2.4, -66.7, 2.2, -66.5, 6, -61.8, 3, 0.49],
];
const FAITH_SIDE_COILS: Coil[] = [
  [-9.18, -60, -11.65, -52, -10.98, -43.8, 7, 0.81],
  [-7.4, -57.6, -9.18, -50.4, -8.85, -44, 6, 0.7],
  [9.41, -60.2, 12.1, -52, 11.65, -43.6, 7, 0.86],
  [7.6, -57.8, 9.86, -50.4, 9.41, -43.6, 6, 0.76],
  [10.75, -58.4, 12.77, -51, 12.32, -44.6, 6, 0.65],
];
const FAITH: Look = {
  skin: FAITH_SKIN,
  sk: FAITH_SK,
  wave: -1,
  slim: 2,
  logoX: -6.9,
  logoW: 6.3,
  back: (
    <>
      {/* tucked inside the curls that frame her face, with no outline, so nothing pokes out past them */}
      <path d={curly(FAITH_BACK, 0.15)} fill={FAITH_HAIR} />
    </>
  ),
  locks: (
    <>
      <clipPath id="hr-clip-side">
        <path d={curly(FAITH_SIDE_L, EDGE) + curly(FAITH_SIDE_R, EDGE)} />
      </clipPath>
      <path d={curly(FAITH_SIDE_L, EDGE)} fill={FAITH_HAIR} stroke="#120C0A" strokeWidth=".3" strokeLinejoin="round" />
      <path d={curly(FAITH_SIDE_R, EDGE)} fill={FAITH_HAIR} stroke="#120C0A" strokeWidth=".3" strokeLinejoin="round" />
      <g clipPath="url(#hr-clip-side)">{coils(FAITH_SIDE_COILS, "fs", FAITH_LINE)}</g>
    </>
  ),
  face: (
    <>
      {/* her face, measured from her photo: an egg shape, wide at the forehead and cheeks, tapering to a soft rounded chin */}
      <path d="M0 -67.1C5.6 -67.1 7.6 -63.2 7.6 -58.4C7.6 -55 6.9 -52 5.1 -49.9C3.6 -48.4 1.9 -47.8 0 -47.8C-1.9 -47.8 -3.6 -48.4 -5.1 -49.9C-6.9 -52 -7.6 -55 -7.6 -58.4C-7.6 -63.2 -5.6 -67.1 0 -67.1Z" fill={FAITH_SKIN} />
      <path d="M3.8 -65.4Q7.6 -63.2 7.6 -58.4C7.6 -55 6.9 -52 5.1 -49.9C3.6 -48.4 1.9 -47.8 0 -47.8Q4.4 -49.2 5.8 -53.2Q6.6 -56.4 6.2 -60.2Q5.6 -63.4 3.8 -65.4Z" fill={FAITH_SK} opacity=".22" />
      {/* short curly hair with a side part */}
      <clipPath id="hr-clip-top">
        <path d={curly(FAITH_TOP, 0.4)} />
      </clipPath>
      <path d={curly(FAITH_TOP, 0.4)} fill={FAITH_HAIR} stroke="#120C0A" strokeWidth=".3" strokeLinejoin="round" />
      <g clipPath="url(#hr-clip-top)">{coils(FAITH_TOP_COILS, "ft", FAITH_LINE)}</g>
      {/* the side part: the hair divides here, a thin strip of scalp showing between the two sides, not outlined */}
      <path d="M-3.32 -68.95Q-3.1 -67.2 -3.22 -65.35L-2.92 -65.35Q-2.8 -67.2 -2.82 -68.95Z" fill="#A36A4C" />
      {/* her ears, small and close to her head, just outside her face from eye to nose level */}
      <path d="M-7.4 -57.7Q-8.4 -57.9 -8.4 -56Q-8.4 -54.3 -7.4 -54.1Z" fill={FAITH_SKIN} />
      <path d="M-7.7 -57Q-8.1 -56.8 -8.05 -56Q-8 -55.2 -7.65 -54.9" stroke={FAITH_SK} strokeWidth=".32" fill="none" strokeLinecap="round" />
      <path d="M7.4 -57.7Q8.4 -57.9 8.4 -56Q8.4 -54.3 7.4 -54.1Z" fill={FAITH_SK} />
      <path d="M7.7 -57Q8.1 -56.8 8.05 -56Q8 -55.2 7.65 -54.9" stroke="#73452F" strokeWidth=".32" fill="none" strokeLinecap="round" />
      <g fill="none" stroke="#E2B547" strokeWidth=".42">
        <circle cx="-7.75" cy="-53.4" r=".6" />
        <circle cx="7.75" cy="-53.4" r=".6" />
      </g>
      <path d="M-5.2 -60.5Q-3.3 -61.6 -1.3 -60.8M1.3 -60.8Q3.3 -61.6 5.2 -60.5" stroke="#1E1512" strokeWidth=".75" fill="none" strokeLinecap="round" />
      <Eyes />
      {/* black frames traced from her photo: the top rim rising from the bridge to the outer corner (where the silver
          hinge sits), the outer side running nearly straight down, a broad rounded bottom, a short inner side slanting in
          to the bridge; bold, even rims */}
      <g fill="#FFFFFF" fillOpacity=".1" stroke="#0D0B0D" strokeWidth=".72" strokeLinejoin="round">
        <path d="M-.5 -57.9Q-1 -58.35 -2.2 -58.45L-6.4 -58.75Q-7 -58.8 -6.95 -58.25L-6.65 -56.4Q-6.3 -54.9 -4.6 -54.6Q-2.7 -54.35 -1.4 -54.8Q-.7 -55.2 -.62 -56.1Z" />
        <path d="M0.5 -57.9Q1 -58.35 2.2 -58.45L6.4 -58.75Q7 -58.8 6.95 -58.25L6.65 -56.4Q6.3 -54.9 4.6 -54.6Q2.7 -54.35 1.4 -54.8Q0.7 -55.2 0.62 -56.1Z" />
      </g>
      <path d="M-.5 -57.9Q0 -58.25 .5 -57.9M-6.95 -58.5L-7.6 -58.1M6.95 -58.5L7.6 -58.1" stroke="#0D0B0D" strokeWidth=".55" fill="none" strokeLinecap="round" />
      <rect x="-7.35" y="-59" width=".7" height=".55" rx=".15" fill="#D3D5DA" />
      <rect x="6.65" y="-59" width=".7" height=".55" rx=".15" fill="#D3D5DA" />
      <path d="M-1.1 -53.8Q0 -52.9 1.1 -53.8" stroke={FAITH_SK} strokeWidth=".8" fill="none" strokeLinecap="round" />
      {/* full lips, the lower one glossy */}
      <path d="M-2.2 -51.85Q-1.1 -52.55 0 -52.2Q1.1 -52.55 2.2 -51.85Q1.1 -51.65 0 -51.7Q-1.1 -51.65 -2.2 -51.85Z" fill="#8F5141" />
      <path d="M-2 -51.8Q0 -51.6 2 -51.8Q1.5 -50.45 0 -50.35Q-1.5 -50.45 -2 -51.8Z" fill="#C97466" />
      <ellipse cx=".3" cy="-50.95" rx=".75" ry=".2" fill="#EDA79B" opacity=".75" />
      <circle cx="-4.4" cy="-53.4" r="1.5" fill="#C9645A" opacity=".18" />
      <circle cx="4.4" cy="-53.4" r="1.5" fill="#C9645A" opacity=".18" />
    </>
  ),
};

export function HrFigure() {
  return (
    <svg className="sec-figure" viewBox="-50 -82 92 58" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
      <StoreFront id="hr" left={-50} width={92} doorL={-16.6} doorR={16.6} />
      <Person x={0} look={FAITH} />
    </svg>
  );
}
