/* The office's own figure for the orange banner (Gregg, 14 Nov 2026). After two tries he asked for "one of these mini
   people but with her features, keep it simple": so she is built exactly like the home page's crew in red
   (tools/grand-entrance/make-scene.js), the same body, arms, hands, head, eyes and shading, with only her own
   features changed:
     her lighter, warm skin; a slightly fuller face; dark hair, centre-parted and pulled back, the tail behind;
     straight brows; a calm closed mouth with a fuller lower lip; small gold hoops; the black company polo with the
     pink cornucopia logo instead of the red polo.
   Motion is CSS (.of-* in styles/staff-theme.css): she waves a few times and rests, and blinks; still for anyone
   who asks for reduced motion. */

const SKIN = "#C8825F";
const SK = "#A86D50"; // the skin a shade darker, as the crew's shade(skin, .84)
const HAIR = "#1E1714";
const SHIRT = "#1F1F25";
const SHIRT_D = "#121216";
const TRIM = "#34343D";

/** One hand, open, palm to the viewer (the crew's hand). */
const Hand = ({ side }: { side: 1 | -1 }) => (
  <>
    <g stroke={SKIN} strokeWidth="1.2" strokeLinecap="round">
      <path d="M-1.5 3.4L-2 6.2M-.5 3.4L-.7 7M.5 3.4L.7 7M1.5 3.4L2 6.2" />
      <path d={"M" + side * 1.9 + " 1.2L" + side * 3.5 + " 3.6"} />
    </g>
    <ellipse cx="0" cy="2.5" rx="2.3" ry="2.5" fill={SKIN} />
    <path d="M-1.3 3.4Q0 4.3 1.3 3.4" stroke={SK} strokeWidth=".5" fill="none" />
  </>
);

/** The crew's short sleeve, in her black polo. */
const Sleeve = () => (
  <>
    <path d="M-3 -1.2Q-3.6 3.4 -3.3 5.8L3.3 5.8Q3.6 3.4 3 -1.2Q0 -2.8 -3 -1.2Z" fill={SHIRT} />
    <path d="M-3.3 5.8H3.3" stroke={TRIM} strokeWidth="1" />
  </>
);

