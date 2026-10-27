import {FIELD,positionAt,locate} from './core.mjs?v=14';
import {nextVisibleSetIndex,visibleSetIndex} from './display-sets.mjs?v=1';
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;}
export class Field {
  constructor(svg,onSelect){
    this.svg=svg;this.onSelect=onSelect;this.zoom=1;this.pan={x:0,y:0};this.nodes=new Map();this.options={};document.fonts?.addEventListener('loadingdone',()=>{for(const g of this.nodes.values()){delete g.lastChild.dataset.fittedSize;this.fitDotLabel(g,+this.options.dotSize||1);}});
    svg.setAttribute('viewBox','-8 -7 116 67.3333');this.resizeObserver=new ResizeObserver(()=>{for(const g of this.nodes.values())this.fitDotLabel(g,+this.options.dotSize||1);if(this.annotationState)this.drawCoordinateLabel(...this.annotationState);});this.resizeObserver.observe(svg);
    svg.addEventListener('wheel',e=>{e.preventDefault();this.zoom=Math.max(1,Math.min(8,this.zoom*(e.deltaY<0?1.12:1/1.12)));this.view();},{passive:false});
    const pointers=new Map();let lastDistance=0;
    svg.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,moved:false,target:e.target};});
    svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;
      const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(lastDistance)this.zoom=Math.max(1,Math.min(8,this.zoom*d/lastDistance));lastDistance=d;this.drag.moved=true;}
      else {const scale=116/svg.getBoundingClientRect().width/this.zoom;this.pan.x-=(e.clientX-prev.x)*scale;this.pan.y-=(e.clientY-prev.y)*scale;if(Math.hypot(e.clientX-this.drag.x,e.clientY-this.drag.y)>4)this.drag.moved=true;}
      this.view();
    });
    const end=e=>{if(this.drag&&!this.drag.moved&&pointers.size===1){const id=this.drag.target.closest('[data-person]')?.dataset.person||'';this.onSelect(id);}pointers.delete(e.pointerId);lastDistance=0;const remaining=[...pointers.values()][0];this.drag=remaining?{...remaining,moved:true,target:this.svg}:null;};
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',()=>{pointers.clear();this.drag=null;lastDistance=0;});
  }
  view(){this.svg.setAttribute('viewBox',`${-8+this.pan.x+(116-116/this.zoom)/2} ${-7+this.pan.y+(67.3333-67.3333/this.zoom)/2} ${116/this.zoom} ${67.3333/this.zoom}`);if(this.annotationState)this.drawCoordinateLabel(...this.annotationState);}
  reset(){this.zoom=1;this.pan={x:0,y:0};this.view();}
  project(p){let x=this.options.swap?100-p.x:p.x,y=FIELD.width-p.y;if(this.options.flip){x=100-x;y=FIELD.width-y;}return {x,y};}
  rebuild(movement,options){
    this.movement=movement;this.options=options;this.svg.replaceChildren();this.nodes.clear();
    const defs=el('defs'),turf=el('linearGradient',{id:'field-turf',x1:'0%',y1:'0%',x2:'0%',y2:'100%'});
    turf.append(el('stop',{offset:'0%','stop-color':'#328b49'}),el('stop',{offset:'50%','stop-color':'#409d55'}),el('stop',{offset:'100%','stop-color':'#328b49'}));defs.append(turf);this.svg.append(defs);
    const bg=el('g');this.svg.append(bg);bg.append(el('rect',{x:-6,y:0,width:112,height:FIELD.width,fill:'url(#field-turf)'}));
    for(let x=0;x<100;x+=10)bg.append(el('rect',{x,y:0,width:5,height:FIELD.width,fill:'#fff',opacity:.025}));
    for(const x of [-6,100])bg.append(el('rect',{x,y:0,width:6,height:FIELD.width,fill:'#003f20',opacity:.35}));
    const line=(x1,y1,x2,y2,opacity=.3,width=.12)=>bg.append(el('line',{x1,y1,x2,y2,stroke:'white','stroke-opacity':opacity,'stroke-width':width}));
    if(options.grid)for(let x=0;x<=100;x+=.625)line(x,0,x,FIELD.width,.045,.06);
    if(options.grid)for(let y=0;y<=FIELD.width;y+=.625)line(0,y,100,y,.045,.06);
    for(let x=0;x<=100;x+=5){line(x,0,x,FIELD.width,x%10===0?.9:.68,x%10===0?.2:.14);if(x>0&&x<100&&x%10===0){const label=x<=50?x:100-x;bg.append(el('text',{x,y:7,'text-anchor':'middle',transform:`rotate(180 ${x} 6)`,class:'yard'},label));bg.append(el('text',{x,y:FIELD.width-5,'text-anchor':'middle',class:'yard'},label));}}
    for(let x=0;x<=100;x++){line(x,0,x,1.25,.75,.1);line(x,FIELD.width-1.25,x,FIELD.width,.75,.1);}
    for(const y of [FIELD.frontHash,FIELD.backHash])for(let x=1;x<100;x++)line(x,y-.7,x,y+.7,.9,.15);
    line(-6,0,106,0,.9,.17);line(-6,FIELD.width,106,FIELD.width,.9,.17);line(-6,0,-6,FIELD.width,.9,.17);line(106,0,106,FIELD.width,.9,.17);
    for(const [x,name] of [[-3,!!this.options.swap!==!!this.options.flip?'SIDE 2':'SIDE 1'],[103,!!this.options.swap!==!!this.options.flip?'SIDE 1':'SIDE 2']])bg.append(el('text',{x,y:FIELD.width/2,'text-anchor':'middle','dominant-baseline':'central',transform:`rotate(-90 ${x} ${FIELD.width/2})`,class:'endzone-label'},name));
    const label=(x,y,text,anchor='middle')=>bg.append(el('text',{x,y,'text-anchor':anchor,class:'field-label'},text));
    label(50,-3,this.options.flip?'FRONT SIDELINE':'BACK SIDELINE');label(50,FIELD.width+4,this.options.flip?'BACK SIDELINE':'FRONT SIDELINE');
    label(18,-3,`SIDE ${(options.swap!==options.flip)?2:1}`);label(82,-3,`SIDE ${(options.swap!==options.flip)?1:2}`);
    label(101,FIELD.frontHash+.5,options.flip?'FRONT':'BACK','start');label(101,FIELD.backHash+.5,options.flip?'BACK':'FRONT','start');
    this.path=el('g');this.svg.append(this.path);
    const sections=[...new Set((movement?.people||[]).map(p=>p.instrument))].sort();this.colors=new Map(sections.map((s,i)=>[s,`hsl(${(i*137.508+35)%360} 80% 72%)`]));
    for(const p of movement?.people||[]){const g=el('g',{'data-person':p.id,tabindex:0,role:'button','aria-label':`${p.instrument} ${p.symbol}${p.label}`,class:'marcher'});g.append(el('circle',{r:.48,fill:options.colors?this.colors.get(p.instrument):'#ffdc8b',stroke:'#102c29','stroke-width':.2}));g.append(el('text',{x:0,y:0,'text-anchor':'middle','dominant-baseline':'central',class:'dot-label'},p.symbol+p.label));g.addEventListener('keydown',e=>{if(e.key==='Enter')this.onSelect(p.id);});this.svg.append(g);this.nodes.set(p.id,g);}
    this.calibration=el('g');const cp=this.project({x:46.875,y:1.25});this.calibration.append(el('circle',{cx:cp.x,cy:cp.y,r:1.1,fill:'#ff7894'}),el('text',{x:cp.x+1.6,y:cp.y,class:'dot-label'},'Calibration'));this.svg.append(this.calibration);this.startMarker=el('circle',{fill:'none',stroke:'#fff5be','pointer-events':'none'});this.pathMarker=el('circle',{fill:'#fff5be',stroke:'#193d38','pointer-events':'none'});this.measurements=el('g',{'pointer-events':'none'});this.svg.append(this.startMarker,this.pathMarker,this.measurements);this.coordinateLabel=el('g',{class:'coordinate-label','pointer-events':'none',role:'note'});this.coordinateLines=[el('text',{'text-anchor':'middle'}),el('text',{'text-anchor':'middle'})];this.coordinateLabel.append(...this.coordinateLines);this.svg.append(this.coordinateLabel);this.lastSelected='';this.annotationState=null;
  }
  draw(count,selected,query='',setIndex=null,followId='',pathIds=new Set()){
    const m=this.movement;this.annotationState=null;this.coordinateLabel.style.display='none';this.startMarker.style.display='none';this.pathMarker.style.display='none';this.path?.replaceChildren();this.measurements?.replaceChildren();this.calibration.style.display=this.options.calibration?'':'none';if(!m)return;
    const l=setIndex===null?locate(m.sets,count):{index:setIndex,next:Math.min(setIndex+1,m.sets.length-1),t:0};
    for(const p of m.people){const g=this.nodes.get(p.id),pos=setIndex===null?positionAt(p,m.sets,count):p.positions[m.sets[setIndex]?.id],matches=(`${p.instrument} ${p.symbol}${p.label} ${p.label}`).toLowerCase().includes(query.toLowerCase());g.style.display=pos?'':'none';if(!pos)continue;
      const xy=this.project(pos);if(p.id===followId){this.pan={x:xy.x-50,y:xy.y-FIELD.width/2};this.view();}
      if(pathIds.has(p.id)){let previous=null;for(const set of m.sets){const point=p.positions[set.id];if(!point){previous=null;continue;}const q=this.project(point);if(previous)this.path.append(el('line',{x1:previous.x,y1:previous.y,x2:q.x,y2:q.y,stroke:this.colors.get(p.instrument),'stroke-width':.18,opacity:.7}));this.path.append(el('circle',{cx:q.x,cy:q.y,r:.35,fill:'none',stroke:this.colors.get(p.instrument),'stroke-width':.15}));previous=q;}}
      g.setAttribute('transform',`translate(${xy.x} ${xy.y})`);g.style.opacity=matches||this.options.noSearchFade?1:.55;g.lastChild.style.display=this.options.labels?'':'none';g.firstChild.setAttribute('stroke',selected===p.id?'#ffffff':'#102c29');const size=+this.options.dotSize||1;g.firstChild.setAttribute('stroke-width',(selected===p.id?.22:.12)*size);g.firstChild.setAttribute('r',.48*size);
      this.fitDotLabel(g,size);
      if(p.id===selected){
        const skip=!!this.options.ignoreLetterSets;
        const destination=skip?nextVisibleSetIndex(m.sets,l.index,true):l.next;
        const start=skip?(setIndex===null?positionAt(p,m.sets,count):p.positions[m.sets[l.index]?.id]):p.positions[m.sets[l.index]?.id];
        const end=destination>=0?p.positions[m.sets[destination]?.id]:null;
        if(start&&end){
          const route=[this.project(start)];
          if(skip){for(let j=l.index+1;j<=destination;j++){const dot=p.positions[m.sets[j]?.id];if(dot)route.push(this.project(dot));}}
          else route.push(this.project(end));
          const from=route[0],to=route[route.length-1];
          this.drawCoordinateLabel(p,to,destination,size);
          if(this.options.paths)this.drawSelectedPath(from,to,size,route);
          if(this.options.ghosts)for(const q of [from,to])this.path.append(el('circle',{cx:q.x,cy:q.y,r:.48*size,fill:'none',stroke:'white',opacity:.5,'stroke-width':.12*size}));
        }else{
          const shown=visibleSetIndex(m.sets,l.index,skip);
          if(shown>=0&&p.positions[m.sets[shown]?.id])this.drawCoordinateLabel(p,this.project(p.positions[m.sets[shown].id]),shown,size);
        }
        if(this.lastSelected!==selected){this.svg.append(g,this.measurements,this.coordinateLabel);this.lastSelected=selected;}
      }
    }
  }
  drawSelectedPath(from,to,size,route=null){
    const dx=to.x-from.x,dy=to.y-from.y;if(Math.hypot(dx,dy)<.02)return;
    const box=this.svg.getBoundingClientRect(),view=this.svg.viewBox.baseVal,scale=Math.min(box.width/view.width,box.height/view.height);
    if(!(scale>0))return;
    const stroke={stroke:'#ffecae','stroke-width':1/scale};
    if(route?.length>2)this.path.append(el('polyline',{points:route.map(p=>`${p.x},${p.y}`).join(' '),fill:'none','stroke-linecap':'round','stroke-linejoin':'round',...stroke}));
    else this.path.append(el('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,...stroke}));
    const guide={stroke:'#eef5d5','stroke-opacity':.75,'stroke-width':.7/scale};
    const horizontal=Math.abs(dx)*scale>=18,vertical=Math.abs(dy)*scale>=18;
    if(horizontal)this.path.append(el('line',{x1:from.x,y1:from.y,x2:to.x,y2:from.y,...guide}));
    if(vertical)this.path.append(el('line',{x1:to.x,y1:from.y,x2:to.x,y2:to.y,...guide}));
    if(horizontal&&vertical)this.path.append(el('circle',{cx:to.x,cy:from.y,r:.16*size,fill:'#fff3b8'}));
    const step=(this.options.step||22.5)/36;
    const measure=(x,y,value,anchor='middle')=>{const font=12/scale,t=el('text',{x,y,'text-anchor':anchor,class:'path-measure'},value);t.style.fontSize=`${font}px`;t.style.strokeWidth=`${1.8/scale}px`;this.measurements.append(t);const b=t.getBBox(),w=b.width||value.length*font*.6,h=b.height||font,x0=b.width?b.x:anchor==='middle'?x-w/2:x,y0=b.height?b.y:y-h;
      const pad=2.5/scale,back=el('rect',{x:x0-pad,y:y0-pad,width:w+pad*2,height:h+pad*2,rx:3/scale,fill:'#0c3029','fill-opacity':.92,stroke:'#f6dc95','stroke-width':.6/scale,'pointer-events':'none'});this.measurements.insertBefore(back,t);};
    if(Math.abs(dx)*scale>=25)measure((from.x+to.x)/2,from.y+27/scale,`${dx<0?'Left':'Right'} ${(Math.abs(dx)/step).toFixed(1)} st`);
    if(Math.abs(dy)*scale>=25)measure(to.x+24/scale,(from.y+to.y)/2+16/scale,`${dy<0?'Up':'Down'} ${(Math.abs(dy)/step).toFixed(1)} st`,'start');
    for(const [key,value] of Object.entries({cx:from.x,cy:from.y,r:.5*size,'stroke-width':.085*size,'stroke-opacity':.5}))this.startMarker.setAttribute(key,value);
    for(const [key,value] of Object.entries({cx:to.x,cy:to.y,r:.25*size,'stroke-width':.08*size}))this.pathMarker.setAttribute(key,value);
    this.startMarker.style.display='';this.pathMarker.style.display='';
  }
  fitDotLabel(g,size){
    const label=g.lastChild;if(label.dataset.fittedSize===String(size))return;
    let font=Math.min(.6,.8/(Math.max(1,Array.from(label.textContent).length)*.65))*size;
    label.setAttribute('x',0);label.setAttribute('y',0);label.style.fontSize=`${font}px`;
    for(let i=0;i<2;i++){const b=label.getBBox(),radius=Math.hypot(b.width/2,b.height/2),limit=.48*size*.82;if(!(radius>limit))break;font*=limit/radius;label.style.fontSize=`${font}px`;}
    const b=label.getBBox();label.setAttribute('x',-(b.x+b.width/2));label.setAttribute('y',-(b.y+b.height/2));if(b.width>0&&b.height>0)label.dataset.fittedSize=String(size);else delete label.dataset.fittedSize;
  }
  drawCoordinateLabel(person,xy,setIndex,size){
    this.annotationState=[person,xy,setIndex,size];
    const set=this.movement.sets[setIndex],row=person.positions[set?.id]?.row;
    if(!row)return;
    const box=this.svg.getBoundingClientRect(),view=this.svg.viewBox.baseVal,scale=Math.min(box.width/view.width,box.height/view.height);if(!(scale>0))return;
    const font=12/scale,gap=36/scale,line=font*1.3;
    const texts=[`Go to ${set.id} · ${row.side}`,row.depth];
    this.coordinateLines.forEach((t,i)=>{if(t.textContent!==texts[i])t.textContent=texts[i];t.setAttribute('y',i===0?-line:0);t.style.fontSize=`${font}px`;t.style.strokeWidth=`${font*.25}px`;});
    this.coordinateLabel.style.display='';this.coordinateLabel.querySelector('.coordinate-backdrop')?.remove();const bounds=this.coordinateLabel.getBBox(),margin=5/scale;
    const pad=3/scale,back=el('rect',{class:'coordinate-backdrop',x:bounds.x-pad,y:bounds.y-pad,width:bounds.width+pad*2,height:bounds.height+pad*2,rx:3/scale,fill:'#0b3029','fill-opacity':.64});this.coordinateLabel.insertBefore(back,this.coordinateLines[0]);
    const half=bounds.width/2,x=Math.max(view.x+half+margin,Math.min(view.x+view.width-half-margin,xy.x));
    const y=Math.max(view.y-bounds.y+margin,xy.y-.48*size-gap);
    this.coordinateLabel.setAttribute('transform',`translate(${x} ${y})`);this.coordinateLabel.setAttribute('aria-label',`Go to set ${set.id}: ${row.side}; ${row.depth}`);
  }

}
