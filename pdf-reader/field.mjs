import {FIELD,positionAt,locate} from './core.mjs';
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
export class Field {
  constructor(svg,onSelect){
    this.svg=svg;this.onSelect=onSelect;this.zoom=1;this.pan={x:0,y:0};this.nodes=new Map();this.options={};
    svg.setAttribute('viewBox','-8 -7 116 67.3333');
    svg.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(1,Math.min(8,this.zoom*(e.deltaY<0?1.12:1/1.12)));this.view();},{passive:false});
    const pointers=new Map();let lastDistance=0;
    svg.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,moved:false,target:e.target};});
    svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;
      const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(lastDistance)this.zoom=Math.max(1,Math.min(8,this.zoom*d/lastDistance));lastDistance=d;this.drag.moved=true;}
      else {const scale=116/svg.getBoundingClientRect().width/this.zoom;this.pan.x-=(e.clientX-prev.x)*scale;this.pan.y-=(e.clientY-prev.y)*scale;if(Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>4)this.drag.moved=true;}
      this.view();
    });
    const end=e=>{if(this.drag&&!this.drag.moved){const id=this.drag.target.closest('[data-person]')?.dataset.person;if(id)this.onSelect(id);}pointers.delete(e.pointerId);lastDistance=0;const remaining=[...pointers.values()][0];this.drag=remaining?{...remaining,moved:true,target:this.svg}:null;};
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',()=>{pointers.clear();this.drag=null;lastDistance=0;});
  }
  view(){this.svg.setAttribute('viewBox',`${-8+this.pan.x+(116-116/this.zoom)/2} ${-7+this.pan.y+(67.3333-67.3333/this.zoom)/2} ${116/this.zoom} ${67.3333/this.zoom}`);}
  reset(){this.zoom=1;this.pan={x:0,y:0};this.view();}
  project(p){let x=this.options.swap?100-p.x:p.x,y=FIELD.width-p.y;if(this.options.flip){x=100-x;y=FIELD.width-y;}return {x,y};}
  rebuild(movement,options){
    this.movement=movement;this.options=options;this.svg.replaceChildren();this.nodes.clear();
    const bg=el('g');this.svg.append(bg);bg.append(el('rect',{x:0,y:0,width:100,height:FIELD.width,fill:'#193d38',rx:.2}));
    for(let x=0;x<100;x+=10)bg.append(el('rect',{x,y:0,width:5,height:FIELD.width,fill:'#ffffff',opacity:.025}));
    const line=(x1,y1,x2,y2,opacity=.3,width=.12)=>bg.append(el('line',{x1,y1,x2,y2,stroke:'white','stroke-opacity':opacity,'stroke-width':width}));
    if(options.grid)for(let x=0;x<=100;x+=.625)line(x,0,x,FIELD.width,.045,.06);
    if(options.grid)for(let y=0;y<=FIELD.width;y+=.625)line(0,y,100,y,.045,.06);
    for(let x=0;x<=100;x+=5){line(x,0,x,FIELD.width,.35);if(x>0&&x<100&&x%10===0){const label=x<=50?x:100-x;bg.append(el('text',{x,y:8,'text-anchor':'middle',class:'yard'},label));bg.append(el('text',{x,y:FIELD.width-6,'text-anchor':'middle',class:'yard'},label));}}
    for(const y of [FIELD.frontHash,FIELD.backHash])for(let x=1;x<100;x++)line(x-.25,y,x+.25,y,.65,.15);
    line(0,0,100,0,.8,.2);line(0,FIELD.width,100,FIELD.width,.8,.2);
    const label=(x,y,text,anchor='middle')=>bg.append(el('text',{x,y,'text-anchor':anchor,class:'field-label'},text));
    label(50,-3,this.options.flip?'FRONT SIDELINE':'BACK SIDELINE');label(50,FIELD.width+4,this.options.flip?'BACK SIDELINE':'FRONT SIDELINE');
    label(18,-3,`SIDE ${(options.swap!==options.flip)?2:1}`);label(82,-3,`SIDE ${(options.swap!==options.flip)?1:2}`);
    label(101,FIELD.frontHash+.5,options.flip?'FRONT':'BACK','start');label(101,FIELD.backHash+.5,options.flip?'BACK':'FRONT','start');
    this.path=el('g');this.svg.append(this.path);
    const sections=[...new Set((movement?.people||[]).map(p=>p.instrument))].sort();this.colors=new Map(sections.map((s,i)=>[s,`hsl(${(i*137.508+35)%360} 80% 72%)`]));
    for(const p of movement?.people||[]){const g=el('g',{'data-person':p.id,tabindex:0,role:'button','aria-label':`${p.instrument} ${p.symbol}${p.label}`,class:'marcher'});g.append(el('circle',{r:.48,fill:options.colors?this.colors.get(p.instrument):'#ffdc8b',stroke:'#102c29','stroke-width':.2}));g.append(el('text',{x:1.2,y:.5,class:'dot-label'},p.symbol+p.label));g.addEventListener('keydown',e=>{if(e.key==='Enter')this.onSelect(p.id);});this.svg.append(g);this.nodes.set(p.id,g);}
    this.calibration=el('g');const cp=this.project({x:46.875,y:1.25});this.calibration.append(el('circle',{cx:cp.x,cy:cp.y,r:1.1,fill:'#ff7894'}),el('text',{x:cp.x+1.6,y:cp.y,class:'dot-label'},'Calibration'));this.svg.append(this.calibration);
  }
  draw(count,selected,query='',setIndex=null){
    const m=this.movement;this.path?.replaceChildren();this.calibration.style.display=this.options.calibration?'':'none';if(!m)return;
    const l=setIndex===null?locate(m.sets,count):{index:setIndex,next:Math.min(setIndex+1,m.sets.length-1),t:0};
    for(const p of m.people){const g=this.nodes.get(p.id),pos=setIndex===null?positionAt(p,m.sets,count):p.positions[m.sets[setIndex]?.id],matches=(`${p.instrument} ${p.symbol}${p.label} ${p.label}`).toLowerCase().includes(query.toLowerCase());g.style.display=pos?'':'none';if(!pos)continue;
      const xy=this.project(pos);g.setAttribute('transform',`translate(${xy.x} ${xy.y})`);g.style.opacity=matches?1:.15;g.lastChild.style.display=this.options.labels?'':'none';g.firstChild.setAttribute('stroke',selected===p.id?'#ffffff':'#102c29');g.firstChild.setAttribute('stroke-width',selected===p.id?.45:.2);g.firstChild.setAttribute('r',selected===p.id?.65:.48);
      if(p.id===selected){const a=p.positions[m.sets[l.index]?.id],b=p.positions[m.sets[l.next]?.id];if(a&&b){const aa=this.project(a),bb=this.project(b);if(this.options.paths)this.path.append(el('line',{x1:aa.x,y1:aa.y,x2:bb.x,y2:bb.y,stroke:'#ffdc8b','stroke-width':.3,'stroke-dasharray':'.6 .5'}));if(this.options.ghosts)for(const q of [aa,bb])this.path.append(el('circle',{cx:q.x,cy:q.y,r:1.1,fill:'none',stroke:'white',opacity:.5,'stroke-width':.18}));}}
    }
  }
}
