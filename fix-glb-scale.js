/* ------------------------------------------------------------------
   Gives every glb the same real-world size its usdz now has.

   glTF is defined in metres, so Scene Viewer places the bounding box
   exactly as it reads it. There is no normalising step to undo on this
   side — these models simply were not authored in metres.

   The correction is therefore not a change to the geometry at all. A
   glb is a json chunk followed by a binary chunk, and everything needed
   here lives in the json: a wrapper node carrying the scale, and the
   studio FLOOR plane unhooked from the scene graph. So the binary chunk
   is copied across untouched and checked by hash afterwards — every
   vertex, normal, uv, index and texture is the same byte it was.

   That matters more than it sounds. The first attempt rebuilt the file
   through a glTF library instead, and re-encoding Draco quietly dropped
   between 12 and 1,782 degenerate triangles per model. Invisible, but
   not something to do to someone's files by accident.

   Run:  npm run sizes
   ------------------------------------------------------------------ */
'use strict';
const fs = require('fs');
const crypto = require('crypto');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const draco3d = require('draco3dgltf');

const PLAN = JSON.parse(fs.readFileSync(
  'C:/Users/Ehtisham/AppData/Local/Temp/claude/plan.json', 'utf8'));

const GLTF = 0x46546C67, JSON_CHUNK = 0x4E4F534A, BIN_CHUNK = 0x004E4942;

