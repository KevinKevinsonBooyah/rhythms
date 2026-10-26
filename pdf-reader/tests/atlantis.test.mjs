import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,clock,starts,validateTiming} from '../core.mjs';
const project=JSON.parse(fs.readFileSync(new URL('../templates/atlantis/project.json',import.meta.url)));
const movements=compile(project.rows,project.settings);
test('Atlantis movement tracks are distinct and all score tempo maps validate',()=>{
 assert.equal(movements.length,3);assert.equal(new Set(movements.map(m=>m.settings.audioFile)).size,3);
 for(const m of movements){validateTiming(m.settings);assert.ok(fs.statSync(new URL('../templates/atlantis/'+m.settings.audioFile,import.meta.url)).size>1000000);}
});
test('score tempo changes apply inside transitions without a discontinuity',()=>{
 for(const [i,bpm,change,next]of [[0,140,140,172],[1,86,96,90],[2,90,32,172]]){
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

test('opening subset uses three 5/4 measures and preserves downstream musical counts',()=>{
 const m=movements[0],ss=starts(m.sets);assert.equal(ss[m.sets.findIndex(s=>s.id==='1A')],15);assert.equal(ss[m.sets.findIndex(s=>s.id==='2')],50);assert.equal(ss.at(-1),496);
});
