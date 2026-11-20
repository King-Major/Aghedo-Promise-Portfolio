import { Suspense, useMemo, useRef, useState, useEffect, useContext, createContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll, Float, RoundedBox, Environment, Lightformer, MeshReflectorMaterial, Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";
import "./threed.css";

/*
  The Lagoon: you travel across stepping-stone islands on still water at golden hour.
  Every station is a real object with its own prop (a medal, pillars, phone / browser / books, steps, sculptures, a
  constellation, an envelope). All text is HTML on top, so it is always sharp, selectable and never overlaps.
*/

const MathUtils = THREE.MathUtils;
const COLORS = ["#ffc61a", "#ff6b4a", "#7fd6e8", "#9be08a", "#f4a6d0"]; // danfo yellow, coral, lagoon sky, leaf, hibiscus
const INK = "#10222a", PAPER = "#f4f1e8", HORIZON = "#58b9b4", DEEP = "#0a2c38", WATER = "#0b4b57";
const S = 9; // distance between islands
const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const col = (i) => COLORS[((i % COLORS.length) + COLORS.length) % COLORS.length];
const Flow = createContext(null); // { f: eased station index, a: visibility per station }

const Glossy = ({ c, ...p }) => <meshPhysicalMaterial color={c} roughness={0.28} clearcoat={1} clearcoatRoughness={0.12} {...p} />;

let blobTex;
const blob = () => (blobTex ??= (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})());

/* ───────────── world ───────────── */
function Sky() {
  const g = useRef(), { camera } = useThree();
  const uniforms = useMemo(() => ({ top: { value: new THREE.Color(DEEP) }, hor: { value: new THREE.Color(HORIZON) } }), []);
  useFrame(() => g.current.position.copy(camera.position));
  return (
    <mesh ref={g} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[220, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} toneMapped={false} uniforms={uniforms}
        vertexShader="varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
        fragmentShader={`varying vec3 v;uniform vec3 top,hor;
          void main(){
            vec3 d=normalize(v);
            vec3 c=mix(hor,top,smoothstep(0.,.6,d.y));
            float s=max(dot(d,normalize(vec3(.15,.16,-1.))),0.);
            c+=vec3(1.,.62,.25)*pow(s,18.)*.55;
            c=mix(c,vec3(1.,.95,.75),smoothstep(.9988,.9994,s));
            gl_FragColor=vec4(c,1.);
            #include <colorspace_fragment>
          }`} />
    </mesh>
  );
}

function Island({ c }) {
  return (
    <group>
      <mesh position-y={-0.2}><cylinderGeometry args={[3.2, 3.3, 0.4, 64]} /><Glossy c={PAPER} roughness={0.55} clearcoat={0.3} /></mesh>
      <mesh rotation-x={Math.PI / 2} position-y={0.01}><torusGeometry args={[3.02, 0.04, 12, 96]} /><meshBasicMaterial color={c} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}><planeGeometry args={[5.2, 5.2]} /><meshBasicMaterial map={blob()} transparent depthWrite={false} /></mesh>
    </group>
  );
}

/** Grows the station's prop in when the camera arrives, shrinks it away when it leaves. */
function Pop({ i, children }) {
  const flow = useContext(Flow), g = useRef();
  useFrame(() => {
    const a = 1 - MathUtils.smoothstep(Math.abs(flow.f - i), 0.1, 0.9), e = 1 - Math.pow(1 - a, 3);
    flow.a[i] = a;
    g.current.visible = a > 0.002;
    g.current.scale.setScalar(0.001 + e);
    g.current.position.y = (1 - e) * -1.2;
  });
  return <group ref={g} visible={false}>{children}</group>;
}

