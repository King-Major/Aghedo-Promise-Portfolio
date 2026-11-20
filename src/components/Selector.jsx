import { worlds } from "../worlds";
import { go } from "./go";
import "./selector.css";

// Each tile previews its own world, so the choice is visual rather than a label to decode.
function Preview({ id }) {
  return (
    <div className={`pv pv-${id}`} aria-hidden="true">
      {id === "3d" && (
        <div className="cube"><i /><i /><i /><i /><i /><i /></div>
      )}
    </div>
  );
}

export default function Selector({ onSelect, onPreload }) {
  return (
    <main className="sel">
      <header>
        <h1>Choose how to see my work</h1>
        <p>Same projects, four ways to look at them. You can switch at any time.</p>
      </header>

      <div className="sel-grid">
        {worlds.map((w) => {
          const body = (
            <>
              <Preview id={w.id} />
              <div className="cap">
                <b>{w.name}</b>
                <span>{w.blurb}</span>
                {!w.ready && <em className="soon">Coming soon</em>}
              </div>
            </>
          );
          return w.ready ? (
            <a
              key={w.id}
              className={`tile t-${w.id}`}
              href={`?world=${w.id}`}
              onClick={(e) => go(e, onSelect, w.id)}
              onPointerEnter={() => { onPreload?.(w.id); }}
              onFocus={() => { onPreload?.(w.id); }}
            >
              {body}
            </a>
          ) : (
            <div key={w.id} className={`tile off t-${w.id}`} aria-disabled="true">
              {body}
            </div>
          );
        })}
      </div>
    </main>
  );
}