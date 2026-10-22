import { useEffect, useRef, useState } from "react";
import { groups, missions, posts, professionalSummary, roles, social, stats } from "./data";
import { reduce, useCountUp, useSky, useSpy } from "./hooks";
import profilePhoto from "./images/Aghedo Oseiwe Promise.webp";
import cvFile from "./cv/Aghedo Oseiwe Promise (1) (1).pdf";

const go = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id).scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
};

function Sky({ page }) {
  const refs = { sky: useRef(), sun: useRef(), stars: useRef() };
  const time = useSky(refs);
  return (
    <>
      <div id="sky" ref={refs.sky} />
      <canvas id="stars" ref={refs.stars} aria-hidden="true" />
      <div id="sun" ref={refs.sun} aria-hidden="true" />
      <div id="ground" aria-hidden="true">
        <svg viewBox="0 0 1200 240" preserveAspectRatio="none">
          <path d="M0 120C150 60 300 150 480 100S800 40 1000 110 1150 90 1200 70V240H0Z" fill="#0a1024" />
          <path d="M0 170C200 120 380 190 600 150S980 110 1200 160V240H0Z" fill="#050813" />
        </svg>
        <div className="panels" />
      </div>
      <Nav time={time} page={page} />
    </>
  );
}

function Nav({ time, page }) {
  const sections = ["about", "stack", "work", "contact"];
  const on = useSpy(page === "home" ? sections : []);
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { label: "Profile", href: "/?page=profile", page: "profile" },
    { label: "About", href: page === "home" ? "#about" : "/#about", section: "about" },
    { label: "Toolkit", href: page === "home" ? "#stack" : "/#stack", section: "stack" },
    { label: "Work", href: page === "home" ? "#work" : "/#work", section: "work" },
    { label: "Writing", href: "/?page=writing", page: "writing" },
    { label: "Contact", href: page === "home" ? "#contact" : "/#contact", section: "contact" },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <nav aria-label="Primary" className={menuOpen ? "nav-open" : ""}>
      <a className="nav-brand" href="/">Aghedo Promise</a>
      <ul id="primary-navigation" className="nav-links">
        {links.map(({ label, href, page: targetPage, section }) => (
          <li key={label}>
            <a
              href={href}
              className={(targetPage === page || section === on) ? "on" : ""}
              onClick={(event) => {
                if (section && page === "home") go(section)(event);
                setMenuOpen(false);
              }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
      <div className="clock" title="The sky follows the day as you scroll"><i />Kebbi · {time}</div>
      <button
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  );
}

function Role() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((n) => (n + 1) % roles.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="role" aria-label={roles.join(", ")}>
      <span key={i}>{roles[i]}</span>
    </p>
  );
}

function Stat({ to, pre = "", label, display }) {
  const ref = useRef();
  const n = useCountUp(ref, to);
  return (
    <div className="stat" ref={ref}>
      <b>{display ?? pre + n.toLocaleString("en-US")}</b>
      <span>{label}</span>
    </div>
  );
}

const Tags = ({ items }) => (
  <ul className="tg">{items.map((t) => <li key={t}>{t}</li>)}</ul>
);

export default function App() {
  const pageParam = new URLSearchParams(window.location.search).get("page");
  const page = pageParam === "profile" || pageParam === "writing" ? pageParam : "home";

  return (
    <>
      <Sky page={page} />
      {page === "home" && <header className="hero">
        <div className="wrap hero-layout">
          <div className="hero-copy">
            <p className="live"><i />Available for projects and hiring</p>
            <h1>Aghedo<br />Promise</h1>
            <Role />
            <p className="lede">I build web and mobile products that hold up in the real world, and I teach people to do the same. Working from Kebbi State, Nigeria, on solar power.</p>
            <div className="cta">
              <a className="btn p" href="#work" onClick={go("work")}>See my work</a>
              <a className="btn" href="#contact" onClick={go("contact")}>Get in touch</a>
            </div>
          </div>
          <div className="hero-portrait">
            <img src={profilePhoto} alt="Aghedo Oseiwe Promise" loading="eager" />
          </div>
        </div>
      </header>}

      <main className={page === "home" ? "" : "subpage"}>
        {page === "profile" && <section className="sec profile-page">
          <div className="wrap">
            <article className="glass profile">
              <div className="profile-top">
                <img className="profile-photo" src={profilePhoto} alt="Aghedo Oseiwe Promise" />
                <div className="profile-heading">
                  <p className="eyebrow">Academy, Creative Tech &amp; Ministry</p>
                  <h2>Professional summary</h2>
                  <a className="btn p cv-download" href={cvFile} download="Aghedo Oseiwe Promise CV.pdf">Download my CV <span aria-hidden="true">↓</span></a>
                </div>
              </div>
              <div className="profile-copy">
                {professionalSummary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </article>
          </div>
        </section>}

        {page === "writing" && <section className="sec writing-page">
          <div className="wrap">
            <p className="eyebrow">Notes from the build</p>
            <h1 className="page-title">Writing for developers</h1>
            <p className="page-lede">Practical lessons from building products, solving real-world problems, and sharing what I learn along the way.</p>
            <div className="writing-list">
              {posts.map((title) => (
                <a className="glass post" key={title} href="https://dev.to/aghedopromise" target="_blank" rel="noopener noreferrer">
                  <span>{title}</span><em>Read on Dev.to <span aria-hidden="true">↗</span></em>
                </a>
              ))}
            </div>
          </div>
        </section>}

        {page === "home" && <>
        <section className="sec" id="about">
          <div className="wrap">
            <div className="glass about">
              <div>
                <h2>Code, data, and a classroom</h2>
                <p><strong>Aghedo Oseiwe Promise</strong>, a BEng graduate in Information and Communication Technology, ships MERN stack web apps and offline-first React Native apps.</p>
                <p>He also cleans and maps health data for field teams, and runs King’s Code Academy, where he teaches with patience and real projects instead of slides.</p>
                <p>At university he led the final-year engineering cohort’s tech team and served as PRO of NUESA.</p>
              </div>
              <div className="stats">{stats.map((s) => <Stat key={s.label} {...s} />)}</div>
            </div>
          </div>
        </section>

        <section className="sec" id="stack">
          <div className="wrap">
            <h2>The toolkit</h2>
            <div className="groups">
              {groups.map(([title, color, items]) => (
                <div className="glass group" key={title} style={{ "--c": color }}>
                  <h3>{title}</h3>
                  <ul className="chips">{items.map((i) => <li key={i}>{i}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="work">
          <div className="wrap">
            <h2>Work</h2>
            <div className="work">
              {missions.map((m) => (
                <article className="glass card" key={m.title}>
                  <h3>{m.title}</h3>
                  <p>{m.body}</p>
                  <small>{m.meta}</small>
                  <Tags items={m.tags} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact" id="contact">
          <div className="wrap">
            <div className="contact-panel glass">
              <div className="contact-copy">
                <p className="eyebrow">Have a project in mind?</p>
                <h2>Let’s make<br />something matter.</h2>
                <p>Open to meaningful projects, thoughtful collaborations, and conversations about learning and technology.</p>
                <span className="contact-status"><i />Based in Kebbi, Nigeria · Open to opportunities</span>
              </div>
              <div className="contact-links" aria-label="Connect with Aghedo">
                {social.map(([label, href]) => (
                  <a key={label} className="contact-link" href={href} target="_blank" rel="noopener noreferrer">
                    <span className={"contact-symbol " + label.toLowerCase().replace(".", "")} aria-hidden="true">{label === "LinkedIn" ? "in" : label === "GitHub" ? "GH" : "DEV"}</span>
                    <span className="contact-link-text"><b>{label}</b><small>{label === "LinkedIn" ? "Professional network" : label === "GitHub" ? "Code and projects" : "Articles and notes"}</small></span>
                    <span className="contact-arrow" aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
        </>}
      </main>

      <footer>
        <p>© 2026 Aghedo Oseiwe Promise. Founder of King’s Code Academy.</p>
        <a href={page === "home" ? "#" : "/"} onClick={page === "home" ? (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); } : undefined}>{page === "home" ? "Back to top" : "Back home"}</a>
      </footer>
    </>
  );
}
