# Aghedo Promise — Portfolio (React + Vite)

A one-page portfolio where the sky follows a full day as you scroll: sunrise in the hero, midday in the toolkit, golden hour in the work section, and a starry night at the contact section.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # preview the build
```

## Edit your content

Everything you would change lives in `src/data.js` (stats, toolkit, projects, articles, links).
Styles are in `src/styles.css`; scroll-driven sky logic is in `src/hooks.js`.

## Deploy

Push to GitHub and import the repo into Vercel or Netlify. Build command `npm run build`, output directory `dist`.
