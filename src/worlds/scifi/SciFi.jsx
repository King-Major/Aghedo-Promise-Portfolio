import { useEffect, useRef, useState } from "react";
import "./scifi.css";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GLYPHS = "01<>/\\[]{}#$%&*+=?";

/** Decodes text left-to-right the first time it scrolls into view. */
function Scramble({ text, as: Tag = "span", ...rest }) {
  const ref = useRef();
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (reduced) return;
    let id;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let f = 0;
      const total = 22;
      id = setInterval(() => {
        const keep = Math.floor((f / total) * text.length);
        setOut(text.split("").map((c, i) => (i < keep || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
        if (++f > total) { clearInterval(id); setOut(text); }
      }, 32);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); clearInterval(id); };
  }, [text]);
  return <Tag ref={ref} aria-label={text} {...rest}><span aria-hidden="true">{out}</span></Tag>;
}

function Clock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <>{t.toISOString().slice(11, 19)} UTC</>;
}

const Sec = ({ id, tag, title, children }) => (
  <section id={id} className="sf-sec"><div className="sf-wrap">
    <p className="sf-tag">{tag}</p>
    <h2><Scramble text={title} /></h2>
    {children}
  </div></section>
);

export default function SciFi({ data: d }) {
  return (
    <div className="sf">
      <div className="sf-scan" aria-hidden="true" />
      <header className="sf-bar">
        <span><i />SYS.STATUS // ONLINE</span>
        <nav aria-label="Sections">{["log", "projects", "modules", "comms"].map((s) => <a key={s} href={`#${s}`}>{s}</a>)}</nav>
        <span className="sf-clock"><Clock /></span>
      </header>

      <main>
        <div className="sf-hero sf-wrap">
          <div>
            <p className="sf-tag">OPERATOR // {d.location.toUpperCase()}</p>
            <h1><Scramble text={d.name.toUpperCase()} /></h1>
            <p className="sf-roles">{d.roles.map((r) => `> ${r}`).join("\n")}</p>
            <p className="sf-lede">{d.headline}</p>
            <div className="sf-cta">
              <a className="sf-btn p" href="#projects">VIEW PROJECTS</a>
              <a className="sf-btn" href={d.cv} download>DOWNLOAD CV</a>
            </div>
          </div>
          <figure className="sf-photo">
            <img src={d.photo} alt={d.fullName} />
            <i /><i /><i /><i />
            <figcaption>ID: APJ-2026 // CLEARANCE: OPEN</figcaption>
          </figure>
        </div>

        <div className="sf-wrap sf-telemetry">
          {d.metrics.map((m, i) => (
            <div key={m.label}><b>{m.value}</b><span>{m.label}</span><em>CH.{String(i + 1).padStart(2, "0")}</em></div>
          ))}
        </div>

        <Sec id="log" tag="MISSION LOG" title="EXPERIENCE">
          <ol className="sf-log">
            {d.experience.map((e) => (
              <li key={e.role + e.org}>
                <time>{e.when}</time>
                <div><h3>{e.role}</h3><p className="org">@ {e.org}</p>
                  <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul></div>
              </li>
            ))}
          </ol>
        </Sec>

        <Sec id="projects" tag="DEPLOYED SYSTEMS" title="PROJECTS">
          <div className="sf-nodes">
            {d.work.map((w, i) => (
              <article key={w.title} className="sf-node">
                <p className="id">NODE-{String(i + 1).padStart(2, "0")}</p>
                <h3>{w.title}</h3>
                <p>{w.summary}</p>
                <ul>{w.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                <p className="res">STATUS: {w.result}</p>
              </article>
            ))}
          </div>
        </Sec>

        <Sec id="services" tag="CAPABILITIES" title="SERVICES">
          <div className="sf-mods">{d.services.map((x) => <div key={x.title}><h3>{x.title}</h3><p>{x.body}</p></div>)}</div>
        </Sec>

        <Sec id="modules" tag="INSTALLED MODULES" title="TOOLKIT">
          <div className="sf-mods">
            {d.stack.map(([g, items]) => (
              <div key={g}><h3>{g}</h3><p>{items.join(" / ")}</p></div>
            ))}
          </div>
          <p className="sf-edu">EDU: {d.education.degree}, {d.education.school}, {d.education.when}</p>
        </Sec>

        <Sec id="signals" tag="TRANSMISSIONS" title="WRITING">
          <ul className="sf-posts">
            {d.posts.map((p) => <li key={p}><a href={d.social[2][1]} target="_blank" rel="noopener noreferrer">{p}<span>READ ON DEV.TO</span></a></li>)}
          </ul>
        </Sec>

        <Sec id="faq" tag="QUERY DATABASE" title="FAQ">
          <div className="sf-faq">{d.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
        </Sec>

        <Sec id="comms" tag="OPEN CHANNEL" title="CONTACT">
          <p className="sf-lede">Open to full-time roles, contract builds and teaching. Send a transmission.</p>
          <div className="sf-cta">
            <a className="sf-btn p" href={`mailto:${d.email}`}>{d.email}</a>
            {d.social.map(([l, h]) => <a key={l} className="sf-btn" href={h} target="_blank" rel="noopener noreferrer">{l.toUpperCase()}</a>)}
          </div>
        </Sec>
      </main>
      <footer className="sf-foot sf-wrap">© 2026 {d.fullName} // END OF TRANSMISSION</footer>
    </div>
  );
}
