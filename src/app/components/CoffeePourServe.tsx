/**
 * A scroll-scrubbed "pour & serve" animation — companion piece to
 * CoffeeBrewMachine, used on the closing section. A jar of brewed coffee
 * tilts in, pours a stream into a waiting mug (which fills in sync), the
 * jar rights itself, steam rises, and the mug is nudged forward as if
 * placed down in front of the guest — all driven purely by `progress`
 * (0 → 1), so it scrubs forward and backward with scroll exactly like the
 * brew machine does.
 */

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function windowT(p: number, start: number, end: number) {
  if (end <= start) return p >= start ? 1 : 0;
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

const STAGE_W = 420;
const STAGE_H = 460;

// Jar pivots near its own base; this is that pivot's fixed stage position.
const JAR_PIVOT = { x: 292, y: 236 };
// Spout corner, in the jar's own local space, relative to the pivot.
const JAR_SPOUT_LOCAL = { x: -24, y: -108 };
// Where the stream should land, at the mug's rim.
const MUG_RIM = { x: 176, y: 268 };

export default function CoffeePourServe({ progress }: { progress: number }) {
  const p = Math.min(1, Math.max(0, progress));

  // ── jar arrives, upright, top-right of stage ──
  const jarInT = easeOut(windowT(p, 0, 0.12));
  const jarSlide = lerp(46, 0, jarInT);
  const jarOpacity = jarInT;

  // ── jar tilts to pour, holds, then rights itself ──
  const tiltInT = easeInOut(windowT(p, 0.14, 0.34));
  const tiltOutT = easeInOut(windowT(p, 0.58, 0.72));
  const angle = tiltOutT > 0 ? lerp(-54, 0, tiltOutT) : lerp(0, -54, tiltInT);

  const angleRad = (angle * Math.PI) / 180;
  const spoutX =
    JAR_PIVOT.x + (JAR_SPOUT_LOCAL.x * Math.cos(angleRad) - JAR_SPOUT_LOCAL.y * Math.sin(angleRad));
  const spoutY =
    JAR_PIVOT.y + (JAR_SPOUT_LOCAL.x * Math.sin(angleRad) + JAR_SPOUT_LOCAL.y * Math.cos(angleRad));

  // ── stream + fill, active while the jar is tilted ──
  const pourGrowT = easeOut(windowT(p, 0.2, 0.32));
  const pourShrinkT = easeOut(windowT(p, 0.56, 0.62));
  const streamOn = windowT(p, 0.2, 0.6) > 0 && windowT(p, 0.6, 1) < 1;
  const dx = MUG_RIM.x - spoutX;
  const dy = MUG_RIM.y - spoutY;
  const fullLen = Math.sqrt(dx * dx + dy * dy);
  const streamLenT = pourShrinkT > 0 ? 1 - pourShrinkT : pourGrowT;
  const streamLen = streamOn ? fullLen * Math.max(0, Math.min(1, streamLenT)) : 0;
  const streamAngle = (Math.atan2(dx, dy) * 180) / Math.PI;

  const fillT = easeOut(windowT(p, 0.22, 0.6));
  const mugFillHeight = lerp(0, 50, fillT);
  const jarLiquidHeight = lerp(64, 14, fillT);

  // ── steam rises from the mug once poured ──
  const steamT = windowT(p, 0.62, 0.92);
  const steamRise = lerp(0, -46, easeOut(steamT));
  const steamOpacity = Math.sin(Math.min(1, steamT) * Math.PI) * 0.85;

  // ── serve: mug + saucer nudge forward, label fades in ──
  const serveT = easeOut(windowT(p, 0.8, 1));
  const mugServeY = lerp(0, 20, serveT);
  const mugServeX = lerp(0, -14, serveT);
  const labelOpacity = easeOut(windowT(p, 0.88, 1));

  return (
    <div
      style={{
        position: "relative",
        width: STAGE_W,
        height: STAGE_H,
        overflow: "visible",
      }}
    >
      {/* Table shadow */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 372,
          width: 200,
          height: 26,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, #1e2e2440 0%, transparent 72%)",
        }}
      />

      {/* Saucer */}
      <div
        style={{
          position: "absolute",
          left: 120 + mugServeX,
          top: 350 + mugServeY,
          width: 140,
          height: 22,
          borderRadius: "50%",
          background: "linear-gradient(180deg, #f0e6d2 0%, #ddd0b4 100%)",
          boxShadow: "0 3px 10px rgba(30,46,36,0.25)",
        }}
      />

      {/* Mug handle */}
      <div
        style={{
          position: "absolute",
          left: 236 + mugServeX,
          top: 292 + mugServeY,
          width: 38,
          height: 46,
          borderRadius: "50%",
          border: "9px solid #1e2e24",
          background: "transparent",
        }}
      />

      {/* Mug body */}
      <div
        style={{
          position: "absolute",
          left: 130 + mugServeX,
          top: 268 + mugServeY,
          width: 100,
          height: 92,
          borderRadius: "6px 6px 16px 16px",
          background: "#1e2e24",
          boxShadow: "0 8px 18px rgba(30,46,36,0.35)",
          overflow: "hidden",
        }}
      >
        {/* Gold rim stripe */}
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 6, background: "#b8943a" }} />
        {/* Cream interior */}
        <div style={{ position: "absolute", left: 6, top: 6, width: 88, height: 82, borderRadius: "3px 3px 12px 12px", background: "#fdf6ec" }}>
          {/* Coffee fill, bottom anchored */}
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              height: mugFillHeight,
              background: "linear-gradient(180deg, #4a3221 0%, #38271d 100%)",
              borderRadius: "0 0 10px 10px",
              transition: "none",
            }}
          />
        </div>
      </div>

      {/* Steam */}
      <div
        style={{
          position: "absolute",
          left: 158 + mugServeX,
          top: 250 + mugServeY + steamRise,
          opacity: steamOpacity,
        }}
      >
        <svg width="64" height="60" viewBox="0 0 64 60" fill="none">
          <path d="M14 56C14 40 26 40 26 26C26 14 14 12 14 2" stroke="#c4deca" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M42 56C42 42 30 42 30 30C30 20 42 18 42 6" stroke="#c4deca" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Served label */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 396,
          width: 340,
          textAlign: "center",
          opacity: labelOpacity,
          transform: `translateY(${lerp(10, 0, labelOpacity)}px)`,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.4em",
            color: "#b8943a",
            textTransform: "uppercase",
          }}
        >
          Freshly Served
        </span>
      </div>

      {/* Pour stream */}
      {streamLen > 0 && (
        <div
          style={{
            position: "absolute",
            left: spoutX,
            top: spoutY,
            width: 5,
            height: streamLen,
            background: "linear-gradient(180deg, #4a3221 0%, #38271d 100%)",
            borderRadius: 3,
            transformOrigin: "top center",
            transform: `rotate(${streamAngle}deg)`,
          }}
        />
      )}

      {/* Jar — glass jar of brewed coffee, tilts to pour */}
      <div
        style={{
          position: "absolute",
          left: JAR_PIVOT.x - 30 + jarSlide,
          top: JAR_PIVOT.y - 112,
          width: 60,
          height: 112,
          opacity: jarOpacity,
          transformOrigin: "30px 112px",
          transform: `rotate(${angle}deg)`,
        }}
      >
        {/* Lid */}
        <div style={{ position: "absolute", left: 8, top: -10, width: 44, height: 14, borderRadius: 4, background: "#2d5a42" }} />
        <div style={{ position: "absolute", left: 14, top: -16, width: 32, height: 8, borderRadius: 3, background: "#4a7d5e" }} />
        {/* Glass body */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 60,
            height: 112,
            borderRadius: "4px 4px 14px 14px",
            background: "linear-gradient(120deg, #e8e0cc55 0%, #c4deca33 100%)",
            border: "2px solid #ffffff55",
            overflow: "hidden",
            boxShadow: "0 6px 16px rgba(30,46,36,0.25)",
          }}
        >
          {/* Coffee liquid inside, draining as it pours */}
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              height: jarLiquidHeight,
              background: "linear-gradient(180deg, #4a3221 0%, #38271d 100%)",
            }}
          />
          {/* Glass sheen */}
          <div style={{ position: "absolute", left: 8, top: 10, width: 8, height: 70, borderRadius: 8, background: "rgba(255,255,255,0.35)" }} />
        </div>
      </div>
    </div>
  );
}
