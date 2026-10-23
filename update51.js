/* Update 51: isolate active modes and make composing easier to read. */
const modeButtons51=['standardMode','endlessMode','impossibleMode','polyMode','echoMode','makerMode'];
function modeBusy51(){return running||starting||breaking||echoReturnBusy||transitioning}
function syncModeLock51(){
 const active=modeBusy51();
 for(const id of modeButtons51){const button=$(id);if(!button)continue;button.disabled=active;button.title=active?'Stop the run to change mode':''}
}
const stopSyncBefore51=syncStop50;
syncStop50=function(){const result=stopSyncBefore51();syncModeLock51();return result};
const switchBefore51=switchMode;
switchMode=function(next){if(modeBusy51())return;echoAnswerPending=false;echoDemoActive=false;const result=switchBefore51(next);syncModeLock51();return result};
const polyGenerateBefore51=generatePoly;
generatePoly=function(){if(cfg.playMode!=='polyrhythms')return;return polyGenerateBefore51()};
const makerGenerateBefore51=generateMaker;
generateMaker=function(){if(cfg.playMode!=='maker')return;return makerGenerateBefore51()};
const polyRenderBefore51=renderPoly;
renderPoly=function(){if(cfg.playMode!=='polyrhythms')return;return polyRenderBefore51()};
const renderBefore51=render;
render=function(){
 const result=renderBefore51();if(cfg.playMode!=='polyrhythms')$('score').querySelectorAll('[data-poly-lane]').forEach(el=>el.remove());
 if(cfg.playMode!=='echo'){$('echoListenBanner').hidden=true;echoTurnBanner.hidden=true}
 if(cfg.playMode!=='endless')$('breakCard').hidden=true;
 return result;
};
// Cancel stale Echo state on an actual Stop. Its internal handoff uses stop(false).
let echoStartGuard51=false;
const stopBefore51=stop;
stop=function(reset=true){const result=stopBefore51(reset);if(reset&&!echoStartGuard51){echoAnswerPending=false;echoDemoActive=false;if(!cloudLoading42&&!transitioning)$('play').disabled=$('listen').disabled=false}syncModeLock51();return result};
const startBefore51=start;
start=function(...args){echoStartGuard51=true;try{return startBefore51(...args)}finally{echoStartGuard51=false}};
const returnBefore51=beginEchoReturn;
beginEchoReturn=function(){const result=returnBefore51();syncModeLock51();return result};

// Impossible gets a controlled speed increase at generation, never repeatedly
// on Start. Other modes keep the Update 50 density limits.
const relaxBefore51=relaxTempos50;
relaxTempos50=function(){
 if(cfg.playMode!=='impossible')return relaxBefore51();if(!barRanges.length)return false;
 const level=Math.round(clamp(generatedLevel,10,12)),maxQuarter=({10:108,11:98,12:90})[level],rate=({10:7.5,11:7.75,12:8})[level];
 const shortest=notes.filter(n=>!n.rest&&!n.tied).reduce((d,n)=>Math.min(d,n.dur/Q),Infinity),cap=Math.min(maxQuarter,shortest*60*rate);let previous=Infinity,changed=false;
 for(const br of barRanges){const old=br.bpm,unit=meterInfo(br.meter||cfg.meter).unit;br.bpm=Math.max(20,Math.floor(Math.min(old*unit,cap,previous*1.15)/unit));previous=br.bpm*unit;changed=changed||old!==br.bpm}
 cfg.bpm=barRanges[0].bpm;return changed;
};
const planBefore51=planImpossible;
planImpossible=function(){if(cfg.playMode==='impossible'){for(const br of barRanges)br.bpm=Math.round(br.bpm*1.2);if(barRanges[0])cfg.bpm=barRanges[0].bpm}return planBefore51()};

