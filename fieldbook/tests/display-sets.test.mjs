import test from 'node:test';
import assert from 'node:assert/strict';
import {isLetteredSet,nextVisibleSetIndex,visibleSetIndex} from '../display-sets.mjs';

const sets=['1','1A','1B','2','2A','3','3A'].map(id=>({id}));
test('lettered subsets remain in underlying sequence but disappear from display navigation',()=>{
  assert.equal(sets.length,7);
  assert.equal(nextVisibleSetIndex(sets,0,true),3);
  assert.equal(nextVisibleSetIndex(sets,1,true),3);
  assert.equal(visibleSetIndex(sets,2,true),0);
  assert.equal(nextVisibleSetIndex(sets,3,true),5);
  assert.equal(nextVisibleSetIndex(sets,5,true),-1);
});
test('disabling the filter restores all set navigation entries',()=>{
  assert.equal(nextVisibleSetIndex(sets,0,false),1);
  assert.equal(visibleSetIndex(sets,2,false),2);
});
test('classify by set identifier, not drill title',()=>{
  assert.equal(isLetteredSet({id:'5',title:'10+15+8'}),false);
  assert.equal(isLetteredSet({id:'5A'}),true);
  assert.equal(isLetteredSet({id:'8B'}),true);
});
