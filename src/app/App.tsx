import { useEffect, useState } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import CoffeeBrewMachine from "@/app/components/CoffeeBrewMachine";
import CoffeePourServe from "@/app/components/CoffeePourServe";
import logoImg from "@/imports/image.png";

// ── Brand colours (kept in sync with theme.css) ──────────────────────────────
const C = {
  sage:        "#6a9e7c",
  sageDark:    "#2d5a42",
  sageMid:     "#4a7d5e",
  sageLight:   "#c4deca",
  heroFrom:    "#243d2e",   // hero gradient start — deep forest
  heroTo:      "#3d6b52",   // hero gradient end — mid sage
  parchment:   "#e8dcc8",   // rich warm ochre-parchment for right panel
  parchmentLt: "#f0e6d2",   // lighter version for cards
  ink:         "#1e2e24",   // dark forest ink
  inkWarm:     "#2c2416",
  gold:        "#b8943a",
  goldLight:   "#d4af6a",
  cream:       "#fdf6ec",
  muted:       "#6b7a6e",
  mutedWarm:   "#7a6e5f",
} as const;

// ── Content ──────────────────────────────────────────────────────────────────

const MOST_ORDERED = [
  {
    rank: "01",
    name: "Eggs Benedict",
    desc: "Poached eggs, house-cured ham, hollandaise on toasted English muffin",
    price: "$16.50",
    tag: "All-day Brunch",
  },
  {
    rank: "02",
    name: "Grandmama's Latte",
    desc: "House blend espresso, steamed oat milk, a whisper of vanilla and honey",
    price: "$7.00",
    tag: "House Favourite",
  },
  {
    rank: "03",
    name: "Banana Walnut Toast",
    desc: "Thick sourdough, caramelised banana, toasted walnuts, local wildflower honey",
    price: "$12.00",
    tag: "Fan Pick",
  },
];

const MENU = [
  {
    cat: "Breakfast",
    items: [["Eggs Benedict", "16.50"], ["French Toast", "14.00"], ["Avocado Toast", "13.50"], ["Granola Bowl", "11.00"]],
  },
  {
    cat: "Coffee & Tea",
    items: [["Grandmama's Latte", "7.00"], ["Cortado", "5.50"], ["Cold Brew", "6.00"], ["Loose-leaf Chai", "5.00"]],
  },
  {
    cat: "Lunch",
    items: [["Club Sandwich", "15.00"], ["Garden Niçoise", "14.50"], ["Soup of the Day", "9.00"]],
  },
  {
    cat: "Sweets",
    items: [["Victoria Sponge", "7.50"], ["Lemon Drizzle", "6.50"], ["Scones & Cream", "8.00"], ["Madeleine Trio", "5.50"]],
  },
];

const HOURS = [
  { day: "Monday — Friday", time: "08:00 — 17:00" },
  { day: "Saturday", time: "09:00 — 17:00" },
  { day: "Sunday", time: "10:00 — 16:00" },
];

const SOCIALS = [
  { label: "Instagram", handle: "@grandmamas.cafe" },
  { label: "Facebook", handle: "/grandmamascafe" },
];

// ── Decorative ornament SVG (inline, no external dependency) ─────────────────
function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <line x1="0" y1="7" x2="44" y2="7" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="52" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="60" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="68" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <line x1="76" y1="7" x2="120" y2="7" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <p
      className="text-[11px] tracking-[0.45em] mb-3 uppercase"
      style={{ fontFamily: "var(--font-mono)", color: C.sage }}
    >
      {text}
    </p>
  );
}

// ── Heading ───────────────────────────────────────────────────────────────────
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-bold leading-[1.0] tracking-tight mb-2"
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(2.4rem, 4vw, 3.6rem)",
        color: C.ink,
      }}
    >
      {children}
    </h2>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// Scroll fraction at which the brew-machine assembly finishes and the
// closing pour-&-serve section begins.
const PHASE5_START = 0.84;

