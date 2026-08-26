# -*- coding: utf-8 -*-
"""Measures what Quick Look actually puts in the room.

Computed from the mesh points themselves, with their world transforms —
not from the authored `extent` attribute, because at least two of these
files carry a corrupt one (carpet-carpet claims 2.9e15 units wide).

Backdrop geometry is reported separately from the product: several of
these files ship a studio floor plane, which is both what casts the
shadow and what inflates the box.
"""
import json, io, os
from pxr import Usd, UsdGeom, Gf

os.chdir('C:/Users/Ehtisham/Documents/arqr')
sub = json.load(io.open('shop-products.json', encoding='utf8'))

FLOORISH = ('floor', 'ground', 'backdrop', 'shadow', 'plane001')


def is_floor(prim, npts, size):
    name = (prim.GetName() or '').lower()
    path = str(prim.GetPath()).lower()
    hit = any(w in name or w in path for w in FLOORISH)
    # a quad called FLOOR is a backdrop whatever its thickness reads as.
    # Requiring dead-flat missed the ava rug, whose plane measured a hair
    # above zero, and left a 3.34 m sheet inside the product bounds.
    return hit and npts <= 8


rows = []
scales = []
for slug in sub:
    for it in sub[slug]:
        p = 'assets/shops/%s/%s.usdz' % (slug, it['f'])
        if not os.path.exists(p):
            continue
        st = Usd.Stage.Open(p)
        mpu = UsdGeom.GetStageMetersPerUnit(st)
        xc = UsdGeom.XformCache(Usd.TimeCode.EarliestTime())

        prod = [None, None]   # lo, hi
        floors = []
        meshes = 0
        for prim in st.Traverse():
            if not prim.IsA(UsdGeom.Mesh):
                continue
            pts = UsdGeom.Mesh(prim).GetPointsAttr().Get(Usd.TimeCode.EarliestTime())
            if not pts:
                continue
            meshes += 1
            m = xc.GetLocalToWorldTransform(prim)
            lo = [1e30] * 3
            hi = [-1e30] * 3
            for v in pts:
                w = m.Transform(Gf.Vec3d(v[0], v[1], v[2]))
                for k in range(3):
                    if w[k] < lo[k]: lo[k] = w[k]
                    if w[k] > hi[k]: hi[k] = w[k]
            size = [hi[k] - lo[k] for k in range(3)]
            if is_floor(prim, len(pts), size):
                floors.append(dict(name=prim.GetName(), size=size))
                continue
            if prod[0] is None:
                prod = [lo, hi]
            else:
                for k in range(3):
                    prod[0][k] = min(prod[0][k], lo[k])
                    prod[1][k] = max(prod[1][k], hi[k])

        size = None if prod[0] is None else [prod[1][k] - prod[0][k] for k in range(3)]
        # the normaliser's scale op, which is the one thing that gets corrected
        ops = []
        for prim in st.Traverse():
            xf = UsdGeom.Xformable(prim)
            if not xf:
                continue
            for op in xf.GetOrderedXformOps():
                if op.GetOpType() == UsdGeom.XformOp.TypeScale:
                    v = op.Get()
                    ops.append([str(prim.GetPath()), float(v[0]), float(v[1]), float(v[2])])
        scales.append(dict(shop=slug, f=it['f'], scales=ops))

        rows.append(dict(shop=slug, f=it['f'], n=it['n'], c=it['c'], mpu=mpu,
                         meshes=meshes, floors=floors,
                         units=size,
                         metres=None if size is None else [s * mpu for s in size]))

json.dump(rows, io.open('C:/Users/Ehtisham/AppData/Local/Temp/claude/usdz-true.json', 'w',
                        encoding='utf8'), indent=1)
json.dump(scales, io.open('C:/Users/Ehtisham/AppData/Local/Temp/claude/usdz-scales.json', 'w',
                          encoding='utf8'), indent=1)
print('  measured %d usdz from points' % len(rows))
print('  with a backdrop plane: %d' % len([r for r in rows if r['floors']]))
