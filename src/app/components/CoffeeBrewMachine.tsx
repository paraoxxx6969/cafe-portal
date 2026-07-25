import type { CSSProperties } from "react";

/**
 * A scroll-scrubbed coffee-machine assembly animation.
 *
 * Instead of CSS @keyframes running on a wall-clock timer (which is what the
 * original snippet did, and which behaves like a little video clip that
 * autoplays once), every part's position is a pure function of `progress`
 * (0 → 1, driven by page scroll). Scrolling forward advances the build;
 * scrolling back rewinds it. Every "step" (bag arrives → grounds drop →
 * roaster + filter assemble → screen/tank/warmer/pot assemble → base +
 * control panel + legs assemble → water drains → coffee drips → ready light)
 * happens in the same order as the original, just tied to the scrollbar
 * instead of a timer.
 */

// Normalized "duration" of the whole build, in the same units the original
// hand-tuned keyframe delays used (seconds) — kept only so the relative
// timing/ordering of every step can be lifted straight from the source.
const TOTAL = 12.75;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Linear 0→1 progress of a [startS,endS] window within the full timeline. */
function windowT(p: number, startS: number, endS: number) {
  const start = startS / TOTAL;
  const end = endS / TOTAL;
  if (end <= start) return p >= start ? 1 : 0;
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

type Pt = { x: number; y: number; rot?: number; scale?: number };

function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * t,
    scale: (a.scale ?? 1) + ((b.scale ?? 1) - (a.scale ?? 1)) * t,
  };
}

function toTransform(pt: Pt, extra = "") {
  return `translate(${pt.x.toFixed(2)}px, ${pt.y.toFixed(2)}px) rotate(${(pt.rot ?? 0).toFixed(1)}deg) scale(${(pt.scale ?? 1).toFixed(3)})${extra ? " " + extra : ""}`;
}

/** A part that slides in from off-stage `from` to its resting `to` spot. */
function slideIn(p: number, startS: number, endS: number, from: Pt, to: Pt, extra = ""): CSSProperties {
  const t = easeOut(windowT(p, startS, endS));
  return { transform: toTransform(lerpPt(from, to, t), extra) };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixColor(hexA: string, hexB: string, t: number) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `rgb(${r}, ${g}, ${bl})`;
}

const STAGE_W = 700;
const STAGE_H = 480;

