/* Write a GLB's textures out as files, to inspect or colour-correct them.
     node glb-textures.mjs <in.glb> <out folder> */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';
import fs from 'fs';
import path from 'path';

const [, , src, dir] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const doc = await io.read(src);
fs.mkdirSync(dir, { recursive: true });
const mat = doc.getRoot().listMaterials()[0];
const role = new Map([
  [mat.getBaseColorTexture(), 'basecolor'], [mat.getNormalTexture(), 'normal'],
  [mat.getMetallicRoughnessTexture(), 'metalrough'], [mat.getOcclusionTexture(), 'occlusion'],
]);
for (const t of doc.getRoot().listTextures()) {
  const ext = (t.getMimeType() || 'image/png').split('/')[1].replace('jpeg', 'jpg');
  const name = `${role.get(t) || t.getName() || 'tex'}.${ext}`;
  fs.writeFileSync(path.join(dir, name), t.getImage());
  console.log(name, t.getSize());
}
