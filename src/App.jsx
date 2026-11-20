import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { worlds } from "./worlds";
import Selector from "./components/Selector";
import WorldSwitcher from "./components/WorldSwitcher";
import { portfolio } from "./data/portfolio";

// The 3D intro (and three.js with it) is its own chunk, so it never slows the other worlds.
const CrownLoader = lazy(() => import("./components/CrownLoader"));

// Play the intro only when someone lands on the selector (not on a deep link, not with reduced motion).
function shouldPlayIntro() {
  const q = new URLSearchParams(window.location.search);
  if (q.get("world") || q.get("intro") === "0") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* Each world is a dynamic import so heavy ones (3D) never slow the   */
/* others. Keep the loaders in one place so we can both lazy-render    */
/* and preload them on hover.                                          */
/* ------------------------------------------------------------------ */
const loaders = {
  professional: () => import("./worlds/professional/Professional"),
  "3d": () => import("./worlds/threed/ThreeD"),
  scifi: () => import("./worlds/scifi/SciFi"),
  cartoon: () => import("./worlds/cartoon/Cartoon"),
};

const components = Object.fromEntries(
  Object.entries(loaders).map(([id, load]) => [id, lazy(load)])
);

const preloadWorld = (id) => loaders[id]?.();

/* ------------------------------------------------------------------ */
/* Routing: keeps ?world=<id> URLs working, but navigates without a    */
/* full page reload and reacts to the back/forward buttons.            */
/* ------------------------------------------------------------------ */
const subscribe = (cb) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};
const getSearch = () => window.location.search;

function useWorldId() {
  const search = useSyncExternalStore(subscribe, getSearch, () => "");
  const raw = new URLSearchParams(search).get("world");
  // Only trust ids we actually have a component for.
  return raw && raw in components ? raw : null;
}

function navigate(id) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("world", id);
  else url.searchParams.delete("world");
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------------ */
/* Resilience: one broken world must not take the whole site down.     */
/* ------------------------------------------------------------------ */
class WorldBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prev) {
    // Switching worlds clears the error.
    if (prev.worldId !== this.props.worldId && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Notice
        title="This world didn't load"
        body="Something went wrong while opening it. Try again, or pick a different world."
        actions={[
          { label: "Try again", onClick: () => window.location.reload() },
          { label: "Choose another world", onClick: () => navigate(null) },
        ]}
      />
    );
  }
}

/* ------------------------------------------------------------------ */
/* Small UI pieces (inline styles so the shell has no CSS dependency)  */
/* ------------------------------------------------------------------ */
const shell = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: "2rem",
  font: "16px/1.5 system-ui, sans-serif",
  color: "inherit",
  background: "inherit",
};

function Notice({ title, body, actions = [] }) {
  return (
    <main style={shell} role="alert">
      <div style={{ maxWidth: "28rem" }}>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 .5rem" }}>{title}</h1>
        <p style={{ margin: "0 0 1.25rem", opacity: 0.75 }}>{body}</p>
        <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              style={{ padding: ".6rem 1rem", cursor: "pointer", font: "inherit" }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

// Waits briefly before showing anything, so fast loads never flash a loader.
function Loading({ delay = 250 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!show) return null;
  return (
    <div style={shell} role="status" aria-live="polite">
      <p style={{ opacity: 0.7, margin: 0 }}>Loading…</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function App() {
  const id = useWorldId();
  const [intro, setIntro] = useState(shouldPlayIntro);
  const endIntro = useCallback(() => setIntro(false), []);

  // Keep the tab title meaningful per world.
  useEffect(() => {
    const name = worlds?.find?.((w) => w.id === id)?.name;
    const owner = portfolio?.name ?? "Portfolio";
    document.title = name ? `${name} · ${owner}` : owner;
  }, [id]);

  const onSelect = useCallback((next) => navigate(next), []);

  if (intro) {
    return (
      <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "#000" }} />}>
        <CrownLoader onDone={endIntro} />
      </Suspense>
    );
  }

  if (!id) {
    return <Selector onSelect={onSelect} onPreload={preloadWorld} />;
  }

  // The 3D world needs WebGL; fall back gracefully instead of a blank canvas.
  if (id === "3d" && !hasWebGL()) {
    return (
      <Notice
        title="3D isn't available on this device"
        body="Your browser can't run WebGL, which this world needs. The other worlds show the same work."
        actions={[
          { label: "Open the professional view", onClick: () => navigate("professional") },
          { label: "Choose another world", onClick: () => navigate(null) },
        ]}
      />
    );
  }

  const World = components[id];

  return (
    <>
      <WorldBoundary worldId={id}>
        <Suspense fallback={<Loading />}>
          <World data={portfolio} />
        </Suspense>
      </WorldBoundary>
      <WorldSwitcher
        current={id}
        onSwitch={onSelect}
        onPreload={preloadWorld}
      />
    </>
  );
}