import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,clock,starts,validateTiming,positionAt} from '../core.mjs';
const project=JSON.parse(fs.readFileSync(new URL('../templates/atlantis/project.json',import.meta.url)));
const movements=compile(project.rows,project.settings);
test('Atlantis movement tracks are distinct and all score tempo maps validate',()=>{
 assert.equal(movements.length,3);assert.equal(new Set(movements.map(m=>m.settings.audioFile)).size,3);
 for(const m of movements){validateTiming(m.settings);assert.ok(fs.statSync(new URL('../templates/atlantis/'+m.settings.audioFile,import.meta.url)).size>1000000);}
});
test('score tempo changes apply inside transitions without a discontinuity',()=>{
 for(const [i,bpm,change,next]of [[0,140,110.7,172],[1,86,96,90],[2,90,32,172]]){
  const s=movements[i].settings,c=clock(s);assert.equal(s.bpm,bpm);
  assert.ok(Math.abs(c.toSeconds(change)-(s.offset+change*60/bpm))<1e-7);
  assert.ok(Math.abs(c.toSeconds(change+4)-c.toSeconds(change)-240/next)<1e-7);
  for(const n of [0,change-.1,change,change+.1,starts(movements[i].sets).at(-1)])assert.ok(Math.abs(c.toCount(c.toSeconds(n))-n)<1e-7);
 }
});
test('Movement 1 retains the requested intro hold and Movement 2 changes at set 27',()=>{
 const c=clock(movements[0].settings);assert.equal(c.toSeconds(0),12.7);assert.equal(c.toCount(12.699),0);
 const m=movements[1];assert.equal(starts(m.sets)[m.sets.findIndex(s=>s.id==='27')],96);
});

test('observed count 20.7 starts set 2 to 2A and preserves subsequent 10-count transitions',()=>{
 const m=movements[0],ss=starts(m.sets),at=id=>ss[m.sets.findIndex(s=>s.id===id)];
 assert.equal(at('1A'),15);
 for(const [id,value]of [['2',20.7],['2A',30.7],['2B',40.7],['3',50.7]])assert.ok(Math.abs(at(id)-value)<1e-8);
 const end=clock(m.settings).toSeconds(ss.at(-1));assert.ok(end>183&&end<189.48);
});
test('Atlantis resolves whole-phrase holds without changing any set or tempo cue count',()=>{
 for(const m of movements){
  const baseline=compile(project.rows,{...project.settings,[m.name]:{...m.settings,holdMode:'off'}}).find(v=>v.name===m.name);assert.deepEqual(starts(m.sets),starts(baseline.sets));
  for(let i=1;i<m.sets.length;i++){const s=m.sets[i];if(!s.holdCounts||!s.moveCounts)continue;
   const start=starts(m.sets)[i-1];for(const p of m.people){const dest=p.positions[s.id];if(!dest||!p.positions[m.sets[i-1].id])continue;
    const reached=positionAt(p,m.sets,start+s.moveCounts),held=positionAt(p,m.sets,start+s.moveCounts+s.holdCounts/2);assert.ok(Math.hypot(reached.x-dest.x,reached.y-dest.y)<1e-8);assert.deepEqual(held,reached);
   }
  }
 }
});
test('all 108 Atlantis marchers retain known positions through every set and transition',()=>{
 for(const m of movements){assert.equal(m.people.length,108);const times=starts(m.sets);for(const p of m.people)for(let i=0;i<m.sets.length;i++){
  assert.ok(p.positions[m.sets[i].id],`${m.name} ${p.label} ${m.sets[i].id}`);
  assert.ok(positionAt(p,m.sets,times[i]));if(i)assert.ok(positionAt(p,m.sets,(times[i-1]+times[i])/2));
 }}
});
