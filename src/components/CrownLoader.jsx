import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildCrown } from "./crownGeometry";

const FLOOR_Y = -1.3;
const SCALE = 0.95;         // crown size in the scene
const HOVER = 0.24;         // how far the pivot sits above the silk
const TURN = 0.6;           // spin speed, radians per second
const TILT = 0.2;           // the crown rests tilted toward the camera, like the photo
const BG = 0x07030f;

function radialTexture(stops) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Soft conical light rays, fading out toward the edge.
function raysTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.translate(128, 128);
  for (let i = 0; i < 18; i++) {
    g.save();
    g.rotate((i / 18) * Math.PI * 2 + (i % 2) * 0.08);
    const w = 0.03 + (i % 3) * 0.022;
    g.fillStyle = "rgba(205,160,255,.55)";
    g.beginPath(); g.moveTo(0, 0); g.lineTo(130, -130 * w); g.lineTo(130, 130 * w); g.fill();
    g.restore();
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "destination-in";
  const m = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  m.addColorStop(0, "rgba(255,255,255,1)"); m.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = m; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// Hanging curtain folds behind the crown.
function drapeGeometry() {
  const g = new THREE.PlaneGeometry(34, 12, 340, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const z = 0.5 * Math.sin(x * 1.5) + 0.2 * Math.sin(x * 3.9 + 1.3) + 0.1 * Math.sin(y * 0.6 + x * 0.3);
    p.setZ(i, z);
  }
  g.computeVertexNormals();
  return g;
}

// Rumpled silk under the crown; calm in the middle so the crown never pokes through.
function silkFloorGeometry() {
  const g = new THREE.PlaneGeometry(40, 40, 240, 240).rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    const amp = 0.012 + 0.2 * THREE.MathUtils.smoothstep(r, 1.1, 4.5);
    const y = amp * (Math.sin(x * 0.9 + z * 0.35) + 0.6 * Math.sin(z * 1.4 - x * 0.5 + 2) + 0.3 * Math.sin(x * 2.3 + z * 1.7));
    p.setY(i, y);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Full-screen intro: a glowing purple royal crown turning on dark draped silk.
 * Plays for at least `minMs`, then fades out and calls onDone().
 */
export default function CrownLoader({ onDone, minMs = 3200 }) {
  const mount = useRef(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), minMs);
    const b = setTimeout(() => onDone?.(), minMs + 650);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [minMs, onDone]);

  useEffect(() => {
    const el = mount.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      onDone?.(); // no WebGL: skip the intro
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(BG, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(BG, 9, 22);

    // Reflections for the gold and gems come from a built-in studio room, not an image file.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTex = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    const key = new THREE.DirectionalLight(0xeadcff, 1.6);
    key.position.set(3, 6, 5);
    const rim = new THREE.DirectionalLight(0xb36bff, 1.3);
    rim.position.set(-5, 3, -4);
    const hemi = new THREE.HemisphereLight(0x9a7ad0, BG, 0.55);
    const under = new THREE.DirectionalLight(0xa050ff, 1.1);   // violet up-light from the silk
    under.position.set(0, -2, 4);
    scene.add(key, rim, hemi, under);

    // Dark blue-grey satin for the drapes and the surface the crown rests on.
    const silk = new THREE.MeshPhysicalMaterial({
      color: 0x2b1a4c, roughness: 0.42, metalness: 0.1, side: THREE.DoubleSide,
      sheen: 1, sheenColor: new THREE.Color(0xa77bff), sheenRoughness: 0.35,
      envMap: envTex, envMapIntensity: 0.3,
    });
    const drape = new THREE.Mesh(drapeGeometry(), silk);
    drape.position.set(0, 4.2, -5);
    const floor = new THREE.Mesh(silkFloorGeometry(), silk);
    floor.position.y = FLOOR_Y;
    scene.add(drape, floor);

    // The crown, tilted on a pivot so it spins like it's resting on the cloth.
    const { rig, dispose: disposeCrown } = buildCrown();
    rig.scale.setScalar(SCALE);
    const pivot = new THREE.Group();
    pivot.add(rig);
    scene.add(pivot);

    // Drifting gold dust.
    const N = 180;
    const dustPos = new Float32Array(N * 3);
    const seed = Array.from({ length: N }, () => ({
      a: Math.random() * Math.PI * 2, r: 0.8 + Math.random() * 3.4,
      y: Math.random() * 4, s: 0.08 + Math.random() * 0.18,
    }));
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dotTex = radialTexture([[0, "rgba(236,208,255,1)"], [0.4, "rgba(190,130,255,.5)"], [1, "rgba(150,80,255,0)"]]);
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      map: dotTex, size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8,
    }));
    scene.add(dust);

    // Aura: a pulsing halo, slowly turning rays, a glow pooled on the silk, and sparkles orbiting the crown.
    const glowMat = (map, opacity) => new THREE.SpriteMaterial({
      map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity, fog: false,
    });
    const haloTex = radialTexture([[0, "rgba(200,140,255,.95)"], [0.25, "rgba(150,80,255,.5)"], [0.6, "rgba(110,40,220,.16)"], [1, "rgba(80,20,180,0)"]]);
    const halo = new THREE.Sprite(glowMat(haloTex, 0.9));
    halo.position.set(0, -0.55, -1.2);
    const raysTex = raysTexture();
    const rays = new THREE.Sprite(glowMat(raysTex, 0.5));
    rays.scale.setScalar(12);
    rays.position.set(0, -0.55, -1.1);
    const poolTex = radialTexture([[0, "rgba(190,120,255,.8)"], [0.5, "rgba(130,60,240,.3)"], [1, "rgba(90,30,200,0)"]]);
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7, fog: false })
    );
    pool.position.y = FLOOR_Y + 0.04;
    scene.add(halo, rays, pool);

    const M = 70;
    const orbitGeo = new THREE.BufferGeometry();
    orbitGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(M * 3), 3));
    const orbitSeed = Array.from({ length: M }, () => ({
      a: Math.random() * Math.PI * 2, r: 1.2 + Math.random() * 0.9, ph: Math.random(), s: 0.25 + Math.random() * 0.4,
    }));
    const sparkles = new THREE.Points(orbitGeo, new THREE.PointsMaterial({
      map: dotTex, size: 0.14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.95, color: 0xf0ddff,
    }));
    scene.add(sparkles);

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.8 ? 42 : 30; // more room on tall phone screens
      halo.scale.setScalar(w / h < 0.8 ? 6 : 8);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf;
    const t0 = performance.now();
    const frame = (now) => {
      const t = (now - t0) / 1000;
      const ease = Math.min(t / 1.2, 1);
      const bob = Math.sin(t * 1.3) * 0.02;

      rig.rotation.y = TURN * t * (0.35 + 0.65 * ease);   // gentle spin-up
      pivot.rotation.x = TILT + Math.sin(t * 0.8) * 0.03;
      pivot.rotation.z = Math.cos(t * 0.55) * 0.03;
      pivot.position.y = FLOOR_Y + HOVER + bob;

      const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
      halo.material.opacity = 0.65 + 0.3 * pulse;
      rays.material.rotation = t * 0.12;
      rays.material.opacity = 0.35 + 0.25 * pulse;
      pool.material.opacity = 0.5 + 0.3 * pulse;
      under.intensity = 0.9 + 0.6 * pulse;

      const sp = orbitGeo.attributes.position;
      orbitSeed.forEach((o, i) => {
        const a = o.a + t * o.s;
        const y = FLOOR_Y + 0.3 + ((o.ph + t * 0.18) % 1) * 2.4;
        sp.setXYZ(i, Math.cos(a) * o.r, y, Math.sin(a) * o.r);
      });
      sp.needsUpdate = true;

      const p = dustGeo.attributes.position;
      seed.forEach((d, i) => {
        const y = ((d.y + t * d.s) % 4);
        const a = d.a + t * 0.05;
        p.setXYZ(i, Math.cos(a) * d.r, FLOOR_Y + y, Math.sin(a) * d.r);
      });
      p.needsUpdate = true;

      camera.position.set(-0.8 + Math.sin(t * 0.4) * 0.5, 0.75 + Math.sin(t * 0.27) * 0.08, 8.6);
      camera.lookAt(0, -0.55, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposeCrown();
      drape.geometry.dispose(); floor.geometry.dispose(); silk.dispose();
      dustGeo.dispose(); dust.material.dispose(); dotTex.dispose();
      halo.material.dispose(); rays.material.dispose(); pool.geometry.dispose(); pool.material.dispose();
      haloTex.dispose(); raysTex.dispose(); poolTex.dispose();
      orbitGeo.dispose(); sparkles.material.dispose();
      envTex.dispose(); room.dispose(); pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [onDone]);

  return (
    <div
      className={`crown-intro${leaving ? " leaving" : ""}`}
      role="status"
      aria-label="Loading"
      style={{ ["--dur"]: `${minMs}ms` }}
    >
      <div ref={mount} className="crown-stage" />
      <div className="crown-bar" aria-hidden="true"><i /></div>
      <style>{`
        .crown-intro{position:fixed;inset:0;z-index:100;background:#07030f;transition:opacity .6s ease}
        .crown-intro.leaving{opacity:0;pointer-events:none}
        .crown-stage{position:absolute;inset:0}
        .crown-bar{position:absolute;left:50%;bottom:calc(7vh + env(safe-area-inset-bottom,0px));width:min(180px,40vw);height:2px;transform:translateX(-50%);background:rgba(255,255,255,.14);overflow:visible;border-radius:2px}
        .crown-bar i{display:block;height:100%;width:100%;background:#b57bff;box-shadow:0 0 10px #a050ff;transform-origin:left;animation:crown-fill var(--dur) cubic-bezier(.3,.1,.2,1) forwards}
        @keyframes crown-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @media (prefers-reduced-motion:reduce){.crown-bar i{animation:none;transform:scaleX(1)}}
      `}</style>
    </div>
  );
}