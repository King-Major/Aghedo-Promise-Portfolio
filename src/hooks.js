import { useEffect, useState } from "react";

export const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const KEYS = [[0, "#141c52", "#ff9b5e"], [0.33, "#1f6fd8", "#9bdcff"], [0.66, "#3b2f86", "#ff7d45"], [1, "#04061a", "#1a2360"]];
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function skyAt(p) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
  const [a, b] = [KEYS[i], KEYS[i + 1]];
  const t = Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0])));
  return [mix(rgb(a[1]), rgb(b[1]), t), mix(rgb(a[2]), rgb(b[2]), t)];
}

/** Drives the sky gradient, sun, stars and clock from scroll progress. Returns the clock text. */
export function useSky({ sky, sun, stars }) {
  const [time, setTime] = useState("06:00");
  useEffect(() => {
    const [skyEl, sunEl, starsEl] = [sky.current, sun.current, stars.current];
    const drawStars = () => {
      const r = Math.min(devicePixelRatio || 1, 2);
      starsEl.width = innerWidth * r;
      starsEl.height = innerHeight * r;
      const x = starsEl.getContext("2d");
      x.scale(r, r);
      x.fillStyle = "#fff";
      for (let i = 0; i < 170; i++) {
        x.globalAlpha = 0.3 + Math.random() * 0.7;
        x.beginPath();
        x.arc(Math.random() * innerWidth, Math.random() * innerHeight * 0.8, Math.random() * 1.3 + 0.2, 0, 6.283);
        x.fill();
      }
    };
    const update = () => {
      const p = Math.min(1, Math.max(0, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
      const [top, bottom] = skyAt(p);
      skyEl.style.background = `linear-gradient(rgb(${top}),rgb(${bottom}))`;
      const k = Math.sin(Math.PI * p);
      const c = mix([255, 150, 60], [255, 246, 205], Math.min(1, k * 1.4)).join(",");
      sunEl.style.left = 12 + 76 * p + "vw";
      sunEl.style.top = 96 - 82 * k + "vh";
      sunEl.style.background = `radial-gradient(circle,rgba(${c},1) 0 9%,rgba(${c},.55) 15%,rgba(${c},.18) 32%,transparent 62%)`;
      starsEl.style.opacity = Math.min(1, Math.max(0, (p - 0.7) / 0.2));
      const m = Math.round((6 + 14 * p) * 60);
      const pad = (n) => String(n).padStart(2, "0");
      setTime(`${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`);
    };
    const resize = () => { drawStars(); update(); };
    resize();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", resize);
    return () => { removeEventListener("scroll", update); removeEventListener("resize", resize); };
  }, []);
  return time;
}

/** Returns the id of the section currently in the middle of the viewport. */
export function useSpy(ids) {
  const [on, setOn] = useState("");
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setOn(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => io.observe(document.getElementById(id)));
    return () => io.disconnect();
  }, []);
  return on;
}

/** Animates a number from 0 to `to` once the ref'd element is half visible. */
export function useCountUp(ref, to) {
  const [n, setN] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) return;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const run = (t) => {
        const q = Math.min((t - t0) / 1400, 1);
        setN(Math.round(to * (1 - Math.pow(1 - q, 3))));
        if (q < 1) raf = requestAnimationFrame(run);
      };
      raf = requestAnimationFrame(run);
    }, { threshold: 0.6 });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return n;
}