/* ───────────── props, one per kind of station ───────────── */
function Hero({ photo }) {
  const g = useRef(), orbit = useRef(), { pointer } = useThree(), map = useTexture(photo);
  const tex = useMemo(() => {
    const t = map.clone(), asp = map.image.width / map.image.height;
    t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
    if (asp > 1) { t.repeat.set(1 / asp, 1); t.offset.set((1 - 1 / asp) / 2, 0); }
    else { t.repeat.set(1, asp); t.offset.set(0, (1 - asp) * 0.65); } // keep the face in frame
    return t;
  }, [map]);
  useFrame((_, dt) => {
    const k = reduced ? 0 : 1;
    g.current.rotation.y = MathUtils.damp(g.current.rotation.y, pointer.x * 0.45 * k, 3, dt);
    g.current.rotation.x = MathUtils.damp(g.current.rotation.x, -pointer.y * 0.25 * k, 3, dt);
    orbit.current.rotation.y += dt * 0.5 * k;
  });
  return (
    <group position-y={2.3}>
      <Float speed={reduced ? 0 : 1.2} floatIntensity={0.5} rotationIntensity={0}>
        <group ref={g}>
          <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[1.5, 1.5, 0.24, 72]} /><Glossy c={COLORS[0]} /></mesh>
          <mesh position-z={0.13}><circleGeometry args={[1.3, 64]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
          <mesh position-z={0.125}><ringGeometry args={[1.3, 1.36, 64]} /><meshBasicMaterial color={INK} /></mesh>
        </group>
      </Float>
      <group ref={orbit}>
        <mesh position={[2.6, 0.5, 0]}><sphereGeometry args={[0.32, 32, 32]} /><Glossy c={COLORS[1]} /></mesh>
        <mesh position={[-2.9, -0.4, 0.6]}><sphereGeometry args={[0.2, 32, 32]} /><Glossy c={INK} /></mesh>
        <mesh position={[0.4, 1.9, -2.2]} rotation={[0.5, 0.5, 0]}><boxGeometry args={[0.4, 0.4, 0.4]} /><Glossy c={COLORS[2]} /></mesh>
        <mesh rotation={[1.2, 0.2, 0]}><torusGeometry args={[2.4, 0.03, 12, 128]} /><meshBasicMaterial color={PAPER} transparent opacity={0.75} /></mesh>
      </group>
    </group>
  );
}

function Grow({ i, count, delay = 0.2, children }) { // children(k) -> element; each grows upward in turn
  const flow = useContext(Flow), refs = useRef([]);
  useFrame(() => { const a = flow.a[i]; refs.current.forEach((g, k) => g && (g.scale.y = 0.02 + MathUtils.clamp(a * 1.8 - k * delay, 0, 1))); });
  return Array.from({ length: count }, (_, k) => <group key={k} ref={(el) => (refs.current[k] = el)}>{children(k)}</group>);
}

function Pillars({ i, count }) {
  const sp = Math.min(1.4, 5.4 / count);
  return (
    <group>
      <Grow i={i} count={count}>
        {(k) => { const h = 1.1 + k * 0.75; return (
          <group position-x={(k - (count - 1) / 2) * sp}>
            <RoundedBox args={[sp * 0.76, h, sp * 0.76]} radius={0.18} smoothness={4} position-y={h / 2}><Glossy c={col(k)} /></RoundedBox>
          </group>
        ); }}
      </Grow>
    </group>
  );
}

function Steps({ i, count }) {
  const sp = Math.min(1.25, 5.4 / count);
  return (
    <group>
      <Grow i={i} count={count} delay={0.25}>
        {(k) => { const h = 0.55 + k * 0.5; return (
          <group position-x={(k - (count - 1) / 2) * sp}>
            <RoundedBox args={[sp * 0.92, h, 1.7]} radius={0.12} smoothness={4} position-y={h / 2}><Glossy c={k === count - 1 ? COLORS[0] : PAPER} /></RoundedBox>
            {k === count - 1 && (
              <group position-y={h}>
                <mesh position-y={0.6}><cylinderGeometry args={[0.035, 0.035, 1.2, 12]} /><Glossy c={INK} /></mesh>
                <mesh position={[0.3, 0.95, 0]}><boxGeometry args={[0.56, 0.36, 0.04]} /><Glossy c={COLORS[1]} /></mesh>
              </group>
            )}
          </group>
        ); }}
      </Grow>
    </group>
  );
}

