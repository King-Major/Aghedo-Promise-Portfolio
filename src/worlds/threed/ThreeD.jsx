import { Suspense, useMemo, useRef, useState, useEffect, useContext, createContext } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll, Float, RoundedBox, Environment, Lightformer, MeshReflectorMaterial, Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";
import "./threed.css";

/*
  The Lagoon, at the end of a harmattan day: you cross stone islands on dark, still water under dusty light.
  Every station is a real object with its own prop (a brass-rimmed medallion, plinths, phone / browser / books, steps,
  sculptures, a constellation, a sealed envelope). All text is HTML on top, so it is always sharp, selectable and
  never overlaps.

  Restraint is the point: one warm accent (danfo ochre), muted supporting colours, satin stone and brass instead of
  glossy plastic, and motion only where it earns attention.
*/

const MathUtils = THREE.MathUtils;
const COLORS = ["#d9a62b", "#7aa3ab", "#86a283", "#a85a6e", "#c9b99a"]; // danfo ochre, lagoon, mangrove, hibiscus, sand
const ACCENT = COLORS[0];
const INK = "#0c1a20", PAPER = "#e8e2d3", STONE = "#cfc8b6";
const HORIZON = "#7a918a", MID = "#17404a", DEEP = "#06161d", WATER = "#06202a"; // haze, upper sky, zenith, lagoon
const FOV = 40;
const S = 9; // distance between islands
const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const col = (i) => COLORS[((i % COLORS.length) + COLORS.length) % COLORS.length];
const ramp = (t) => new THREE.Color("#3f666c").lerp(new THREE.Color(ACCENT), t); // lagoon -> ochre
const Flow = createContext(null); // { f: eased station index, a: visibility per station }

// Satin, not gloss: a soft sheen so the forms read without the toy-plastic shine.
const Satin = ({ c, ...p }) => <meshPhysicalMaterial color={c} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.4} {...p} />;
const Brass = (p) => <meshPhysicalMaterial color={ACCENT} metalness={0.9} roughness={0.32} {...p} />;

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
  const uniforms = useMemo(() => ({
    top: { value: new THREE.Color(DEEP) }, mid: { value: new THREE.Color(MID) }, hor: { value: new THREE.Color(HORIZON) },
  }), []);
  useFrame(() => g.current.position.copy(camera.position));
  return (
    <mesh ref={g} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[220, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} toneMapped={false} uniforms={uniforms}
        vertexShader="varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}"
        fragmentShader={`varying vec3 v;uniform vec3 top,mid,hor;
          void main(){
            vec3 d=normalize(v);
            float h=max(d.y,0.);
            vec3 c=mix(hor,mid,smoothstep(0.,.2,h));
            c=mix(c,top,smoothstep(.1,.7,h));
            float s=max(dot(d,normalize(vec3(.15,.12,-1.))),0.);
            c+=vec3(1.,.66,.36)*(pow(s,9.)*.2+pow(s,80.)*.45);       // dust-haze glow, no hard edge
            c=mix(c,vec3(1.,.93,.78),smoothstep(.9988,.9997,s)*.8);   // a pale sun through the haze
            c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.; // dither, no banding
            gl_FragColor=vec4(c,1.);
            #include <colorspace_fragment>
          }`} />
    </mesh>
  );
}

function Island({ c }) {
  return (
    <group>
      <mesh position-y={-0.2}><cylinderGeometry args={[3.2, 3.3, 0.4, 96]} /><Satin c={PAPER} roughness={0.7} clearcoat={0.1} /></mesh>
      <mesh position-y={0.005}><cylinderGeometry args={[2.3, 2.3, 0.02, 96]} /><Satin c={STONE} roughness={0.85} clearcoat={0} /></mesh>
      <mesh rotation-x={Math.PI / 2} position-y={0.012}><torusGeometry args={[3.04, 0.022, 8, 160]} /><meshBasicMaterial color={c} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}><planeGeometry args={[5.2, 5.2]} /><meshBasicMaterial map={blob()} transparent depthWrite={false} /></mesh>
    </group>
  );
}

