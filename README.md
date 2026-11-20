# Portfolio Worlds
One content file, multiple visual "worlds".
- `src/data/portfolio.js` – all copy, projects, links (edit here only)
- `src/worlds.js` – registry of worlds; `src/App.jsx` – lazy-loaded routes (`/?world=professional`)
- `src/worlds/professional/` – the finished Professional world
- To add a world: create `src/worlds/<id>/`, register it in `App.jsx`, set `ready: true` in `worlds.js`.

    npm install && npm run dev
