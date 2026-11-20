import { useState } from "react";
import "./professional.css";

const Arrow = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5" /></svg>
);
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const icons = {
  case: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  pin: <><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></>,
  repo: <path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zM20 17v4H6.5A2.5 2.5 0 014 18.5" />,
  moon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  link: <><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></>,
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" />,
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
};

const TABS = [["work", "Work"], ["services", "Services"], ["experience", "Experience"], ["about", "About"], ["faq", "FAQ"], ["writing", "Writing"]];
const KINDS = ["client", "collaborator", "recruiter", "other"];

const Block = ({ title, children, className = "" }) => (
  <section className={`pro-block ${className}`}><h2>{title}</h2>{children}</section>
);

const Card = ({ w, kind }) => (
  <article className="pro-repo">
    <header>
      <Icon d={icons.repo} />
      <h3>{w.title}</h3>
      <span className="pro-badge">{kind}</span>
    </header>
    <p className="pro-repo-desc">{w.summary}</p>
    <ul className="pro-meta">{w.tags.map((t) => <li key={t}><i />{t}</li>)}</ul>
    <p className="pro-repo-foot">
      <span>{w.result}</span>
      {w.live && <a href={w.live} target="_blank" rel="noopener noreferrer">Visit live site<Arrow /></a>}
    </p>
  </article>
);