function Prop({ k }) {
  const c = col(k);
  switch (k % 4) {
    case 0: return ( // phone
      <group>
        <RoundedBox args={[1.1, 2.1, 0.16]} radius={0.15} smoothness={4}><Glossy c={INK} /></RoundedBox>
        <mesh position-z={0.085}><planeGeometry args={[0.92, 1.9]} /><meshBasicMaterial color={c} /></mesh>
        <mesh position={[0, 0.76, 0.09]}><planeGeometry args={[0.32, 0.07]} /><meshBasicMaterial color={INK} /></mesh>
        <mesh position={[0, -0.2, 0.095]}><circleGeometry args={[0.28, 32]} /><meshBasicMaterial color={PAPER} /></mesh>
      </group>
    );
    case 1: return ( // browser window
      <group>
        <RoundedBox args={[2.1, 1.5, 0.14]} radius={0.1} smoothness={4}><Glossy c={PAPER} /></RoundedBox>
        <mesh position={[0, 0.6, 0.075]}><planeGeometry args={[2.1, 0.3]} /><meshBasicMaterial color={c} /></mesh>
        {[-0.85, -0.7, -0.55].map((x) => <mesh key={x} position={[x, 0.6, 0.08]}><circleGeometry args={[0.05, 16]} /><meshBasicMaterial color={INK} /></mesh>)}
        {[[-0.35, 0.15, 1.2], [-0.35, -0.1, 0.9], [-0.35, -0.35, 1.05]].map(([x, y, w]) => <mesh key={y} position={[x, y, 0.08]}><planeGeometry args={[w, 0.12]} /><meshBasicMaterial color={INK} /></mesh>)}
      </group>
    );
    case 2: return ( // books
      <group>
        {[0, 1, 2].map((b) => <RoundedBox key={b} args={[1.8 - b * 0.15, 0.34, 1.25]} radius={0.06} smoothness={3} position={[b % 2 ? 0.1 : -0.1, -0.5 + b * 0.38, 0]} rotation-y={b * 0.25}><Glossy c={col(k + b)} /></RoundedBox>)}
      </group>
    );
    default: return ( // chart
      <group position-y={-0.4}>
        <RoundedBox args={[2.1, 0.14, 1.3]} radius={0.05} smoothness={3}><Glossy c={PAPER} /></RoundedBox>
        {[0.6, 1.0, 1.5].map((h, b) => <RoundedBox key={b} args={[0.4, h, 0.4]} radius={0.08} smoothness={3} position={[-0.6 + b * 0.6, 0.07 + h / 2, 0]}><Glossy c={col(k + b)} /></RoundedBox>)}
      </group>
    );
  }
}

function Props({ count }) {
  const sp = Math.min(2.3, 5.8 / count), sc = Math.min(1, sp / 2.1);
  return (
    <group scale={sc} position-y={1.5}>
      {Array.from({ length: count }, (_, k) => (
        <Float key={k} speed={reduced ? 0 : 1.4} floatIntensity={0.5} rotationIntensity={0.35}>
          <group position-x={(k - (count - 1) / 2) * (sp / sc)}><Prop k={k} /></group>
        </Float>
      ))}
    </group>
  );
}

