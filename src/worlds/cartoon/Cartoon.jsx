import { useEffect, useRef, useState } from "react";
import "./cartoon.css";
import Mascot from "./Mascot.jsx";

/* Experience is usually listed newest-first on a CV; evolution runs oldest -> newest.
   Set to false if your data is already oldest-first. */
const REVERSE_EXPERIENCE = true;

const COL = ["p", "y", "s", "m", "v"];
const has = (a) => Array.isArray(a) && a.length > 0;
const pad = (n) => String(n).padStart(2, "0");
const reduced = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- helpers ---------- */

function useInView() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

function Reveal({ children, delay = 0 }) {
  const [ref, seen] = useInView();
  return (
    <div ref={ref} className={`rv${seen ? " in" : ""}`} style={{ "--d": `${delay}ms` }}>
      {children}
    </div>
  );
}

/* 3D tilt that follows the mouse (mouse/pen only, never on touch or reduced motion) */
function Tilt({ children, max = 8 }) {
  const ref = useRef(null);
  const move = (e) => {
    if (e.pointerType === "touch" || reduced()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(0)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(0)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div ref={ref} className="tz-tilt" onPointerMove={move} onPointerLeave={leave}>
      {children}
    </div>
  );
}

const NUM = /^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/;

function CountUp({ value }) {
  const [ref, seen] = useInView();
  const [n, setN] = useState(null);
  const str = String(value);

  useEffect(() => {
    if (!seen || reduced()) return undefined;
    const m = str.match(NUM);
    if (!m) return undefined;
    const to = parseFloat(m[2].replace(/,/g, ""));
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 1000);
      setN(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
      else setN(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, str]);

  const m = str.match(NUM);
  if (!m || n === null) return <span ref={ref}>{str}</span>;
  const dec = (m[2].split(".")[1] || "").length;
  const out = n.toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
    useGrouping: m[2].includes(","),
  });
  return (
    <span ref={ref}>
      {m[1]}
      {out}
      {m[3]}
    </span>
  );
}

function Page({ id, n, title, children }) {
  return (
    <section id={id} className="tz-sec tz-wrap">
      <p className="tz-kick">
        <span>{n}</span>
      </p>
      <h2 className="tz-h">{title}</h2>
      {children}
    </section>
  );
}

