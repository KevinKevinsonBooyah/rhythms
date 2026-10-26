import {FIELD,locate} from './core.mjs?v=14';
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
  const l=manualSet===null?locate(sets,count):{index:manualSet,next:Math.min(manualSet+1,sets.length-1)};
  const at=l.index,row=person.positions[sets[at].id]?.row,nextIndex=l.next,next=person.positions[sets[nextIndex].id]?.row;
  return {name:`${person.instrument} ${person.symbol}${person.label}`,status:`Dot card · set ${sets[at].id}`,side:row?.side||'Unknown',depth:row?.depth||'Unknown',nextSet:sets[nextIndex].id,nextSide:next?.side||'Unknown',nextDepth:next?.depth||'Unknown',hasNext:nextIndex!==at};
}
