/* Update 50: clearer transport, accessible score navigation, and Maker practice. */
function syncStop50(){const active=running||starting||breaking||echoReturnBusy;$('stop').textContent='■ Stop';$('stop').hidden=!active;document.body.dataset.transportActive=String(active)}
const syncPauseBefore50=syncPauseControl;
syncPauseControl=function(){const result=syncPauseBefore50();syncStop50();return result};
const stopBefore50=stop;
stop=function(reset=true){const result=stopBefore50(reset);syncStop50();return result};

// Show preparation immediately, before asynchronous audio loading. Clock stalls
// change the label without pretending a slow metronome beat is a loading stall.
let countClock50={time:-1,at:0};
function labelCount50(loading){const label=$('countLoading50');if(!label)return;label.textContent=loading?'Loading…':'Count in';label.dataset.loading=String(loading)}
window.showLoadingCount50=function(){
 const m=meterInfo(barRanges[0]?.meter||cfg.meter);setupCountIn(m,Math.max(1,cfg.count)*m.length);$('countInPanel').hidden=false;$('countInBeat').textContent='Get ready';labelCount50(true);syncStop50();
};
const setupCountBefore50=setupCountIn;
setupCountIn=function(m,countQ){const result=setupCountBefore50(m,countQ);countClock50={time:audio?.currentTime??-1,at:performance.now()};labelCount50(false);return result};
setInterval(()=>{
 syncStop50();if($('countInPanel').hidden||roundPaused)return;
 const now=performance.now(),time=audio?.currentTime??-1;
 if(time>countClock50.time+.001)countClock50={time,at:now};
 labelCount50(starting||audio?.state!=='running'||now-countClock50.at>700);
},200);

// A safety pass uses the actual written density, not only the level number.
// Everything is converted to quarter-note tempo before comparing meters.
function relaxTempos50(){
 if(cfg.playMode==='maker'||cfg.playMode==='polyrhythms'||generatedLevel<7||!barRanges.length)return false;
 const level=Math.round(clamp(generatedLevel,7,12)),quarterCap=({7:112,8:104,9:96,10:88,11:80,12:72})[level],maxRate=({7:6,8:6,9:6.25,10:6.5,11:6.75,12:7})[level];
 const globalMin=notes.filter(n=>!n.rest&&!n.tied).reduce((d,n)=>Math.min(d,n.dur/Q),Infinity);
 // A common cap avoids a sudden rush immediately after a dense measure.
 const densityCap=Number.isFinite(globalMin)?globalMin*60*maxRate:quarterCap,cap=Math.min(quarterCap,densityCap);let previous=Infinity,changed=false;
 for(const br of barRanges){const unit=meterInfo(br.meter||cfg.meter).unit,old=br.bpm,quarter=Math.min(old*unit,cap,previous*1.15);br.bpm=Math.max(20,Math.floor(quarter/unit));previous=br.bpm*unit;changed=changed||old!==br.bpm}
 cfg.bpm=barRanges[0].bpm;return changed;
}
const planBefore50=planImpossible;
planImpossible=function(){relaxTempos50();return planBefore50()};
const generateBefore50=generate;
generate=function(options={}){if(cfg.playMode==='strange'){cfg.playMode='standard';cfg.bars=cfg.standardBars||8;isCustom=false;preset(cfg.level)}const result=generateBefore50(options);syncScroll50();syncStop50();return result};
const switchBefore50=switchMode;
switchMode=function(next){if(next==='strange')return;const result=switchBefore50(next);syncScroll50();return result};
function retimeScore50(){
 if(cfg.playMode==='maker'||!barRanges.length)return;
 let changed=false;if(cfg.bpm!==barRanges[0].bpm){const ratio=cfg.bpm/barRanges[0].bpm;for(const br of barRanges)br.bpm=Math.max(20,Math.round(br.bpm*ratio));changed=true}
 changed=relaxTempos50()||changed;if(changed){if(impOn())impBuild();render();sync();save();syncScroll50()}
}
const startBefore50=start;
start=async function(which,continuation=false){
 if(starting||transitioning||cloudLoading42)return;retimeScore50();
 const result=await startBefore50(which,continuation);syncStop50();return result;
};

