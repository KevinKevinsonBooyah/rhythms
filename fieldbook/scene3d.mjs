import {FIELD,positionAt} from './core.mjs?v=14';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const vector=(x,y,z=0)=>({x,y,z});
const sub=(a,b)=>vector(a.x-b.x,a.y-b.y,a.z-b.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const norm=a=>{const d=Math.hypot(a.x,a.y,a.z)||1;return vector(a.x/d,a.y/d,a.z/d);};
const cross=(a,b)=>vector(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);

export class Scene3D {
  constructor(canvas,onSelect){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onSelect=onSelect;
    this.side=1;this.pick=[];this.count=0;this.selected='';this.scale=1;
    canvas.addEventListener('pointerup',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
      const hit=[...this.pick].reverse().find(p=>Math.hypot(p.x-x,p.y-y)<Math.max(14,p.size*.75));if(hit)this.onSelect(hit.id);
    });
    this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(canvas);
  }
  setSide(side){this.side=side;this.draw();}
  update(movement,count,selected,options={},manualSet=null){this.movement=movement;this.count=count;this.selected=selected;this.options=options;this.manualSet=manualSet;this.draw();}
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
    const side1Left=!(!!this.options?.swap!==!!this.options?.flip);
    const left=this.side===1?side1Left:!side1Left;
    const from=left?vector(-31,-54,44):vector(131,-54,44),target=vector(50,FIELD.width/2,0);
    const forward=norm(sub(target,from)),right=norm(cross(forward,vector(0,0,1))),up=cross(right,forward);
    const focal=Math.min(w*.78,h*1.35);
    const project=p=>{const v=sub(p,from),depth=dot(v,forward);if(depth<1)return null;const size=focal/depth;return {x:w/2+dot(v,right)*size,y:h*.53-dot(v,up)*size,size,depth};};
    const polygon=(points,fill,stroke=null,width=1)=>{const ps=points.map(project);if(ps.some(p=>!p))return;ctx.beginPath();ctx.moveTo(ps[0].x,ps[0].y);for(const p of ps.slice(1))ctx.lineTo(p.x,p.y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
    const line=(a,b,color,width=1)=>{const p=project(a),q=project(b);if(!p||!q)return;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
    // A wide patch beyond the playable field gives the near edge a natural boundary.
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
    this.pick=[];
    if(this.movement){
      const sprites=[];
      for(const person of this.movement.people){const pos=this.manualSet===null?positionAt(person,this.movement.sets,this.count):person.positions[this.movement.sets[this.manualSet]?.id];if(!pos)continue;
        const ground=project(this.point(pos));if(ground)sprites.push({person,ground});
      }
      sprites.sort((a,b)=>b.ground.depth-a.ground.depth);
      for(const {person,ground} of sprites)this.marcher(person,ground,ctx);
    }
    const vignette=ctx.createLinearGradient(0,h*.7,0,h);vignette.addColorStop(0,'#0d2d1900');vignette.addColorStop(1,'#0d2d1955');ctx.fillStyle=vignette;ctx.fillRect(0,h*.7,w,h*.3);
  }
  marcher(person,p,ctx){
    const x=p.x,y=p.y,s=clamp(p.size*.8,3.8,52),inst=(person.instrument||'').toLowerCase();
    const selected=person.id===this.selected,color=selected?'#ffe292':'#f6f9ed';
    ctx.save();ctx.translate(x,y);
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
    if(selected||s>23){ctx.font=`600 ${clamp(s*.26,8,13)}px system-ui`;ctx.textAlign='center';ctx.fillStyle='#10241c';ctx.fillText(`${person.symbol||''}${person.label||''}`.trim(),0,-s*1.67);}
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
