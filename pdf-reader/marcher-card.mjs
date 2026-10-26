import {FIELD,locate,performerPhase,positionAt} from './core.mjs?v=14';
const number=n=>String(Math.round(n*100)/100);
export function formatCardCoordinate(point,step=.625){
  if(!point||!(step>0))return {side:'Unknown',depth:'Unknown'};
  const side=point.x<=50?1:2,local=side===1?point.x:100-point.x,line=Math.max(0,Math.min(50,Math.round(local/5)*5)),delta=local-line;
  const sideText=Math.abs(point.x-50)<1e-7?'On 50 yd ln':`Side ${side}: ${Math.abs(delta)<1e-7?'On':`${number(Math.abs(delta)/step)} steps ${delta>0?'inside':'outside'}`} ${line} yd ln`;
  const anchors=[{y:0,name:'Front side line'},{y:FIELD.frontHash,name:'Front Hash (HS)'},{y:FIELD.backHash,name:'Back Hash (HS)'},{y:FIELD.width,name:'Back side line'}],anchor=anchors.reduce((a,b)=>Math.abs(point.y-a.y)<=Math.abs(point.y-b.y)?a:b),diff=point.y-anchor.y;
  return {side:sideText,depth:Math.abs(diff)<1e-7?`On ${anchor.name}`:`${number(Math.abs(diff)/step)} steps ${diff>0?'behind':'in front of'} ${anchor.name}`};
}
export function marcherReadout(person,movement,count,step=.625,manualSet=null){
  const sets=movement.sets;if(!sets.length)return null;
  const l=manualSet===null?locate(sets,count):{index:manualSet,next:Math.min(manualSet+1,sets.length-1)},phase=manualSet===null?performerPhase(person,sets,count):{progress:0};
  const from=person.positions[sets[l.index].id],to=person.positions[sets[l.next].id],stationary=from&&to&&Math.hypot(from.x-to.x,from.y-to.y)<1e-8;
  const at=manualSet!==null?manualSet:phase.progress>=1&&!stationary&&count>l.start+1e-8?l.next:l.index,point=manualSet!==null?person.positions[sets[at].id]:positionAt(person,sets,count),exact=manualSet!==null||phase.progress===0||phase.progress>=1;
  const row=exact?person.positions[sets[at].id]?.row:null,coords=row?{side:row.side,depth:row.depth}:formatCardCoordinate(point,step);
  const nextIndex=at===l.next?Math.min(at+1,sets.length-1):l.next,next=person.positions[sets[nextIndex].id]?.row;
  return {name:`${person.instrument} ${person.symbol}${person.label}`,status:exact?`Dot card · set ${sets[at].id}`:`Live estimate · ${sets[l.index].id} → ${sets[l.next].id}`,side:coords.side,depth:coords.depth,nextSet:sets[nextIndex].id,nextSide:next?.side||'Unknown',nextDepth:next?.depth||'Unknown',hasNext:nextIndex!==at};
}
