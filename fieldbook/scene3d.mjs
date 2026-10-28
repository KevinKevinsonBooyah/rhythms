import {FIELD,positionAt,locate} from './core.mjs?v=14';
import {nextVisibleSetIndex} from './display-sets.mjs?v=1';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const vector=(x,y,z=0)=>({x,y,z});
const sub=(a,b)=>vector(a.x-b.x,a.y-b.y,a.z-b.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const norm=a=>{const d=Math.hypot(a.x,a.y,a.z)||1;return vector(a.x/d,a.y/d,a.z/d);};
const cross=(a,b)=>vector(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);

export class Scene3D {
  constructor(canvas,onSelect){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onSelect=onSelect;
    this.side=1;this.pick=[];this.count=0;this.selected='';this.firstPerson=false;
    this.yaw=-2.36;this.pitch=.37;this.lookOffset=0;this.distance=122;this.followDistance=32;this.pan=vector(0,0);
    this.pointers=new Map();this.dragged=false;this.lastPinch=0;
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.dragged=false;this.lastPinch=0;});
    canvas.addEventListener('pointermove',e=>{if(!this.pointers.has(e.pointerId))return;
      const previous=this.pointers.get(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
      if(this.pointers.size===2){const [a,b]=[...this.pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
        if(this.lastPinch)this.zoom(this.lastPinch/distance);this.lastPinch=distance;
        const panScale=(this.firstPerson?3:this.followId?this.followDistance:this.distance)/this.canvas.clientWidth;
        this.pan.x-=dx*panScale;this.pan.y-=dy*panScale;this.draw();this.dragged=true;
      }else if(Math.hypot(dx,dy)>0){if(e.shiftKey){const factor=(this.followId?this.followDistance:this.distance)/this.canvas.clientWidth;this.pan.x+=dx*factor;this.pan.y+=dy*factor;}
        else{if(this.firstPerson)this.lookOffset-=dx*.006;else this.yaw-=dx*.006;this.pitch=clamp(this.pitch+dy*.005,.04,1.27);}
        this.dragged=true;this.draw();}
    });
    canvas.addEventListener('pointerup',e=>{if(!this.dragged&&this.pointers.size===1){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      const hit=[...this.pick].reverse().find(p=>Math.hypot(p.x-x,p.y-y)<Math.max(14,p.size*.75));if(hit)this.onSelect(hit.id);
    }this.pointers.delete(e.pointerId);this.lastPinch=0;});
    canvas.addEventListener('pointercancel',e=>{this.pointers.delete(e.pointerId);this.lastPinch=0;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom(Math.exp(e.deltaY*.001));this.draw();},{passive:false});
    this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(canvas);
  }
  zoom(factor){if(this.firstPerson)this.pitch=clamp(this.pitch+(factor-1)*.1,.04,1.27);else if(this.followId)this.followDistance=clamp(this.followDistance*factor,5,110);else this.distance=clamp(this.distance*factor,18,340);this.draw();}
  reset(){this.distance=122;this.followDistance=32;this.pitch=.37;this.lookOffset=0;this.pan=vector(0,0);this.yaw=this.side===1?-2.36:-.78;this.firstPerson=false;this.draw();}
  setSide(side){this.side=side;this.yaw=side===1?-2.36:-.78;this.pan=vector(0,0);this.draw();}
  update(movement,count,selected,options={},manualSet=null,followId='',pathIds=new Set(),isolateId='',query=''){
    this.movement=movement;this.count=count;this.selected=selected;this.options=options;this.manualSet=manualSet;this.followId=followId;this.pathIds=pathIds;this.isolateId=isolateId;this.query=query.toLowerCase();
    if(!followId)this.firstPerson=false;this.draw();
  }
  position(person){return this.manualSet===null?positionAt(person,this.movement.sets,this.count):person.positions[this.movement.sets[this.manualSet]?.id];}
  point(p){let x=this.options?.swap?100-p.x:p.x,y=p.y;
    if(this.options?.flip){x=100-x;y=FIELD.width-y;}
    return vector(x,y,0);
  }
  draw(){
    const c=this.canvas,rect=c.getBoundingClientRect(),w=rect.width,h=rect.height;
    if(w<1||h<1)return;
    const dpr=Math.min(devicePixelRatio||1,2),pw=Math.round(w*dpr),ph=Math.round(h*dpr);
    if(c.width!==pw||c.height!==ph){c.width=pw;c.height=ph;}
    const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const sky=ctx.createLinearGradient(0,0,0,h*.8);sky.addColorStop(0,'#78b8dc');sky.addColorStop(.55,'#c5e5eb');sky.addColorStop(1,'#f6e6b9');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const horizon=ctx.createLinearGradient(0,h*.2,0,h*.6);horizon.addColorStop(0,'#ffffff00');horizon.addColorStop(1,'#ffffff40');ctx.fillStyle=horizon;ctx.fillRect(0,h*.24,w,h*.35);
    for(let layer=0;layer<3;layer++){
      const base=h*(.48+layer*.055),size=16+layer*18;
      ctx.fillStyle=['#76a69355','#4f846d77','#35674f88'][layer];ctx.beginPath();ctx.moveTo(0,h);
      for(let x=-size;x<w+size;x+=size*.57){const peak=base-size*(.55+((Math.floor(x/size)*17+layer*11)%7)/13);
        ctx.lineTo(x,base);ctx.lineTo(x+size*.28,peak);ctx.lineTo(x+size*.56,base);}
      ctx.lineTo(w,h);ctx.closePath();ctx.fill();
    }
    const side1Left=!(!!this.options?.swap!==!!this.options?.flip);
    const left=this.side===1?side1Left:!side1Left;
    if(this.followId&&this.movement?.people){
      const person=this.movement.people.find(p=>p.id===this.followId),pos=person&&this.position(person);
      if(pos)this.followPoint=this.point(pos);
    }
    const center=this.followId&&this.followPoint?this.followPoint:vector(50,FIELD.width/2);
    const focus=vector(center.x+this.pan.x,center.y+this.pan.y,this.followId?1:0);
    let from,target;
    if(this.firstPerson&&this.followId&&this.followPoint){
      const person=this.movement.people.find(p=>p.id===this.followId),l=locate(this.movement.sets,this.count),next=person?.positions[this.movement.sets[l.next]?.id];
      if(next){const d=sub(this.point(next),this.followPoint);if(Math.hypot(d.x,d.y)>.05)this.firstDirection=norm(vector(d.x,d.y));}
      this.firstDirection??=vector(left?1:-1,.2);
      const angle=Math.atan2(this.firstDirection.y,this.firstDirection.x)+this.lookOffset,d=vector(Math.cos(angle),Math.sin(angle));
      from=vector(focus.x-d.x*.45,focus.y-d.y*.45,1.8);
      target=vector(from.x+d.x*18,from.y+d.y*18,1.8+Math.tan(this.pitch-.37)*4);
    }else{
      const distance=this.followId?this.followDistance:this.distance;
      const yaw=this.yaw+(side1Left?0:(this.side===1?1.58:-1.58));
      from=vector(focus.x+Math.cos(yaw)*distance*Math.cos(this.pitch),focus.y+Math.sin(yaw)*distance*Math.cos(this.pitch),focus.z+distance*Math.sin(this.pitch));
      target=focus;
    }
    const forward=norm(sub(target,from)),right=norm(cross(forward,vector(0,0,1))),up=cross(right,forward);
    const focal=Math.min(w*.78,h*1.35);
    const depth=p=>dot(sub(p,from),forward),near=.35;
    const project=p=>{const v=sub(p,from),d=dot(v,forward);if(d<near-.001)return null;const size=focal/Math.max(d,near);return {x:w/2+dot(v,right)*size,y:h*.53-dot(v,up)*size,size,depth:d};};
    const lerp=(a,b,t)=>vector(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t);
    const clipped=(points)=>{let out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],da=depth(a),db=depth(b),inside=da>=near;if(inside)out.push(a);if((da>=near)!==(db>=near))out.push(lerp(a,b,(near-da)/(db-da)));}return out;};
    const polygon=(points,fill,stroke=null,width=1)=>{const ps=clipped(points).map(project);if(ps.length<3||ps.some(p=>!p))return;ctx.beginPath();ctx.moveTo(ps[0].x,ps[0].y);for(const p of ps.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
    const line=(a,b,color,width=1)=>{const da=depth(a),db=depth(b);if(da<near&&db<near)return;if(da<near)a=lerp(a,b,(near-da)/(db-da));else if(db<near)b=lerp(a,b,(near-db)/(da-db));const p=project(a),q=project(b);if(!p||!q)return;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
    // The forest continues past every sideline, and distant layers soften into the sky.
    polygon([vector(-600,-600),vector(600,-600),vector(600,600),vector(-600,600)],'#345f3b');
    polygon([vector(-20,-18),vector(120,-18),vector(120,72),vector(-20,72)],'#265f36');
    for(let i=0;i<22;i++){
      const x=-10+i*5;
      polygon([vector(x,0),vector(x+5,0),vector(x+5,FIELD.width),vector(x,FIELD.width)],i%2?'#368b46':'#419953');
    }
    polygon([vector(-10,0),vector(0,0),vector(0,FIELD.width),vector(-10,FIELD.width)],'#246b54');
    polygon([vector(100,0),vector(110,0),vector(110,FIELD.width),vector(100,FIELD.width)],'#246b54');
    // Stable, tiny blades of grass, sparse at distance to keep phone rendering quick.
    for(let i=0;i<480;i++){
      const x=((i*73.913)%120)-10,y=(i*37.173)%FIELD.width;
      const p=project(vector(x,y));if(!p||p.size<1)continue;
      ctx.strokeStyle=i%3?'#b6d77d24':'#d9e99c35';ctx.lineWidth=Math.min(1.4,p.size*.035);
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.min(2,p.size*.05),p.y-Math.min(3,p.size*.07));ctx.stroke();
    }
    const white='#f3faf0c9';
    for(let x=0;x<=100;x+=5)line(vector(x,0),vector(x,FIELD.width),white,x%10===0?2.1:1.35);
    for(const y of [0,FIELD.width])line(vector(0,y),vector(100,y),'#f8fff0',2.4);
    for(const y of [FIELD.frontHash,FIELD.backHash])for(let x=1;x<100;x+=1)line(vector(x,y-.35),vector(x,y+.35),'#f3faf0ba',1);
    for(let x=0;x<=100;x++)for(const y of [0,FIELD.width])line(vector(x,y),vector(x,y+(y===0?1:-1)),white,1);
    // Both end-zone goalposts have uprights and a square Y crossbar.
    for(const x of [-10,110]){
      const y=FIELD.width/2,gold='#ffe356';
      line(vector(x,y,0),vector(x,y,6),gold,Math.max(2,project(vector(x,y,6))?.size*.17||2));
      line(vector(x,y-5,6),vector(x,y+5,6),gold,3.8);
      for(const edge of [y-5,y+5])line(vector(x,edge,6),vector(x,edge,15),gold,3.5);
    }
    const trees=[];
    for(let i=0;i<230;i++){
      const spread=(i*47.711)%1,row=Math.floor(i/4),offset=(row*13.117)%1;
      let x,y;
      if(i%4<2){x=-35+row*3.1+(offset-.5)*2;y=i%4===0?-22-spread*38:FIELD.width+17+spread*48;}
      else{x=i%4===2?-24-spread*55:124+spread*55;y=-60+row*2.3+(offset-.5)*5;}
      const p=project(vector(x,y)),height=7+((i*13.117)%1)*12;
      if(p&&p.x>-80&&p.x<w+80&&p.y>-h*.5&&p.y<h+120)trees.push({p,height,i});
    }
    trees.sort((a,b)=>b.p.depth-a.p.depth);
    for(const {p,height,i} of trees){const size=clamp(height*p.size,2,160),opacity=clamp(1-p.depth/700,.15,.9);
      ctx.save();ctx.globalAlpha=opacity;ctx.translate(p.x,p.y);
      ctx.fillStyle='#493b2b';ctx.fillRect(-size*.035,-size*.42,size*.07,size*.42);
      ctx.fillStyle=['#164b36','#255b3c','#326944','#20543a'][i%4];
      for(let tier=0;tier<3;tier++){const top=-size*(.42+tier*.2),half=size*(.33-tier*.065);
        ctx.beginPath();ctx.moveTo(0,top-size*.34);ctx.lineTo(-half,top+size*.13);ctx.lineTo(half,top+size*.13);ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    this.pick=[];
    if(this.movement){
      const sprites=[];
      for(const person of this.movement.people){const pos=this.position(person);if(!pos)continue;
        const ground=project(this.point(pos));if(ground)sprites.push({person,ground});
      }
      for(const person of this.movement.people){if(!this.pathIds?.has(person.id))continue;let previous=null;
        for(const set of this.movement.sets){const p=person.positions[set.id];if(!p){previous=null;continue;}
          const world=this.point(p);world.z=.13;if(previous)line(previous,world,'#ffdb81c0',1.5);
          const q=project(world);if(q){ctx.beginPath();ctx.arc(q.x,q.y,clamp(q.size*.12,2,5),0,Math.PI*2);ctx.fillStyle='#ffe39b';ctx.fill();}previous=world;
        }
      }
      const selected=this.movement.people.find(p=>p.id===this.selected);
      if(selected)this.guides(ctx,selected,project,line);
      sprites.sort((a,b)=>b.ground.depth-a.ground.depth);
      for(const {person,ground} of sprites)if(!(this.firstPerson&&person.id===this.followId))this.marcher(person,ground,ctx);
    }
    const vignette=ctx.createLinearGradient(0,h*.7,0,h);vignette.addColorStop(0,'#0d2d1900');vignette.addColorStop(1,'#0d2d1955');ctx.fillStyle=vignette;ctx.fillRect(0,h*.7,w,h*.3);
  }
  guides(ctx,person,project,line){
    const sets=this.movement.sets,l=this.manualSet===null?locate(sets,this.count):{index:this.manualSet,next:Math.min(this.manualSet+1,sets.length-1)};
    const start=person.positions[sets[l.index]?.id],targetIndex=this.options.ignoreLetterSets?nextVisibleSetIndex(sets,l.index,true):l.next;
    const end=person.positions[sets[targetIndex]?.id];if(!start||!end)return;
    const a=this.point(start),b=this.point(end),corner=vector(b.x,a.y,.2),groundA=vector(a.x,a.y,.2),groundB=vector(b.x,b.y,.2);
    const screenA=project(groundA),screenB=project(groundB),screenCorner=project(corner);
    if(this.options.paths){
      line(groundA,groundB,'#ffe09e',2.6);line(groundA,corner,'#e8f8e8df',1.4);line(corner,groundB,'#e8f8e8df',1.4);
      if(this.options.ignoreLetterSets&&targetIndex>l.next){let previous=groundA;for(let i=l.index+1;i<=targetIndex;i++){
        const p=person.positions[sets[i]?.id];if(p){const q=this.point(p);q.z=.3;line(previous,q,'#ffebbd',2);previous=q;}
      }}
      if(screenCorner){ctx.beginPath();ctx.arc(screenCorner.x,screenCorner.y,3,0,Math.PI*2);ctx.fillStyle='#fff4c4';ctx.fill();}
      const mid=(p,q)=>p&&q?{x:(p.x+q.x)/2,y:(p.y+q.y)/2}:null;
      const step=(this.options.step||22.5)/36;
      this.chip(ctx,mid(screenA,screenCorner),`${b.x>=a.x?'Right':'Left'} ${(Math.abs(b.x-a.x)/step).toFixed(1)} st`);
      this.chip(ctx,mid(screenCorner,screenB),`${b.y>=a.y?'Back':'Front'} ${(Math.abs(b.y-a.y)/step).toFixed(1)} st`);
    }
    if(screenA){ctx.beginPath();ctx.ellipse(screenA.x,screenA.y,clamp(screenA.size*.35,4,14),clamp(screenA.size*.13,2,5),0,0,Math.PI*2);ctx.strokeStyle='#ffebb9a6';ctx.lineWidth=1.5;ctx.stroke();}
    if(screenB){ctx.beginPath();ctx.arc(screenB.x,screenB.y,clamp(screenB.size*.18,3,7),0,Math.PI*2);ctx.fillStyle='#ffdc89';ctx.fill();
      const row=end.row,above=project(vector(b.x,b.y,3))||{x:screenB.x,y:screenB.y-35};
      this.chip(ctx,{x:above.x,y:above.y-20},`Go to ${sets[targetIndex].id}`);
      if(row&&this.options.labels){this.chip(ctx,{x:above.x,y:above.y-42},`L/R: ${row.side||'Unknown'}`,true);
        this.chip(ctx,{x:above.x,y:above.y-60},`F/B: ${row.depth||'Unknown'}`,true);}
    }
  }
  chip(ctx,p,text,small=false){if(!p||!Number.isFinite(p.x+p.y))return;ctx.save();ctx.font=`700 ${small?10:12}px system-ui`;const width=ctx.measureText(text).width+12;
    ctx.fillStyle='#12332ee8';ctx.fillRect(p.x-width/2,p.y-12,width,17);ctx.strokeStyle='#ffdf94bb';ctx.strokeRect(p.x-width/2,p.y-12,width,17);
    ctx.textAlign='center';ctx.fillStyle='#fff3c7';ctx.fillText(text,p.x,p.y);ctx.restore();}
  marcher(person,p,ctx){
    const x=p.x,y=p.y,s=clamp(p.size*.8,3.8,52),inst=(person.instrument||'').toLowerCase();
    const selected=person.id===this.selected,color=selected?'#ffe292':'#f6f9ed';
    ctx.save();ctx.translate(x,y);
    if(this.isolateId&&this.isolateId!==person.id)ctx.globalAlpha=.3;
    else if(this.query&&!(`${person.instrument} ${person.symbol}${person.label}`).toLowerCase().includes(this.query)&&!this.options.noSearchFade)ctx.globalAlpha=.55;
    ctx.fillStyle='#0b33245b';ctx.beginPath();ctx.ellipse(0,1,s*.35,s*.12,0,0,Math.PI*2);ctx.fill();
    if(selected){ctx.strokeStyle='#ffeaa7';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,1,s*.42,s*.17,0,0,Math.PI*2);ctx.stroke();}
    ctx.lineCap='round';ctx.strokeStyle='#15292b';ctx.lineWidth=clamp(s*.12,1.2,5);
    const line=(a,b,c,d)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.stroke();};
    line(-s*.11,-s*.43,-s*.13,0);line(s*.11,-s*.43,s*.13,0);
    ctx.fillStyle='#f4f0df';ctx.beginPath();ctx.moveTo(-s*.22,-s*.86);ctx.lineTo(s*.22,-s*.86);ctx.lineTo(s*.18,-s*.38);ctx.lineTo(-s*.18,-s*.38);ctx.fill();
    ctx.fillStyle='#142b38';ctx.fillRect(-s*.17,-s*1.26,s*.34,s*.3);
    ctx.fillStyle='#d8ad7c';ctx.beginPath();ctx.arc(0,-s*1.31,s*.13,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f6f0de';ctx.lineWidth=clamp(s*.09,1,4);line(-s*.2,-s*.78,-s*.32,-s*.59);line(s*.2,-s*.78,s*.34,-s*.59);
    this.instrument(ctx,inst,s,color);
    if(this.options.labels&&(selected||s>23)){ctx.font=`600 ${clamp(s*.26,8,13)}px system-ui`;ctx.textAlign='center';ctx.fillStyle='#10241c';ctx.fillText(`${person.symbol||''}${person.label||''}`.trim(),0,-s*1.67);}
    ctx.restore();this.pick.push({id:person.id,x,y:y-s*.7,size:s});
  }
  instrument(ctx,inst,s,color){
    const metal=/trumpet|mellophone|horn|trombone|baritone|euphonium|tuba|sousaphone/.test(inst),percussion=/drum|snare|tenor|bass|cymbal|percussion/.test(inst);
    ctx.strokeStyle=metal?'#f5c955':percussion?'#f1f1e6':'#292b36';ctx.fillStyle=metal?'#f5c955':percussion?'#e6eef0':'#262d34';ctx.lineWidth=clamp(s*.085,1.2,4);ctx.lineCap='round';
    if(/tuba|sousaphone/.test(inst)){
      ctx.beginPath();ctx.arc(-s*.1,-s*.87,s*.4,-.9,Math.PI*1.43);ctx.stroke();ctx.beginPath();ctx.ellipse(s*.28,-s*1.25,s*.18,s*.1,-.5,0,Math.PI*2);ctx.fill();
    }else if(/trombone/.test(inst)){
      ctx.beginPath();ctx.moveTo(-s*.28,-s*.7);ctx.lineTo(s*.56,-s*.7);ctx.lineTo(s*.56,-s*.59);ctx.lineTo(-s*.24,-s*.59);ctx.stroke();
      ctx.beginPath();ctx.moveTo(s*.48,-s*.72);ctx.lineTo(s*.72,-s*.82);ctx.lineTo(s*.72,-s*.5);ctx.closePath();ctx.fill();
    }else if(/trumpet|mellophone|horn|baritone|euphonium/.test(inst)){
      ctx.beginPath();ctx.moveTo(-s*.29,-s*.72);ctx.lineTo(s*.35,-s*.72);ctx.stroke();ctx.beginPath();ctx.moveTo(s*.31,-s*.72);ctx.lineTo(s*.55,-s*.85);ctx.lineTo(s*.55,-s*.59);ctx.closePath();ctx.fill();
    }else if(percussion){
      if(/cymbal/.test(inst)){for(const x of [-s*.25,s*.25]){ctx.beginPath();ctx.ellipse(x,-s*.63,s*.18,s*.1,0,0,Math.PI*2);ctx.fill();}}
      else{ctx.fillRect(-s*.23,-s*.64,s*.46,s*.2);ctx.beginPath();ctx.moveTo(-s*.35,-s*.93);ctx.lineTo(0,-s*.66);ctx.moveTo(s*.35,-s*.93);ctx.lineTo(0,-s*.66);ctx.stroke();}
    }else if(/sax/.test(inst)){
      ctx.beginPath();ctx.moveTo(-s*.18,-s*.65);ctx.lineTo(s*.16,-s*.58);ctx.lineTo(s*.3,-s*.36);ctx.quadraticCurveTo(s*.42,-s*.25,s*.49,-s*.42);ctx.stroke();
    }else if(/flute|piccolo/.test(inst)){
      ctx.beginPath();ctx.moveTo(-s*.36,-s*.67);ctx.lineTo(s*.45,-s*.69);ctx.stroke();
    }else if(/clarinet|oboe|bassoon/.test(inst)){
      ctx.beginPath();ctx.moveTo(-s*.22,-s*.84);ctx.lineTo(s*.34,-s*.44);ctx.stroke();ctx.beginPath();ctx.arc(s*.35,-s*.43,s*.07,0,Math.PI*2);ctx.fill();
    }else{ctx.beginPath();ctx.moveTo(-s*.22,-s*.7);ctx.lineTo(s*.3,-s*.59);ctx.stroke();}
  }
}