function Work({ v }) {
  const g = useRef(), c = col(v), c2 = col(v + 2);
  useFrame((_, dt) => { if (!reduced) g.current.rotation.y += dt * 0.5; });
  return (
    <Float speed={reduced ? 0 : 1.3} floatIntensity={0.6} rotationIntensity={0.12}>
      <group ref={g} position-y={2}>
        {v % 5 === 0 && <mesh><torusKnotGeometry args={[0.95, 0.34, 220, 36]} /><Glossy c={c} /></mesh>}
        {v % 5 === 1 && (<>
          <RoundedBox args={[1.9, 0.7, 1.9]} radius={0.16} smoothness={4} position-y={-0.75}><Glossy c={c} /></RoundedBox>
          <RoundedBox args={[1.4, 0.7, 1.4]} radius={0.16} smoothness={4} rotation-y={0.5}><Glossy c={c2} /></RoundedBox>
          <RoundedBox args={[0.9, 0.7, 0.9]} radius={0.16} smoothness={4} position-y={0.75} rotation-y={1}><Glossy c={PAPER} /></RoundedBox>
        </>)}
        {v % 5 === 2 && <mesh><icosahedronGeometry args={[1.35, 0]} /><Glossy c={c} flatShading metalness={0.15} /></mesh>}
        {v % 5 === 3 && (<>
          <mesh><sphereGeometry args={[0.5, 32, 32]} /><Glossy c={COLORS[0]} /></mesh>
          {[[0, 0, 0], [1.1, 0, 0], [0, 1.1, 0.8]].map((r, k) => <mesh key={k} rotation={r}><torusGeometry args={[1.25 + k * 0.28, 0.09, 24, 96]} /><Glossy c={[c, c2, PAPER][k]} /></mesh>)}
        </>)}
        {v % 5 === 4 && (<>
          <mesh position-y={-0.7} rotation-x={Math.PI}><coneGeometry args={[0.8, 1.8, 48]} /><Glossy c={c} /></mesh>
          <mesh position-y={0.7}><sphereGeometry args={[0.9, 48, 48]} /><Glossy c={c} /></mesh>
          <mesh position={[0, 0.7, 0.62]}><sphereGeometry args={[0.33, 32, 32]} /><Glossy c={PAPER} /></mesh>
        </>)}
      </group>
    </Float>
  );
}

function Cloud({ stack }) {
  const g = useRef();
  const items = useMemo(() => {
    const a = []; stack.forEach(([, list], gi) => list.forEach(() => a.push(gi)));
    const N = Math.min(a.length, 44);
    return Array.from({ length: N }, (_, k) => {
      const y = 1 - (k / Math.max(N - 1, 1)) * 2, r = Math.sqrt(1 - y * y), th = k * 2.39996;
      return { p: [Math.cos(th) * r * 1.95, y * 1.95, Math.sin(th) * r * 1.95], gi: a[k], s: 0.16 + ((k * 37) % 5) * 0.04, box: k % 3 === 0 };
    });
  }, [stack]);
  useFrame((_, dt) => { if (!reduced) { g.current.rotation.y += dt * 0.25; g.current.rotation.x += dt * 0.05; } });
  return (
    <group position-y={2.3} ref={g}>
      <mesh><sphereGeometry args={[1.05, 48, 48]} /><Glossy c={INK} /></mesh>
      {items.map((o, k) => (
        <mesh key={k} position={o.p} rotation={[k, k * 0.7, 0]}>
          {o.box ? <boxGeometry args={[o.s * 1.6, o.s * 1.6, o.s * 1.6]} /> : <sphereGeometry args={[o.s, 24, 24]} />}
          <Glossy c={col(o.gi)} />
        </mesh>
      ))}
    </group>
  );
}

function Envelope() {
  const shape = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-1.6, 1.05); s.lineTo(1.6, 1.05); s.lineTo(0, -0.1); s.closePath(); return s; }, []);
  const o = useRef();
  useFrame((_, dt) => { if (!reduced) o.current.rotation.y += dt * 0.9; });
  return (
    <group position-y={2}>
      <Float speed={reduced ? 0 : 1.2} floatIntensity={0.5} rotationIntensity={0.25}>
        <RoundedBox args={[3.2, 2.1, 0.25]} radius={0.1} smoothness={4}><Glossy c={PAPER} /></RoundedBox>
        <mesh position-z={0.14}><shapeGeometry args={[shape]} /><Glossy c={COLORS[1]} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.1, 0.22]}><sphereGeometry args={[0.24, 32, 32]} /><Glossy c={COLORS[0]} /></mesh>
      </Float>
      <group ref={o}>
        <mesh position={[2.7, 0.6, 0]}><sphereGeometry args={[0.28, 32, 32]} /><Glossy c={COLORS[2]} /></mesh>
        <mesh position={[-2.7, -0.4, 0]}><sphereGeometry args={[0.2, 32, 32]} /><Glossy c={COLORS[0]} /></mesh>
        <mesh rotation-x={Math.PI / 2}><torusGeometry args={[2.7, 0.025, 12, 128]} /><meshBasicMaterial color={PAPER} transparent opacity={0.7} /></mesh>
      </group>
    </group>
  );
}

