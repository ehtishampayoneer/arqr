# -*- coding: utf-8 -*-
"""Renders a model from six fixed angles so it can actually be looked at.

Bounding boxes tell you how big a thing is and nothing about whether it is
facing the right way. The wall-decor photoframe measured perfectly sane and
was still turned ninety degrees, showing the customer the edge of the canvas
-- which no measurement was ever going to reveal. One render did.

Reads glb or usdz. Writes <out>_front.png and friends.

    python render-model.py <model> <out-prefix> [size] [views]

`views` is a comma separated subset of front, back, left, right, top, hero.
Paths must be absolute: Blender does not share this script's directory.
"""
import bpy, sys, os, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--')+1:]
src, out = argv[0], argv[1]
W = int(argv[2]) if len(argv) > 2 else 300
only = argv[3].split(',') if len(argv) > 3 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
if src.lower().endswith(('.glb', '.gltf')):
    bpy.ops.import_scene.gltf(filepath=src)
else:
    bpy.ops.wm.usd_import(filepath=src)

objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
lo = Vector(( 1e30,) * 3); hi = Vector((-1e30,) * 3)
for o in objs:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        for k in range(3):
            lo[k] = min(lo[k], w[k]); hi[k] = max(hi[k], w[k])
ctr = (lo + hi) / 2
size = max(hi[k] - lo[k] for k in range(3)) or 1.0

sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE'
sc.render.resolution_x = W; sc.render.resolution_y = W
sc.render.image_settings.file_format = 'PNG'
sc.render.film_transparent = False

world = bpy.data.worlds.new('w'); sc.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.55, 0.58, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = 1.6

for d, e in ((( 1, -1, 1), 3.0), ((-1, -1, 0.4), 1.6), ((0, 1, 0.5), 1.2)):
    l = bpy.data.lights.new('l', 'SUN'); l.energy = e
    ob = bpy.data.objects.new('l', l); sc.collection.objects.link(ob)
    v = Vector(d).normalized()
    ob.rotation_euler = v.to_track_quat('-Z', 'Y').to_euler()

cam_d = bpy.data.cameras.new('c'); cam_d.type = 'ORTHO'
cam_d.ortho_scale = size * 1.2
cam = bpy.data.objects.new('c', cam_d); sc.collection.objects.link(cam); sc.camera = cam

views = {
    'front': ((0, -1,  0), (math.pi/2, 0, 0)),
    'back':  ((0,  1,  0), (math.pi/2, 0, math.pi)),
    'right': (( 1,  0,  0), (math.pi/2, 0, math.pi/2)),
    'left':  ((-1,  0,  0), (math.pi/2, 0, -math.pi/2)),
    'top':   ((0,  0,  1), (0, 0, 0)),
    'hero':  ((0.9, -1, 0.55), None),
}
for name, (d, rot) in views.items():
    if only and name not in only: continue
    cam.location = ctr + Vector(d).normalized() * size * 3
    if rot is None:
        cam.rotation_euler = (Vector(d).normalized()).to_track_quat('Z', 'Y').to_euler()
    else:
        cam.rotation_euler = rot
    sc.render.filepath = out + '_' + name + '.png'
    bpy.ops.render.render(write_still=True)

print('SIZE %.4f %.4f %.4f' % tuple(hi[k]-lo[k] for k in range(3)))
