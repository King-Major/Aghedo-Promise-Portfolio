import { worlds } from "../worlds";
import { go } from "./go";
import "./switcher.css";

export default function WorldSwitcher({ current, onSwitch, onPreload }) {
  return (
    <nav className="switcher" aria-label="Switch portfolio style">
      {worlds.map((w) =>
        w.ready ? (
          <a
            key={w.id}
            href={`?world=${w.id}`}
            aria-current={w.id === current ? "page" : undefined}
            onClick={(e) => go(e, onSwitch, w.id)}
            onPointerEnter={() => onPreload?.(w.id)}
            onFocus={() => onPreload?.(w.id)}
          >
            {w.name}
          </a>
        ) : (
          <span key={w.id} aria-disabled="true" title="Coming soon">{w.name}</span>
        )
      )}
      <a className="all" href="?" onClick={(e) => go(e, onSwitch, null)}>All styles</a>
    </nav>
  );
}