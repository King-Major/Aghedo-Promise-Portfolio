import * as THREE from "three";

/**
 * A classic forest-green circlet crown, built in code and modelled on the reference photo:
 * a flared polished band set with round and oval gems, a scalloped top edge that
 * rises to slender points tipped with green balls, and small diamond ornaments in
 * the valleys. Open inside (no cap, arches or cross). Base sits at y = 0 and the
 * crown is ~1.15 tall with a ~1.9 diameter.
 */

const POINTS = 8;          // number of tall points
const R0 = 0.9;            // base radius
const FLARE = 0.16;        // how much the crown widens per unit of height
const WALL = 0.035;        // wall thickness
const VALLEY = 0.64;       // height of the lowest dip of the scalloped edge
const PEAK = 1.08;         // height of the points
const BAND_TOP = 0.4;      // top of the solid gem band
const TILT = Math.atan(FLARE);

const GOLD = { color: 0x3f643f, emissive: 0x1f321f, emissiveIntensity: 0.55, metalness: 1, roughness: 0.2, envMapIntensity: 1.8 }; // forest-green metal

const radiusAt = (y) => R0 + FLARE * y;

// Height of the top edge at angle theta: sharp points with concave swoops between.
function topHeight(theta) {
  const p = (((theta / (Math.PI * 2)) * POINTS) % 1 + 1) % 1;
  const d = Math.min(p, 1 - p);                       // 0 at a point, 0.5 at a valley
  return VALLEY + (PEAK - VALLEY) * Math.pow(1 - d * 2, 2.3);
}

// One wall of the crown (outer or inner), cut to the scalloped profile.
function wallGeometry(offset) {
  const S = 360, V = 22;
  const pos = [], idx = [];
  for (let i = 0; i <= S; i++) {
    const th = (i / S) * Math.PI * 2;
    const h = topHeight(th);
    for (let j = 0; j <= V; j++) {
      const y = (h * j) / V;
      const r = radiusAt(y) + offset;
      pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
    }
  }
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j, b = (i + 1) * (V + 1) + j, c = a + 1, d = b + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A rounded rim that follows the scalloped top edge.
function edgeGeometry() {
  const pts = [];
  const N = 960;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const h = topHeight(th);
    const r = radiusAt(h) - WALL / 2;
    pts.push(new THREE.Vector3(Math.cos(th) * r, h, Math.sin(th) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 1400, 0.021, 8, true);
}

export function buildCrown() {
  const rig = new THREE.Group();
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  const gold = track(new THREE.MeshPhysicalMaterial(GOLD));
  const goldWall = track(new THREE.MeshPhysicalMaterial({ ...GOLD, side: THREE.DoubleSide }));
  const gem = (color, glow = 0.3) => track(new THREE.MeshPhysicalMaterial({
    color, emissive: color, emissiveIntensity: glow, roughness: 0.03, metalness: 0.05,
    clearcoat: 1, clearcoatRoughness: 0, ior: 1.77, flatShading: true, envMapIntensity: 2,
  }));
  // Forest-green stones with pale-green and white highlights.
  const ruby = gem(0x395b39, 0.55), garnet = gem(0x4f774f, 0.55), emerald = gem(0x7fa17f, 0.5),
    steel = gem(0xa9bea9, 0.45), diamond = gem(0xe8eee7, 0.4);
  const gems = [ruby, diamond, garnet, diamond, emerald, ruby, diamond, steel];

  const add = (geo, mat, parent = rig) => { const m = new THREE.Mesh(track(geo), mat); parent.add(m); return m; };

  /* ---- body: outer + inner wall, rim along the top, ridges on the band ---- */
  add(wallGeometry(0), goldWall);
  add(wallGeometry(-WALL), goldWall);
  add(edgeGeometry(), gold);

  const ridge = (y, tube) => {
    const t = add(new THREE.TorusGeometry(radiusAt(y) - WALL / 2, tube, 12, 160), gold);
    t.rotation.x = Math.PI / 2;
    t.position.y = y;
  };
  ridge(0.018, 0.034);       // bottom lip
  ridge(BAND_TOP, 0.026);    // top of the gem band
  ridge(BAND_TOP + 0.05, 0.012);

  // Place something on the outside wall at angle a and height y, facing outward and leaning with the flare.
  const onWall = (obj, a, y, lift = 0.008) => {
    const r = radiusAt(y) + lift;
    obj.rotation.order = "YXZ";
    obj.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    obj.rotation.y = Math.PI / 2 - a;
    obj.rotation.x = TILT;
    rig.add(obj);
    return obj;
  };

  /* ---- gems: alternating oval and round stones in bezels ---- */
  const gemGeo = track(new THREE.IcosahedronGeometry(1, 1));
  const bezelGeo = track(new THREE.TorusGeometry(1, 0.17, 10, 40));
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const oval = i % 2 === 0;
    const sx = oval ? 0.075 : 0.088, sy = oval ? 0.112 : 0.088;
    const g = new THREE.Mesh(gemGeo, gems[i]);
    g.scale.set(sx, sy, 0.05);
    onWall(g, a, 0.21, 0.012);
    const b = new THREE.Mesh(bezelGeo, gold);
    b.scale.set(sx * 1.2, sy * 1.2, 0.5);
    onWall(b, a, 0.21, 0.012);
  }

  /* ---- ball-tipped points ---- */
  const tipGeo = track(new THREE.SphereGeometry(0.062, 28, 20));
  const smallGeo = track(new THREE.SphereGeometry(0.036, 20, 14));
  for (let k = 0; k < POINTS; k++) {
    const a = (k / POINTS) * Math.PI * 2;
    const r = radiusAt(PEAK) - WALL / 2;
    const tip = new THREE.Mesh(tipGeo, gold);
    tip.position.set(Math.cos(a) * r, PEAK + 0.045, Math.sin(a) * r);
    rig.add(tip);
    if (k % 2 === 1) { // a pair of little beads climbing the sides of every other point
      for (const s of [-1, 1]) {
        const th = a + s * 0.09;
        const h = topHeight(th);
        const rr = radiusAt(h) - WALL / 2;
        const bead = new THREE.Mesh(smallGeo, gold);
        bead.position.set(Math.cos(th) * rr, h + 0.012, Math.sin(th) * rr);
        rig.add(bead);
      }
    }
  }

  /* ---- little diamond ornaments in the valleys ---- */
  const diaGeo = track(new THREE.OctahedronGeometry(1, 0));
  for (let k = 0; k < POINTS; k++) {
    const a = ((k + 0.5) / POINTS) * Math.PI * 2;
    const up = new THREE.Mesh(diaGeo, gold);
    up.scale.set(0.034, 0.085, 0.014);
    onWall(up, a, 0.52, 0.006);
    const across = new THREE.Mesh(diaGeo, gold);
    across.scale.set(0.085, 0.034, 0.014);
    onWall(across, a, 0.52, 0.006);
  }

  return {
    rig,
    dispose() {
      disposables.forEach((d) => d.dispose?.());
    },
  };
}