let moreValues51=false;
function syncComposer51(){
 if(!$('makerNotes51'))return;
 $('makerNotes51').setAttribute('aria-pressed',String(!makerRest));$('maker42Rest').setAttribute('aria-pressed',String(makerRest));$('maker42Rest').textContent='Rests';
 $('maker42Delete').textContent='Note → rest';$('maker42Delete').title='Replace the note before the cursor with a rest of the same value';
 $('makerMore51').textContent=moreValues51?'Fewer values':'More values · dots & tuplets';$('makerMore51').setAttribute('aria-expanded',String(moreValues51));
 $('maker42Values').dataset.expanded=String(moreValues51);
 const {bar,index}=makerCursor42,entry=makerBars[bar]?.[index-1];$('maker42Cursor').textContent='Bar '+(bar+1)+' · '+(entry?'after '+(entry.rest?'rest ':'note ')+index:'start');
 const boundary=makerBoundary42();$('makerBarHelp51').textContent=boundary===null?'Click a barline for meter, or a tempo marking to edit tempo.':'Changes apply at the start of bar '+(boundary+1)+'.';
 for(const button of $('maker42Values').children){const value=makerValues[Number(button.dataset.value)];button.title='Add '+value.label+(value.count?'':' '+(makerRest?'rest':'note'));button.setAttribute('aria-label',button.title)}
}
const toolbarBefore51=editorDrawToolbar;
editorDrawToolbar=function(){const result=toolbarBefore51();syncComposer51();return result};
function installUpdate51(){
 // Preserve free/owned items and their tier order while reducing every paid item.
 const max=Math.max(...catalog.map(c=>c.price));for(const item of catalog)if(item.price>0)item.price=Math.max(50,Math.min(20000,Math.round(item.price*20000/max/50)*50));
 const generateClick=$('generate').onclick;$('generate').onclick=event=>{echoAnswerPending=false;echoDemoActive=false;const result=generateClick(event);syncModeLock51();if(result?.then)result.finally(syncModeLock51);return result};
 for(const id of modeButtons51)$(id).addEventListener('click',event=>{if(modeBusy51()){event.preventDefault();event.stopImmediatePropagation()}},{capture:true});
 const work=$('makerWorkbench'),palette=$('maker42Values'),prev=$('maker42Prev'),next=$('maker42Next'),cursor=$('maker42Cursor'),del=$('maker42Delete'),rest=$('maker42Rest'),undo=$('maker42Undo'),redo=$('maker42Redo'),tempo=$('maker42Tempo'),meter=$('maker42Meter'),status=$('makerEditorStatus');
 const restClick=rest.onclick;work.replaceChildren();
 const header=document.createElement('div');header.className='compose-head51';header.innerHTML='<strong>Compose</strong><span>Click a value to add it to your score.</span>';work.append(header);
 const add=document.createElement('section');add.className='compose-add51';add.innerHTML='<div class="compose-step51"><b>1</b><strong>Add to score</strong><div class="entry-kind51"><button id="makerNotes51" aria-pressed="true">Notes</button></div><button id="makerMore51" aria-expanded="false" aria-controls="maker42Values">More values · dots & tuplets</button></div>';add.querySelector('.entry-kind51').append(rest);add.append(palette);work.append(add);
 const move=document.createElement('section');move.className='compose-move51';move.innerHTML='<div class="compose-step51"><b>2</b><strong>Move & edit</strong></div><div class="compose-navigation51"></div>';prev.textContent='← Back';next.textContent='Next →';prev.title='Move insertion point to the previous note';next.title='Move insertion point to the next note';move.querySelector('.compose-navigation51').append(prev,cursor,next,del,undo,redo);work.append(move);
 const marks=document.createElement('section');marks.className='compose-marks51';marks.innerHTML='<div class="compose-step51"><b>3</b><strong>Tempo & meter</strong></div><div class="compose-mark-actions51"></div><span id="makerBarHelp51"></span>';tempo.textContent='Set tempo';meter.textContent='Set time signature';marks.querySelector('.compose-mark-actions51').append(tempo,meter);work.append(marks,status);
 for(const button of palette.children){const value=makerValues[Number(button.dataset.value)];button.dataset.advanced51=String(!!value.dot||!!value.count||value.base<.25)}
 const choose=desired=>{if(makerRest!==desired)restClick();syncComposer51()};$('makerNotes51').onclick=()=>choose(false);rest.onclick=()=>choose(true);$('makerMore51').onclick=()=>{moreValues51=!moreValues51;syncComposer51()};
 syncComposer51();syncModeLock51();
}