export default function App() {
  const [phase, setPhase]               = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // ── Scroll ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const maxS = document.documentElement.scrollHeight - window.innerHeight;
      const p    = maxS > 0 ? Math.min(1, window.scrollY / maxS) : 0;
      setScrollProgress(p);
      let ph = 0;
      if (p > 0.11) ph = 1;
      if (p > 0.30) ph = 2;
      if (p > 0.49) ph = 3;
      if (p > 0.68) ph = 4;
      if (p > 0.84) ph = 5;
      setPhase(ph);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const vis = (idx: number): React.CSSProperties => ({
    opacity:        phase === idx ? 1 : 0,
    transform:      `translateY(${phase === idx ? 0 : 28}px)`,
    transition:     "opacity 0.65s ease, transform 0.65s ease",
    pointerEvents:  phase === idx ? "auto" : "none",
  });

  // Brew machine plays out over [0, PHASE5_START], then holds fully built.
  const machineProgress = Math.min(1, scrollProgress / PHASE5_START);
  // Pour-and-serve stage plays out over [PHASE5_START, 1].
  const pourProgress = Math.min(1, Math.max(0, (scrollProgress - PHASE5_START) / (1 - PHASE5_START)));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: "720vh", background: C.parchment }}>

      {/* Progress bar — thin gold line */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ height: 3, background: `${C.gold}28` }}>
        <div
          className="h-full transition-all duration-150"
          style={{ width: `${scrollProgress * 100}%`, background: `linear-gradient(to right, ${C.sage}, ${C.gold})` }}
        />
      </div>

      {/* Section dots — right edge */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            width: phase === i ? 22 : 7,
            height: 7,
            borderRadius: 4,
            background: phase === i
              ? `linear-gradient(to right, ${C.sage}, ${C.gold})`
              : `${C.sage}38`,
            transition: "all 0.45s ease",
          }} />
        ))}
      </div>

      {/* ── Sticky viewport ── */}
      <div className="sticky top-0 h-screen overflow-hidden" style={{
        background: `linear-gradient(105deg, #ddeae0 0%, #e8e0cc 48%, ${C.parchment} 100%)`,
      }}>

        {/* Coffee machine — assembles piece by piece as the page scrolls */}
        <div
          className="absolute inset-0 flex items-center justify-center lg:justify-start pointer-events-none lg:pl-[2%]"
          style={{ opacity: phase < 5 ? 1 : 0, transition: "opacity 0.6s ease" }}
        >
          <div className="origin-center lg:origin-left scale-[0.42] sm:scale-[0.55] md:scale-[0.7] lg:scale-[0.8] xl:scale-[0.95]">
            <CoffeeBrewMachine progress={machineProgress} />
          </div>
        </div>

        {/* Pour & serve — closing section: coffee poured from jar to mug.
            This section flips the usual layout (text left, visual right). */}
        <div
          className="absolute inset-0 flex items-center justify-center lg:justify-end pointer-events-none lg:pr-[4%]"
          style={{ opacity: phase === 5 ? 1 : 0, transition: "opacity 0.6s ease" }}
        >
          <div className="origin-center lg:origin-right scale-[0.5] sm:scale-[0.62] md:scale-[0.78] lg:scale-[0.88] xl:scale-100">
            <CoffeePourServe progress={pourProgress} />
          </div>
        </div>

        {/* Left-side sage glow around mug */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 55% 70% at 25% 52%, #c8e0cc88 0%, transparent 65%)`,
        }} />

        {/* Right-side parchment panel bg */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none" style={{
          background: `linear-gradient(160deg, ${C.parchment}ee 0%, #ddd0b4ee 100%)`,
          borderLeft: `1px solid ${C.sage}30`,
        }} />

        {/* ── HERO (phase 0) ── full dark-sage overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-between py-14"
          style={{
            ...vis(0),
            background: `linear-gradient(150deg, ${C.heroFrom} 0%, ${C.heroTo} 55%, ${C.heroFrom} 100%)`,
          }}
        >
          {/* Decorative corner vines — pure CSS */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `radial-gradient(circle 1px at 20px 20px, #c4deca 1px, transparent 0),
                                radial-gradient(circle 1px at 60px 60px, #c4deca 1px, transparent 0)`,
              backgroundSize: "80px 80px",
            }} />
          </div>

          {/* Logo — mix-blend-mode:multiply removes white bg on dark sage */}
          <div className="flex flex-col items-center gap-3">
            <div style={{
              background: C.parchmentLt,
              borderRadius: "50%",
              padding: "8px 16px",
              mixBlendMode: "normal",
            }}>
              <ImageWithFallback
                src={logoImg}
                alt="Grandmama's All Day Cafe logo"
                className="w-auto object-contain"
                style={{
                  height: "clamp(130px, 20vh, 185px)",
                  mixBlendMode: "multiply",
                  display: "block",
                }}
              />
            </div>
            <p className="text-[10px] tracking-[0.6em] uppercase" style={{
              fontFamily: "var(--font-mono)", color: C.sageLight,
            }}>
              Est. 2009 · Garden District
            </p>
          </div>

          {/* Script tagline */}
          <div className="text-center px-8">
            <p style={{
              fontFamily: "var(--font-script)",
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              color: C.parchmentLt,
              lineHeight: 1.3,
              textShadow: `0 2px 20px ${C.heroFrom}88`,
            }}>
              Good food, warm hearts,<br />all day long.
            </p>
            <Ornament className="mx-auto mt-5 w-40" style={{ color: C.sageLight } as React.CSSProperties} />
          </div>

          {/* Scroll cue */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[9px] tracking-[0.6em] uppercase" style={{
              fontFamily: "var(--font-mono)", color: `${C.sageLight}88`,
            }}>
              Scroll to explore
            </span>
            <div className="flex flex-col items-center gap-1 animate-bounce">
              <div className="w-px h-10" style={{
                background: `linear-gradient(to bottom, ${C.sageLight}66, transparent)`,
              }} />
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.sageLight, opacity: 0.6 }} />
            </div>
          </div>
        </div>

        {/* Persistent mini logo badge (phases 1-4) */}
        <div
          className="absolute top-6 left-7 flex items-center gap-3 z-20 transition-opacity duration-500"
          style={{ opacity: phase > 0 ? 1 : 0 }}
        >
          {/* Logo on parchment pill — multiply removes white */}
          <div style={{
            background: C.parchmentLt,
            padding: "2px 6px",
            borderRadius: 4,
            border: `1px solid ${C.sage}40`,
          }}>
            <ImageWithFallback
              src={logoImg}
              alt="Grandmama's logo"
              className="object-contain block"
              style={{ height: 40, mixBlendMode: "multiply" }}
            />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{
              fontFamily: "var(--font-display)", color: C.ink,
            }}>GRANDMAMA&apos;S</div>
            <div className="text-[9px] tracking-[0.35em]" style={{
              fontFamily: "var(--font-mono)", color: C.sage,
            }}>ALL DAY CAFE</div>
          </div>
        </div>

        {/* ── LEFT PANEL: phase 5 (closing) — text sits on the left this time,
             mirroring the pour-&-serve visual which sits on the right ── */}
        <div
          className="absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-10 lg:px-14"
          style={vis(5)}
        >
          <SectionLabel text="Section 05 · Stay Close" />
          <Heading>Do Visit Us,<br />and Say Hello</Heading>
          <Ornament className="w-36 mb-6" style={{ color: C.sage } as React.CSSProperties} />
          <p className="text-sm leading-[1.9] mb-6" style={{
            fontFamily: "var(--font-sans)", color: C.mutedWarm,
          }}>
            Follow along for fresh bakes, seasonal menus, and the occasional
            behind-the-counter moment. We would love to pour one for you in person.
          </p>
          <div className="space-y-3 mb-6">
            {SOCIALS.map((s) => (
              <div key={s.label} className="flex items-center justify-between p-3" style={{
                background: `${C.cream}cc`,
                border: `1px solid ${C.sage}28`,
              }}>
                <span className="text-[9px] tracking-[0.35em] font-bold" style={{
                  fontFamily: "var(--font-mono)", color: C.sage,
                }}>{s.label.toUpperCase()}</span>
                <span className="text-sm font-semibold" style={{
                  fontFamily: "var(--font-mono)", color: C.ink,
                }}>{s.handle}</span>
              </div>
            ))}
          </div>
          <div className="p-4 mb-7" style={{
            background: `${C.sage}10`,
            borderLeft: `3px solid ${C.sage}`,
          }}>
            <div className="text-[9px] tracking-[0.45em] mb-2 font-bold" style={{
              fontFamily: "var(--font-mono)", color: C.sage,
            }}>CALL OR WRITE</div>
            <p className="text-base leading-relaxed" style={{
              fontFamily: "var(--font-sans)", color: C.ink,
            }}>
              (504) 555-0148<br />
              hello@grandmamascafe.com
            </p>
          </div>
          <button
            className="w-full py-3 text-sm tracking-widest transition-all cursor-pointer"
            style={{
              fontFamily: "var(--font-mono)",
              color: "#fff",
              background: `linear-gradient(135deg, ${C.sage}, ${C.sageDark})`,
              border: "none",
              boxShadow: `0 4px 18px ${C.sage}55`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            FOLLOW @GRANDMAMAS.CAFE →
          </button>
        </div>

        {/* ── RIGHT PANEL: phases 1-4 ── */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full"
          style={{ opacity: phase > 0 ? 1 : 0, transition: "opacity 0.5s" }}
        >
          {/* PHASE 1 — Fan Favourites */}
          <div className="absolute inset-0 flex flex-col justify-center px-10 lg:px-14" style={vis(1)}>
            <SectionLabel text="Section 01 · Our Favourites" />
            <Heading>What Everyone<br />Comes Back For</Heading>
            <Ornament className="w-36 mb-6" style={{ color: C.sage } as React.CSSProperties} />
            <div className="space-y-3">
              {MOST_ORDERED.map((item) => (
                <div key={item.rank} className="p-4 transition-all hover:shadow-md" style={{
                  background: `linear-gradient(135deg, ${C.cream} 0%, ${C.parchmentLt} 100%)`,
                  border: `1px solid ${C.sage}35`,
                  boxShadow: `0 2px 12px ${C.inkWarm}0a`,
                }}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[9px] tracking-widest" style={{
                      fontFamily: "var(--font-mono)", color: `${C.sage}70`,
                    }}>{item.rank}</span>
                    <span className="text-[9px] tracking-wider px-2 py-0.5" style={{
                      fontFamily: "var(--font-mono)", color: C.sageMid,
                      background: `${C.sage}1a`, border: `1px solid ${C.sage}30`,
                    }}>{item.tag}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-semibold" style={{
                      fontFamily: "var(--font-display)", color: C.ink,
                    }}>{item.name}</h3>
                    <span className="text-sm font-bold" style={{
                      fontFamily: "var(--font-mono)", color: C.gold,
                    }}>{item.price}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{
                    fontFamily: "var(--font-sans)", color: C.mutedWarm,
                  }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PHASE 2 — Menu */}
          <div className="absolute inset-0 flex flex-col justify-center px-10 lg:px-14" style={vis(2)}>
            <SectionLabel text="Section 02 · The Menu" />
            <Heading>All Day,<br />Every Day</Heading>
            <Ornament className="w-36 mb-6" style={{ color: C.sage } as React.CSSProperties} />
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {MENU.map((cat) => (
                <div key={cat.cat} className="p-4 rounded-sm" style={{
                  background: `${C.cream}cc`,
                  border: `1px solid ${C.sage}22`,
                }}>
                  <div className="text-[9px] tracking-[0.45em] mb-3 pb-2 border-b font-bold" style={{
                    fontFamily: "var(--font-mono)", color: C.sageMid,
                    borderColor: `${C.sage}28`,
                  }}>{cat.cat.toUpperCase()}</div>
                  <ul className="space-y-2">
                    {cat.items.map(([name, price]) => (
                      <li key={name} className="flex justify-between items-baseline text-sm">
                        <span style={{ fontFamily: "var(--font-sans)", color: C.ink }}>{name}</span>
                        <span style={{ fontFamily: "var(--font-mono)", color: C.gold, fontWeight: 600 }}>${price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* PHASE 3 — Story */}
          <div className="absolute inset-0 flex flex-col justify-center px-10 lg:px-14" style={vis(3)}>
            <SectionLabel text="Section 03 · Our Story" />
            <Heading>A Little Bit<br />of Grandmama</Heading>
            <Ornament className="w-36 mb-6" style={{ color: C.sage } as React.CSSProperties} />
            <div className="p-5 mb-4" style={{
              background: `${C.sage}12`,
              borderLeft: `3px solid ${C.sage}`,
            }}>
              <p className="text-base leading-[1.85] italic" style={{
                fontFamily: "var(--font-mono)", color: C.ink,
              }}>
                Grandmama&apos;s began in a sunny corner kitchen, where the rule was simple:
                the table is always set, and there is always something good on it.
              </p>
            </div>
            <p className="text-sm leading-[1.9]" style={{
              fontFamily: "var(--font-sans)", color: C.mutedWarm,
            }}>
              We opened our first café in 2009 to share that feeling. Everything on our menu
              is made from scratch each morning using local market produce, heirloom recipes,
              and a healthy amount of love. Pull up a chair — you are expected.
            </p>
            <div className="mt-7 flex gap-0 divide-x" style={{ borderColor: `${C.sage}30` }}>
              {[["2009", "Founded"], ["4", "Locations"], ["Daily", "Made Fresh"]].map(([num, label]) => (
                <div key={label} className="flex-1 text-center py-4" style={{
                  background: `${C.sage}0e`,
                  borderTop: `2px solid ${C.sage}40`,
                }}>
                  <div className="text-2xl font-bold" style={{
                    fontFamily: "var(--font-display)", color: C.ink,
                  }}>{num}</div>
                  <div className="text-[9px] tracking-widest mt-1" style={{
                    fontFamily: "var(--font-mono)", color: C.sage,
                  }}>{label.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PHASE 4 — Visit */}
          <div className="absolute inset-0 flex flex-col justify-center px-10 lg:px-14" style={vis(4)}>
            <SectionLabel text="Section 04 · Come Visit" />
            <Heading>You Are<br />Always Welcome</Heading>
            <Ornament className="w-36 mb-6" style={{ color: C.sage } as React.CSSProperties} />
            <div className="space-y-6">
              <div className="p-4" style={{
                background: `${C.sage}10`,
                border: `1px solid ${C.sage}28`,
              }}>
                <div className="text-[9px] tracking-[0.45em] mb-2 font-bold" style={{
                  fontFamily: "var(--font-mono)", color: C.sage,
                }}>ADDRESS</div>
                <p className="text-base leading-relaxed" style={{
                  fontFamily: "var(--font-sans)", color: C.ink,
                }}>
                  12 Magnolia Street<br />
                  Garden District<br />
                  New Orleans, LA 70115
                </p>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.45em] mb-3 font-bold" style={{
                  fontFamily: "var(--font-mono)", color: C.sage,
                }}>HOURS</div>
                <div className="space-y-0 divide-y" style={{ borderColor: `${C.sage}20` }}>
                  {HOURS.map((h) => (
                    <div key={h.day} className="flex justify-between items-center py-2.5">
                      <span className="text-sm" style={{ fontFamily: "var(--font-sans)", color: C.mutedWarm }}>{h.day}</span>
                      <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: C.ink }}>{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  className="flex-1 py-3 text-sm tracking-widest transition-all cursor-pointer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "#fff",
                    background: `linear-gradient(135deg, ${C.sage}, ${C.sageDark})`,
                    border: "none",
                    boxShadow: `0 4px 18px ${C.sage}55`,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                >
                  GET DIRECTIONS →
                </button>
                <button
                  className="flex-1 py-3 text-sm tracking-widest transition-all cursor-pointer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: C.gold,
                    background: "transparent",
                    border: `1px solid ${C.gold}70`,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${C.gold}18`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  BOOK A TABLE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
