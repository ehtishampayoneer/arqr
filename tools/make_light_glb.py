"""Light Android/Scene Viewer copy of an ARQR rug GLB: the 6 pile tiles become one
atlas (max 2048 px), one pile material, no KHR_materials_specular, smaller images."""
import sys, io, struct, json, numpy as np
from PIL import Image
from pygltflib import GLTF2, Buffer, BufferView, Accessor, Image as GImage, Texture, Sampler, Material, PbrMetallicRoughness, TextureInfo, Mesh, Primitive, Attributes
src, dst = sys.argv[1], sys.argv[2]
g = GLTF2().load(src); blob = g.binary_blob()
CT = {5120:np.int8,5121:np.uint8,5122:np.int16,5123:np.uint16,5125:np.uint32,5126:np.float32}
NC = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def acc(i):
    a=g.accessors[i]; bv=g.bufferViews[a.bufferView]; dt=np.dtype(CT[a.componentType]); n=NC[a.type]
    off=(bv.byteOffset or 0)+(a.byteOffset or 0); stride=bv.byteStride or dt.itemsize*n
    if stride==dt.itemsize*n: return np.frombuffer(blob,dt,a.count*n,off).reshape(a.count,n).copy()
    raw=np.frombuffer(blob,np.uint8,stride*(a.count-1)+dt.itemsize*n,off)
    return np.stack([np.frombuffer(raw[k*stride:k*stride+dt.itemsize*n].tobytes(),dt) for k in range(a.count)])
def img(i):
    im=g.images[i]; bv=g.bufferViews[im.bufferView]; o=bv.byteOffset or 0
    return Image.open(io.BytesIO(blob[o:o+bv.byteLength]))
