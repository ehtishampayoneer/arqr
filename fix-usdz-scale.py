# -*- coding: utf-8 -*-
"""Corrects the one bad number in each usdz, and nothing else.

Every one of these files is a Sketchfab export, and every one carries a
root Xform called /scene/Meshes with an `xformOp:scale`. When the
converter behaved it wrote 100, which against metersPerUnit = 0.01 is a
net x1 and the model keeps the size its author gave it. When it misfired
it wrote whatever number squeezed the thing into a 3 metre box — and on
the two flat carpets it divided by a zero thickness and wrote 1.2e13,
which is how a rug came to be placed 45 billion kilometres wide.

So this sets that one attribute. It does not touch a vertex, a normal,
a uv, a material or a texture: all of those are read back afterwards and
compared against the original, and the file is refused if any of them
moved. Packaging is done by UsdUtils.CreateNewARKitUsdzPackage — Pixar's
own ARKit packager — rather than by hand, so the zip is laid out the way
Quick Look expects.

The five studio FLOOR planes go too: a 4-point quad carrying a baked
shadow, which belongs to the product photograph and not to the product.

Run:  npm run sizes
"""
import io, json, os, shutil, sys, zipfile, hashlib
from pxr import Usd, UsdGeom, UsdUtils, Sdf, Gf

os.chdir('C:/Users/Ehtisham/Documents/arqr')

PLAN = json.load(io.open('C:/Users/Ehtisham/AppData/Local/Temp/claude/plan.json', encoding='utf8'))
TMP = 'C:/Users/Ehtisham/AppData/Local/Temp/claude/usdzwork'
FLOOR_WORDS = ('FLOOR', 'PLANE001', 'SHADOW')


def members(path):
    with zipfile.ZipFile(path) as z:
        return {i.filename: z.read(i.filename) for i in z.infolist()}


def survey(stage):
    """everything that is not allowed to change"""
    meshes = {}
    for prim in stage.Traverse():
        if not prim.IsA(UsdGeom.Mesh):
            continue
        m = UsdGeom.Mesh(prim)
        pts = m.GetPointsAttr().Get()
        fvc = m.GetFaceVertexCountsAttr().Get()
        fvi = m.GetFaceVertexIndicesAttr().Get()
        nrm = m.GetNormalsAttr().Get()
        pv = UsdGeom.PrimvarsAPI(prim).GetPrimvar('st')
        uvs = pv.Get() if pv else None
        # hash the whole array rather than keep it around
        h = hashlib.sha256()
        for arr in (pts, nrm, uvs):
            h.update(repr(list(arr) if arr else []).encode())
        meshes[str(prim.GetPath())] = (len(pts or ()), len(fvc or ()), len(fvi or ()),
                                       len(nrm or ()), len(uvs or ()), h.hexdigest()[:16])
    shaders = {}
    for prim in stage.Traverse():
        if prim.GetTypeName() in ('Shader', 'Material'):
            shaders[str(prim.GetPath())] = {a.GetName(): str(a.Get())
                                            for a in prim.GetAttributes()}
    return meshes, shaders


def world_size(stage):
    xc = UsdGeom.XformCache(Usd.TimeCode.EarliestTime())
    lo = [1e30] * 3
    hi = [-1e30] * 3
    for prim in stage.Traverse():
        if not prim.IsA(UsdGeom.Mesh):
            continue
        pts = UsdGeom.Mesh(prim).GetPointsAttr().Get()
        if not pts:
            continue
        m = xc.GetLocalToWorldTransform(prim)
        for v in pts:
            w = m.Transform(Gf.Vec3d(v[0], v[1], v[2]))
            for k in range(3):
                lo[k] = min(lo[k], w[k])
                hi[k] = max(hi[k], w[k])
    mpu = UsdGeom.GetStageMetersPerUnit(stage)
    return [(hi[k] - lo[k]) * mpu for k in range(3)]


