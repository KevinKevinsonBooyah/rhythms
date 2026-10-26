import test from 'node:test';import assert from 'node:assert/strict';
import {compile,positionAt,starts,clock,locate} from '../core.mjs';
const rows=[{movement:'Demo',instrument:'Clarinet',symbol:'C',label:'1',set:'1',title:'Opening',measure:'',counts:'0',side:'Side 1: On 30 yd ln',depth:'On Front Hash'},{movement:'Demo',instrument:'Clarinet',symbol:'C',label:'1',set:'2',title:'8+12',measure:'1-5',counts:'20',side:'Side 1: On 40 yd ln',depth:'On Front Hash'}];
test('march reaches destination early, holds exactly, and reverse scrubbing preserves geometry',()=>{
 const m=compile(rows,{Demo:{holdMode:'title'}})[0],p=m.people[0],pos=c=>positionAt(p,m.sets,c).x;
 assert.equal(pos(0),30);assert.equal(pos(4),35);assert.equal(pos(8),40);assert.equal(pos(19),40);assert.equal(pos(20),40);assert.equal(pos(2),32.5);assert.equal(locate(m.sets,9).holding,true);assert.deepEqual(starts(m.sets),[0,20]);
});
test('title interpretation is opt-in and conflicts never invent a hold duration',()=>{
 const off=compile(rows)[0];assert.equal(positionAt(off.people[0],off.sets,10).x,35);
 const bad=compile(rows.map(r=>r.set==='2'?{...r,counts:'19'}:r),{Demo:{holdMode:'title'}})[0];assert.ok(bad.sets[1].motionIssue);assert.equal(bad.sets[1].holdCounts,0);
});
test('phase changes preserve audio clock and do not fill unknown destination dots',()=>{
 const m=compile(rows,{Demo:{holdMode:'title',bpm:120}})[0];const c=clock(m.settings);assert.equal(c.toSeconds(starts(m.sets)[1]),10);const p={positions:{'1':{x:30,y:0}}};assert.equal(positionAt(p,m.sets,9),null);
});
test('manual phase override works on conflicting titles and rejects out-of-range phases',()=>{
 const m=compile(rows,{Demo:{holdMode:'title',motionCounts:{'2':5}}})[0];assert.equal(positionAt(m.people[0],m.sets,5).x,40);assert.equal(m.sets[1].holdCounts,15);
 const bad=compile(rows,{Demo:{motionCounts:{'2':21}}})[0];assert.ok(bad.sets[1].motionIssue);assert.equal(bad.sets[1].moveCounts,20);
});
test('phrase marching budget spans subset rows exactly once',()=>{
 const extra=[rows[0],{...rows[1],set:'1A',title:'Subset',measure:'Subset',counts:'10',side:'Side 1: On 35 yd ln'},{...rows[1],title:'18+12',counts:'20'}];
 const m=compile(extra,{Demo:{holdMode:'title'}})[0],p=m.people[0];assert.deepEqual(starts(m.sets),[0,10,30]);assert.equal(m.sets[2].moveCounts,8);assert.equal(m.sets[2].holdCounts,12);assert.equal(positionAt(p,m.sets,14).x,37.5);assert.equal(positionAt(p,m.sets,18).x,40);assert.equal(positionAt(p,m.sets,29).x,40);
});
test('coordinate-changing subsets during a claimed full hold are flagged instead of teleporting',()=>{
 const extra=[rows[0],{...rows[1],set:'1A',title:'Subset',measure:'Subset',counts:'8',side:'Side 1: On 35 yd ln'},{...rows[1],title:'8+12',counts:'12'}];
 const m=compile(extra,{Demo:{holdMode:'title'}})[0];assert.match(m.sets[2].motionIssue,/coordinates change/);assert.equal(m.sets[2].moveCounts,12);
});
test('short paths can arrive earlier by step-size estimate without changing the audio timeline',()=>{
 const small=rows.map(r=>r.set==='2'?{...r,side:'Side 1: On 32 yd ln'}:r),m=compile(small,{Demo:{holdMode:'title',naturalArrival:true}})[0],p=m.people[0];
 assert.equal(p.motionPhases['2'].move,4);assert.equal(p.motionPhases['2'].estimated,true);assert.equal(positionAt(p,m.sets,4).x,32);assert.equal(positionAt(p,m.sets,15).x,32);assert.deepEqual(starts(m.sets),[0,20]);
});
test('per-marcher step-off and early hold override the estimate and survive reconstruction',()=>{
 const initial=compile(rows)[0],id=initial.people[0].id,settings={Demo:{holdMode:'title',naturalArrival:true,performerPhases:{[id]:{'2':{start:3,move:5}}}}};
 const m=compile(rows,JSON.parse(JSON.stringify(settings)))[0],p=m.people[0];assert.equal(positionAt(p,m.sets,2).x,30);assert.equal(positionAt(p,m.sets,5.5).x,35);assert.equal(positionAt(p,m.sets,8).x,40);assert.equal(positionAt(p,m.sets,19).x,40);assert.equal(p.motionPhases['2'].custom,true);
});