export default function CoffeeBrewMachine({ progress }: { progress: number }) {
  const p = Math.min(1, Math.max(0, progress));

  // ── the little bean bag (assembles centre-stage, then pours + flies off) ──
  const bagBox = { x: 296, y: 108 }; // top-left of the 72×170 bag, at rest
  const bagFlightLocal = windowT(p, 2, 4.5);
  const bagFlight =
    bagFlightLocal <= 0.5
      ? lerpPt({ x: 0, y: 0, rot: 0 }, { x: 220, y: -190, rot: -85 }, easeOut(bagFlightLocal / 0.5))
      : lerpPt({ x: 220, y: -190, rot: -85 }, { x: 760, y: -230, rot: -95 }, easeOut((bagFlightLocal - 0.5) / 0.5));

  // ── falling grounds (fade in, drift down into the filter, fade out) ──
  const groundsLocal = windowT(p, 2.75, 4);
  const groundsOpacity = groundsLocal <= 0.1 ? groundsLocal / 0.1 : Math.max(0, 1 - (groundsLocal - 0.1) / 0.9);
  const groundsDrift = groundsLocal * 55;

  // ── ready light: red → green ──
  const readyT = easeOut(windowT(p, 7.5, 8.25));
  const readyColor = mixColor("#ff2d2d", "#4ac861", readyT);

  // ── water tank draining ──
  const waterT = easeOut(windowT(p, 8.25, 12.25));
  const waterHeight = lerp(32, 0, waterT);

  // ── drip stream + its glassy highlight ──
  const dripT = easeOut(windowT(p, 8.5, 9.75));
  const dripHeight = lerp(0, 90, dripT);
  const dripCoverT = easeOut(windowT(p, 10, 12.5));
  const dripCoverHeight = lerp(0, 90, dripCoverT);

  // ── coffee rising in the pot (bottom-anchored) ──
  const coffeeT = easeOut(windowT(p, 9.25, 12.75));
  const coffeeHeight = lerp(0, 50, coffeeT);
  const potBottom = 242; // matches coffeePotGlassBase to.y(176) + height(66)

  return (
    <div
      style={{
        position: "relative",
        width: STAGE_W,
        height: STAGE_H,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <style>{`
        .cbm-abs { position: absolute; left: 0; top: 0; }
        .cbm-bean { border-radius: 20px; background: #4b2603; height: 8px; position: absolute; width: 20px; }
        .cbm-bean-one { left: 3px; top: 16px; }
        .cbm-bean-two { left: 16px; top: 14px; }
        .cbm-info { background: #d4a575; height: 10px; position: absolute; width: 54px; }
        .cbm-grounds { background: #4b0b09; height: 2px; width: 2px; position: absolute; }
        .cbm-grounds:before, .cbm-grounds:after { background: #4b0b09; content: ''; display: block; height: 2px; width: 2px; position: absolute; }
        .cbm-grounds:before { top: 5px; left: 5px; }
        .cbm-grounds:after { bottom: 5px; right: 5px; }
        .cbm-filter:before { background: #d1a978; border-radius: 50%; content: ''; display: block; height: 35px; left: 50%; margin-left: -60px; position: absolute; top: -10px; width: 120px; }
        .cbm-filter:after { background: #b18957; border-radius: 50%; content: ''; display: block; height: 20px; left: 50%; margin-left: -50px; position: absolute; top: -2px; width: 100px; z-index: 2; }
        .cbm-roasting-top:before { background: #32262c; border-radius: 4px; content: ''; display: block; height: 18px; position: absolute; top: -12px; width: 125px; }
        .cbm-roasting-body:before { content: ''; display: block; position: absolute; border-radius: 50%; left: 50%; background: #1d1615; height: 35px; margin-left: -60px; top: -10px; width: 120px; z-index: 1; }
        .cbm-roasting-body:after { content: ''; display: block; position: absolute; background: #2f2827; border-radius: 0 0 10px 10px; bottom: 0; height: 20px; width: 100px; }
        .cbm-water-lid:before { background: #2f2828; border-radius: 6px 6px 0 0; content: ''; display: block; height: 14px; left: 12px; position: absolute; top: -14px; width: 85px; }
        .cbm-water-pot:before { background: #2f2828; border-radius: 0 0 6px 6px; content: ''; display: block; height: 6px; left: 12px; position: absolute; top: 0; width: 85px; }
        .cbm-fill-line { background: #1d1614; border-radius: 50%; height: 3px; left: 50%; margin-left: -11px; position: absolute; width: 22px; z-index: 3; }
        .cbm-fill-line:after { background: #1d1614; border-radius: 50%; content: ''; display: block; height: 3px; left: 50%; margin-left: -11px; position: absolute; top: 14px; width: 22px; }
        .cbm-warmer-accent { background: #d5d4d5; border-radius: 24px; position: absolute; width: 24px; }
        .cbm-warmer-base:before { background: #191112; border-radius: 4px; bottom: -16px; content: ''; display: block; height: 22px; left: 0; position: absolute; width: 88px; }
        .cbm-control-panel-lamp { background: #2a2225; border-radius: 4px; height: 14px; position: absolute; width: 28px; }
        .cbm-control-panel-lamp:after { border-radius: 8px; content: ''; display: block; height: 8px; margin-top: -4px; position: absolute; top: 50%; width: 8px; }
      `}</style>

      {/* Water tank — slides in from the left */}
      <div className="cbm-abs" style={{ width: 110, height: 12, background: "#b3b2b4", borderRadius: 4, ...slideIn(p, 4.5, 6, { x: -600, y: 120 }, { x: 20, y: 120 }) }} />
      <div className="cbm-abs cbm-water-lid" style={{ width: 110, height: 12, left: 13, background: "#130f10", borderRadius: 4, ...slideIn(p, 4.5, 6, { x: -600, y: 133 }, { x: 20, y: 133 }) }} />
      <div className="cbm-abs cbm-water-pot" style={{ width: 110, height: 64, left: 13, background: "#eaeceb", borderRadius: 4, ...slideIn(p, 4.75, 6.25, { x: 700, y: 146 }, { x: 20, y: 146 }) }}>
        <div className="cbm-fill-line" style={{ top: 12 }} />
        <div className="cbm-fill-line" style={{ top: 40 }} />
        <div className="cbm-abs" style={{ width: 100, left: "50%", marginLeft: -50, bottom: 5, height: waterHeight, background: "#0093be", borderRadius: "0 0 4px 4px" }} />
        <div className="cbm-abs" style={{ width: 18, height: 45, left: 11, top: 10, background: "rgba(255,255,255,.6)", borderRadius: 18 }} />
      </div>

      {/* Roaster + filter — drop in from above, grounds fall between them */}
      <div className="cbm-abs cbm-roasting-top" style={{ width: 125, height: 16, background: "#32262c", borderRadius: 4, ...slideIn(p, 3, 5, { x: 190, y: -400 }, { x: 190, y: 60 }) }} />
      <div className="cbm-abs cbm-roasting-body" style={{ width: 100, height: 90, background: "#1d1615", borderRadius: "0 0 10px 10px", ...slideIn(p, 3, 5, { x: 202, y: 480 }, { x: 202, y: 76 }) }}>
        <div className="cbm-abs" style={{ height: 48, right: -25, top: 23, width: 26 }}>
          <div className="cbm-abs" style={{ background: "#1d1615", height: 17, width: 26 }} />
          <div className="cbm-abs" style={{ background: "#2f2827", height: 48, right: 0, width: 8, left: "auto" }} />
        </div>
      </div>
      <div className="cbm-abs" style={{ width: 40, height: 60, ...( { left: 225 + groundsDrift * 0.05, top: 170 + groundsDrift } as CSSProperties), opacity: groundsOpacity }}>
        <span className="cbm-grounds" style={{ left: 10, top: 0 }} />
        <span className="cbm-grounds" style={{ left: 10, top: 10 }} />
        <span className="cbm-grounds" style={{ left: 10, top: 20 }} />
        <span className="cbm-grounds" style={{ left: 10, top: 30 }} />
      </div>
      <div className="cbm-abs cbm-filter" style={{ width: 100, height: 90, background: "#d1a978", borderRadius: "0 0 10px 10px", ...slideIn(p, 2, 4.5, { x: 200, y: 700 }, { x: 200, y: 280 }) }} />

      {/* Screen readout */}
      <div className="cbm-abs" style={{ width: 164, height: 12, background: "#1d1615", borderRadius: 4, ...slideIn(p, 4.25, 5.75, { x: 700, y: 40 }, { x: 270, y: 40 }) }} />

      {/* Warmer + carafe column, on the right */}
      <div className="cbm-abs" style={{ width: 88, height: 10, background: "#191112", borderRadius: 4, ...slideIn(p, 4.5, 6, { x: 700, y: 242 }, { x: 505, y: 242 }) }} />
      <div className="cbm-abs" style={{ width: 94, height: 130, background: "#9b9187", borderRadius: 6, ...slideIn(p, 5, 6.5, { x: 700, y: 252 }, { x: 503, y: 252 }) }}>
        <div className="cbm-warmer-accent" style={{ height: 86, left: 10, top: 6 }} />
        <div className="cbm-warmer-accent" style={{ height: 24, left: 10, bottom: 6 }} />
        <div className="cbm-warmer-accent" style={{ height: 120, right: 10, top: 6 }} />
      </div>
      <div className="cbm-abs cbm-warmer-base" style={{ width: 88, height: 10, background: "#191112", borderRadius: 4, ...slideIn(p, 5, 6.5, { x: -600, y: 382 }, { x: 505, y: 382 }) }} />
      <div className="cbm-abs" style={{ width: 94, height: 10, background: "#191112", borderRadius: 4, ...slideIn(p, 4, 5.5, { x: -600, y: 392 }, { x: 503, y: 392 }) }} />

      <div className="cbm-abs" style={{ width: 92, height: 16, background: "#1c1616", borderRadius: 6, ...slideIn(p, 5, 6.5, { x: -600, y: 137 }, { x: 507, y: 137 }) }} />
      <div className="cbm-abs" style={{ width: 92, height: 16, background: "#dfe3e6", border: "3px solid #f3f2f7", borderRadius: 6, ...slideIn(p, 4.25, 5.75, { x: 700, y: 153 }, { x: 507, y: 153 }, "skewX(18deg)") }} />
      <div className="cbm-abs" style={{ width: 96, height: 7, background: "#1c1616", borderRadius: 6, ...slideIn(p, 5.25, 6.75, { x: 700, y: 169 }, { x: 505, y: 169 }) }} />
      <div className="cbm-abs" style={{ width: 92, height: 66, background: "#dfe3e6", border: "3px solid #f3f2f7", borderRadius: 6, ...slideIn(p, 4.5, 6, { x: 700, y: 176 }, { x: 507, y: 176 }) }}>
        <div className="cbm-abs" style={{ background: "#eff2f1", borderRadius: 16, height: 50, left: 6, top: 6, width: 16 }} />
      </div>
      <div className="cbm-abs" style={{ height: 86, width: 52, ...slideIn(p, 5, 6.5, { x: 597, y: 480 }, { x: 597, y: 153 }) }}>
        <div className="cbm-abs" style={{ background: "#1d1614", borderRadius: "10px 10px 0 10px", height: 26, right: 0, top: 0, width: 48, left: "auto" }} />
        <div className="cbm-abs" style={{ background: "transparent", border: "4px solid #1d1614", bottom: 10, height: 52, right: 0, width: 20, left: "auto", top: "auto" }} />
      </div>

      {/* Drip stream falling from the filter spout into the carafe */}
      <div className="cbm-abs" style={{ left: 548, top: 60, width: 5, height: dripHeight, background: "#38271d" }} />
      <div className="cbm-abs" style={{ left: 548, top: 60, width: 5, height: dripCoverHeight, background: "#dfe3e6" }} />
      {/* Coffee rising in the carafe */}
      <div className="cbm-abs" style={{ left: 512, top: potBottom - coffeeHeight, width: 82, height: coffeeHeight, background: "#38271d", borderRadius: "0 0 6px 6px" }} />

      {/* Base, control panel + legs */}
      <div className="cbm-abs" style={{ width: 344, height: 34, background: "#97938d", borderRadius: 10, ...slideIn(p, 5.5, 7, { x: 170, y: 900 }, { x: 170, y: 410 }) }} />
      <div className="cbm-abs" style={{ width: 16, height: 34, background: "#1c1512", borderRadius: "10px 0 0 10px", ...slideIn(p, 5.5, 7, { x: -600, y: 703 }, { x: 154, y: 410 }) }} />
      <div className="cbm-abs" style={{ width: 16, height: 34, background: "#1c1512", borderRadius: "0 10px 10px 0", ...slideIn(p, 5.5, 7, { x: 700, y: 703 }, { x: 514, y: 410 }) }} />
      <div className="cbm-abs" style={{ width: 283, height: 22, background: "#d4d4d4", borderRadius: 15, ...slideIn(p, 5.75, 7.25, { x: -600, y: 392 }, { x: 190, y: 392 }) }}>
        <div className="cbm-control-panel-lamp" style={{ left: 15, top: 4 }}>
          <span className="cbm-abs" style={{ borderRadius: 8, height: 8, left: 4, top: "50%", marginTop: -4, width: 8, background: "#4ac861" }} />
        </div>
        <div className="cbm-control-panel-lamp" style={{ left: 55, top: -10 }}>
          <span className="cbm-abs" style={{ borderRadius: 8, height: 8, right: 4, top: "50%", marginTop: -4, width: 8, background: readyColor }} />
        </div>
      </div>
      <div className="cbm-abs" style={{ width: 20, height: 20, background: "#1b1317", borderRadius: 4, ...slideIn(p, 6, 7.5, { x: 195, y: 780 }, { x: 195, y: 444 }) }} />
      <div className="cbm-abs" style={{ width: 20, height: 20, background: "#1b1317", borderRadius: 4, ...slideIn(p, 6, 7.5, { x: 465, y: 780 }, { x: 465, y: 444 }) }} />

      {/* Coffee bean bag — assembles centre-stage, pours, then flies off */}
      <div
        className="cbm-abs"
        style={{
          width: 72,
          height: 170,
          left: bagBox.x,
          top: bagBox.y,
          transform: toTransform(bagFlight),
        }}
      >
        <div className="cbm-abs" style={{ background: "#73271f", height: 12, width: 72, zIndex: 2, ...slideIn(p, 0.5, 1.5, { x: 180, y: 0 }, { x: 0, y: 0 }) }} />
        <div className="cbm-abs" style={{ borderRadius: "8px 8px 0 0", background: "#8e4542", height: 38, width: 72, zIndex: 1, ...slideIn(p, 0, 1, { x: -140, y: 0 }, { x: 0, y: 0 }) }} />
        <div className="cbm-abs" style={{ borderRadius: "0 0 8px 8px", background: "#73271f", height: 125, width: 72, zIndex: 1, ...slideIn(p, 0, 1, { x: 140, y: 38 }, { x: 0, y: 38 }) }} />
        <div className="cbm-abs" style={{ borderRadius: "50%", background: "#af8757", height: 40, width: 40, zIndex: 2, ...slideIn(p, 0, 1, { x: 15, y: -75, scale: 0.25 }, { x: 15, y: -75, scale: 1 }) }}>
          <div className="cbm-bean cbm-bean-one" style={slideIn(p, 0.5, 1.5, { x: 0, y: 0, rot: 45, scale: 0.25 }, { x: 0, y: 0, rot: 45, scale: 1 })} />
          <div className="cbm-bean cbm-bean-two" style={slideIn(p, 0.5, 1.5, { x: 0, y: 0, rot: 45, scale: 0.25 }, { x: 0, y: 0, rot: 45, scale: 1 })} />
        </div>
        <div className="cbm-info" style={{ zIndex: 2, ...slideIn(p, 0.25, 1.25, { x: -140, y: -25 }, { x: 8, y: -25 }) }} />
        <div className="cbm-info" style={{ zIndex: 2, ...slideIn(p, 0.5, 1.5, { x: -140, y: -10 }, { x: 8, y: -10 }) }} />
        <div className="cbm-info" style={{ zIndex: 2, ...slideIn(p, 0.75, 1.75, { x: -140, y: 5 }, { x: 8, y: 5 }) }} />
        <div className="cbm-abs" style={{ borderRadius: "0 0 8px 8px", background: "#4a0b10", height: 12, width: 72, zIndex: 2, bottom: 0, ...slideIn(p, 0, 0.75, { x: -140, y: 158 }, { x: 0, y: 158 }) }} />
      </div>
    </div>
  );
}