/* ───────────── camera ───────────── */
function Rig({ n, curve, flow, goRef, onFrame, narrow }) {
  const scroll = useScroll(), { camera, pointer, size } = useThree();
  const st = useMemo(() => ({ p: new THREE.Vector3(), tg: new THREE.Vector3(), mx: 0, my: 0, fov: 45 }), []);
  useEffect(() => { // shift the world sideways (or up on phones) so the props never sit behind the text
    const { width: w, height: h } = size;
    if (narrow) camera.setViewOffset(w, h, 0, h * 0.2, w, h); else camera.setViewOffset(w, h, -w * 0.17, 0, w, h);
    camera.updateProjectionMatrix();
    return () => camera.clearViewOffset();
  }, [camera, size, narrow]);
  useEffect(() => {
    goRef.current = (i) => { const el = scroll.el; el.scrollTo({ top: (MathUtils.clamp(i, 0, n - 1) / (n - 1)) * (el.scrollHeight - el.clientHeight), behavior: reduced ? "auto" : "smooth" }); };
  }, [scroll, n, goRef]);
  useFrame((_, dt) => {
    const raw = scroll.offset * (n - 1), i = Math.min(Math.floor(raw), n - 2), prev = flow.f;
    const target = i + MathUtils.smoothstep(raw - i, 0.15, 0.85); // lingers on each island
    flow.f = MathUtils.damp(flow.f, target, reduced ? 60 : 6, dt);
    const t = MathUtils.clamp(flow.f / (n - 1), 0, 1), k = reduced ? 0 : 1, dist = narrow ? 12.5 : 9.5;
    curve.getPoint(t, st.p); curve.getTangent(t, st.tg);
    st.mx = MathUtils.damp(st.mx, pointer.x, 3, dt); st.my = MathUtils.damp(st.my, pointer.y, 3, dt);
    camera.position.set(st.p.x - st.tg.x * 5 + st.mx * 0.7 * k, 2.8 + st.my * 0.4 * k, st.p.z + dist);
    camera.lookAt(st.p.x, 1.4, st.p.z);
    st.fov = MathUtils.damp(st.fov, 45 + Math.min((Math.abs(flow.f - prev) / Math.max(dt, 1e-3)) * 4, 6) * k, 4, dt);
    if (Math.abs(camera.fov - st.fov) > 0.02) { camera.fov = st.fov; camera.updateProjectionMatrix(); }
    onFrame(flow.f);
  });
  return null;
}

function Scene({ d, n, flow, goRef, onFrame }) {
  const { size } = useThree(), narrow = size.width / size.height < 0.95, nw = d.work.length;
  const curve = useMemo(() => new THREE.CatmullRomCurve3(Array.from({ length: n }, (_, i) => new THREE.Vector3(Math.sin(i * 1.05) * 3.2, 0, -i * S))), [n]);
  const stones = useMemo(() => Array.from({ length: n - 1 }, (_, i) => [0.38, 0.5, 0.62].map((u, k) => ({ p: curve.getPoint((i + u) / (n - 1)), r: k === 1 ? 0.7 : 0.4 }))).flat(), [curve, n]);
  const prop = (i) =>
    i === 0 ? <Hero photo={d.photo} />
    : i === 1 ? <Pillars i={i} count={d.metrics.length} />
    : i === 2 ? <Props count={d.services.length} />
    : i === 3 ? <Steps i={i} count={d.experience.length} />
    : i < 4 + nw ? <Work v={i - 4} />
    : i === 4 + nw ? <Cloud stack={d.stack} />
    : <Envelope />;
  return (
    <>
      <Rig n={n} curve={curve} flow={flow} goRef={goRef} onFrame={onFrame} narrow={narrow} />
      <Sky />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.25, -(n * S) / 2]}>
        <planeGeometry args={[500, 500]} />
        <MeshReflectorMaterial color={WATER} blur={[400, 120]} resolution={512} mixBlur={1} mixStrength={28} mirror={0.6} roughness={0.85} metalness={0.4} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4} />
      </mesh>
      {stones.map((s, k) => <mesh key={k} position={[s.p.x, -0.12, s.p.z]}><cylinderGeometry args={[s.r, s.r * 1.05, 0.26, 32]} /><Glossy c={PAPER} roughness={0.6} clearcoat={0.2} /></mesh>)}
      {Array.from({ length: n }, (_, i) => {
        const p = curve.getPoint(i / (n - 1));
        return <group key={i} position={p}><Island c={col(i)} /><Pop i={i}>{prop(i)}</Pop></group>;
      })}
      <Sparkles count={140} scale={[18, 6, n * S]} position={[0, 2.6, -(n * S) / 2]} size={3} speed={reduced ? 0 : 0.3} color="#ffe08a" opacity={0.9} />
    </>
  );
}

