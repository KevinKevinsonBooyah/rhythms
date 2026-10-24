/* Update 53: visible Maker rests and phone landscape practice. */
let wideActive53=false,wideDismissed53=false,wideScale53=1,wideFrame53=0,wideSavedScroll53=0;
const landscape53=matchMedia('(orientation: landscape)');
function isPhoneWide53(){return document.body.dataset.device==='mobile'&&innerWidth>=480&&innerHeight<=650&&landscape53.matches}
function syncWideScore53(){
 const svg=$('score'),vp=$('viewport');if(!wideActive53){svg.style.removeProperty('width');svg.style.removeProperty('height');wideScale53=1;return}
 const height=svg.viewBox.baseVal.height||280;wideScale53=Math.min(1,Math.max(.25,vp.clientHeight/height));
 svg.style.setProperty('width',(width*wideScale53)+'px','important');svg.style.setProperty('height',(height*wideScale53)+'px','important');
 if(running||breaking||starting){vp.scrollLeft=Math.max(0,transportX*wideScale53-vp.clientWidth*.28);placeHandoffBubble()}
}
function syncWideButton53(){
 const pause=$('widePause54');if(pause){pause.hidden=!wideActive53||(!running&&!breaking);pause.disabled=$('pauseRound').disabled||starting||resumeCounting;pause.textContent=$('pauseRound').textContent;pause.setAttribute('aria-pressed',breaking?String(countdownPaused):$('pauseRound').getAttribute('aria-pressed')||'false')}
 if(!wideActive53)return;
 if(cfg.playMode==='maker'&&pause){pause.hidden=false;pause.disabled=!running||starting||resumeCounting}
 const label=starting?'Loading…':breaking?'Next round…':resumeCounting?'Resuming…':roundPaused?'Tap to resume':running?(mode==='listen'?'Listen first':'Tap the rhythm'):'Tap to start';
 $('tap').querySelector('span:first-child').textContent=label;
 const disabled=starting||breaking||resumeCounting||running&&mode==='listen';$('tap').disabled=disabled;
 if(cfg.playMode==='polyrhythms')for(let lane=0;lane<2;lane++){$('polyTap'+lane).disabled=disabled;$('polyFeedback'+lane).textContent=label}
}
function setWide53(next){
 if(wideActive53===next){syncWideButton53();return}wideActive53=next;
 if(next){wideSavedScroll53=scrollY;settleCoinFlights44();document.body.dataset.wide53='true';$('wideStatus53').append($('countInPanel'));$('wideExit53').hidden=false;window.scrollTo(0,0)}
 else{document.body.dataset.wide53='false';$('countHome53').after($('countInPanel'));$('wideExit53').hidden=true;$('tap').querySelector('span:first-child').textContent='Tap here or on the rhythm!';$('tap').disabled=roundPaused;for(let lane=0;lane<2;lane++)$('polyTap'+lane).disabled=roundPaused;syncPolyFeedback();window.scrollTo(0,wideSavedScroll53)}
 petMotion52();cancelAnimationFrame(wideFrame53);wideFrame53=requestAnimationFrame(()=>{wideFrame53=0;fitTransportCanvas();syncWideScore53();resizeFx();if(notes.length)setTransportPosition(transportX||notes[0].x,$('playhead')?.getAttribute('opacity')||1);syncScroll50()});syncWideButton53();
}
function syncWide53(){
 const eligible=isPhoneWide53();if(!eligible)wideDismissed53=false;
 setWide53(eligible&&!wideDismissed53&&deviceChosen50&&!document.querySelector('dialog[open]:not(#resultsDialog)'));
}
const transportBefore53=setTransportPosition;
setTransportPosition=function(x,opacity=1){const result=transportBefore53(x,opacity);if(wideActive53){$('viewport').scrollLeft=Math.max(0,x*wideScale53-$('viewport').clientWidth*.28);placeHandoffBubble()}return result};
const renderBefore53=render;render=function(){const r=renderBefore53();syncWideScore53();return r};
const chooseBefore53=chooseDevice;chooseDevice=function(kind){const r=chooseBefore53(kind);requestAnimationFrame(syncWide53);return r};
const controlBefore53=syncStop50;syncStop50=function(){const r=controlBefore53();syncWideButton53();return r};
const pauseBefore53=syncPauseControl;syncPauseControl=function(){const r=pauseBefore53();syncWideButton53();return r};
const handoffBefore54=syncEndlessHandoffControls;syncEndlessHandoffControls=function(){const r=handoffBefore54();syncWideButton53();return r};
const countBefore53=setupCountIn;setupCountIn=function(...args){const r=countBefore53(...args);syncWideButton53();return r};
const launchBefore53=launchCoins;
launchCoins=function(point,amount,txn){
 if(!wideActive53)return launchBefore53(point,amount,txn);
 if(!txn||txn.cancelled)return;amount=Math.min(Math.max(0,Math.floor(amount)),txn.amount-txn.arrived);if(!amount)return;
 creditHiddenCoins44(txn,amount);if(cfg.coinVisuals===false||document.hidden||!fxContext)return;
 let p=point;if(!p.anchor){const note=[...notes].reverse().find(n=>!n.rest)||notes.at(-1);if(note)p=notePoint(note)}
 addFx({type:'rewardText54',anchor:p.anchor,x:p.x,y:p.y-27,label:'+'+amount,life:1.05,silver:!!txn.silver,txn});
 const available=Math.max(0,40-fxItems.filter(p=>p.type==='coinBurst53').length),count=Math.min(10,available);
 for(let i=0;i<count;i++){const angle=-Math.PI+(i+.5)/count*Math.PI,speed=75+Math.random()*65;addFx({type:'coinBurst53',anchor:p.anchor?{...p.anchor}:undefined,x:p.x,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,spin:(Math.random()-.5)*4,life:.72+Math.random()*.16,silver:!!txn.silver,txn})}
};
const flyBefore54=flyCoins;
flyCoins=function(n,amount,txn){if(!wideActive53)return flyBefore54(n,amount,txn);launchCoins(notePoint(n),amount,txn)};
function landscapeTap53(event){
 if(!wideActive53||event.target.closest('#wideExit53'))return;
 if(roundPaused&&!resumeCounting){event.preventDefault();event.stopImmediatePropagation();setRoundPaused(false);return}
 if(!running&&!starting&&!breaking&&!transitioning){event.preventDefault();event.stopImmediatePropagation();start('practice')}
}
function installUpdate53(){
 const pause=document.createElement('button');pause.id='widePause54';pause.type='button';pause.hidden=true;pause.setAttribute('aria-label','Pause or resume the run');pause.onclick=event=>{event.preventDefault();event.stopPropagation();$('pauseRound').click();syncWideButton53()};document.body.append(pause);
 const home=document.createElement('span');home.id='countHome53';home.hidden=true;$('countInPanel').before(home);
 const status=document.createElement('div');status.id='wideStatus53';document.querySelector('.practice').append(status);
 const exit=document.createElement('button');exit.id='wideExit53';exit.type='button';exit.hidden=true;exit.setAttribute('aria-label','Exit landscape view');exit.textContent='×';document.body.append(exit);exit.onclick=event=>{event.preventDefault();event.stopPropagation();wideDismissed53=true;setWide53(false)};exit.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();exit.click()}};
 for(const id of ['tap','polyTap0','polyTap1'])$(id).addEventListener('pointerdown',landscapeTap53,{capture:true});
 $('score').addEventListener('click',event=>{
  if(cfg.playMode!=='maker'||running||starting||wideActive53)return;const target=event.target.closest('g[id^="n"]');if(!target)return;const n=notes.find(n=>'n'+n.id===target.id);if(!n?.placeholder)return;
  event.preventDefault();event.stopPropagation();const prefix=notes.filter(r=>r.bar===n.bar&&r.placeholder&&r.t<n.t);if(prefix.length)editorRemember();
  for(const rest of prefix)makerBars[n.bar].push({base:rest.base,dot:rest.dot,rest:true,tied:false});makerCursor42={bar:n.bar,index:makerBars[n.bar].length};saveMaker();generateMaker();makerFollow42();
 },true);
 for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>requestAnimationFrame(syncWide53));
 new MutationObserver(()=>requestAnimationFrame(syncWide53)).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 window.addEventListener('resize',()=>{syncWide53();requestAnimationFrame(syncWideScore53)});globalThis.visualViewport?.addEventListener('resize',()=>{syncWide53();requestAnimationFrame(syncWideScore53)});landscape53.addEventListener('change',syncWide53);
 syncWide53();
}
