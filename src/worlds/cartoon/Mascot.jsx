/* An original mascot. It levels up with your career: sprout, glasses, headphones, cape and star, then a crown.
   Colour comes from the surrounding .k-* kit, so it re-colours itself every stage. */
const KITS = ["p", "y", "s", "m", "v"];
const draw = (fill, w = 5) => ({ fill, stroke: "var(--line)", strokeWidth: w, strokeLinejoin: "round", strokeLinecap: "round" });
const line = (w = 5) => ({ fill: "none", stroke: "var(--line)", strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round" });

export default function Mascot({ level = 0, total = 1, wave = false, className = "" }) {
  const tier = Math.min(level, 5);
  const grow = total > 1 ? level / (total - 1) : 1;
  const size = wave ? 160 : 150 + grow * 100;
  const hat = tier >= 5;
  return (
    <div className={`tz-mascot k-${KITS[level % KITS.length]} ${wave ? "tz-wave" : "tz-pop"} ${className}`} style={{ "--ms": `${size}px` }} aria-hidden={wave ? "true" : undefined}>
      <svg viewBox="-20 0 280 270" role={wave ? undefined : "img"} aria-label={wave ? undefined : `Mascot, level ${level + 1}`}>
        <ellipse cx="120" cy="256" rx="76" ry="10" fill="rgba(27,21,48,.22)" />
        <g className="m-bob">
          {tier >= 4 && <path d="M66 118 C 38 188 36 228 22 252 C 70 238 170 238 218 252 C 204 228 202 188 174 118 Z" style={draw("#ff6fa5")} />}
          <ellipse cx="88" cy="242" rx="25" ry="14" style={draw("var(--c2)")} />
          <ellipse cx="152" cy="242" rx="25" ry="14" style={draw("var(--c2)")} />
          <ellipse cx="42" cy="170" rx="15" ry="25" transform="rotate(18 42 170)" style={draw("var(--c2)")} />
          <g className={wave ? "m-arm" : undefined}>
            {wave
              ? <ellipse cx="208" cy="128" rx="15" ry="26" transform="rotate(-38 208 128)" style={draw("var(--c2)")} />
              : <ellipse cx="198" cy="170" rx="15" ry="25" transform="rotate(-18 198 170)" style={draw("var(--c2)")} />}
          </g>
          <path d="M120 50 C 190 50 208 112 204 166 C 200 216 164 238 120 238 C 76 238 40 216 36 166 C 32 112 50 50 120 50 Z" style={draw("var(--c2)")} />
          <ellipse cx="120" cy="198" rx="46" ry="32" fill="var(--c1)" opacity=".85" />
          <path d="M64 98 C 70 78 86 68 102 64" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" opacity=".7" />
          <circle cx="68" cy="162" r="11" fill="#ff6fa5" opacity=".5" />
          <circle cx="172" cy="162" r="11" fill="#ff6fa5" opacity=".5" />

          <g className="m-eyes">
            <circle cx="92" cy="126" r="24" style={draw("#fff")} />
            <circle cx="148" cy="126" r="24" style={draw("#fff")} />
            <circle cx="98" cy="130" r="11" style={{ fill: "var(--line)" }} />
            <circle cx="154" cy="130" r="11" style={{ fill: "var(--line)" }} />
            <circle cx="102" cy="125" r="4" fill="#fff" />
            <circle cx="158" cy="125" r="4" fill="#fff" />
          </g>
          <path d="M98 168 Q120 204 142 168 Z" style={draw("#7a1f3d")} />
          <path d="M110 187 Q120 198 130 187 Q120 181 110 187 Z" fill="#ff8fb0" />

          {tier >= 1 && !hat && (
            <g className="m-sprout">
              <path d="M120 54 C 118 38 122 28 120 18" style={line()} />
              <ellipse cx="103" cy="22" rx="17" ry="9" transform="rotate(-25 103 22)" style={draw("#5be3a7")} />
              <ellipse cx="138" cy="14" rx="17" ry="9" transform="rotate(25 138 14)" style={draw("#5be3a7")} />
            </g>
          )}
          {tier >= 2 && (
            <g>
              <circle cx="92" cy="126" r="30" fill="rgba(255,255,255,.2)" style={line()} />
              <circle cx="148" cy="126" r="30" fill="rgba(255,255,255,.2)" style={line()} />
              <path d="M118 122 Q120 116 122 122" style={line(4)} />
              <path d="M63 118 L46 112 M177 118 L194 112" style={line(4)} />
            </g>
          )}
          {tier >= 3 && (
            <g>
              <path d="M46 134 C 34 26 206 26 194 134" style={line(17)} />
              <path d="M46 134 C 34 26 206 26 194 134" fill="none" stroke="#ffd23f" strokeWidth="8" strokeLinecap="round" />
              <rect x="28" y="112" width="28" height="54" rx="13" style={draw("#ffd23f")} />
              <rect x="184" y="112" width="28" height="54" rx="13" style={draw("#ffd23f")} />
            </g>
          )}
          {tier >= 4 && <path d="M120 180 L126 193 L140 194 L129 203 L133 217 L120 209 L107 217 L111 203 L100 194 L114 193 Z" style={draw("#ffd23f", 4)} />}
          {hat && (
            <g>
              <path d="M82 54 L88 12 L105 36 L120 6 L135 36 L152 12 L158 54 Z" style={draw("#ffd23f")} />
              <circle cx="120" cy="40" r="6" style={draw("#ff6fa5", 3)} />
            </g>
          )}
        </g>
      </svg>
      {!wave && <span className="tz-mlv">Lv.{level + 1}</span>}
    </div>
  );
}