/* The evolution machine5: press Evolve and the orb grows into the next career stage */
function Evolver({ stages }) {
  const [i, setI] = useState(0);
  const [flash, setFlash] = useState(0);
  const last = stages.length - 1;
  const e = stages[i];
  const size = 150 + (last > 0 ? i / last : 1) * 100;
  const go = (n) => {
    setI(n);
    setFlash((f) => f + 1);
  };

  return (
    <div className="tz-evo">
      <div className="tz-evo-left">
        <div className="tz-orbwrap">
          <Mascot key={flash} level={i} total={stages.length} />
          {flash > 0 && <span key={`f${flash}`} className="tz-flash" aria-hidden="true" />}
        </div>
        {last > 0 && (
          <button type="button" className="tz-btn k-y" onClick={() => go(i < last ? i + 1 : 0)}>
            {i < last ? "Evolve!" : "Start over"}
          </button>
        )}
      </div>

      <div className="tz-evo-right">
        <div key={`i${i}`} className={`tz-card tz-swap k-${COL[i % COL.length]}`} aria-live="polite">
          <p className="tz-when">
            Stage {i + 1} of {stages.length} · {e.when}
          </p>
          <h3>{e.role}</h3>
          <p className="tz-org">{e.org}</p>
          <ul className="tz-points">
            {(e.points || []).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        {last > 0 && (
          <ol className="tz-chain" aria-label="Career stages">
            {stages.map((s, k) => (
              <li key={s.role + s.org}>
                <button
                  type="button"
                  className={`tz-mini k-${COL[k % COL.length]}${k === i ? " on" : ""}${k > i ? " locked" : ""}`}
                  style={{ "--ms": `${46 + (k / last) * 22}px` }}
                  aria-label={`Stage ${k + 1}: ${s.role}`}
                  aria-current={k === i ? "step" : undefined}
                  onClick={() => go(k)}
                >
                  {k + 1}
                </button>
                <small>{s.when}</small>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function Evolution3D({ data: d }) {
  const [js, setJs] = useState(false);
  const [theme, setTheme] = useState("light");
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState("");
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState({ msg: "", show: false });
  const [showTop, setShowTop] = useState(false);
  const bar = useRef(null);
  const toastTimer = useRef(0);

  const roles = Array.isArray(d.roles) ? d.roles : [];
  const socials = Array.isArray(d.social) ? d.social : [];
  const work = d.work || [];
  const stages = has(d.experience) ? (REVERSE_EXPERIENCE ? [...d.experience].reverse() : d.experience) : [];
  const devHref = (socials.find(([l]) => /dev/i.test(l)) || socials[0] || [])[1] || "#";
  const posts = (d.posts || []).map((p) =>
    typeof p === "string" ? { title: p, url: devHref } : { ...p, url: p.url || p.href || devHref }
  );

  const present = {
    story: stages.length > 0,
    work: has(work),
    services: has(d.services),
    tools: has(d.stack),
    words: posts.length > 0,
    faq: has(d.faq),
  };
  const order = Object.keys(present).filter((k) => present[k]);
  const num = (id) => pad(order.indexOf(id) + 1);
  const nav = [
    present.story && ["story", "Evolution"],
    present.work && ["work", "Work"],
    present.services && ["services", "Skills"],
    present.tools && ["tools", "Toolbox"],
    present.faq && ["faq", "FAQ"],
    ["hello", "Say hi"],
  ].filter(Boolean);
  const navKey = nav.map(([id]) => id).join();

  useEffect(() => {
    setJs(true);
    let saved = null;
    try {
      saved = localStorage.getItem("tz-theme");
    } catch (e) {
      /* storage unavailable */
    }
    if (!saved && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) saved = "dark";
    if (saved === "dark" || saved === "light") setTheme(saved);
    return () => clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const y = window.scrollY || h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      setShowTop(y > 700);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const els = navKey
      .split(",")
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [navKey]);

  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("tz-theme", next);
    } catch (e) {
      /* ignore */
    }
  };

  const flash = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(d.email);
      flash("Email copied!");
    } catch (e) {
      flash("Couldn’t copy. Select the address instead!");
    }
  };

  /* mouse parallax for the hero scene */
  const moveStage = (e) => {
    if (e.pointerType === "touch" || reduced()) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
    e.currentTarget.style.setProperty("--my", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
  };

  const words = String(d.name || "").split(" ").filter(Boolean);
  const availability = String(d.availability || "").replace(/[!.\s]+$/, "");

  const counts = new Map();
  work.forEach((w) => (w.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([t]) => t);
  const shown = work
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => filter === "All" || (w.tags || []).includes(filter));

  return (
    <div className={`tz${js ? " tz-js" : ""}`} data-theme={theme}>
      <a className="tz-skip" href="#top">Skip to content</a>
      <div className="tz-progress" ref={bar} aria-hidden="true" />

      <header className="tz-nav">
        <a href="#top" className="tz-logo" onClick={() => setMenu(false)}>
          <i aria-hidden="true" />
          {d.name}
        </a>
        <nav id="tz-links" className={`tz-links${menu ? " open" : ""}`} aria-label="Sections">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined} onClick={() => setMenu(false)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="tz-actions">
          <button
            type="button"
            className="tz-icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
          <button
            type="button"
            className="tz-icon tz-burger"
            onClick={() => setMenu((m) => !m)}
            aria-expanded={menu}
            aria-controls="tz-links"
            aria-label={menu ? "Close menu" : "Open menu"}
          >
            <span aria-hidden="true">{menu ? "✕" : "☰"}</span>
          </button>
        </div>
      </header>

      <main id="top">
        {/* ----- hero: 3D scene ----- */}
        <div className="tz-stage" onPointerMove={moveStage}>
          <div className="tz-deco" aria-hidden="true">
            <i className="tz-sph k-p a" />
            <i className="tz-sph k-s b" />
            <i className="tz-sph k-m c" />
            <i className="tz-sph k-y d" />
            <i className="tz-ring" />
            <div className="tz-cubewrap">
              <div className="tz-cube">
                <b className="k-p f1">★</b>
                <b className="k-y f2">✦</b>
                <b className="k-s f3">●</b>
                <b className="k-m f4">▲</b>
                <b className="k-v f5">■</b>
                <b className="k-p f6">♥</b>
              </div>
            </div>
          </div>

          <section className="tz-hero tz-wrap">
            <div className="tz-intro">
              {availability && (
                <p className="tz-pill">
                  <i aria-hidden="true" />
                  {availability}!
                </p>
              )}
              <h1>
                {words.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </h1>
              {roles.length > 0 && (
                <ul className="tz-roles" aria-label="Roles">
                  {roles.map((r, i) => (
                    <li key={r} className={`k-${COL[(i + 2) % COL.length]}`}>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
              <p className="tz-lede">{d.headline}</p>
              <div className="tz-cta">
                <a className="tz-btn k-y" href="#work">See my work</a>
                {d.cv && (
                  <a className="tz-btn" href={d.cv} download>
                    Get my CV
                  </a>
                )}
              </div>
            </div>

            <div className="tz-photo-wrap">
              <Tilt max={10}>
                <Mascot wave level={Math.max(0, stages.length - 1)} total={stages.length} className="tz-mascot-hero" />
                <figure className="tz-card tz-photo k-w">
                  <img src={d.photo} alt={d.fullName} decoding="async" />
                  <figcaption>{d.fullName}</figcaption>
                  <span className="tz-lv k-y" aria-hidden="true">
                    Lv.{Math.max(1, stages.length)}
                  </span>
                </figure>
              </Tilt>
            </div>
          </section>
        </div>

        {/* ----- stats as glossy orbs ----- */}
        {has(d.metrics) && (
          <div className="tz-wrap tz-stats">
            {d.metrics.map((m, i) => (
              <Reveal key={m.label} delay={i * 90}>
                <div className={`tz-gem k-${COL[i % COL.length]}`} style={{ "--bd": `${i * -0.7}s` }}>
                  <b>
                    <CountUp value={m.value} />
                  </b>
                  <small>{m.label}</small>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* ----- evolution ----- */}
        {present.story && (
          <Page id="story" n={num("story")} title="My evolution">
            <Evolver stages={stages} />
          </Page>
        )}

        {/* ----- work ----- */}
        {present.work && (
          <Page id="work" n={num("work")} title="Things I made">
            {tags.length > 1 && work.length > 2 && (
              <div className="tz-filter" role="group" aria-label="Filter projects by tag">
                {["All", ...tags].map((t) => (
                  <button key={t} type="button" className="tz-chip" aria-pressed={filter === t} onClick={() => setFilter(t)}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            <div className="tz-grid">
              {shown.map(({ w, i }) => {
                const href = w.url || w.link || w.href;
                return (
                  <Reveal key={w.title}>
                    <Tilt>
                      <article className={`tz-card tz-work k-${COL[i % COL.length]}`}>
                        <span className="tz-num" aria-hidden="true">{pad(i + 1)}</span>
                        <h3>{w.title}</h3>
                        <p>{w.summary}</p>
                        <ul className="tz-tags">
                          {(w.tags || []).map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                        <p className="tz-res">{w.result}</p>
                        {href && (
                          <a className="tz-link" href={href} target="_blank" rel="noopener noreferrer">
                            Take a look ↗
                          </a>
                        )}
                      </article>
                    </Tilt>
                  </Reveal>
                );
              })}
            </div>
          </Page>
        )}

        {/* ----- services ----- */}
        {present.services && (
          <Page id="services" n={num("services")} title="Skills unlocked">
            <div className="tz-grid">
              {d.services.map((x, i) => (
                <Reveal key={x.title} delay={i * 80}>
                  <Tilt>
                    <div className={`tz-card tz-serv k-${COL[(i + 1) % COL.length]}`}>
                      <span className="tz-badge" aria-hidden="true">{pad(i + 1)}</span>
                      <h3>{x.title}</h3>
                      <p>{x.body}</p>
                    </div>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Page>
        )}

        {/* ----- toolbox: brick chips ----- */}
        {present.tools && (
          <Page id="tools" n={num("tools")} title="My toolbox">
            <div className="tz-grid">
              {d.stack.map(([g, items], i) => (
                <Reveal key={g} delay={i * 70}>
                  <div className="tz-card tz-belt">
                    <h3>{g}</h3>
                    <ul className="tz-bricks">
                      {(items || []).map((it, k) => (
                        <li key={it} className={`k-${COL[(i + k) % COL.length]}`}>
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
            {d.education && (
              <p className="tz-edu">
                <span>School</span> {d.education.degree}, {d.education.school}, {d.education.when}
              </p>
            )}
          </Page>
        )}

        {/* ----- writing ----- */}
        {present.words && (
          <Page id="words" n={num("words")} title="Words I wrote">
            <div className="tz-grid">
              {posts.map((p, i) => (
                <Reveal key={p.title} delay={i * 70}>
                  <Tilt>
                    <a className={`tz-card tz-post k-${COL[(i + 3) % COL.length]}`} href={p.url} target="_blank" rel="noopener noreferrer">
                      <b aria-hidden="true">{pad(i + 1)}</b>
                      <span className="tz-post-t">{p.title}</span>
                      <span className="tz-post-s">{/dev\.to/i.test(p.url) ? "Read on Dev.to" : "Read the post"}</span>
                    </a>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </Page>
        )}

        {/* ----- faq ----- */}
        {present.faq && (
          <Page id="faq" n={num("faq")} title="Questions?">
            <div className="tz-faq">
              {d.faq.map((f) => (
                <details key={f.q} name="tz-faq" className="tz-card">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </Page>
        )}

        {/* ----- contact ----- */}
        <section id="hello" className="tz-sec tz-wrap">
          <div className="tz-card tz-end k-p">
            <i className="tz-sph k-y a" aria-hidden="true" />
            <i className="tz-sph k-s b" aria-hidden="true" />
            <h2>Let’s make something fun!</h2>
            <p>Open to full-time roles, contract builds and teaching. I reply to every email.</p>
            <div className="tz-cta">
              <a className="tz-btn k-y" href={`mailto:${d.email}`}>
                {d.email}
              </a>
              <button type="button" className="tz-btn" onClick={copyEmail}>
                Copy email
              </button>
              {socials.map(([l, h]) => (
                <a key={l} className="tz-btn" href={h} target="_blank" rel="noopener noreferrer">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="tz-wrap tz-foot">
        © {new Date().getFullYear()} {d.fullName}. Still evolving…
      </footer>

      <a href="#top" className={`tz-top${showTop ? " show" : ""}`} aria-label="Back to top" tabIndex={showTop ? 0 : -1}>
        <span aria-hidden="true">↑</span>
      </a>
      <div className={`tz-toast${toast.show ? " show" : ""}`} role="status" aria-live="polite">
        {toast.msg}
      </div>
    </div>
  );
}