/* ───────────── text, plain HTML so it is always crisp ───────────── */
function Count({ v }) {
  const m = /^(\D*)(\d[\d,]*\.?\d*)(.*)$/.exec(String(v)), [t, set] = useState(reduced ? 1 : 0);
  useEffect(() => {
    if (!m || reduced) return;
    let r, s; const loop = (ts) => { s ??= ts; const p = Math.min(1, (ts - s) / 1300); set(p); if (p < 1) r = requestAnimationFrame(loop); };
    r = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(r);
  }, [v]);
  if (!m) return v;
  const dec = (m[2].split(".")[1] || "").length, e = 1 - Math.pow(1 - t, 3);
  return m[1] + (parseFloat(m[2].replace(/,/g, "")) * e).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: m[2].includes(",") }) + m[3];
}

function Panel({ d, i }) {
  const nw = d.work.length, c = col(i), style = { "--c": c };
  if (i === 0) return (
    <section className="td-panel td-intro" style={style}>
      <h1>{d.name}</h1>
      <p className="td-roles">{d.roles.join("  /  ")}</p>
      <p>{d.headline}</p>
    </section>
  );
  if (i === 1) return (
    <section className="td-panel" style={style}>
      <h2>Impact</h2>
      <div className="td-stats">{d.metrics.map((m) => <div key={m.label}><b><Count v={m.value} /></b><span>{m.label}</span></div>)}</div>
    </section>
  );
  if (i === 2) return (
    <section className="td-panel" style={style}>
      <h2>Services</h2>
      <ul className="td-list">{d.services.map((x, k) => <li key={x.title} style={{ "--c": col(k) }}><b>{x.title}</b><span>{x.body}</span></li>)}</ul>
    </section>
  );
  if (i === 3) return (
    <section className="td-panel" style={style}>
      <h2>Experience</h2>
      <ul className="td-list">{d.experience.map((e, k) => <li key={e.role} style={{ "--c": k === d.experience.length - 1 ? COLORS[0] : "#a9c7c8" }}><b>{e.role}</b><span>{e.org} | {e.when}</span></li>)}</ul>
    </section>
  );
  if (i < 4 + nw) { const w = d.work[i - 4]; return (
    <section className="td-panel" style={{ "--c": col(i - 4) }}>
      <h2>{w.title}</h2>
      <p>{w.summary}</p>
      <div className="td-chips">{w.tags.map((t) => <span key={t}>{t}</span>)}</div>
      <p className="td-res">{w.result}</p>
    </section>
  ); }
  if (i === 4 + nw) return (
    <section className="td-panel" style={style}>
      <h2>Toolkit</h2>
      {d.stack.map(([g, items], k) => (
        <div className="td-group" key={g} style={{ "--c": col(k) }}><b>{g}</b><div className="td-chips">{items.map((t) => <span key={t}>{t}</span>)}</div></div>
      ))}
    </section>
  );
  return (
    <section className="td-panel" style={style}>
      <h2>{"Let\u2019s work together"}</h2>
      <p>Open to full-time roles, contract builds and teaching.</p>
      <a className="td-btn" href={`mailto:${d.email}`}>{d.email}</a>
      <div className="td-social">{d.social.map(([l, h]) => <a key={l} href={h} target="_blank" rel="noopener noreferrer">{l}</a>)}</div>
    </section>
  );
}