mesh=g.meshes[0]; prims=mesh.primitives
mname=lambda p: g.materials[p.material].name
piles=sorted([p for p in prims if mname(p).startswith('pile_')], key=lambda p:int(mname(p).split('_')[1]))
others=[p for p in prims if not mname(p).startswith('pile_')]
assert len(piles) in (4,6), [mname(p) for p in prims]
cols=2; rows=len(piles)//2
T=min(1024, 2048//rows); W,H=cols*T,rows*T
atlas=Image.new('RGB',(W,H))
P=[];N=[];UV=[];IDX=[];base=0
for k,p in enumerate(piles):
    tex=g.materials[p.material].pbrMetallicRoughness.baseColorTexture.index
    t=img(g.textures[tex].source).convert('RGB').resize((T,T),Image.LANCZOS)
    c,r=k%cols,k//cols; atlas.paste(t,(c*T,r*T))
    pos=acc(p.attributes.POSITION); uv=acc(p.attributes.TEXCOORD_0).astype(np.float32)
    uv=np.clip(uv,0,1); uv[:,0]=(c*T+0.5+uv[:,0]*(T-1))/W; uv[:,1]=(r*T+0.5+uv[:,1]*(T-1))/H
    P.append(pos); UV.append(uv)
    if p.attributes.NORMAL is not None: N.append(acc(p.attributes.NORMAL))
    IDX.append(acc(p.indices).reshape(-1).astype(np.uint32)+base); base+=len(pos)
P=np.concatenate(P).astype(np.float32); UV=np.concatenate(UV); IDX=np.concatenate(IDX)
N=np.concatenate(N).astype(np.float32) if len(N)==len(piles) else None
# ---- build a fresh GLB
out=GLTF2(); out.asset=g.asset; out.scene=0; out.scenes=g.scenes; out.nodes=g.nodes
data=bytearray(); bvs=[]; accs=[]
def add_bytes(b,target=None):
    while len(data)%4: data.append(0)
    o=len(data); data.extend(b); bvs.append(BufferView(buffer=0,byteOffset=o,byteLength=len(b),target=target)); return len(bvs)-1
def add_acc(arr,ctype,typ,target,minmax=False):
    v=add_bytes(arr.tobytes(),target); a=Accessor(bufferView=v,componentType=ctype,count=len(arr),type=typ)
    if minmax: a.min=arr.min(0).tolist(); a.max=arr.max(0).tolist()
    accs.append(a); return len(accs)-1
images=[];textures=[];mats=[]
samplers=[Sampler(magFilter=9729,minFilter=9987,wrapS=33071,wrapT=33071),Sampler(magFilter=9729,minFilter=9987)]
def add_img(pil,fmt,q=88):
    b=io.BytesIO()
    if fmt=='JPEG': pil.convert('RGB').save(b,'JPEG',quality=q,optimize=True,progressive=False)
    else: pil.save(b,'PNG',optimize=True)
    v=add_bytes(b.getvalue()); images.append(GImage(bufferView=v,mimeType='image/'+fmt.lower())); return len(images)-1
def add_tex(i,s): textures.append(Texture(source=i,sampler=s)); return len(textures)-1
newprims=[]
def copy_prim(p):
    a=Attributes(POSITION=add_acc(acc(p.attributes.POSITION).astype(np.float32),5126,'VEC3',34962,True))
    if p.attributes.NORMAL is not None: a.NORMAL=add_acc(acc(p.attributes.NORMAL).astype(np.float32),5126,'VEC3',34962)
    if p.attributes.TEXCOORD_0 is not None: a.TEXCOORD_0=add_acc(acc(p.attributes.TEXCOORD_0).astype(np.float32),5126,'VEC2',34962)
    ind=add_acc(acc(p.indices).reshape(-1).astype(np.uint32),5125,'SCALAR',34963)
    m=g.materials[p.material]; pbr=m.pbrMetallicRoughness
    nm=Material(name=m.name,alphaMode=m.alphaMode,alphaCutoff=m.alphaCutoff,doubleSided=m.doubleSided,
        pbrMetallicRoughness=PbrMetallicRoughness(baseColorFactor=pbr.baseColorFactor,metallicFactor=pbr.metallicFactor if pbr.metallicFactor is not None else 0,roughnessFactor=pbr.roughnessFactor if pbr.roughnessFactor is not None else 1))
    ext={k:v for k,v in (m.extensions or {}).items() if k=='KHR_materials_unlit'}
    if ext: nm.extensions=ext
    if pbr.baseColorTexture is not None:
        src_i=g.textures[pbr.baseColorTexture.index].source; im=img(src_i); im.thumbnail((1024,1024))
        alpha=(m.alphaMode in ('MASK','BLEND'))
        nm.pbrMetallicRoughness.baseColorTexture=TextureInfo(index=add_tex(add_img(im,'PNG' if alpha else 'JPEG'),1))
    mats.append(nm); newprims.append(Primitive(attributes=a,indices=ind,material=len(mats)-1))
for p in others: copy_prim(p)
a=Attributes(POSITION=add_acc(P,5126,'VEC3',34962,True),TEXCOORD_0=add_acc(UV,5126,'VEC2',34962))
if N is not None: a.NORMAL=add_acc(N,5126,'VEC3',34962)
ind=add_acc(IDX,5125,'SCALAR',34963)
pm=g.materials[piles[0].material]
mats.append(Material(name='pile',pbrMetallicRoughness=PbrMetallicRoughness(baseColorTexture=TextureInfo(index=add_tex(add_img(atlas,'JPEG',90),0)),metallicFactor=0,roughnessFactor=1),
    extensions={k:v for k,v in (pm.extensions or {}).items() if k=='KHR_materials_unlit'} or None))
newprims.append(Primitive(attributes=a,indices=ind,material=len(mats)-1))
out.meshes=[Mesh(name=mesh.name,primitives=newprims)]
out.accessors=accs; out.bufferViews=bvs; out.images=images; out.textures=textures; out.samplers=samplers; out.materials=mats
used=sorted({k for m in mats for k in (m.extensions or {})})
out.extensionsUsed=used or None
while len(data)%4: data.append(0)
out.buffers=[Buffer(byteLength=len(data))]; out.set_binary_blob(bytes(data)); out.save_binary(dst)
print(dst, f'{len(open(dst,"rb").read())//1024} KB', 'atlas',W,'x',H,'mats',len(mats),'ext',used)
