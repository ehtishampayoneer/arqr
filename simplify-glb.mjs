/* Thin a heavy GLB for phones without breaking its texture seams.

     node simplify-glb.mjs <in.glb> <out.glb> <target_tris> [max_texture_px] [basecolor.jpg]

   basecolor.jpg, if given, replaces the colour texture (e.g. after a colour
   correction), keeping everything else.

   Blender's decimate moved vertices along texture seams, and the texture's
   empty background then showed through as white hairlines. meshoptimizer's
   simplifier is seam-aware: vertices on a seam stay on it. Textures are
   capped (2048 px by default, Android's limit) and the file is written with
   no compression extension, which Android's Scene Viewer cannot rely on. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, simplify, textureCompress, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const [, , src, dst, targetArg, texArg, baseArg] = process.argv;
const target = Number(targetArg || 50000);
const maxTex = Number(texArg || 2048);

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const doc = await io.read(src);
if (baseArg) {
  const { readFileSync } = await import('fs');
  const tex = doc.getRoot().listMaterials()[0].getBaseColorTexture();
  tex.setImage(new Uint8Array(readFileSync(baseArg))).setMimeType(baseArg.endsWith('.png') ? 'image/png' : 'image/jpeg');
}

const tris = () => doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0);
const before = tris();

await MeshoptSimplifier.ready;
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, target / before), error: 0.01 }),
  dedup(), prune(),
  textureCompress({ encoder: sharp, resize: [maxTex, maxTex], targetFormat: undefined }),
);
// written plain: no Draco, no meshopt compression
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (/draco|meshopt/i.test(ext.extensionName)) ext.dispose();
}
await io.write(dst, doc);
console.log(JSON.stringify({ before: Math.round(before), after: Math.round(tris()) }));