/* ───────────── page ───────────── */
const pad = (x) => String(x + 1).padStart(2, "0");

export default function ThreeD({ data: d }) {
  const names = useMemo(() => ["Intro", "Impact", "Services", "Experience", ...d.work.map((w) => w.title), "Toolkit", "Contact"], [d]);
  const n = names.length;
  const flow = useMemo(() => ({ f: 0, a: new Array(n).fill(0) }), [n]);
  const [active, setActive] = useState(0);
  const root = useRef(), bar = useRef(), goRef = useRef(), cur = useRef(0);

  const onFrame = (f) => {
    if (!bar.current) return;
    bar.current.style.transform = `scaleX(${f / Math.max(n - 1, 1)})`;
    if (f > 0.08) root.current.classList.add("moved");
    const i = Math.round(f);
    if (i !== cur.current) { cur.current = i; setActive(i); }
  };

  useEffect(() => {
    const key = (e) => {
      const next = ["ArrowDown", "PageDown", "ArrowRight"].includes(e.key) ? 1 : ["ArrowUp", "PageUp", "ArrowLeft"].includes(e.key) ? -1 : 0;
      if (!next || /input|textarea/i.test(e.target.tagName)) return;
      e.preventDefault();
      goRef.current?.(cur.current + next);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);

  return (
    <div className="td" ref={root}>
      <Canvas camera={{ fov: 45, near: 0.1, far: 500, position: [0, 2.8, 10] }} dpr={[1, 1.75]} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
        <color attach="background" args={[HORIZON]} />
        <fog attach="fog" args={[HORIZON, 16, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 9, 5]} intensity={1.1} color="#fff1d6" />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} color="#fff0d2" position={[0, 6, 2]} scale={[14, 6, 1]} rotation-x={Math.PI / 2} />
          <Lightformer form="rect" intensity={1.6} color="#8fe3f2" position={[-8, 3, 0]} rotation-y={Math.PI / 2} scale={[8, 5, 1]} />
          <Lightformer form="ring" intensity={2} color="#ffb454" position={[0, 2, -10]} scale={6} />
        </Environment>
        <Flow.Provider value={flow}>
          <Suspense fallback={null}>
            <ScrollControls pages={n + 1} damping={0.3}><Scene d={d} n={n} flow={flow} goRef={goRef} onFrame={onFrame} /></ScrollControls>
          </Suspense>
        </Flow.Provider>
      </Canvas>

      <header className="td-hud"><b>{d.name}</b><a href={d.cv} download>Download CV</a></header>
      <Panel key={active} d={d} i={active} />
      <nav className="td-nav" aria-label="Sections">
        {names.map((nm, i) => <button key={i} onClick={() => goRef.current?.(i)} aria-label={`Go to ${nm}`} aria-current={i === active ? "true" : undefined}><span>{nm}</span></button>)}
      </nav>
      <div className="td-foot" aria-hidden="true">
        <p className="td-hint">Scroll to travel, or use the arrow keys</p>
        <div className="td-now"><b>{pad(active)}</b><span>{names[active]}</span></div>
        <i className="td-bar"><u ref={bar} /></i>
      </div>

      {/* Full content for screen readers and search engines. */}
      <div className="td-sr">
        <h1>{d.name}</h1><p>{d.headline}</p>
        {d.services.map((x) => <section key={x.title}><h2>{x.title}</h2><p>{x.body}</p></section>)}
        {d.work.map((w) => <section key={w.title}><h2>{w.title}</h2><p>{w.summary}</p></section>)}
        {d.faq.map((f) => <section key={f.q}><h2>{f.q}</h2><p>{f.a}</p></section>)}
        <a href={`mailto:${d.email}`}>{d.email}</a>
      </div>
    </div>
  );
}