function syncScroll50(){
 const scroll=$('rhythmScroll50'),viewport=$('viewport');if(!scroll)return;
 const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);scroll.max=String(max||1);scroll.value=String(viewport.scrollLeft);scroll.disabled=max<1;scroll.style.setProperty('--scroll-thumb50',Math.max(30,viewport.clientWidth*viewport.clientWidth/Math.max(1,viewport.scrollWidth))+'px');scroll.setAttribute('aria-valuetext',max?Math.round(viewport.scrollLeft/max*100)+'% through the score':'Entire score visible');
}
const decorateBefore50=editorDecorateScore;
editorDecorateScore=function(){
 const result=decorateBefore50();if(cfg.playMode!=='maker'||running||starting)return result;
 const svg=$('score');svg.querySelectorAll('[data-maker-barline50]').forEach(el=>el.remove());
 for(let bar=0;bar<barRanges.length;bar++){
  const x=bar===0?48:barRanges[bar-1].right-12,group=svgEl('g',{'data-maker-barline50':bar,role:'button',tabindex:0,'aria-label':'Set time signature at bar '+(bar+1)});
  group.append(svgEl('rect',{x:x-13,y:125,width:27,height:69,rx:4,fill:'transparent'}));group.append(svgEl('line',{x1:x,y1:134,x2:x,y2:182,stroke:'#a4d9bc','stroke-width':2,opacity:.6}));group.append(svgEl('title',{},'Time signature · bar '+(bar+1)));
  const edit=e=>{e.preventDefault();e.stopPropagation();makerCursor42={bar,index:0};makerOpenMark42('meter',bar)};group.addEventListener('click',edit);group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')edit(e)});svg.append(group);
 }
 syncScroll50();return result;
};
// Equal-value rest replacement leaves tuplets complete and lets a deleted note
// be restored with its palette value, without changing the rest of the bar.
const insertBefore50=makerInsert42;
makerInsert42=function(value){
 if(running||starting)return;makerClamp42();const {bar,index}=makerCursor42,entry=makerBars[bar]?.[index];
 if(!makerRest&&entry?.rest&&entry.base===value.base&&entry.dot===value.dot&&(!value.count||value.count===entry.tuplet)){
  editorRemember();entry.rest=false;entry.tied=false;makerCursor42.index++;saveMaker();generateMaker();makerFollow42();editorMessage('Rest replaced with a note.');return;
 }
 return insertBefore50(value);
};
const toolbarBefore50=editorDrawToolbar;
editorDrawToolbar=function(){const result=toolbarBefore50();if(cfg.playMode!=='maker')return result;const entry=makerBars[makerCursor42.bar]?.[makerCursor42.index];if(!makerRest&&entry?.rest)for(const button of $('maker42Values').children){const value=makerValues[Number(button.dataset.value)];if(entry.base===value.base&&entry.dot===value.dot&&(!value.count||value.count===entry.tuplet))button.disabled=false}return result};

let deviceChosen50=false;
function maybeLoginTip50(){
 if(!deviceChosen50||cloudLoading42||document.querySelector('dialog[open]'))return;
 try{if(localStorage.getItem('rhythms-login-tip50'))return;if(cloudUser){localStorage.setItem('rhythms-login-tip50','seen');return}localStorage.setItem('rhythms-login-tip50','seen')}catch(e){}
 $('loginTip50').hidden=false;
}
const chooseBefore50=chooseDevice;
chooseDevice=function(kind){const result=chooseBefore50(kind);if(['mobile','computer'].includes(kind)){deviceChosen50=true;requestAnimationFrame(()=>{syncScroll50();maybeLoginTip50()})}return result};
const cloudBefore50=initCloud;
initCloud=async function(){try{return await cloudBefore50()}finally{maybeLoginTip50()}};
const boardBefore50=renderBoard;
renderBoard=function(rows,label){const result=boardBefore50(rows,label);if(!rows.length&&$('leaderboardMode').value==='maker')$('boardRows').querySelector('.board-empty').textContent='Complete a rhythm with at least 4 notes to set a score.';return result};

function installUpdate50(){
 document.title='Rhythms';for(const id of ['tempo','tempo2','bpm']){$(id).min='20';const before=$(id).oninput;$(id).oninput=e=>{before(e);retimeScore50()}}$('legacyModes').remove();$('legacyDialog').hidden=true;$('strangeMode').disabled=true;$('strangeMode').onclick=null;
 if(cfg.playMode==='strange'){cfg.playMode='standard';cfg.bars=cfg.standardBars||8;isCustom=false;preset(cfg.level)}
 for(const item of catalog)if(item.price>0)item.price=Math.round(item.price/100)*50;
 const label=document.createElement('div');label.id='countLoading50';label.setAttribute('role','status');label.textContent='Count in';$('countInPanel').prepend(label);
 const rail=document.createElement('div');rail.className='score-scroll50';rail.innerHTML='<input id="rhythmScroll50" type="range" min="0" max="1" value="0" step="1" aria-label="Scroll through rhythm">';$('scoreStage').after(rail);
 const viewport=$('viewport');viewport.setAttribute('tabindex','0');viewport.setAttribute('aria-label','Rhythm score. Scroll to see more.');$('rhythmScroll50').oninput=e=>{viewport.scrollLeft=Number(e.target.value);syncScroll50()};viewport.addEventListener('scroll',syncScroll50,{passive:true});
 viewport.addEventListener('wheel',e=>{if(cfg.playMode!=='maker'||running||starting||e.ctrlKey||Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;const dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientWidth:1),max=viewport.scrollWidth-viewport.clientWidth;if(dy<0&&viewport.scrollLeft>0||dy>0&&viewport.scrollLeft<max-1){e.preventDefault();viewport.scrollLeft+=dy}},{passive:false});
 new ResizeObserver(syncScroll50).observe(viewport);new ResizeObserver(syncScroll50).observe($('score'));
 $('makerMarkHint44').textContent='Click a barline to set its time signature. Click a tempo marking to edit it.';
 const tip=document.createElement('aside');tip.id='loginTip50';tip.hidden=true;tip.setAttribute('aria-label','Account reminder');tip.innerHTML='<button class="login-tip-close50" aria-label="Dismiss sign-in reminder">×</button><strong>Log in to be in the leaderboard, and more!</strong><button class="login-tip-open50">Log in</button>';document.body.append(tip);tip.querySelector('.login-tip-close50').onclick=()=>tip.hidden=true;tip.querySelector('.login-tip-open50').onclick=()=>{tip.hidden=true;$('accountButton').click()};
 for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>requestAnimationFrame(maybeLoginTip50));
 const wallet=$('wallet').parentElement;for(const node of [...wallet.childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();const coin=document.createElement('span');coin.className='wallet-coin50';coin.setAttribute('aria-hidden','true');wallet.prepend(coin);wallet.setAttribute('aria-label','Gold wallet');
 syncStop50();syncScroll50();
}