const shortUrl = (h) => h.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export default function Professional({ data: d }) {
  const [tab, setTab] = useState("work");
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark"
  );
  const [form, setForm] = useState({ kind: "client", name: "", email: "", message: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const projects = d.work.filter((w) => !d.products.some((p) => p.title === w.title));
  const [first, ...rest] = d.name.split(" ");
  const devto = d.social.find(([l]) => /dev/i.test(l))?.[1] ?? d.social[2]?.[1] ?? d.social[0]?.[1];
  const go = (t) => { setTab(t); setMenu(false); document.getElementById("tabs")?.scrollIntoView({ behavior: "smooth" }); };

  const contacts = [
    ["Email", d.email, `mailto:${d.email}`, icons.mail],
    ...(d.phone ? [["Phone", d.phone, `tel:${d.phone.replace(/\s/g, "")}`, icons.phone]] : []),
    ...d.social.map(([l, h]) => [l, shortUrl(h), h, icons.link]),
  ];

  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Project enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n${form.name} (${form.kind})\n${form.email}`);
    window.location.href = `mailto:${d.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="pro" data-theme={theme}>
      <header className="pro-bar">
        <div className="pro-col pro-bar-in">
          <a href="#top" className="pro-brand">
            <img src={d.photo} alt="" />
            <span><b>{first}</b> {rest.join(" ")}</span>
          </a>
          <nav className="pro-nav" aria-label="Sections">
            {[["services", "Services"], ["work", "Products"], ["experience", "Experience"], ["about", "About"], ["faq", "FAQ"]].map(([t, l]) => <button key={t} onClick={() => go(t)}>{l}</button>)}
            <a href="#contact">Contact</a>
          </nav>
          <button className="pro-icon pro-menu-btn" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon d={icons.menu} /></button>
          <button className="pro-icon" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Icon d={theme === "dark" ? icons.sun : icons.moon} />
          </button>
          <a className="pro-btn sm" href={`mailto:${d.email}`}>Hire me</a>
        </div>
        {menu && (
          <nav className="pro-menu pro-col" aria-label="Menu">
            {TABS.map(([t, l]) => <button key={t} onClick={() => go(t)}>{l}</button>)}
            <a href={d.cv} download>Download CV (PDF)</a>
            <a href="#contact" onClick={() => setMenu(false)}>Contact</a>
          </nav>
        )}
      </header>

      <section id="top" className="pro-banner">
        <div className="pro-col">
          <h1>{d.headline || `${d.roles[0]} who ships and teaches.`}</h1>
          <p>{d.tagline || d.intro}</p>
        </div>
      </section>

      <main className="pro-col pro-layout">
        <aside className="pro-side">
          <div className="pro-who">
            <img src={d.photo} alt={d.fullName} />
            <div><h2>{d.fullName}</h2><p>{d.roles.join(" and ")}</p></div>
          </div>

          <ul className="pro-info">
            <li><Icon d={icons.case} /><span><i className="pro-dot" />{d.availability}</span></li>
            <li><Icon d={icons.mail} /><a href={`mailto:${d.email}`}>{d.email}</a></li>
            <li><Icon d={icons.pin} />{d.location}</li>
          </ul>

          <div className="pro-actions">
            <a className="pro-btn" href={`mailto:${d.email}`}>Communicate with me</a>
            <a className="pro-btn ghost" href={d.cv} download><Icon d={icons.download} size={15} />&nbsp;CV (PDF)</a>
          </div>

          <Block title="Stats" className="pro-side-block">
            <dl className="pro-stats">
              {d.metrics.map((m) => <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}
            </dl>
          </Block>

          <Block title="On the web" className="pro-side-block">
            <ul className="pro-web">
              {d.social.map(([l, h]) => <li key={l}><a href={h} target="_blank" rel="noopener noreferrer">{l}<Arrow /></a></li>)}
            </ul>
          </Block>
        </aside>

        <div className="pro-main">
          <div id="tabs" className="pro-tabs" role="tablist">
            {TABS.map(([t, l]) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{l}</button>
            ))}
          </div>

          <div className="pro-panel" role="tabpanel">
            {tab === "work" && (
              <>
                <Block title="Products built"><div className="pro-cards">{d.products.map((p) => <Card key={p.title} w={p} kind="Product" />)}</div></Block>
                <Block title="Selected projects"><div className="pro-cards">{projects.map((w) => <Card key={w.title} w={w} kind="Project" />)}</div></Block>
              </>
            )}

            {tab === "services" && (
              <Block title="Services">
                <ul className="pro-services">
                  {d.services.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.body}</p></li>)}
                </ul>
              </Block>
            )}

            {tab === "experience" && (
              <Block title="Work experience">
                <ol className="pro-timeline">
                  {d.experience.map((e) => (
                    <li key={e.role + e.org}>
                      <div className="when">{e.when}</div>
                      <div>
                        <h3>{e.role}</h3><p className="org">{e.org}</p>
                        <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
                      </div>
                    </li>
                  ))}
                </ol>
              </Block>
            )}

            {tab === "about" && (
              <>
                <Block title="About"><div className="pro-prose">{d.summary.map((p) => <p key={p}>{p}</p>)}</div></Block>
                <Block title="Toolkit">
                  <dl className="pro-stack">{d.stack.map(([g, items]) => <div key={g}><dt>{g}</dt><dd>{items.join(", ")}</dd></div>)}</dl>
                </Block>
                <Block title="Education">
                  <p className="pro-prose"><b>{d.education.degree}</b><br />{d.education.school}, {d.education.when}</p>
                  <ul className="pro-bullets">{d.courses.map((c) => <li key={c}>{c}</li>)}</ul>
                </Block>
              </>
            )}

            {tab === "faq" && (
              <Block title="Frequently asked questions">
                <div className="pro-faq">{d.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
              </Block>
            )}

            {tab === "writing" && (
              <Block title="Writing">
                <ul className="pro-posts">
                  {d.posts.map((p) => <li key={p}><a href={devto} target="_blank" rel="noopener noreferrer"><span>{p}</span><small>Read on Dev.to <Arrow /></small></a></li>)}
                </ul>
              </Block>
            )}
          </div>
        </div>
      </main>

      <section id="contact" className="pro-contact">
        <div className="pro-col">
          <h2>Let’s work together</h2>
          <p className="pro-lead">Based in {d.location}. Open to full-time roles, contract builds and teaching engagements, remote or on site.</p>

          <div className="pro-contact-grid">
            <ul className="pro-rows">
              {contacts.map(([label, value, href, ic]) => (
                <li key={label}>
                  <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <span className="pro-tile"><Icon d={ic} /></span>
                    <b>{label}</b>
                    <span className="pro-val">{value}</span>
                  </a>
                </li>
              ))}
            </ul>

            <form className="pro-form" onSubmit={submit}>
              <fieldset>
                <legend>I am a</legend>
                <div className="pro-chips" role="radiogroup" aria-label="I am a">
                  {KINDS.map((k) => (
                    <button type="button" key={k} role="radio" aria-checked={form.kind === k} onClick={() => setForm({ ...form, kind: k })}>{k}</button>
                  ))}
                </div>
              </fieldset>
              <div className="pro-fields">
                <label>Name<input required value={form.name} onChange={set("name")} placeholder="Your name" autoComplete="name" /></label>
                <label>Email<input required type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" /></label>
              </div>
              <label>Message<textarea required rows={6} value={form.message} onChange={set("message")} placeholder="Tell me about your project…" /></label>
              <button className="pro-btn pro-send" type="submit"><Icon d={icons.send} size={16} />&nbsp;Send message</button>
              <p className="pro-note">This opens your email app with the message filled in.</p>
            </form>
          </div>
        </div>
      </section>

      <footer className="pro-foot">
        <div className="pro-col pro-foot-in">
          <span>© 2026 {d.fullName}. Founder of King’s Code Academy.</span>
          <nav aria-label="Footer">
            <a href="#top">Back to top</a>
            {d.social.slice(0, 3).map(([l, h]) => <a key={l} href={h} target="_blank" rel="noopener noreferrer">{l}</a>)}
          </nav>
        </div>
      </footer>
    </div>
  );
}