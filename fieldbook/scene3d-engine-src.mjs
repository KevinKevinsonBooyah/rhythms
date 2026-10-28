import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {FIELD,positionAt,locate} from './core.mjs?v=14';
import {nextVisibleSetIndex} from './display-sets.mjs?v=1';

const mat=(c,metalness=0,roughness=.85)=>new T.MeshStandardMaterial({color:c,metalness,roughness});
const turf=mat('#397d42'),white=mat('#f5f6e9'),gold=mat('#f8cc46',.55,.26),silver=mat('#bcc8ca',.7,.25),black=mat('#20282a'),skin=mat('#ba805f'),uniform=mat('#e9e7d7'),pants=mat('#1b292b'),hat=mat('#162d3a');
const tube=(radius=.045)=>new T.CylinderGeometry(radius,radius,1,7);
const sphere=new T.SphereGeometry(1,8,6),box=new T.BoxGeometry(1,1,1),trunk=new T.CylinderGeometry(.3,.4,1,5),pine=new T.ConeGeometry(1,1,7);
function mesh(parent,geom,material,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=new T.Mesh(geom,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
function rod(parent,a,b,r,material){const d=new T.Vector3().subVectors(b,a),m=mesh(parent,tube(r),material);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
const v=(x,y,z)=>new T.Vector3(x,y,z);
function instrument(name){
  const g=new T.Group(),n=name.toLowerCase(),brass=/trumpet|mellophone|horn|trombone|baritone|euphonium|tuba|sousaphone/.test(n),drum=/drum|snare|tenor|bass|percussion/.test(n);
  const metal=brass?gold:silver;
  if(/colorguard|guard/.test(n)){rod(g,v(.1,-.5,0),v(.1,1.35,0),.025,silver);const flag=mesh(g,box,mat('#c6a7df'),.55,.8,0,.85,.6,.025);flag.rotation.z=-.08;}
  else if(/cymbal/.test(n)){for(const x of [-.25,.25]){const c=mesh(g,new T.CylinderGeometry(.28,.28,.025,14),gold,x,0,.25);c.rotation.z=Math.PI/2;}}
  else if(drum){mesh(g,new T.CylinderGeometry(/bass/.test(n)?.45:.34,/bass/.test(n)?.45:.34,.31,12),white,0,-.15,.32);rod(g,v(-.4,.2,.12),v(.1,-.05,.3),.018,skin);rod(g,v(.4,.2,.12),v(-.1,-.05,.3),.018,skin);}
  else if(/tuba|sousaphone/.test(n)){const ring=mesh(g,new T.TorusGeometry(.46,.055,6,18),gold,0,.25,0);ring.rotation.y=.15;rod(g,v(.3,.5,0),v(.48,.9,.1),.06,gold);const bell=mesh(g,new T.CylinderGeometry(.28,.09,.3,12),gold,.48,1,.1);bell.rotation.x=.18;}
  else if(/trombone/.test(n)){rod(g,v(-.4,0,.2),v(.65,0,.2),.035,gold);rod(g,v(-.3,-.16,.2),v(.65,-.16,.2),.026,gold);rod(g,v(.65,-.16,.2),v(.65,0,.2),.025,gold);const bell=mesh(g,new T.CylinderGeometry(.16,.05,.3,12),gold,.8,0,.2);bell.rotation.z=-Math.PI/2;}
  else if(brass){rod(g,v(-.25,0,.2),v(.46,0,.2),.045,gold);const bell=mesh(g,new T.CylinderGeometry(.18,.055,.28,12),gold,.58,0,.2);bell.rotation.z=-Math.PI/2;for(let i=0;i<3;i++)rod(g,v(-.08+i*.1,.02,.2),v(-.08+i*.1,.13,.2),.015,gold);}
  else if(/sax/.test(n)){const path=new T.CatmullRomCurve3([v(-.2,.2,.2),v(0,-.1,.26),v(.23,-.3,.24),v(.33,-.05,.25)]);g.add(new T.Mesh(new T.TubeGeometry(path,16,.065,7,false),gold));const bell=mesh(g,new T.CylinderGeometry(.17,.06,.26,10),gold,.36,.05,.25);bell.rotation.z=-.3;}
  else if(/flute|piccolo/.test(n)){rod(g,v(-.48,.1,.2),v(.48,.1,.2),.027,silver);}
  else{rod(g,v(-.28,.18,.2),v(.28,-.27,.28),/bassoon|bass clarinet/.test(n)?.06:.036,black);mesh(g,new T.CylinderGeometry(.07,.035,.12,8),silver,.29,-.3,.28);}
  return g;
}
function marcher(person){
  const group=new T.Group(),legs=[],arms=[];
  mesh(group,box,uniform,0,1.13,0,.46,.72,.3);
  mesh(group,box,hat,0,1.52,.02,.47,.09,.32);
  mesh(group,sphere,skin,0,1.76,0,.2,.24,.18);
  mesh(group,new T.CylinderGeometry(.2,.22,.27,10),hat,0,2.03,0);
  mesh(group,box,gold,0,2.19,0,.19,.06,.19);
  for(const x of [-.14,.14]){const leg=new T.Group();leg.position.set(x,.8,0);mesh(leg,tube(.09),pants,0,-.32,0,1,.62,1);mesh(leg,box,black,0,-.69,.1,.18,.1,.3);group.add(leg);legs.push(leg);}
  for(const x of [-.31,.31]){const arm=new T.Group();arm.position.set(x,1.42,0);mesh(arm,tube(.08),uniform,0,-.26,.08,1,.54,1);mesh(arm,sphere,skin,0,-.53,.08,.08,.09,.08);group.add(arm);arms.push(arm);}
  const prop=instrument(person.instrument||'');prop.position.set(.16,1.16,-.33);group.add(prop);
  group.userData={id:person.id,legs,arms,instrument:person.instrument};return group;
}
function label(text){const c=document.createElement('canvas');c.width=512;c.height=80;const x=c.getContext('2d');x.fillStyle='#163a31e8';x.fillRect(0,0,512,80);x.strokeStyle='#ffe5a7';x.lineWidth=4;x.strokeRect(2,2,508,76);x.fillStyle='#fff2ca';x.font='bold 24px system-ui';x.textAlign='center';x.fillText(text.length>38?text.slice(0,37)+'…':text,256,50);const texture=new T.CanvasTexture(c);const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(Math.min(13,Math.max(4,text.length*.29)),1.1,1);sprite.userData.texture=texture;return sprite;}

export class Scene3D{
  constructor(canvas,onSelect){
    this.canvas=canvas;this.onSelect=onSelect;this.side=1;this._firstPerson=false;this.people=new Map();this.pathIds=new Set();this.pickables=[];this.followId='';
    this.scene=new T.Scene();this.scene.background=new T.Color('#93c9e8');this.scene.fog=new T.FogExp2('#8bb0a1',.0035);
    this.camera=new T.PerspectiveCamera(58,1,.1,1500);this.camera.position.set(-85,48,-80);
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.minDistance=2;this.controls.maxDistance=320;this.controls.maxPolarAngle=Math.PI*.49;this.controls.target.set(0,0,0);
    this.controls.addEventListener('change',()=>this.render());
    this.scene.add(new T.HemisphereLight('#d3eaff','#38573d',2.2));const sun=new T.DirectionalLight('#fff1cf',2.4);sun.position.set(-90,150,-80);this.scene.add(sun);
    this.world=new T.Group();this.scene.add(this.world);this.buildWorld();this.routes=new T.Group();this.scene.add(this.routes);
    this.raycaster=new T.Raycaster();this.pointer=new T.Vector2();this.down=null;
    canvas.addEventListener('pointerdown',e=>{this.down={x:e.clientX,y:e.clientY};this.lookPointer={x:e.clientX,y:e.clientY};});
    canvas.addEventListener('pointerup',e=>{if(!this.down||Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>7)return;const r=canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects(this.pickables,true);if(hits[0]){let o=hits[0].object;while(o.parent&&!o.userData.id)o=o.parent;if(o.userData.id)this.onSelect(o.userData.id);}});
    canvas.addEventListener('pointermove',e=>{if(this._firstPerson&&this.lookPointer&&e.buttons){const dx=e.clientX-this.lookPointer.x,dy=e.clientY-this.lookPointer.y;this.lookPointer={x:e.clientX,y:e.clientY};this.lookYaw-=dx*.005;this.lookPitch=T.MathUtils.clamp((this.lookPitch||0)-dy*.005,-.7,.7);this.render();}});
    canvas.addEventListener('pointercancel',()=>{this.lookPointer=null;});canvas.addEventListener('pointerup',()=>{this.lookPointer=null;});
    canvas.addEventListener('wheel',e=>{if(this._firstPerson){e.preventDefault();this.camera.fov=T.MathUtils.clamp(this.camera.fov+Math.sign(e.deltaY)*2,35,75);this.camera.updateProjectionMatrix();this.render();}},{passive:false});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
  }
  get firstPerson(){return this._firstPerson;}
  set firstPerson(value){this._firstPerson=!!value;this.controls.enabled=!this._firstPerson;this.lookYaw=0;this.lookPitch=0;this.render();}
  buildWorld(){
    mesh(this.world,new T.PlaneGeometry(1600,1600),mat('#365f39'),0,-.09,0).rotation.x=-Math.PI/2;
    const field=mesh(this.world,new T.PlaneGeometry(120,FIELD.width),turf,0,0,0);field.rotation.x=-Math.PI/2;
    for(const x of [-55,55])mesh(this.world,new T.PlaneGeometry(10,FIELD.width),mat('#226a54'),x,.008,0).rotation.x=-Math.PI/2;
    const lines=[];const add=(x1,z1,x2,z2)=>lines.push(x1,.025,z1,x2,.025,z2);
    for(let x=-50;x<=50;x+=5)add(x,-FIELD.width/2,x,FIELD.width/2);
    for(const z of [-FIELD.width/2,FIELD.width/2])add(-60,z,60,z);
    for(let x=-50;x<=50;x++)for(const z of [-FIELD.width/2,FIELD.width/2])add(x,z,x,z+(z<0?1:-1));
    for(let x=-49;x<50;x++)for(const z of [FIELD.frontHash-FIELD.width/2,FIELD.backHash-FIELD.width/2])add(x,z-.36,x,z+.36);
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(lines,3));this.world.add(new T.LineSegments(geo,new T.LineBasicMaterial({color:'#e8f5e8'})));
    for(const x of [-60,60]){rod(this.world,v(x,0,0),v(x,6,0),.16,gold);rod(this.world,v(x,6,-5),v(x,6,5),.14,gold);for(const z of [-5,5])rod(this.world,v(x,6,z),v(x,15,z),.13,gold);}
    // Instanced geometry: every trunk and canopy is real 3D, but all trees batch into a few draw calls.
    const count=650,trunks=new T.InstancedMesh(trunk,mat('#554535'),count),crowns=new T.InstancedMesh(pine,mat('#285c3c'),count),crowns2=new T.InstancedMesh(pine,mat('#32794a'),count),dummy=new T.Object3D();
    for(let i=0;i<count;i++){let x,z;const seed=(i*73.311)%1,other=(i*17.137)%1;
      if(i%2){x=-350+seed*700;z=i%4===1?-36-other*320:36+other*320;}else{x=i%4===0?-69-other*320:69+other*320;z=-300+seed*600;}
      const h=5+((i*11.913)%1)*10;
      dummy.position.set(x,h*.09,z);dummy.scale.set(1,h*.18,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
      dummy.position.set(x,h*.52,z);dummy.scale.set(h*.27,h*.65,h*.27);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);
      dummy.position.set(x,h*.78,z);dummy.scale.set(h*.2,h*.48,h*.2);dummy.updateMatrix();crowns2.setMatrixAt(i,dummy.matrix);
    }for(const m of [trunks,crowns,crowns2]){m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;this.world.add(m);}
    const grassCount=2800,blades=new T.InstancedMesh(new T.ConeGeometry(.045,.24,3),mat('#82ad59'),grassCount);
    for(let i=0;i<grassCount;i++){dummy.position.set(-59+(i*31.117)%118,.11,-FIELD.width/2+(i*17.819)%FIELD.width);dummy.scale.setScalar(.5+(i*7.317)%1);dummy.updateMatrix();blades.setMatrixAt(i,dummy.matrix);}blades.instanceMatrix.needsUpdate=true;blades.frustumCulled=false;this.world.add(blades);
  }
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(w<1||h<1)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.render();}
  point(p){let x=this.options?.swap?100-p.x:p.x,z=p.y;if(this.options?.flip){x=100-x;z=FIELD.width-z;}return v(x-50,0,z-FIELD.width/2);}
  reset(){this.firstPerson=false;this.controls.target.set(0,0,0);this.camera.position.set(this.side===1?-85:85,48,-80);this.controls.update();this.render();}
  zoom(factor){if(this._firstPerson){this.camera.fov=T.MathUtils.clamp(this.camera.fov*factor,35,75);this.camera.updateProjectionMatrix();}else{const d=this.camera.position.clone().sub(this.controls.target).multiplyScalar(factor);this.camera.position.copy(this.controls.target).add(d);this.controls.update();}this.render();}
  setSide(side){this.side=side;this.reset();}
  update(movement,count,selected,options={},manualSet=null,followId='',pathIds=new Set(),isolateId='',query=''){
    const changed=movement!==this.movement;this.movement=movement;this.count=count;this.selected=selected;this.options=options;this.manualSet=manualSet;this.pathIds=pathIds;this.isolateId=isolateId;this.query=query.toLowerCase();
    if(changed)this.buildPeople();
    if(!followId&&this._firstPerson)this.firstPerson=false;
    const wasFollowing=this.followId;this.followId=followId;
    for(const p of movement?.people||[]){const g=this.people.get(p.id),pos=manualSet===null?positionAt(p,movement.sets,count):p.positions[movement.sets[manualSet]?.id];if(!g)continue;g.visible=!!pos;if(!pos)continue;
      g.position.copy(this.point(pos));const phase=(count%2)*Math.PI;g.userData.legs[0].rotation.x=Math.sin(phase)*.24;g.userData.legs[1].rotation.x=-Math.sin(phase)*.24;
      const fade=isolateId&&p.id!==isolateId?.3:query&&!`${p.instrument} ${p.symbol}${p.label}`.toLowerCase().includes(query)&&!options.noSearchFade?.55:1;
      if(g.userData.opacity!==fade){g.traverse(o=>{if(o.isMesh)o.material.opacity=fade;});g.userData.opacity=fade;}
      g.scale.setScalar(p.id===selected?1.14:1);
    }
    const followed=movement?.people.find(p=>p.id===followId),fpos=followed&&(manualSet===null?positionAt(followed,movement.sets,count):followed.positions[movement.sets[manualSet]?.id]);
    if(fpos){const target=this.point(fpos);target.y=1.2;
      if(this._firstPerson){this.camera.position.copy(target).add(v(0,.5,0));const l=locate(movement.sets,count),next=followed.positions[movement.sets[l.next]?.id],dest=next?this.point(next):target.clone().add(v(0,0,-10));let dir=dest.sub(target).setY(0);if(dir.lengthSq()<.001)dir=this.lastDirection||v(0,0,-1);dir.normalize();this.lastDirection=dir.clone();dir.applyAxisAngle(v(0,1,0),this.lookYaw||0);this.camera.lookAt(this.camera.position.clone().add(dir.multiplyScalar(10)).add(v(0,(this.lookPitch||0)*10,0)));}
      else{const delta=target.clone().sub(this.controls.target);this.controls.target.copy(target);this.camera.position.add(delta);if(!wasFollowing){this.camera.position.copy(target).add(v(this.side===1?-11:11,8,-11));}this.controls.update();}
      this.setHeld(followed);
    }else this.setHeld(null);
    this.drawGuides();this.render();
  }
  setHeld(person){const id=this._firstPerson?person?.id||'':'';if(this.heldPerson===id)return;this.heldPerson=id;
    if(this.held){this.camera.remove(this.held);this.held.traverse(o=>{if(o.isMesh)o.geometry.dispose();});this.held=null;}
    if(!id)return;this.held=instrument(person.instrument||'');this.held.position.set(.25,-.34,-1.2);this.held.scale.setScalar(1.2);this.camera.add(this.held);this.scene.add(this.camera);}
  buildPeople(){for(const g of this.people.values())this.scene.remove(g);this.people.clear();this.pickables=[];
    for(const p of this.movement?.people||[]){const g=marcher(p);g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.depthWrite=false;}});this.scene.add(g);this.people.set(p.id,g);this.pickables.push(g);}
  }
  drawGuides(){while(this.routes.children.length){const c=this.routes.children[0];this.routes.remove(c);if(c.userData.texture)c.userData.texture.dispose();if(c.geometry)c.geometry.dispose();}
    const m=this.movement;if(!m)return;const route=(pts,color)=>{if(pts.length<2)return;const geo=new T.BufferGeometry().setFromPoints(pts);this.routes.add(new T.Line(geo,new T.LineBasicMaterial({color,depthTest:false})));};
    for(const p of m.people){if(!this.pathIds?.has(p.id))continue;const points=m.sets.map(s=>p.positions[s.id]).filter(Boolean).map(pos=>this.point(pos).add(v(0,.1,0)));route(points,'#ffd27a');}
    const p=m.people.find(q=>q.id===this.selected);if(!p)return;const l=this.manualSet===null?locate(m.sets,this.count):{index:this.manualSet,next:Math.min(this.manualSet+1,m.sets.length-1)},n=this.options.ignoreLetterSets?nextVisibleSetIndex(m.sets,l.index,true):l.next;
    const a=p.positions[m.sets[l.index]?.id],b=p.positions[m.sets[n]?.id];if(!a||!b)return;
    const start=this.point(a).add(v(0,.13,0)),end=this.point(b).add(v(0,.13,0)),corner=v(end.x,.13,start.z);
    if(this.options.paths){route([start,end],'#ffe49c');route([start,corner,end],'#e9f7db');const step=(this.options.step||22.5)/36;
      const lr=label(`${end.x>=start.x?'Right':'Left'} ${(Math.abs(end.x-start.x)/step).toFixed(1)} st`);lr.position.copy(start).lerp(corner,.5).add(v(0,1.4,0));this.routes.add(lr);
      const fb=label(`${end.z>=start.z?'Back':'Front'} ${(Math.abs(end.z-start.z)/step).toFixed(1)} st`);fb.position.copy(corner).lerp(end,.5).add(v(0,1.4,0));this.routes.add(fb);}
    const ring=mesh(this.routes,new T.TorusGeometry(.55,.04,6,24),gold,start.x,.12,start.z);ring.rotation.x=Math.PI/2;
    mesh(this.routes,new T.SphereGeometry(.18,8,6),gold,end.x,.25,end.z);
    const dest=label(`Go to ${m.sets[n].id}`);dest.position.copy(end).add(v(0,3.2,0));this.routes.add(dest);
    if(b.row&&this.options.labels){const l=label(b.row.side||'L/R unknown');l.position.copy(end).add(v(0,5,0));this.routes.add(l);const f=label(b.row.depth||'F/B unknown');f.position.copy(end).add(v(0,6.5,0));this.routes.add(f);}
  }
  render(){if(!this.renderer||!this.camera)return;this.renderer.render(this.scene,this.camera);}
}
