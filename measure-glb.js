'use strict';
const fs=require('fs');
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const draco3d=require('draco3dgltf');
function mul(a,b){const o=new Array(16);for(let r=0;r<4;r++)for(let c=0;c<4;c++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;}
function xf(m,p){const[x,y,z]=p;return[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];}
const isFloor=(nodeName,matName,tris,size)=>{
  const s=((nodeName||'')+' '+(matName||'')).toUpperCase();
  return /FLOOR|GROUND|BACKDROP|SHADOW|PLANE00/.test(s) && tris<=4 && size[1]<1e-4;
};
(async()=>{
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder':await draco3d.createEncoderModule(),'draco3d.decoder':await draco3d.createDecoderModule()});
 const box={window:{}};new Function('window',fs.readFileSync('stores.js','utf8'))(box.window);
 const out=[];
 for(const s of box.window.ARQR_STORES) for(const it of s.items){
  const doc=await io.read(it.glb);
  const I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  const parts=[];
  const walk=(n,par)=>{const m=mul(par,n.getMatrix());const me=n.getMesh();
   if(me){let lo=[1e30,1e30,1e30],hi=[-1e30,-1e30,-1e30],tris=0,mats=[];
    me.listPrimitives().forEach(p=>{const a=p.getAttribute('POSITION');if(!a)return;
     const idx=p.getIndices();tris+=(idx?idx.getCount():a.getCount())/3;
     const mt=p.getMaterial();if(mt)mats.push(mt.getName());
     const mn=a.getMin([]),mx=a.getMax([]);
     for(let i=0;i<8;i++){const c=xf(m,[i&1?mx[0]:mn[0],i&2?mx[1]:mn[1],i&4?mx[2]:mn[2]]);
      for(let k=0;k<3;k++){if(c[k]<lo[k])lo[k]=c[k];if(c[k]>hi[k])hi[k]=c[k];}}});
    if(tris)parts.push({name:n.getName()||me.getName()||'',mat:mats.join(','),tris,
      size:[hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2]],lo,hi});}
   n.listChildren().forEach(c=>walk(c,m));};
  doc.getRoot().listScenes().forEach(sc=>sc.listChildren().forEach(n=>walk(n,I)));
  const floors=parts.filter(p=>isFloor(p.name,p.mat,p.tris,p.size));
  const keep=parts.filter(p=>!floors.includes(p));
  const lo=[1e30,1e30,1e30],hi=[-1e30,-1e30,-1e30];
  keep.forEach(p=>{for(let k=0;k<3;k++){if(p.lo[k]<lo[k])lo[k]=p.lo[k];if(p.hi[k]>hi[k])hi[k]=p.hi[k];}});
  out.push({shop:s.slug,f:it.f,n:it.n,c:it.c,d:it.d,
    product:[hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2]],
    floors:floors.map(p=>({name:p.name,mat:p.mat,size:p.size})),
    parts:parts.length});
 }
 fs.writeFileSync('C:/Users/Ehtisham/AppData/Local/Temp/claude/audit.json',JSON.stringify(out,null,1));
 console.log('audited '+out.length+', with a floor plane: '+out.filter(o=>o.floors.length).length);
})();
