import test from 'node:test';import assert from 'node:assert/strict';
import {formatCardCoordinate,marcherReadout} from '../marcher-card.mjs';import {coordinate} from '../core.mjs';
const row1={side:'Side 1: On 30 yd ln',depth:'On Front Hash (HS)'},row2={side:'Side 1: On 40 yd ln',depth:'On Front Hash (HS)'};
const m={sets:[{id:'1',duration:0},{id:'2',duration:20,moveCounts:10},{id:'3',duration:10}]};const p={instrument:'Clarinet',symbol:'C',label:'1',positions:{'1':{...coordinate(row1.side,row1.depth),row:row1},'2':{...coordinate(row2.side,row2.depth),row:row2}}};
test('printed coordinates stay fixed during a transition and show the next dot',()=>{
 const a=marcherReadout(p,m,0);assert.equal(a.side,row1.side);assert.equal(a.depth,row1.depth);assert.equal(a.nextSet,'2');
 const moving=marcherReadout(p,m,5);assert.equal(moving.side,row1.side);assert.equal(moving.depth,row1.depth);assert.equal(moving.nextSide,row2.side);
 const held=marcherReadout(p,m,15);assert.equal(held.side,row1.side);assert.equal(held.status,'Dot card · set 1');assert.equal(held.nextSide,row2.side);
 const arrived=marcherReadout(p,m,20);assert.equal(arrived.side,row2.side);assert.equal(arrived.nextSide,'Unknown');
});
test('live coordinate formatter round trips across both sides, hashes, sidelines and centerline',()=>{
 for(const step of [.625,.75])for(const x of [0,13.42,46.875,50,53.125,86.58,100])for(const y of [0,1.25,17.7777777778,25,35.5555555556,53.3333333333]){const text=formatCardCoordinate({x,y},step),q=coordinate(text.side,text.depth,step);assert.ok(q.valid,JSON.stringify(text));assert.ok(Math.abs(q.x-x)<=step*.0051);assert.ok(Math.abs(q.y-y)<=step*.0051);}
});
test('manual set inspection uses that dot and missing coordinates stay unknown',()=>{
 const manual=marcherReadout(p,m,0,.625,1);assert.equal(manual.side,row2.side);assert.equal(manual.status,'Dot card · set 2');
 const missing=marcherReadout(p,m,30);assert.equal(missing.side,'Unknown');assert.equal(missing.depth,'Unknown');
});
test('stationary marchers keep the current set label until the timeline advances',()=>{
 const q={...p,positions:{...p.positions,'2':{...p.positions['1'],row:{...row1}}},motionPhases:{'2':{start:0,move:0}}};assert.equal(marcherReadout(q,m,0).status,'Dot card · set 1');assert.equal(marcherReadout(q,m,5).status,'Dot card · set 1');
});