/** Grows the station's prop in when the camera arrives, shrinks it away when it leaves. */
function Pop({ i, children }) {
  const flow = useContext(Flow), g = useRef();
  useFrame(() => {
    const a = 1 - MathUtils.smoothstep(Math.abs(flow.f - i), 0.1, 0.9), e = 1 - Math.pow(1 - a, 4);
    flow.a[i] = a;
    g.current.visible = a > 0.002;
    g.current.scale.setScalar(0.001 + e);
    g.current.position.y = (1 - e) * -0.9;
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
    g.current.rotation.y = MathUtils.damp(g.current.rotation.y, pointer.x * 0.3 * k, 3, dt);
    g.current.rotation.x = MathUtils.damp(g.current.rotation.x, -pointer.y * 0.15 * k, 3, dt);
    orbit.current.rotation.z += dt * 0.25 * k;
  });
  return (
    <group position-y={2.3}>
      <Float speed={reduced ? 0 : 0.8} floatIntensity={0.3} rotationIntensity={0}>
        <group ref={g}>
          <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[1.42, 1.42, 0.1, 96]} /><Satin c={INK} /></mesh>
          <mesh position-z={0.055}><circleGeometry args={[1.3, 96]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
          <mesh position-z={0.05}><torusGeometry args={[1.36, 0.045, 16, 128]} /><Brass /></mesh>
        </group>
      </Float>
      <group rotation={[1.28, 0, 0.12]}>
        <mesh><torusGeometry args={[2.45, 0.012, 8, 192]} /><meshBasicMaterial color={PAPER} transparent opacity={0.5} /></mesh>
        <group ref={orbit}>
          <mesh position={[2.45, 0, 0]}><sphereGeometry args={[0.09, 24, 24]} /><Brass /></mesh>
          <mesh position={[-2.45, 0, 0]}><sphereGeometry args={[0.055, 24, 24]} /><Satin c={PAPER} /></mesh>
        </group>
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
  const sp = Math.min(1.4, 5.4 / count), w = sp * 0.62;
  return (
    <group>
      <Grow i={i} count={count}>
        {(k) => { const h = 1.1 + k * 0.75; return (
          <group position-x={(k - (count - 1) / 2) * sp}>
            <RoundedBox args={[w, h, w]} radius={0.035} smoothness={4} position-y={h / 2}><Satin c={ramp(k / Math.max(count - 1, 1))} /></RoundedBox>
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
        {(k) => { const h = 0.55 + k * 0.5, top = k === count - 1; return (
          <group position-x={(k - (count - 1) / 2) * sp}>
            <RoundedBox args={[sp * 0.94, h, 1.7]} radius={0.04} smoothness={4} position-y={h / 2}><Satin c={top ? ACCENT : PAPER} /></RoundedBox>
            {top && (
              <group position-y={h}>
                <mesh position-y={0.6}><cylinderGeometry args={[0.02, 0.02, 1.2, 12]} /><Satin c={INK} /></mesh>
                <mesh position={[0.26, 1.0, 0]}><boxGeometry args={[0.5, 0.3, 0.02]} /><Satin c={PAPER} /></mesh>
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
        <RoundedBox args={[1.1, 2.1, 0.12]} radius={0.1} smoothness={4}><Satin c={INK} roughness={0.35} clearcoat={0.6} /></RoundedBox>
        <mesh position-z={0.065}><planeGeometry args={[0.96, 1.96]} /><meshBasicMaterial color="#14323b" /></mesh>
        <mesh position={[0, 0.42, 0.07]}><planeGeometry args={[0.8, 0.9]} /><meshBasicMaterial color={c} /></mesh>
        {[[0.62, -0.28], [0.44, -0.46], [0.54, -0.64]].map(([w, y]) => <mesh key={y} position={[-0.4 + w / 2, y, 0.07]}><planeGeometry args={[w, 0.07]} /><meshBasicMaterial color={PAPER} transparent opacity={0.55} /></mesh>)}
      </group>
    );
    case 1: return ( // browser window
      <group>
        <RoundedBox args={[2.1, 1.5, 0.1]} radius={0.05} smoothness={4}><Satin c={PAPER} /></RoundedBox>
        <mesh position={[0, 0.6, 0.055]}><planeGeometry args={[2.06, 0.3]} /><meshBasicMaterial color={INK} /></mesh>
        {[-0.85, -0.7, -0.55].map((x) => <mesh key={x} position={[x, 0.6, 0.06]}><circleGeometry args={[0.04, 16]} /><meshBasicMaterial color={PAPER} transparent opacity={0.7} /></mesh>)}
        <mesh position={[0.68, -0.05, 0.055]}><planeGeometry args={[0.6, 0.8]} /><meshBasicMaterial color={c} /></mesh>
        {[[-0.35, 0.15, 1.2], [-0.35, -0.1, 0.9], [-0.35, -0.35, 1.05]].map(([x, y, w]) => <mesh key={y} position={[x, y, 0.055]}><planeGeometry args={[w, 0.1]} /><meshBasicMaterial color={INK} /></mesh>)}
      </group>
    );
    case 2: return ( // books
      <group>
        {[0, 1, 2].map((b) => <RoundedBox key={b} args={[1.8 - b * 0.15, 0.34, 1.25]} radius={0.03} smoothness={3} position={[b % 2 ? 0.1 : -0.1, -0.5 + b * 0.38, 0]} rotation-y={b * 0.25}><Satin c={col(k + b)} /></RoundedBox>)}
      </group>
    );
    default: return ( // chart
      <group position-y={-0.4}>
        <RoundedBox args={[2.1, 0.12, 1.3]} radius={0.03} smoothness={3}><Satin c={PAPER} /></RoundedBox>
        {[0.6, 1.0, 1.5].map((h, b) => <RoundedBox key={b} args={[0.36, h, 0.36]} radius={0.03} smoothness={3} position={[-0.6 + b * 0.6, 0.06 + h / 2, 0]}><Satin c={col(k + b)} /></RoundedBox>)}
      </group>
    );
  }
}

function Props({ count }) {
  const sp = Math.min(2.3, 5.8 / count), sc = Math.min(1, sp / 2.1);
  return (
    <group scale={sc} position-y={1.5}>
      {Array.from({ length: count }, (_, k) => (
        <Float key={k} speed={reduced ? 0 : 0.8} floatIntensity={0.25} rotationIntensity={0.12}>
          <group position-x={(k - (count - 1) / 2) * (sp / sc)}><Prop k={k} /></group>
        </Float>
      ))}
    </group>
  );
}

function Work({ v }) {
  const g = useRef(), c = col(v);
  useFrame((_, dt) => { if (!reduced) g.current.rotation.y += dt * 0.25; });
  return (
    <Float speed={reduced ? 0 : 0.9} floatIntensity={0.35} rotationIntensity={0.06}>
      <group ref={g} position-y={2}>
        {v % 5 === 0 && <mesh><torusKnotGeometry args={[1.0, 0.2, 280, 40]} /><Brass /></mesh>}
        {v % 5 === 1 && (<>
          <RoundedBox args={[2.0, 0.34, 2.0]} radius={0.03} smoothness={3} position-y={-0.55}><Satin c={PAPER} /></RoundedBox>
          <RoundedBox args={[1.5, 0.34, 1.5]} radius={0.03} smoothness={3} position-y={-0.1} rotation-y={0.4}><Satin c={c} /></RoundedBox>
          <RoundedBox args={[1.0, 0.34, 1.0]} radius={0.03} smoothness={3} position-y={0.35} rotation-y={0.8}><Satin c={INK} /></RoundedBox>
          <mesh position-y={0.78}><sphereGeometry args={[0.12, 32, 32]} /><Brass /></mesh>
        </>)}
        {v % 5 === 2 && (<>
          <mesh><icosahedronGeometry args={[1.15, 0]} /><Satin c={c} flatShading roughness={0.4} metalness={0.2} /></mesh>
          <mesh><icosahedronGeometry args={[1.6, 0]} /><meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.55} /></mesh>
        </>)}
        {v % 5 === 3 && (<>
          <mesh><sphereGeometry args={[0.32, 32, 32]} /><Brass /></mesh>
          {[[0, 0, 0], [1.2, 0, 0], [0, 1.2, 0.7]].map((r, k) => <mesh key={k} rotation={r}><torusGeometry args={[1.2 + k * 0.28, 0.028, 16, 160]} />{k === 0 ? <Brass /> : <Satin c={PAPER} />}</mesh>)}
        </>)}
        {v % 5 === 4 && (<>
          <mesh position-y={-0.55} rotation-x={Math.PI}><coneGeometry args={[0.52, 1.5, 64]} /><Satin c={c} /></mesh>
          <mesh position-y={0.5}><sphereGeometry args={[0.68, 64, 64]} /><Satin c={c} /></mesh>
          <mesh position={[0, 0.5, 0.645]}><torusGeometry args={[0.22, 0.04, 16, 48]} /><Brass /></mesh>
        </>)}
      </group>
    </Float>
  );
}

function Cloud({ stack }) {
  const g = useRef();
  const { items, lines } = useMemo(() => {
    const a = []; stack.forEach(([, list], gi) => list.forEach(() => a.push(gi)));
    const N = Math.min(a.length, 44);
    const items = Array.from({ length: N }, (_, k) => {
      const y = 1 - (k / Math.max(N - 1, 1)) * 2, r = Math.sqrt(1 - y * y), th = k * 2.39996;
      return { p: new THREE.Vector3(Math.cos(th) * r * 1.9, y * 1.9, Math.sin(th) * r * 1.9), gi: a[k], s: 0.065 + ((k * 37) % 5) * 0.022 };
    });
    const lim = 1.18 * Math.sqrt(44 / Math.max(N, 6)), pts = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) if (items[i].p.distanceTo(items[j].p) < lim) pts.push(items[i].p, items[j].p);
    return { items, lines: new THREE.BufferGeometry().setFromPoints(pts) };
  }, [stack]);
  useFrame((_, dt) => { if (!reduced) { g.current.rotation.y += dt * 0.2; g.current.rotation.x += dt * 0.03; } });
  return (
    <group position-y={2.3} ref={g}>
      <mesh><sphereGeometry args={[0.34, 32, 32]} /><Brass /></mesh>
      <lineSegments geometry={lines}><lineBasicMaterial color={PAPER} transparent opacity={0.22} /></lineSegments>
      {items.map((o, k) => <mesh key={k} position={o.p}><sphereGeometry args={[o.s, 20, 20]} /><Satin c={col(o.gi)} /></mesh>)}
    </group>
  );
}

function Envelope() {
  const shape = useMemo(() => { const s = new THREE.Shape(); s.moveTo(-1.6, 1.05); s.lineTo(1.6, 1.05); s.lineTo(0, -0.1); s.closePath(); return s; }, []);
  const o = useRef();
  useFrame((_, dt) => { if (!reduced) o.current.rotation.z += dt * 0.2; });
  return (
    <group position-y={2}>
      <Float speed={reduced ? 0 : 0.8} floatIntensity={0.3} rotationIntensity={0.12}>
        <RoundedBox args={[3.2, 2.1, 0.08]} radius={0.03} smoothness={3}><Satin c={PAPER} /></RoundedBox>
        <mesh position-z={0.045}><shapeGeometry args={[shape]} /><Satin c="#d7cfbb" side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.1, 0.075]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.2, 0.2, 0.06, 48]} /><Satin c={COLORS[3]} roughness={0.35} clearcoat={0.6} /></mesh>
      </Float>
      <group rotation={[1.3, 0, 0.1]}>
        <mesh><torusGeometry args={[2.6, 0.012, 8, 192]} /><meshBasicMaterial color={PAPER} transparent opacity={0.5} /></mesh>
        <group ref={o}><mesh position={[2.6, 0, 0]}><sphereGeometry args={[0.08, 24, 24]} /><Brass /></mesh></group>
      </group>
    </group>
  );
}

/* ───────────── camera ───────────── */
function Rig({ n, curve, flow, goRef, onFrame, narrow }) {
  const scroll = useScroll(), { camera, pointer, size } = useThree();
  const st = useMemo(() => ({ p: new THREE.Vector3(), tg: new THREE.Vector3(), mx: 0, my: 0, fov: FOV }), []);
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
    flow.f = MathUtils.damp(flow.f, target, reduced ? 60 : 5, dt);
    const t = MathUtils.clamp(flow.f / (n - 1), 0, 1), k = reduced ? 0 : 1, dist = narrow ? 13.2 : 10.4;
    curve.getPoint(t, st.p); curve.getTangent(t, st.tg);
    st.mx = MathUtils.damp(st.mx, pointer.x, 3, dt); st.my = MathUtils.damp(st.my, pointer.y, 3, dt);
    camera.position.set(st.p.x - st.tg.x * 5 + st.mx * 0.45 * k, 2.5 + st.my * 0.25 * k, st.p.z + dist);
    camera.lookAt(st.p.x, 1.5, st.p.z);
    st.fov = MathUtils.damp(st.fov, FOV + Math.min((Math.abs(flow.f - prev) / Math.max(dt, 1e-3)) * 2, 3) * k, 4, dt);
    if (Math.abs(camera.fov - st.fov) > 0.02) { camera.fov = st.fov; camera.updateProjectionMatrix(); }
    onFrame(flow.f);
  });
  return null;
}

function Scene({ d, n, flow, goRef, onFrame }) {
  const { size } = useThree(), narrow = size.width / size.height < 0.95, nw = d.work.length;
  const curve = useMemo(() => new THREE.CatmullRomCurve3(Array.from({ length: n }, (_, i) => new THREE.Vector3(Math.sin(i * 1.05) * 3.2, 0, -i * S))), [n]);
  const stones = useMemo(() => Array.from({ length: n - 1 }, (_, i) => [0.38, 0.5, 0.62].map((u, k) => ({ p: curve.getPoint((i + u) / (n - 1)), r: k === 1 ? 0.6 : 0.35 }))).flat(), [curve, n]);
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
        <MeshReflectorMaterial color={WATER} blur={[400, 120]} resolution={512} mixBlur={1} mixStrength={28} mirror={0.7} roughness={0.85} metalness={0.4} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4} />
      </mesh>
      {stones.map((s, k) => <mesh key={k} position={[s.p.x, -0.12, s.p.z]}><cylinderGeometry args={[s.r, s.r * 1.05, 0.26, 40]} /><Satin c={PAPER} roughness={0.8} clearcoat={0} /></mesh>)}
      {Array.from({ length: n }, (_, i) => {
        const p = curve.getPoint(i / (n - 1));
        return <group key={i} position={p}><Island c={col(i)} /><Pop i={i}>{prop(i)}</Pop></group>;
      })}
      <Sparkles count={60} scale={[18, 5, n * S]} position={[0, 2.6, -(n * S) / 2]} size={1.6} speed={reduced ? 0 : 0.12} color="#f3dca4" opacity={0.45} />
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
  const dec = (m[2].split(".")[1] || "").length, e = 1 - Math.pow(1 - t, 3), num = parseFloat(m[2].replace(/,/g, ""));
  const fmt = (x) => m[1] + x.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: m[2].includes(",") }) + m[3];
  // The final value is laid out invisibly underneath, so the number counts up without the layout shifting.
  return <span className="td-count"><i aria-hidden="true">{fmt(num)}</i><em>{fmt(num * e)}</em></span>;
}