export function OfficeFigure() {
  return (
    <svg className="sec-figure" viewBox="-27 -78 46 80" aria-hidden="true" focusable="false">
      {/* a soft round light behind her */}
      <circle cx="-2" cy="-44" r="30" fill="#FFFFFF" opacity=".14" />
      <circle cx="-2" cy="-50" r="18" fill="#FFFFFF" opacity=".12" />
      <ellipse cx="0" cy="0" rx="11" ry="1.8" fill="#3B2A10" opacity=".22" />
      <g className="of-body">
        {/* her tail of hair, behind */}
        <path d="M3.6 -61.5Q11 -60 10.4 -52Q10 -46 7.4 -44.2Q8.4 -50 6.6 -55Q5.6 -58.6 3.6 -58.6Z" fill={HAIR} />
        <circle cx="5.4" cy="-60.2" r="1.2" fill="#3A2C27" />

        {/* trousers, shoes, neck, black polo (shaded side, collar, placket, logo), belt — the crew's */}
        <path d="M-6.4 -24.5H-.7L-1 -2.2H-5.8Z" fill="#2A2C3B" />
        <path d="M.7 -24.5H6.4L5.8 -2.2H1Z" fill="#23252F" />
        <path d="M-6.6 -2.6H-.6Q.2 -2.6 .2 -.8V0H-7.6Q-7.8 -1.8 -6.6 -2.6ZM.6 -2.6H6.6Q7.8 -1.8 7.6 0H-.2V-.8Q-.2 -2.6 .6 -2.6Z" fill="#141418" />
        <rect x="-2.5" y="-50.6" width="5" height="4" rx="1.6" fill={SK} />
        <path d="M-11 -25.2Q-12 -36 -10.2 -44.2Q-7.4 -47.6 -3.4 -47.8H3.4Q7.4 -47.6 10.2 -44.2Q12 -36 11 -25.2Z" fill={SHIRT} />
        <path d="M4.6 -47.5Q8.9 -46.4 10.2 -44.2Q12 -36 11 -25.2H7.2Q8.6 -34 7.5 -41Z" fill={SHIRT_D} opacity=".7" />
        <path d="M-3.2 -47.8L0 -44.2L3.2 -47.8Z" fill={SK} />
        <path d="M-3.8 -48.1L0 -46.4L-1.2 -43.4L-4.9 -46.3ZM3.8 -48.1L0 -46.4L1.2 -43.4L4.9 -46.3Z" fill="#2E2E36" />
        <path d="M0 -44.2V-39.6" stroke={TRIM} strokeWidth=".8" />
        <circle cx="0" cy="-42.4" r=".55" fill="#0B0B0D" />
        <circle cx="0" cy="-40.4" r=".55" fill="#0B0B0D" />
        <g transform="translate(-6 -42)">
          <path d="M-1.3 -1.5Q-.3 -1.8 .7 -.8Q1 -.2 .6 .5Q.1 .9 -.5 .7Q-.1 .3 -.2 -.3Q-.5 -1 -1.3 -1.5Z" fill="#F29BB4" />
          <circle cx=".7" cy=".5" r=".32" fill="#E3336F" />
          <rect x="1.2" y="-1.1" width="2.2" height=".38" rx=".18" fill="#F4F1EC" />
          <rect x="1.2" y="-.4" width="1.8" height=".38" rx=".18" fill="#F4F1EC" />
        </g>
        <rect x="-7.2" y="-26.4" width="14.4" height="2" fill="#141418" />
        <rect x="-1.2" y="-26.6" width="2.4" height="2.4" rx=".4" fill="#C9A14A" />

        {/* the arm at rest, her left (the viewer's right) */}
        <g transform="translate(8.8 -44.6)">
          <g transform="rotate(-10)">
            <path d="M0 5L0 9.5" stroke={SKIN} strokeWidth="3.6" strokeLinecap="round" />
            <g transform="translate(0 9.5)">
              <g transform="rotate(8)">
                <path d="M0 0L0 8.6" stroke={SKIN} strokeWidth="3.3" strokeLinecap="round" />
                <g transform="translate(0 8.6)">
                  <Hand side={1} />
                </g>
              </g>
            </g>
            <Sleeve />
          </g>
        </g>

        {/* the waving arm, her right (the viewer's left): shoulder, elbow and wrist each turn, as the crew wave */}
        <g transform="translate(-8.8 -44.6)">
          <g transform="rotate(140)">
            <g className="of-sh">
              <path d="M0 5L0 9.5" stroke={SKIN} strokeWidth="3.6" strokeLinecap="round" />
              <g transform="translate(0 9.5)">
                <g transform="rotate(46)">
                  <g className="of-el">
                    <path d="M0 0L0 8.6" stroke={SKIN} strokeWidth="3.3" strokeLinecap="round" />
                    <g transform="translate(0 8.6)">
                      <g className="of-wr">
                        <Hand side={-1} />
                      </g>
                    </g>
                  </g>
                </g>
              </g>
              <Sleeve />
            </g>
          </g>
        </g>

        {/* head: ears with gold hoops, a fuller face with its shaded side, centre-parted hair, brows, eyes, nose, lips */}
        <g>
          <ellipse cx="-7.2" cy="-55" rx="1.5" ry="2.1" fill={SKIN} />
          <ellipse cx="7.2" cy="-55" rx="1.5" ry="2.1" fill={SK} />
          <g fill="none" stroke="#E2B547" strokeWidth=".45">
            <circle cx="-7.4" cy="-53" r=".7" />
            <circle cx="7.4" cy="-53" r=".7" />
          </g>
          <ellipse cx="0" cy="-55.4" rx="7.3" ry="7.7" fill={SKIN} />
          <path d="M3.4 -62.2Q7.8 -59 7.3 -54.4Q6.7 -49.2 2 -47.8Q5.6 -51.4 5.4 -55.4Q5.2 -59.6 3.4 -62.2Z" fill={SK} opacity=".45" />
          <path d="M-7.7 -54.8Q-8.5 -65.2 0 -65Q8.5 -65.2 7.7 -54.8Q7.1 -59.6 4.3 -61.4Q1.6 -62.4 0 -61.3Q-1.6 -62.4 -4.3 -61.4Q-7.1 -59.6 -7.7 -54.8Z" fill={HAIR} />
          <path d="M0 -64.8V-61.6" stroke="#5A4740" strokeWidth=".4" strokeLinecap="round" />
          <path d="M-4.4 -59.3Q-2.7 -60.1 -1.1 -59.5M1.1 -59.5Q2.7 -60.1 4.4 -59.3" stroke={HAIR} strokeWidth="1.05" fill="none" strokeLinecap="round" />
          <g className="of-eyes">
            <ellipse cx="-2.5" cy="-56.4" rx=".95" ry="1.1" fill="#24161A" />
            <ellipse cx="2.5" cy="-56.4" rx=".95" ry="1.1" fill="#24161A" />
            <circle cx="-2.15" cy="-56.8" r=".33" fill="#FFFFFF" />
            <circle cx="2.85" cy="-56.8" r=".33" fill="#FFFFFF" />
          </g>
          <path d="M-1.1 -54Q0 -53 1.1 -54" stroke={SK} strokeWidth=".8" fill="none" strokeLinecap="round" />
          <path d="M-2.3 -51.6Q0 -50.9 2.3 -51.6Q1.6 -50 0 -49.9Q-1.6 -50 -2.3 -51.6Z" fill="#C9776C" />
          <path d="M-2.6 -51.6Q0 -51.2 2.6 -51.6" stroke="#7A3E36" strokeWidth=".7" fill="none" strokeLinecap="round" />
          <circle cx="-4.4" cy="-53.2" r="1.5" fill="#E5736A" opacity=".22" />
          <circle cx="4.4" cy="-53.2" r="1.5" fill="#E5736A" opacity=".22" />
        </g>
      </g>
    </svg>
  );
}