/* euler xyz in degrees -> the quaternion glTF wants, [x, y, z, w] */
function quat(deg){
  const [a, b, c] = deg.map(d => d * Math.PI / 360);   /* half angles */
  const [sx, cx, sy, cy, sz, cz] = [Math.sin(a), Math.cos(a),
                                    Math.sin(b), Math.cos(b),
                                    Math.sin(c), Math.cos(c)];
  return [ sx*cy*cz + cx*sy*sz,
           cx*sy*cz - sx*cy*sz,
           cx*cy*sz + sx*sy*cz,
           cx*cy*cz - sx*sy*sz ].map(v => +v.toFixed(9));
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

function readGlb(buf){
  if (buf.readUInt32LE(0) !== GLTF) throw new Error('not a glb');
  let at = 12, json = null, bin = null;
  while (at + 8 <= buf.length){
    const len = buf.readUInt32LE(at), type = buf.readUInt32LE(at + 4);
    const body = buf.slice(at + 8, at + 8 + len);
    if (type === JSON_CHUNK) json = JSON.parse(body.toString('utf8'));
    else if (type === BIN_CHUNK) bin = body;
    at += 8 + len + ((4 - (len % 4)) % 4);
  }
  return { json, bin };
}

function writeGlb(json, bin){
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  if (js.length % 4) js = Buffer.concat([js, Buffer.alloc(4 - (js.length % 4), 0x20)]);
  const parts = [Buffer.alloc(12)];
  const head = Buffer.alloc(8);
  head.writeUInt32LE(js.length, 0); head.writeUInt32LE(JSON_CHUNK, 4);
  parts.push(head, js);
  if (bin){
    let b = bin;
    if (b.length % 4) b = Buffer.concat([b, Buffer.alloc(4 - (b.length % 4), 0)]);
    const bh = Buffer.alloc(8);
    bh.writeUInt32LE(b.length, 0); bh.writeUInt32LE(BIN_CHUNK, 4);
    parts.push(bh, b);
  }
  const out = Buffer.concat(parts);
  out.writeUInt32LE(GLTF, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  return out;
}

/* a backdrop: a handful of points, painted with a material called FLOOR */
function floorMeshes(json){
  const out = new Set();
  (json.meshes || []).forEach((mesh, mi) => {
    const prims = mesh.primitives || [];
    if (!prims.length) return;
    const all = prims.every(p => {
      const mat = json.materials && json.materials[p.material];
      const name = ((mat && mat.name) || '') + ' ' + (mesh.name || '');
      const acc = json.accessors && json.accessors[p.attributes && p.attributes.POSITION];
      return /FLOOR|PLANE001|BACKDROP|SHADOW/i.test(name) && acc && acc.count <= 8;
    });
    if (all) out.add(mi);
  });
  return out;
}

function detach(json, drop){
  /* unhook from every parent and every scene; the mesh data stays in the
     buffer, unreferenced, because touching the buffer is the one thing
     this is trying not to do */
  let cut = 0;
  (json.nodes || []).forEach(n => {
    if (!n.children) return;
    const keep = n.children.filter(c => !drop.has(c));
    cut += n.children.length - keep.length;
    if (keep.length) n.children = keep; else delete n.children;
  });
  (json.scenes || []).forEach(s => {
    if (!s.nodes) return;
    const keep = s.nodes.filter(c => !drop.has(c));
    cut += s.nodes.length - keep.length;
    s.nodes = keep;
  });
  return cut;
}

function measure(doc){
  const I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  const mul = (a, b) => { const o = new Array(16);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++){ let s = 0;
      for (let k = 0; k < 4; k++) s += a[k*4+r] * b[c*4+k]; o[c*4+r] = s; } return o; };
  const xf = (m, p) => [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
                        m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
                        m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
  const lo = [1e30,1e30,1e30], hi = [-1e30,-1e30,-1e30];
  let tris = 0;
  const walk = (n, par) => {
    const m = mul(par, n.getMatrix());
    const mesh = n.getMesh();
    if (mesh) mesh.listPrimitives().forEach(p => {
      const a = p.getAttribute('POSITION'); if (!a) return;
      const idx = p.getIndices();
      tris += (idx ? idx.getCount() : a.getCount()) / 3;
      const mn = a.getMin([]), mx = a.getMax([]);
      for (let i = 0; i < 8; i++){
        const c = xf(m, [i&1?mx[0]:mn[0], i&2?mx[1]:mn[1], i&4?mx[2]:mn[2]]);
        for (let k = 0; k < 3; k++){ if (c[k] < lo[k]) lo[k] = c[k]; if (c[k] > hi[k]) hi[k] = c[k]; }
      }
    });
    n.listChildren().forEach(c => walk(c, m));
  };
  doc.getRoot().listScenes().forEach(s => s.listChildren().forEach(n => walk(n, I)));
  return { size: [hi[0]-lo[0], hi[1]-lo[1], hi[2]-lo[2]], tris };
}

(async () => {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule()
  });

  const only = process.argv.slice(2);
  const todo = PLAN.filter(p => p.change && (!only.length || only.includes(p.f)));
  console.log('  ' + todo.length + ' glb to correct\n');
  let done = 0; const problems = [];

  for (const p of todo){
    const path = 'assets/shops/' + p.shop + '/' + p.f + '.glb';
    const raw = fs.readFileSync(path);
    const { json, bin } = readGlb(raw);
    const before = measure(await io.read(path));

    /* the floor, if this one has one */
    const floors = floorMeshes(json);
    const dropNodes = new Set();
    (json.nodes || []).forEach((n, i) => { if (floors.has(n.mesh)) dropNodes.add(i); });
    const cut = dropNodes.size ? detach(json, dropNodes) : 0;

    /* the scale and, where one is asked for, the rotation. Both ride on a
       single wrapper above every scene root, so the buffer is still never
       read. A uniform scale commutes with a rotation, so it makes no
       difference that glTF applies them R then S. */
    /* A factor this close to 1 is the measurement, not the model — the
       armchair came back at 0.99995, a correction of 0.005%, which is well
       inside the noise and would have hung another wrapper node on the file
       every single run. The plan already calls anything under 0.4% correct. */
    const k = p.glbFactor;
    const needsScale = Math.abs(k - 1) > 1e-3;
    const needsFreeze = !!(p.freeze && json.animations && json.animations.length);
    if (!needsScale && !p.rotate && !needsFreeze && !dropNodes.size){
      console.log('  ' + p.f.slice(0, 44).padEnd(45) + 'nothing to do on this side, left alone');
      continue;
    }
    if (needsScale){
      (json.scenes || []).forEach(scene => {
        json.nodes.push({ name: 'ARQR_real_size', scale: [k, k, k], children: scene.nodes || [] });
        scene.nodes = [json.nodes.length - 1];
      });
    }

    /* The rotation gets a wrapper of its own, and the same one every time.
       The scale factor is a ratio, so it converges on 1 and stops adding
       wrappers by itself; a rotation is an absolute bearing, so stacking a
       second one would turn the model another ninety degrees on every run.
       Found or created once, then set. */
    if (p.rotate){
      const q = quat(p.rotate);
      let at = (json.nodes || []).findIndex(n => n.name === 'ARQR_orient');
      if (at < 0){
        (json.scenes || []).forEach(scene => {
          json.nodes.push({ name: 'ARQR_orient', rotation: q, children: scene.nodes || [] });
          scene.nodes = [json.nodes.length - 1];
        });
      } else {
        json.nodes[at].rotation = q;
      }
    }

    /* a running animation reads as the model drifting on the card */
    let heldAnim = 0;
    if (p.freeze && json.animations && json.animations.length){
      heldAnim = json.animations.length;
      delete json.animations;
    }

    const out = writeGlb(json, bin);
    const check = readGlb(out);

    if (sha(check.bin) !== sha(bin)){
      problems.push(p.f + ' — binary chunk changed'); continue;
    }
    const doc = await io.readBinary(out);
    const after = measure(doc);
    const want = p.wantGlb;
    const scale = Math.max(...want) || 1;
    const drift = Math.max(...[0,1,2].map(i => Math.abs(after.size[i] - want[i]) / scale));
    const lostTris = before.tris - after.tris;

    if (drift > 0.004){
      problems.push(p.f + ' — lands at ' + after.size.map(v => v.toFixed(3)).join(' x ') +
                    ', wanted ' + want.map(v => v.toFixed(3)).join(' x '));
      continue;
    }
    if (lostTris !== (dropNodes.size ? lostTris : 0) || (!dropNodes.size && lostTris !== 0)){
      problems.push(p.f + ' — ' + lostTris + ' triangles vanished with no floor to remove');
      continue;
    }

    fs.writeFileSync(path, out);
    done++;
    const extra = [];
    if (cut) extra.push('floor unhooked, ' + lostTris + ' tris');
    if (p.rotate) extra.push('rotated ' + p.rotate.join(','));
    if (heldAnim) extra.push(heldAnim + ' animation held');
    console.log('  ' + p.f.slice(0, 44).padEnd(45) +
      ('x' + (k < 0.01 ? k.toExponential(2) : k.toFixed(4))).padEnd(12) +
      after.size.map(v => v.toFixed(3)).join(' x ') + ' m  ' +
      (extra.length ? '[' + extra.join('; ') + ']' : ''));
  }

  console.log('\n  ' + done + ' corrected — every binary chunk hash-identical to before');
  if (problems.length){
    console.log('  ' + problems.length + ' refused (left untouched):');
    problems.forEach(x => console.log('    ' + x));
    process.exitCode = 1;
  }
})();
