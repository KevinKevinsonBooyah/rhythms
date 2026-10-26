// Canonical units: yards. x=0 at Side 1 goal, y=0 at front sideline.
export const FIELD = Object.freeze({length:100,width:160/3,frontHash:160/9,backHash:320/9});
export const natural = (a,b) => String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:'base'});
export function fraction(value) {
  let s=String(value).trim().replace(/¼/g,' 1/4').replace(/½/g,' 1/2').replace(/¾/g,' 3/4').trim();
  if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
  const m=s.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  return m && +m[3] ? +(m[1]||0)+m[2]/m[3] : NaN;
}
const norm = s => String(s||'').replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
export function coordinate(sideText,depthText,step=0.625) {
  const side=norm(sideText), depth=norm(depthText);
  let x=null,y=null; const errors=[];
  const sm=side.match(/^Side\s*([12])\s*:\s*(?:(On)|(.+?)\s*steps?\s*(inside|outside))\s*(\d+(?:\.\d+)?)\s*(?:yd\.?\s*(?:[li]n|line)|yard\s*line)\.?$/i);
  if(sm) {
    const line=+sm[5], amount=sm[2]?0:fraction(sm[3]);
    if(line<=50 && Number.isFinite(amount)) {
      const offset=amount*step*(sm[4]?.toLowerCase()==='outside'?-1:1);
      x=sm[1]==='1'?line+offset:100-line-offset;
    }
  }
  if(/^On\s+50\s*(?:yd\.?\s*(?:ln|line)|yard\s*line)\.?$/i.test(side))x=50;
  if(x===null) errors.push('Unrecognized side coordinate');
  const dm=depth.match(/^(?:(On)|(.+?)\s*steps?\s*(in front of|behind))\s*(Front|Back)\s*(Hash(?:\s*\(HS\))?|side\s*line|sideline)\.?$/i);
  if(dm) {
    const back=dm[4].toLowerCase()==='back', hash=/hash/i.test(dm[5]);
    const origin=hash?(back?FIELD.backHash:FIELD.frontHash):(back?FIELD.width:0);
    const amount=dm[1]?0:fraction(dm[2]);
    if(Number.isFinite(amount)) y=origin+amount*step*(dm[3]?.toLowerCase()==='in front of'?-1:1);
  }
  if(y===null) errors.push('Unrecognized front/back coordinate');
  if(!(step>0 && Number.isFinite(step))) {x=y=null;errors.push('Invalid step size');}
  if(x!==null && (x<0 || x>100) || y!==null && (y<0 || y>FIELD.width)) errors.push('Outside field: confirm this position');
  return {x,y,valid:x!==null&&y!==null,errors};
}
export function identity(r) {return JSON.stringify([r.instrument.trim().toLowerCase(),r.symbol.trim().toLowerCase(),r.label.trim().toLowerCase()]);}
export function reviewRow(r,step=.625) {
  const p=coordinate(r.side,r.depth,step), warnings=[...p.errors];
  if(!r.instrument||!r.symbol||!r.label) warnings.push('Missing performer identity');
  if(!r.movement) warnings.push('Missing movement');
  if(!/^\d+[A-Za-z]*$/.test(r.set)) warnings.push('Check set identifier');
  if(r.counts!=='' && (!Number.isFinite(+r.counts)||+r.counts<=0)) warnings.push('Counts must be positive or blank');
  if(r.method==='ocr') warnings.push('OCR: verify against original');
  if(r.parseWarning) warnings.push(r.parseWarning);
  return {position:p,warnings};
}
export function compile(rows,old={},step=.625) {
  const movements=[]; const names=[...new Set(rows.map(r=>r.movement).filter(Boolean))];
  for(const name of names) {
    const previous=old[name]||{}; const rr=rows.filter(r=>r.movement===name);
    const ids=[...new Set(rr.map(r=>r.set))].sort(natural);
    const order=[...(previous.order||[]).filter(s=>ids.includes(s)),...ids.filter(s=>!(previous.order||[]).includes(s))];
    const sets=order.map((id,index)=>{
      const sr=rr.filter(r=>r.set===id), counts=[...new Set(sr.map(r=>r.counts).filter(s=>s!=='').map(Number))];
      const override=previous.durations?.[id];
      const candidate=counts.length===1&&counts[0]>0?counts[0]:null;
      const duration=override!==undefined?+override:candidate;
      return {id,title:sr[0].title,measure:sr[0].measure,duration:index===0?0:duration,timingIssue:index>0 && !(duration>0),conflict:counts.length>1};
    });
    const people=[];
    for(const key of new Set(rr.map(identity))) {
      const pr=rr.filter(r=>identity(r)===key), first=pr[0], positions={};
      if(!first.instrument||!first.symbol||!first.label) continue;
      for(const set of sets) {
        const candidates=pr.filter(r=>r.set===set.id);
        const distinct=[...new Set(candidates.map(r=>JSON.stringify([r.side,r.depth])))];
        const r=candidates[0];
        if(r && distinct.length===1) {const p=coordinate(r.side,r.depth,step); if(p.valid) positions[set.id]={...p,row:r};}
      }
      people.push({id:key,instrument:first.instrument,symbol:first.symbol,label:first.label,positions});
    }
    applyPhases(sets,people,previous);
    applyPerformerPhases(sets,people,previous,step);
    movements.push({name,sets,people,settings:{bpm:120,offset:0,tempo:[],markers:[],beats:4,subdivision:1,countIn:0,...previous}});
  }
  return movements;
}
// Titles describe a phrase ending at a main set, including intervening subsets.
export function applyPhases(sets,people,settings){
  for(let i=1;i<sets.length;i++){const s=sets[i];s.moveCounts=s.duration;s.holdCounts=0;s.motionIssue='';s.phaseSource='full interval';}
  if(settings.holdMode==='title')for(let i=1;i<sets.length;i++){
    const target=sets[i];if(!/^\d+(?:\.\d+)?(?:\s*\+\s*\d+(?:\.\d+)?)+$/.test(target.title.trim()))continue;
    let first=i;while(first>1&&/subset/i.test(sets[first-1].measure))first--;
    const parts=target.title.split('+').map(Number),total=parts.reduce((a,b)=>a+b,0),block=sets.slice(first,i+1),span=block.reduce((a,s)=>a+(s.duration||0),0);
    if(Math.abs(total-span)>1e-7){target.motionIssue=`Title ${target.title} totals ${total}, phrase including subsets totals ${span}. Confirm march/hold split.`;continue;}
    let elapsed=0;const phases=block.map(s=>{const move=Math.max(0,Math.min(s.duration,parts[0]-elapsed));elapsed+=s.duration;return {set:s,move};});
    const conflicts=phases.some(({set,move})=>{if(move>0)return false;const k=sets.indexOf(set),from=sets[k-1].id;return people.some(p=>{const a=p.positions[from],b=p.positions[set.id];return a&&b&&Math.hypot(a.x-b.x,a.y-b.y)>1e-6;});});
    if(conflicts){target.motionIssue='Title requires a complete hold while subset coordinates change. Confirm subset schedule.';continue;}
    for(const {set,move}of phases){set.moveCounts=move;set.phaseSource='title phrase';}
  }
  for(let i=1;i<sets.length;i++){
    const s=sets[i],explicit=settings.motionCounts?.[s.id];
    if(explicit!==undefined){if(Number.isFinite(+explicit)&&+explicit>=0&&+explicit<=s.duration){s.moveCounts=+explicit;s.phaseSource='manual';s.motionIssue='';}else s.motionIssue='March counts must be between 0 and the interval total.';}
    s.holdCounts=Math.max(0,(s.duration||0)-(s.moveCounts||0));
  }
}
export function applyPerformerPhases(sets,people,settings,step){
  for(const p of people){p.motionPhases={};for(let i=1;i<sets.length;i++){
    const s=sets[i],a=p.positions[sets[i-1].id],b=p.positions[s.id],distance=a&&b?Math.hypot(a.x-b.x,a.y-b.y):null;
    let phase={start:0,move:distance===0?0:s.moveCounts??s.duration,estimated:false,custom:false};
    if(settings.naturalArrival&&s.holdCounts>0&&distance!==null&&step>0){const required=distance<1e-8?0:Math.max(1,Math.ceil(distance/step-1e-9));if(required<phase.move)phase={...phase,move:required,estimated:true};}
    const custom=settings.performerPhases?.[p.id]?.[s.id];
    if(custom){if(Number.isFinite(custom.start)&&Number.isFinite(custom.move)&&custom.start>=0&&custom.move>=0&&custom.start+custom.move<=s.duration&&(custom.move>0||distance===0))phase={start:custom.start,move:custom.move,estimated:false,custom:true};else phase.issue='Invalid marcher timing; using the default phase.';}
    p.motionPhases[s.id]=phase;
  }}
}
export function performerPhase(person,sets,count){
  const l=locate(sets,count),s=sets[l.next],phase=person.motionPhases?.[s?.id]||{start:0,move:s?.moveCounts??s?.duration??0};
  const elapsed=Math.max(0,count-l.start),progress=l.next===l.index?0:Math.max(0,Math.min(1,phase.move>0?(elapsed-phase.start)/phase.move:elapsed>=phase.start?1:0));
  return {...phase,progress,waiting:elapsed<phase.start,holding:l.next!==l.index&&elapsed>=phase.start+phase.move};
}
export function starts(sets) {
  let c=0;return sets.map((s,i)=>{if(i) c+=s.duration>0?s.duration:0;return c;});
}
export function locate(sets,count) {
  const times=starts(sets);let i=0;
  while(i+1<times.length && times[i+1]<=count) i++;
  const end=times[i+1];
  const elapsed=Math.max(0,count-(times[i]||0)),duration=end-times[i],move=sets[i+1]?.moveCounts??duration;
  return {index:i,next:Math.min(i+1,sets.length-1),t:duration>0?elapsed/duration:0,motionT:duration>0?(move>0?Math.min(1,elapsed/move):1):0,holding:duration>0&&move<duration&&elapsed>=move,start:times[i]||0};
}
export function positionAt(person,sets,count) {
  if(!sets.length)return null;
  const l=locate(sets,count),a=person.positions[sets[l.index].id],b=person.positions[sets[l.next].id];
  const progress=performerPhase(person,sets,count).progress;
  if(!a || (progress>0&&!b))return null;
  return {x:a.x+((b?.x??a.x)-a.x)*progress,y:a.y+((b?.y??a.y)-a.y)*progress};
}
// Count zero is the opening dot/downbeat. Counts column defaults to arrival counts.
export function clock(settings) {
  const bpm=+settings.bpm||120, subdivision=+settings.subdivision||1;
  const tempo=[{count:0,bpm},...(settings.tempo||[])].sort((a,b)=>a.count-b.count);
  function base(c) {
    let sec=0;
    for(let i=0;i<tempo.length;i++) {
      const a=tempo[i],b=tempo[i+1];
      if(c<=a.count) break;
      sec+=(Math.min(c,b?.count??c)-a.count)*60/a.bpm/subdivision;
    }
    return sec;
  }
  const markers=[{count:0,seconds:+settings.offset||0},...(settings.markers||[]).filter(m=>m.count>0)].sort((a,b)=>a.count-b.count);
  function toSeconds(c) {
    let i=0;while(i+1<markers.length&&markers[i+1].count<=c)i++;
    const a=markers[i],b=markers[i+1];
    return b?a.seconds+(base(c)-base(a.count))/(base(b.count)-base(a.count))*(b.seconds-a.seconds):a.seconds+base(c)-base(a.count);
  }
  function toCount(s) {
    if(s<=toSeconds(0))return 0;
    let lo=0,hi=1;while(toSeconds(hi)<s&&hi<1e7)hi*=2;
    for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(toSeconds(mid)<s)lo=mid;else hi=mid;}return (lo+hi)/2;
  }
  return {toSeconds,toCount};
}
export function validateTiming(s) {
  if(!(+s.bpm>0)||!(+s.subdivision>0)||!Number.isFinite(+s.offset)||+s.offset<0)throw Error('Use a positive BPM/subdivision and a nonnegative audio offset.');
  for(const t of s.tempo)if(!(t.count>=0&&t.bpm>0&&Number.isFinite(t.count)&&Number.isFinite(t.bpm)))throw Error('Tempo entries need count ≥ 0 and BPM > 0.');
  if(new Set(s.tempo.map(t=>t.count)).size!==s.tempo.length)throw Error('Only one tempo per count.');
  const mm=[{count:0,seconds:+s.offset},...s.markers].sort((a,b)=>a.count-b.count);
  for(let i=1;i<mm.length;i++)if(!(mm[i].count>mm[i-1].count&&mm[i].seconds>mm[i-1].seconds&&Number.isFinite(mm[i].seconds)))throw Error('Sync markers must increase in count and audio seconds, after the first-count offset.');
}
export function canAddFiles(existing,incoming){return existing+incoming<=3;}
export function mergeRows(existing,incoming) {
  const key=r=>JSON.stringify([r.movement,identity(r),r.set]);
  const all=[...existing];let duplicates=0,conflicts=0;
  for(const r of incoming){const matches=all.filter(a=>key(a)===key(r));
    const same=matches.find(a=>['side','depth','counts','title','measure'].every(k=>a[k]===r[k]));
    if(same){same.sources=[...new Set([...(same.sources||[same.fileId]),r.fileId].filter(Boolean))];duplicates++;continue;}
    if(matches.length){r.parseWarning='Conflicting duplicate: edit or delete one row';matches.forEach(a=>a.parseWarning=r.parseWarning);conflicts++;}
    all.push(r);
  }return {rows:all,duplicates,conflicts};
}