function Panel({ d, i }) {
  const nw = d.work.length, c = col(i), style = { "--c": c };
  if (i === 0) return (
    <section className="td-panel td-intro" style={style}>
      <h1>{d.name}</h1>
      <p className="td-roles">{d.roles.map((r) => <span key={r}>{r}</span>)}</p>
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
      <ul className="td-list td-exp">{d.experience.map((e, k) => (
        <li key={e.role} style={{ "--c": k === d.experience.length - 1 ? ACCENT : "#8ea8a8" }}>
          <span className="td-when">{e.when}</span>
          <div><b>{e.role}</b><span>{e.org}</span></div>
        </li>
      ))}</ul>
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
      <h2>{"Let’s work together"}</h2>
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
      <Canvas camera={{ fov: FOV, near: 0.1, far: 500, position: [0, 2.5, 10.4] }} dpr={[1, 1.75]} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
        <color attach="background" args={[HORIZON]} />
        <fog attach="fog" args={[HORIZON, 14, 85]} />
        <ambientLight intensity={0.3} color="#cfe0e0" />
        <directionalLight position={[6, 7, 6]} intensity={0.85} color="#ffe6bf" />
        <directionalLight position={[-5, 4, -9]} intensity={0.6} color="#ffb870" />
        <Environment resolution={256}>
          <color attach="background" args={["#22373b"]} />
          <Lightformer form="rect" intensity={2.4} color="#ffeccc" position={[0, 6, 2]} scale={[14, 6, 1]} rotation-x={Math.PI / 2} />
          <Lightformer form="rect" intensity={1} color="#9cc4cc" position={[-8, 3, 0]} rotation-y={Math.PI / 2} scale={[8, 5, 1]} />
          <Lightformer form="ring" intensity={1.6} color="#ffb454" position={[0, 2, -10]} scale={6} />
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