def floor_prims(meshes):
    """the studio backdrop: a handful of points, named or bound FLOOR"""
    out = []
    for path, info in meshes.items():
        leaf = path.rsplit('/', 1)[-1].upper()
        if info[0] <= 8 and any(w in leaf for w in FLOOR_WORDS):
            # take the whole Plane001 group with it, not just the leaf mesh
            cut = path
            while cut.count('/') > 3:
                head = cut.rsplit('/', 1)[0]
                if 'PLANE001' in head.rsplit('/', 1)[-1].upper():
                    cut = head
                    break
                if 'PLANE001' in cut.rsplit('/', 1)[-1].upper():
                    break
                cut = head
            out.append((path, cut))
    return out


def main():
    todo = [p for p in PLAN if p['change']]
    if len(sys.argv) > 1:
        todo = [p for p in todo if p['f'] in sys.argv[1:]]
    print('  %d usdz to correct\n' % len(todo))
    done, problems = 0, []

    for p in todo:
        src = 'assets/shops/%s/%s.usdz' % (p['shop'], p['f'])
        work = os.path.join(TMP, p['f'])
        if os.path.isdir(work):
            shutil.rmtree(work)
        os.makedirs(work)

        original = members(src)
        root = list(original)[0]
        for name, data in original.items():
            dst = os.path.join(work, name.replace('/', os.sep))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            io.open(dst, 'wb').write(data)

        stage = Usd.Stage.Open(os.path.join(work, root))
        was_meshes, was_shaders = survey(stage)
        was_size = world_size(stage)

        prim = stage.GetPrimAtPath('/scene/Meshes')
        if not prim:
            problems.append(p['f'] + ' — no /scene/Meshes'); continue
        sops = [o for o in UsdGeom.Xformable(prim).GetOrderedXformOps()
                if o.GetOpType() == UsdGeom.XformOp.TypeScale]
        if len(sops) != 1:
            problems.append(p['f'] + ' — %d scale ops, expected 1' % len(sops)); continue
        before = float(sops[0].Get()[0])
        k = p['usdzScale']
        sops[0].Set(Gf.Vec3f(k, k, k))

        dropped = floor_prims(was_meshes)
        for _, cut in dropped:
            stage.RemovePrim(Sdf.Path(cut))

        edited = os.path.join(work, '_edited.usdc')
        stage.GetRootLayer().Export(edited)
        os.replace(edited, os.path.join(work, root))

        chk = Usd.Stage.Open(os.path.join(work, root))
        now_meshes, now_shaders = survey(chk)
        want_meshes = {a: b for a, b in was_meshes.items()
                       if a not in [d[0] for d in dropped]}
        if now_meshes != want_meshes:
            problems.append(p['f'] + ' — geometry moved'); continue
        if now_shaders != was_shaders:
            problems.append(p['f'] + ' — materials moved'); continue

        out = os.path.join(work, '_packed.usdz')
        if not UsdUtils.CreateNewARKitUsdzPackage(os.path.join(work, root), out):
            problems.append(p['f'] + ' — packaging refused'); continue

        # read it back the way a phone would, straight out of the package
        packed = Usd.Stage.Open(out)
        got = world_size(packed)
        want = p['want']
        drift = max(abs(got[i] - want[i]) for i in range(3))
        if drift > 0.003:
            problems.append('%s — lands at %s, wanted %s' % (
                p['f'], [round(v, 3) for v in got], [round(v, 3) for v in want]))
            continue

        kept = members(out)
        moved = [n for n, d in original.items()
                 if n != root and (n not in kept or kept[n] != d)]
        if moved:
            problems.append(p['f'] + ' — textures changed: ' + ', '.join(moved[:3]))
            continue

        shutil.copyfile(out, src)
        done += 1
        print('  %-44s scale %-11s -> %-9s %s m %s' % (
            p['f'][:44], '%.4g' % before, '%.4g' % k,
            ' x '.join('%.3f' % v for v in got),
            '[floor removed]' if dropped else ''))

    print('\n  %d corrected, textures byte-identical throughout' % done)
    if problems:
        print('  %d refused (left untouched):' % len(problems))
        for x in problems:
            print('    ' + x)
        sys.exit(1)


main()
