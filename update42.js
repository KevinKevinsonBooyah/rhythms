/* Rhythms 43. Silent Mode playback with the original low-latency audio clock. */
let silentAudio43=null,silentURL43=null,silentRelease43=0,silentWanted43=false;
const isIOS43=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
configureAudioSession=function(){
 try{if(navigator.audioSession){navigator.audioSession.type='playback';return navigator.audioSession.type==='playback'}}catch(e){}
 return false;
};
function unlockSilentAudio43(){
 clearTimeout(silentRelease43);silentWanted43=true;
 // Modern Safari can select the media channel directly. Older iOS needs a
 // silent media element alongside Web Audio. Never route timed notes through it.
 if(configureAudioSession()||!isIOS43())return;
 if(!silentAudio43){
  const samples=8000,bytes=new Uint8Array(44+samples),view=new DataView(bytes.buffer);
  const tag=(offset,text)=>{for(let i=0;i<text.length;i++)bytes[offset+i]=text.charCodeAt(i)};
  tag(0,'RIFF');view.setUint32(4,36+samples,true);tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,8000,true);view.setUint32(28,8000,true);view.setUint16(32,1,true);view.setUint16(34,8,true);tag(36,'data');view.setUint32(40,samples,true);bytes.fill(128,44);
  silentURL43=URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}));
  silentAudio43=document.createElement('audio');silentAudio43.src=silentURL43;silentAudio43.loop=true;silentAudio43.preload='auto';silentAudio43.muted=false;silentAudio43.volume=1;silentAudio43.setAttribute('playsinline','');silentAudio43.setAttribute('aria-hidden','true');silentAudio43.hidden=true;document.body.append(silentAudio43);
 }
 if(silentAudio43.paused){try{Promise.resolve(silentAudio43.play()).then(()=>{if(!silentWanted43)silentAudio43.pause()}).catch(()=>{/* Retry on the next playback gesture. */})}catch(e){}}
}
function releaseSilentAudio43(delay=0){
 clearTimeout(silentRelease43);
 const release=()=>{silentWanted43=false;silentAudio43?.pause()};
 if(delay)silentRelease43=setTimeout(release,delay);else release();
}
configureAudioSession();
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseSilentAudio43();else if((running||starting||breaking)&&!roundPaused)unlockSilentAudio43()});
window.addEventListener('pagehide',()=>{releaseSilentAudio43();if(silentURL43){silentAudio43.removeAttribute('src');silentAudio43.load();silentAudio43.remove();silentAudio43=null;URL.revokeObjectURL(silentURL43);silentURL43=null}});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{if((running||starting||breaking)&&!roundPaused)unlockSilentAudio43()},{capture:true,passive:true});
const timeout42=(promise,ms,message)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(message)),ms);Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v)},e=>{clearTimeout(timer);reject(e)})});
let audioBuild42=null,runClock42={time:0,at:0},lastPaint42=0,cloudLoading42=false,cloudReady42=false,cloudSaveTimer42=0,cloudRetry42=false;
function fallbackSample42(ctx,index){
 const length=index===0?.055:.085,b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<d.length;i++){const t=i/ctx.sampleRate;d[i]=(index===0?Math.sin(t*2*Math.PI*1350):Math.random()*2-1)*Math.exp(-t*(index===0?110:65))*.55}return b;
}
initAudio=async function(){
 unlockSilentAudio43();
 if(!audio||audio.state==='closed'){
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('This browser cannot start audio.');
  audio=new Audio({latencyHint:'interactive'});buffers=[];snareNoise=null;audioBuild42=null;
  audio.addEventListener('statechange',()=>{if(audio?.state==='running')configureAudioSession()});
 }
 const ctx=audio;
 // Resume synchronously in the tap/key gesture, before decoding can use its activation.
 const resumed=timeout42(ctx.resume(),2500,'Audio did not wake up. Tap Start to retry.');
 if(!audioBuild42){
  audioBuild42=Promise.all(assets.map((asset,index)=>timeout42(ctx.decodeAudioData(Uint8Array.from(atob(asset),c=>c.charCodeAt(0)).buffer),3500,'Sample unavailable').then(trimLead).catch(()=>fallbackSample42(ctx,index))))
   .then(decoded=>{if(audio===ctx)buffers=decoded});
  audioReady=audioBuild42;
 }
 await Promise.all([resumed,audioBuild42]);
 configureAudioSession();
 if(ctx!==audio||ctx.state!=='running')throw Error('Audio is paused by your browser. Tap Start to retry.');
 if(!snareNoise){snareNoise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.18),ctx.sampleRate);const d=snareNoise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)}
};
function audioError42(error){
 stop(false);$('countInPanel').hidden=true;$('play').disabled=false;$('listen').disabled=false;
 $('status').textContent='Ready to retry';$('feedback').textContent=error?.message||'Audio interrupted. Tap Start to restart.';
}
start=async function(which,continuation=false){
 if(starting||transitioning||cloudLoading42)return;
 if(cfg.playMode==='endless'&&!continuation&&generatedRound!==1){endlessRound=1;generate({randomize:true})}
 if(!continuation)stop();
 const ticket=++session;starting=true;$('play').textContent='Starting…';$('stop').textContent='■ Stop';$('stop').disabled=false;$('status').textContent='Starting audio…';window.showLoadingCount50?.();
 if(!continuation){endlessRound=1;beginResultsSession()}
 try{
  await timeout42(initAudio(),6000,'Audio took too long. Tap Start to retry.');if(ticket!==session)return;
  if(cfg.playMode==='echo'&&which==='practice'){
   if(echoAnswerPending){echoAnswerPending=false;echoDemoActive=false;mode='practice'}else{echoDemoActive=true;mode='listen'}
  }else{echoDemoActive=false;mode=which}
  resetStats();runSerial++;
  const first=barRanges[0],m=meterInfo(first?.meter||cfg.meter),spq=60/(first?.bpm||cfg.bpm)/m.unit;
  const countBars=continuation?Math.max(1,Math.round(clamp(cfg.count,0,2))):Math.round(clamp(cfg.count,0,2)),countQ=countBars*m.length;
  startTime=audio.currentTime+.18+countQ*spq;prepareAttacks();queue=[];
  for(let b=0;b<countBars;b++)for(let beat=0;beat<m.n;beat++)queue.push({time:startTime+(-countQ+b*m.length+beat*4/m.d)*spq,type:'met',accent:beat===0,count:true});
  if(impOn()){
   for(const pass of impTL){if(pass.type==='hold')continue;const br=barRanges[pass.b],bm=meterInfo(br.meter);for(let t=pass.t0;t<pass.t1-1e-6;t+=bm.unit*Q)queue.push({time:startTime+pass.time0+(t-pass.t0)*pass.spt,type:'met',accent:Math.abs(t-br.start)<1e-6,count:false})}
  }else for(let t=0;t<totalTicks/Q-1e-6;t+=m.unit)queue.push({time:startTime+t*spq,type:'met',accent:Math.abs(t%m.length)<1e-6,count:false});
  for(const a of attacks)queue.push({time:a.time,type:'note',duration:a.pass?a.n.dur*a.pass.spt:a.n.dur/Q*spq,lane:a.n.lane,a});
  queue.sort((a,b)=>a.time-b.time);qi=0;setupCountIn(m,countQ);starting=false;running=true;lastBeat='';
  document.body.dataset.makerPlaying=String(cfg.playMode==='maker');if(cfg.playMode==='maker')editorDecorateScore();
  $('play').disabled=false;$('listen').disabled=false;$('play').textContent='↻ Restart';$('listen').textContent=mode==='listen'?'Listening…':'Listen';
  $('feedback').textContent=mode==='listen'?'Listen':'Ready';$('echoListenBanner').hidden=true;
  if(!continuation)$('viewport').scrollLeft=0;setTransportPosition(notes[0].x,1);syncPauseControl();
  runClock42={time:audio.currentTime,at:performance.now()};lastPaint42=performance.now();
  clearInterval(interval);interval=setInterval(()=>{try{schedule()}catch(error){audioError42(error)}},25);schedule();animate();
 }catch(error){if(ticket===session)audioError42(error)}
 finally{if(ticket===session)starting=false}
};
const animateBefore42=animate;
animate=function(){lastPaint42=performance.now();try{return animateBefore42()}catch(error){audioError42(error)}};
const stopBefore42=stop;
stop=function(reset=true){const r=stopBefore42(reset);releaseSilentAudio43(reset?0:8000);document.body.dataset.runActive='false';if(cfg.playMode==='maker'&&!appending&&makerBars[makerCursor42.bar]&&notes.some(n=>n.placeholder||n.makerIndex!==undefined))editorDecorateScore();return r};
const pauseBefore42=setRoundPaused;
setRoundPaused=async function(next){
 if(!next&&running&&roundPaused&&!pauseBusy)unlockSilentAudio43();
 try{await timeout42(pauseBefore42(next),6500,'Audio pause timed out. Tap Start to restart.');if(roundPaused&&!pauseBusy)releaseSilentAudio43()}
 catch(error){audioError42(error)}
};
setInterval(()=>{
 document.body.dataset.runActive=String(running||starting||breaking);
 if(!running||roundPaused||pauseBusy||document.hidden||!audio){runClock42.at=performance.now();runClock42.time=audio?.currentTime||0;return}
 const now=performance.now();if(audio.currentTime>runClock42.time+.005)runClock42={time:audio.currentTime,at:now};
 else if(now-runClock42.at>2400){const broken=audio;audioError42(Error('Audio was interrupted. Tap Start to restart.'));broken.close().catch(()=>{});if(audio===broken){audio=null;audioBuild42=null}return}
 if(now-lastPaint42>900)animate();
},400);

// Keep the Endless badge anchored above the next score, with a single clean layout.
placeHandoffBubble=function(){
 const bubble=$('breakCard');if(!bubble||bubble.hidden)return;
 const stage=$('scoreStage').getBoundingClientRect(),target=worldPoint({x:scoreStart+62,y:0}),half=bubble.offsetWidth/2;
 bubble.style.left=clamp(target.x-stage.left,half+10,Math.max(half+10,stage.width-half-10))+'px';
};

// Sequential Maker. The cursor is a gap: insert after it, delete before it.
let makerCursor42={bar:0,index:0},makerMarks42={},makerMarkTarget42=null,makerRestoring42=false;
try{const saved=JSON.parse(localStorage.getItem('pulse-maker-v1')||'{}');if(saved.marks&&typeof saved.marks==='object')makerMarks42=saved.marks}catch(e){}
const makerDefaults42=[4,2,1,.5,.25,.125];
function makerPlan42(bar,marks=makerMarks42){let plan={meter:'4/4',bpm:60};for(let b=0;b<=bar;b++){const v=marks[b];if(v?.meter&&/^(?:[1-9]|[12][0-9]|3[0-2])\/(?:2|4|8|16)$/.test(v.meter))plan.meter=v.meter;if(Number.isFinite(v?.bpm))plan.bpm=Math.round(clamp(v.bpm,30,240))}return plan}
function makerUsed42(bar){return (makerBars[bar]||[]).reduce((n,e)=>n+makerTicks(e),0)}
function makerLimit42(bar,marks=makerMarks42){return Math.round(meterInfo(makerPlan42(bar,marks).meter).length*Q)}
function makerClamp42(){makerCursor42.bar=Math.round(clamp(makerCursor42.bar,0,cfg.bars-1));makerCursor42.index=Math.round(clamp(makerCursor42.index,0,makerBars[makerCursor42.bar]?.length||0));makerBar=makerCursor42.bar}
normalizeMaker=function(){
 makerBars=Array.from({length:cfg.bars},(_,bar)=>{
  const valid=[];let used=0;for(const e of Array.isArray(makerBars[bar])?makerBars[bar]:[]){
   if(!e||!makerValues.some(v=>v.base===e.base&&v.dot===e.dot&&(!e.tuplet||v.count===e.tuplet)))continue;
   const duration=makerTicks(e);if(!Number.isFinite(duration)||duration<=0||used+duration>makerLimit42(bar))break;
   valid.push({...e,rest:!!e.rest,tied:!!e.tied&&!e.rest&&valid.length>0&&!valid.at(-1).rest});used+=duration;
  }return valid;
 });makerClamp42();
};
saveMaker=function(){try{localStorage.setItem('pulse-maker-v1',JSON.stringify({bars:makerBars,marks:makerMarks42,version:2}))}catch(error){editorMessage('Browser storage is full. Export your save to keep this score.')}};
editorSnapshot=function(){return JSON.stringify({bars:makerBars,marks:makerMarks42,cursor:makerCursor42})};
editorRestore=function(snapshot){const d=JSON.parse(snapshot);makerBars=d.bars||d;makerMarks42=d.marks||{};makerCursor42=d.cursor||{bar:0,index:0};saveMaker();generateMaker()};
editorMessage=function(message){$('makerEditorStatus').textContent=message};
function makerBoundary42(){
 makerClamp42();const {bar,index}=makerCursor42;
 if(index===0)return bar;
 if(index===makerBars[bar].length&&makerUsed42(bar)===makerLimit42(bar)&&bar+1<cfg.bars)return bar+1;
 return null;
}
function makerNavigate42(direction){
 if(running||starting)return;makerClamp42();let {bar,index}=makerCursor42;
 if(direction<0){if(index>0)index--;else if(bar>0){bar--;index=makerBars[bar].length}}
 else if(index<makerBars[bar].length)index++;else if(bar+1<cfg.bars){bar++;index=0}
 makerCursor42={bar,index};makerClamp42();editorDecorateScore();makerFollow42();
}
function makerFollow42(){const br=barRanges[makerCursor42.bar];if(!br)return;const n=notes.find(n=>n.bar===makerCursor42.bar&&n.makerIndex===makerCursor42.index);const x=n?.x??br.first+makerUsed42(makerCursor42.bar)/Q*br.spacing;$('viewport').scrollLeft=Math.max(0,x-$('viewport').clientWidth*.5)}
function makerInsert42(value){
 if(running||starting)return;makerClamp42();let {bar,index}=makerCursor42;
 if(makerUsed42(bar)===makerLimit42(bar)&&index===makerBars[bar].length&&bar+1<cfg.bars){bar++;index=0;makerCursor42={bar,index}}
 const needed=value.count?Math.round(value.span*Q):makerTicks(value);
 if(makerUsed42(bar)+needed>makerLimit42(bar)){editorMessage('That value does not fit. Choose a shorter note or move to the next bar.');return}
 editorRemember();const id=crypto.randomUUID?.()||String(Date.now()+Math.random()),entries=Array.from({length:value.count||1},()=>({base:value.base,dot:value.dot,rest:makerRest,tied:false,...(value.count?{tuplet:value.count,span:value.span,groupId:id}:{})}));
 // Insert only between complete tuplet groups, never split a written tuplet.
 const list=makerBars[bar];if(list[index]?.tuplet&&index>0&&list[index-1]?.groupId===list[index].groupId){while(index<list.length&&list[index]?.groupId===list[index-1]?.groupId)index++}
 list.splice(index,0,...entries);makerCursor42={bar,index:index+entries.length};saveMaker();generateMaker();makerFollow42();editorMessage((makerRest?'Rest':'Note')+' added.');
}
function makerDelete42(){
 if(running||starting)return;makerClamp42();let {bar,index}=makerCursor42;
 if(index===0){if(bar===0)return;bar--;index=makerBars[bar].length;if(!index){makerCursor42={bar,index};editorDecorateScore();return}}
 const list=makerBars[bar],entry=list[index-1];if(!entry)return;
 editorRemember();list[index-1]={...entry,rest:true,tied:false};if(list[index])list[index].tied=false;
 makerCursor42={bar,index:index-1};saveMaker();generateMaker();makerFollow42();editorMessage('Replaced with a rest of the same value.');
}
generateMaker=function(){
 stop();scoreOffset=0;historyMarkup='';historyChunks=[];normalizeMaker();notes=[];groups=[];barRanges=[];totalTicks=0;
 const first=makerPlan42(0);cfg.meter=first.meter;cfg.bpm=first.bpm;cfg.manualBpm=first.bpm;
 for(let b=0;b<cfg.bars;b++){
  const plan=makerPlan42(b),m=meterInfo(plan.meter),barTicks=Math.round(m.length*Q),start=totalTicks,entries=makerBars[b].map((e,index)=>({...e,makerIndex:index}));let remaining=barTicks-makerUsed42(b);
  for(const base of makerDefaults42)while(remaining>=Math.round(base*Q)){entries.push({base,dot:0,rest:true,tied:false,placeholder:true});remaining-=Math.round(base*Q)}
  // A very short residual rest is possible after a partial imported tuplet.
  if(remaining>0)entries.push({base:.125,dot:0,rest:true,tied:false,placeholder:true,duration:remaining});
  let local=0,lastToken='',group=null;
  for(const e of entries){const dur=e.duration||makerTicks(e),token=e.tuplet?'t'+e.groupId:'b'+Math.floor(local/(m.unit*Q));
   if(!group||token!==lastToken){group={notes:[],tuplet:e.tuplet||0,bar:b,start:start+local,span:0};groups.push(group);lastToken=token}
   const n={...e,id:notes.length,t:start+local,dur,bar:b,group:groups.length-1,state:'pending',gold:false,silver:false,goldClaimed:false};notes.push(n);group.notes.push(n);group.span+=dur;local+=dur;
  }
  totalTicks+=barTicks;barRanges.push({start,end:totalTicks,...plan});
 }
 impBuild();render();resetStats();sync();save();saveMaker();editorDecorateScore();
};
editorDrawToolbar=function(){
 if(!$('maker42Values'))return;makerClamp42();const {bar,index}=makerCursor42,used=makerUsed42(bar),limit=makerLimit42(bar),boundary=makerBoundary42();
 $('maker42Cursor').textContent='Bar '+(bar+1)+' · '+(index?'after '+index+' / '+makerBars[bar].length:'start');
 $('maker42Rest').setAttribute('aria-pressed',String(makerRest));$('maker42Rest').textContent=makerRest?'Rest entry':'Note entry';
 $('maker42Prev').disabled=bar===0&&index===0;$('maker42Next').disabled=bar===cfg.bars-1&&index===makerBars[bar].length;
 $('maker42Delete').disabled=bar===0&&index===0;$('maker42Undo').disabled=!editorHistory.length;$('maker42Redo').disabled=!editorFuture.length;
 for(const id of ['maker42Tempo','maker42Meter']){$(id).disabled=boundary===null;$(id).title=boundary===null?'Move to a barline to add a marking':'Add at bar '+(boundary+1)}
 for(const button of $('maker42Values').children){const value=makerValues[Number(button.dataset.value)],needed=value.count?value.span*Q:makerTicks(value);button.disabled=needed>limit-used&&!(used===limit&&index===makerBars[bar].length&&bar+1<cfg.bars&&needed<=makerLimit42(bar+1)-makerUsed42(bar+1));button.setAttribute('aria-label','Add '+(makerRest?'rest: ':'note: ')+value.label)}
};
editorDecorateScore=function(){
 if(cfg.playMode!=='maker'||!notes.length||!$('maker42Values'))return;
 const svg=$('score');svg.querySelectorAll('.maker-score-grid,[data-maker-edit]').forEach(el=>el.remove());
 const overlay=svgEl('g',{class:'maker-score-grid','aria-hidden':'true','pointer-events':'none'});
 for(const n of notes)if(n.placeholder)$('n'+n.id)?.setAttribute('opacity',running?'1':'0');
 if(!running){
  makerClamp42();const {bar,index}=makerCursor42,br=barRanges[bar],ns=notes.filter(n=>n.bar===bar),selected=ns.find(n=>n.makerIndex===index-1);
  if(selected)overlay.append(svgEl('rect',{x:selected.x-15,y:105,width:Math.max(30,selected.w-4),height:83,rx:9,fill:'#a4e6bd13',stroke:'#a4e6bd66'}));
  const elapsed=makerBars[bar].slice(0,index).reduce((t,e)=>t+makerTicks(e),0),x=br.first+elapsed/Q*br.spacing;

  for(let b=0;b<cfg.bars;b++){const r=barRanges[b],m=meterInfo(r.meter);for(let beat=0;beat<m.beats;beat++)line(overlay,r.first+beat*m.unit*r.spacing,151,r.first+beat*m.unit*r.spacing,166,1,'#a4e6bd22')}
 }
 svg.prepend(overlay);
 if(!running){
  const hit=(bar,kind,x,y,w,h)=>{const rect=svgEl('rect',{x,y,width:w,height:h,rx:6,fill:'transparent',stroke:'transparent','data-maker-edit':kind,'data-maker-bar':bar,tabindex:0,role:'button','aria-label':'Edit '+kind+' at bar '+(bar+1)});svg.append(rect);rect.addEventListener('click',e=>{e.stopPropagation();makerOpenMark42(kind,bar)});rect.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();makerOpenMark42(kind,bar)}})};
  hit(0,'tempo',35,72,95,40);hit(0,'meter',75,124,43,69);
  for(let b=1;b<barRanges.length;b++){const r=barRanges[b];if(r.sig)hit(b,'meter',r.left+10,124,45,69);if(r.tempoChange)hit(b,'tempo',r.left+7,17,110,40)}
 }
 editorDrawToolbar();
};
function makerOpenMark42(kind,bar=makerBoundary42()){
 if(bar===null||running||starting)return;makerMarkTarget42={kind,bar};const plan=makerPlan42(bar),[n,d]=plan.meter.split('/');
 $('maker42MarkTitle').textContent=(kind==='tempo'?'Tempo':'Time signature')+' · bar '+(bar+1);$('maker42TempoField').hidden=kind!=='tempo';$('maker42MeterField').hidden=kind!=='meter';
 $('maker42Bpm').value=plan.bpm;$('maker42Numerator').value=n;$('maker42Denominator').value=d;$('maker42MarkError').textContent='';$('maker42MarkDialog').showModal();
}
function makerSaveMark42(event){
 event.preventDefault();if(!makerMarkTarget42)return;const {kind,bar}=makerMarkTarget42,marks=JSON.parse(JSON.stringify(makerMarks42));marks[bar]??={};
 if(kind==='tempo'){const bpm=Number($('maker42Bpm').value);if(!Number.isInteger(bpm)||bpm<30||bpm>240){$('maker42MarkError').textContent='Enter a tempo from 30 to 240.';return}marks[bar].bpm=bpm}
 else{const n=Number($('maker42Numerator').value),d=Number($('maker42Denominator').value);if(!Number.isInteger(n)||n<1||n>32||![2,4,8,16].includes(d)){ $('maker42MarkError').textContent='Choose a valid time signature.';return}marks[bar].meter=n+'/'+d;
  for(let b=bar;b<cfg.bars;b++)if(makerUsed42(b)>makerLimit42(b,marks)){$('maker42MarkError').textContent='Bar '+(b+1)+' has too many notes for that meter. Delete some first.';return}
 }
 editorRemember();makerMarks42=marks;saveMaker();$('maker42MarkDialog').close();generateMaker();makerFollow42();editorMessage('Marking saved at bar '+(bar+1)+'.');
}
openMaker=function(){if(cfg.playMode==='maker')$('makerWorkbench').scrollIntoView({behavior:'smooth',block:'nearest'})};
const syncModeBefore42=syncMode;
syncMode=function(){syncModeBefore42();if(cfg.playMode==='maker'){$('description').textContent='';$('generate').textContent='＋ New score';$('meter').disabled=false;editorDrawToolbar()}if(cloudLoading42){$('play').disabled=true;$('listen').disabled=true}};
const syncBefore42=sync;
sync=function(){syncBefore42();if(cfg.playMode==='maker'){$('description').textContent='';const m=meterInfo();$('tempoLabel').textContent=(m.d===2?'Half':m.compound?'Dotted quarter':m.d===16?'Sixteenth':m.d===8?'Eighth':'Quarter')+' = '+cfg.bpm+' BPM'}};

// Account-bound restoration. Cloud revisions prevent stale-device overwrites.
const ownerKey42='rhythms-save-owner-v1',pendingLogin42='rhythms-signin42';
const defaultConfig42={modded:true,level:3,bpm:90,bars:8,meter:'4/4',count:1,rests:true,broken:false,ties:false,guide:true,showPlayhead:true,metro:true,loop:false,randomMeter:true,randomTempo:true,playMode:'standard',standardBars:8,showCounts:false,volume:70,noteVol:40,hitVol:80,offset:0};
function localBackup42(owner){const data={};for(const key of SAVE_KEYS){const raw=localStorage.getItem(key);if(raw!==null)data[key]=raw}try{localStorage.setItem('rhythms-backup42-'+(owner||'guest'),JSON.stringify({format:'beatbounce-save',version:1,data}))}catch(e){}return {format:'beatbounce-save',version:1,data}}
function validateSave42(payload){
 if(payload?.format!=='beatbounce-save'||payload.version!==1||!payload.data||typeof payload.data!=='object')throw Error('That is not a Rhythms save.');
 for(const key of SAVE_KEYS){const v=payload.data[key];if(v==null)continue;if(typeof v!=='string'||v.length>500000)throw Error('Invalid save data.');if(key!=='beatbounce-alias')JSON.parse(v)}return payload;
}
function hydrateSave42(payload,replace=true){
 validateSave42(payload);stop();for(const key of SAVE_KEYS){const value=payload.data[key];if(value!=null)localStorage.setItem(key,value);else if(replace)localStorage.removeItem(key)}
 const saved=JSON.parse(localStorage.getItem('pulse-rhythm-v1')||'{}');cfg={...defaultConfig42,...saved};cfg.level=Math.round(clamp(cfg.level,0,12));cfg.bpm=clamp(cfg.bpm,20,240);cfg.count=Math.round(clamp(cfg.count,0,2));cfg.standardBars=Math.round(clamp(cfg.standardBars||cfg.bars||8,1,32));cfg.bars=cfg.playMode==='endless'?8:cfg.playMode==='impossible'?cfg.standardBars+2:Math.round(clamp(cfg.bars||8,1,32));
 if(!['standard','endless','impossible','maker','echo','polyrhythms'].includes(cfg.playMode))cfg.playMode='standard';if(!meters.includes(cfg.meter))cfg.meter='4/4';cfg.manualBpm=clamp(cfg.manualBpm||cfg.bpm,20,240);cfg.polyA=Math.round(clamp(cfg.polyA||3,2,16));cfg.polyB=Math.round(clamp(cfg.polyB||2,2,16));cfg.polyKey0=cfg.polyKey0||'d';cfg.polyKey1=cfg.polyKey1||'k';isCustom=!!saved.custom;
 cfg.enabled=Array.isArray(saved.enabled)?saved.enabled.filter(id=>patterns.some(p=>p.id===id)):[];if(!cfg.enabled.length)cfg.enabled=patterns.filter(p=>!p.manual&&p.level<=cfg.level).map(p=>p.id);
 const stored=JSON.parse(localStorage.getItem('pulse-modded-v1')||'{}');economy={gold:Math.max(0,Math.floor(Number(stored.gold)||0)),owned:['classic','clean','stageNone','buddyNone','headNone'],theme:'classic',effect:'clean',stage:'stageNone',buddy:'buddyNone',head:'headNone',pets:stored.pets||{}};
 for(const id of Array.isArray(stored.owned)?stored.owned:[])if(catalog.some(c=>c.id===id)&&!economy.owned.includes(id))economy.owned.push(id);
 for(const category of ['theme','effect','stage','buddy','head'])if(economy.owned.includes(stored[category]))economy[category]=stored[category];
 const maker=JSON.parse(localStorage.getItem('pulse-maker-v1')||'{}');makerBars=Array.isArray(maker.bars)?maker.bars:[];makerMarks42=maker.marks||{};makerCursor42={bar:0,index:0};editorHistory.length=editorFuture.length=0;
 const scores=JSON.parse(localStorage.getItem('beatbounce-scores')||'[]');localScores=Array.isArray(scores)?scores:[];endlessRound=1;generate();renderAvatar33();
}
applySave=function(payload){localBackup42(localStorage.getItem(ownerKey42));hydrateSave42(payload);$('saveStatus').textContent='Save loaded.'};
const snapshotBefore42=snapshotSave;
snapshotSave=function(){const payload=snapshotBefore42();const pending=fxItems.filter(p=>p.type==='coin'&&!p.arrived&&!p.txn?.cancelled).length;if(pending){const value=JSON.parse(payload.data['pulse-modded-v1']);value.gold+=pending;payload.data['pulse-modded-v1']=JSON.stringify(value)}return payload};
async function cloudFetch42(path,options){const r=await timeout42(fetch(path,options),9000,'Cloud request timed out. Try again.');const d=await r.json();if(!r.ok)throw Object.assign(Error(d.error||'Cloud request failed.'),{status:r.status});return d}
initCloud=async function(){
 if(cloudLoading42)return;cloudLoading42=true;cloudReady42=false;$('play').disabled=$('listen').disabled=true;$('saveCloud').disabled=$('loadCloud').disabled=true;$('accountStatus').textContent='Loading account…';
 try{
  const me=await cloudFetch42('/api/me');cloudEnabled=true;cloudUser=me.user;document.body.dataset.offline='false';$('offlineAccountNotice').hidden=$('offlineBoardNotice').hidden=true;$('onlineLink').hidden=true;$('signInLink').hidden=!!cloudUser;$('signOutLink').hidden=!cloudUser;
  if(!cloudUser){if(localStorage.getItem(ownerKey42)&&localStorage.getItem(ownerKey42)!=='guest'){localBackup42(localStorage.getItem(ownerKey42));window.rhythmsAfterSignOut42();const guest=localStorage.getItem('rhythms-backup42-guest');hydrateSave42(guest?JSON.parse(guest):{format:'beatbounce-save',version:1,data:{}})}localStorage.removeItem(BIO_KEY);$('playerBio').value='';window.rhythmsGoogleAvatar='';$('accountStatus').textContent='Sign in to sync your progress.';renderAvatar33();return}
  const owner=cloudUser.id,oldOwner=localStorage.getItem(ownerKey42)||'guest',switching=oldOwner!==owner,login=localStorage.getItem(pendingLogin42)===owner;
  if(switching){localBackup42(oldOwner);if(oldOwner!=='guest'){const backup=localStorage.getItem('rhythms-backup42-'+owner);hydrateSave42(backup?JSON.parse(backup):{format:'beatbounce-save',version:1,data:{}})}}
  localStorage.setItem(ownerKey42,owner);$('accountStatus').textContent='Loading latest save…';
  const [state,profile]=await Promise.all([cloudFetch42('/api/save'),cloudFetch42('/api/profile/me')]);
  const known=localStorage.getItem('rhythms-revision42-'+owner);
  if(state.save&&(switching||login||known!==state.etag)){localBackup42(owner);hydrateSave42(state.save);$('saveStatus').textContent='Latest cloud save loaded.'}
  cloudVersion=state.etag||null;if(cloudVersion)localStorage.setItem('rhythms-revision42-'+owner,cloudVersion);localStorage.removeItem(pendingLogin42);
  const alias=profile.alias||cloudUser.alias||'Player';localStorage.setItem('beatbounce-alias',alias);$('playerAlias').value=alias;cloudUser.alias=alias;
  const bio=typeof profile.bio==='string'?profile.bio.slice(0,180):'';localStorage.setItem(BIO_KEY,bio);$('playerBio').value=bio;
  if(profile.avatar)localStorage.setItem('rhythms-avatar-v1',JSON.stringify({image:profile.avatar}));else localStorage.removeItem('rhythms-avatar-v1');
  window.rhythmsGoogleAvatar=cloudUser.picture||'';cloudReady42=true;cloudAuto=true;$('saveCloud').disabled=false;$('loadCloud').disabled=!state.save;$('saveProfile').disabled=false;$('accountStatus').textContent=state.save?'Signed in · cloud save ready':'Signed in · progress saves after runs';syncBioCount36();renderAvatar33();syncOwner35();
 }catch(error){cloudAuto=false;$('accountStatus').textContent='Cloud could not load. Local progress is available.';$('saveStatus').textContent=error.message;$('loadCloud').disabled=!cloudUser;$('saveProfile').disabled=!!cloudUser}
 finally{cloudLoading42=false;$('play').disabled=$('listen').disabled=false;syncBioCount36();refreshLeaderboard()}
};
saveCloud=async function(auto=false){
 if(!cloudUser||!cloudReady42){if(!auto)$('saveStatus').textContent='Load your account save before saving to cloud.';return}
 if(cloudBusy){cloudRetry42=true;return}cloudBusy=true;
 try{const result=await cloudFetch42('/api/save',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({save:snapshotSave(),etag:cloudVersion})});cloudVersion=result.etag;localStorage.setItem('rhythms-revision42-'+cloudUser.id,cloudVersion);cloudAuto=true;$('loadCloud').disabled=false;$('saveStatus').textContent='Cloud saved.'}
 catch(error){cloudAuto=false;if(error.status===409)cloudReady42=false;$('saveStatus').textContent=error.message}
 finally{cloudBusy=false;if(cloudRetry42){cloudRetry42=false;queueCloudSave42()}}
};
function queueCloudSave42(){clearTimeout(cloudSaveTimer42);cloudSaveTimer42=setTimeout(()=>saveCloud(true),1600)}
const recordBefore42=recordRunResult;recordRunResult=function(reward,completed){recordBefore42(reward,completed);if(mode==='practice'&&(completed||cfg.playMode==='endless'))queueCloudSave42()};
window.rhythmsBeforeSignIn42=()=>localBackup42(localStorage.getItem(ownerKey42));
window.rhythmsBeforeSignOut42=async()=>{localBackup42(localStorage.getItem(ownerKey42));await saveCloud(true)};
window.rhythmsAfterSignOut42=()=>{const guest=localStorage.getItem('rhythms-backup42-guest');for(const key of SAVE_KEYS)localStorage.removeItem(key);if(guest){const data=JSON.parse(guest).data;for(const key of SAVE_KEYS)if(data[key]!=null)localStorage.setItem(key,data[key])}localStorage.removeItem(BIO_KEY);localStorage.setItem(ownerKey42,'guest')};

function installUpdate42(){
 const work=$('makerWorkbench');work.innerHTML='<div class="maker42-head"><strong>Rhythm Maker</strong><span>Choose a value to insert it</span></div><div class="maker42-row"><button id="maker42Prev" aria-label="Previous note or rest">←</button><span id="maker42Cursor" aria-live="polite"></span><button id="maker42Next" aria-label="Next note or rest">→</button><button id="maker42Delete">⌫ Delete</button></div><div class="maker42-row"><button id="maker42Rest" aria-pressed="false">Note entry</button><button id="maker42Undo">Undo</button><button id="maker42Redo">Redo</button><div id="maker42Marks"><button id="maker42Tempo">＋ Tempo</button><button id="maker42Meter">＋ Time signature</button></div></div><div id="maker42Values"></div><span id="makerEditorStatus" role="status">Use arrows to move. Delete replaces the previous note with a rest.</span>';
 if(!makerValues.some(v=>v.base===.25&&v.dot))makerValues.splice(7,0,{base:.25,dot:1,label:'Dotted 16th',symbol:'♬·'});
 if(!makerValues.some(v=>v.base===.125&&v.dot))makerValues.splice(10,0,{base:.125,dot:1,label:'Dotted 32nd',symbol:'♬·'});
 for(const [index,value] of makerValues.entries()){const button=document.createElement('button');button.type='button';button.dataset.value=index;button.title='Add '+value.label;const icon=svgEl('svg',{viewBox:'-20 -58 45 69','aria-hidden':'true'});glyph(icon,{base:value.base,dot:value.dot,rest:false},0,0,.95);if(value.count)text(icon,14,-37,value.count,13,'#b9e6c9');const label=document.createElement('small');label.textContent=value.label;button.append(icon,label);button.onclick=()=>makerInsert42(value);$('maker42Values').append(button)}
 $('maker42Prev').onclick=()=>makerNavigate42(-1);$('maker42Next').onclick=()=>makerNavigate42(1);$('maker42Delete').onclick=makerDelete42;
 $('maker42Rest').onclick=()=>{makerRest=!makerRest;for(const [i,button] of [...$('maker42Values').children].entries()){const icon=button.querySelector('svg');icon.replaceChildren();const value=makerValues[i];glyph(icon,{base:value.base,dot:value.dot,rest:makerRest},0,0,.95);if(value.count)text(icon,14,-37,value.count,13,'#b9e6c9')}editorDrawToolbar()};
 $('maker42Undo').onclick=()=>{if(editorHistory.length){editorFuture.push(editorSnapshot());editorRestore(editorHistory.pop())}};$('maker42Redo').onclick=()=>{if(editorFuture.length){editorHistory.push(editorSnapshot());editorRestore(editorFuture.pop())}};
 $('maker42Tempo').onclick=()=>makerOpenMark42('tempo');$('maker42Meter').onclick=()=>makerOpenMark42('meter');
 const dialog=document.createElement('dialog');dialog.id='maker42MarkDialog';dialog.innerHTML='<form id="maker42MarkForm"><div class="modal-head"><h2 id="maker42MarkTitle">Marking</h2><button type="button" id="maker42MarkClose" aria-label="Close marking editor">✕</button></div><div class="modal-body"><label id="maker42TempoField">Beats per minute<input id="maker42Bpm" type="number" min="30" max="240" required></label><div id="maker42MeterField"><label>Time signature</label><div class="maker42-meter-inputs"><input id="maker42Numerator" type="number" min="1" max="32" aria-label="Beats per bar"><span>/</span><select id="maker42Denominator" aria-label="Beat denominator"><option>2</option><option>4</option><option>8</option><option>16</option></select></div></div><p id="maker42MarkError" role="alert"></p><button class="primary" type="submit">Save marking</button></div></form>';document.body.append(dialog);$('maker42MarkClose').onclick=()=>dialog.close();$('maker42MarkForm').onsubmit=makerSaveMark42;
 $('score').removeEventListener('click',editorScoreClick);$('score').addEventListener('click',event=>{if(cfg.playMode!=='maker'||running||starting||event.target.closest('[data-maker-edit]'))return;const r=$('score').getBoundingClientRect(),x=(event.clientX-r.left)*width/r.width,bar=barRanges.findIndex(b=>x>=b.left-20&&x<=b.right);if(bar<0)return;const authored=notes.filter(n=>n.bar===bar&&!n.placeholder),near=authored.reduce((a,n)=>!a||Math.abs(n.x-x)<Math.abs(a.x-x)?n:a,null);makerCursor42={bar,index:near&&Math.abs(near.x-x)<40?near.makerIndex+1:makerBars[bar].length};editorDecorateScore()});
 // Remove the old score-click editor's keyboard action, which refers to old toolbar nodes.
 editorErase=makerDelete42;
 document.addEventListener('keydown',event=>{if(cfg.playMode!=='maker'||running||starting||event.target.closest('input,textarea,select,[contenteditable]')||document.querySelector('dialog[open]'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();event.stopImmediatePropagation();makerNavigate42(event.key==='ArrowLeft'?-1:1)}else if((event.ctrlKey||event.metaKey)&&['z','y'].includes(event.key.toLowerCase())){event.preventDefault();event.stopImmediatePropagation();$(event.key.toLowerCase()==='z'?'maker42Undo':'maker42Redo').click()}else if(event.key==='Backspace'||event.key==='Delete'){event.preventDefault();event.stopImmediatePropagation();makerDelete42()}},true);
 const generateClick=$('generate').onclick;$('generate').onclick=()=>{if(cfg.playMode!=='maker')return generateClick();editorRemember();makerBars=Array.from({length:cfg.bars},()=>[]);makerMarks42={};makerCursor42={bar:0,index:0};saveMaker();generateMaker();editorMessage('New empty score.')};
 const oldMeter=$('meter').onclick;$('meter').onclick=()=>cfg.playMode==='maker'?makerOpenMark42('meter',0):oldMeter();const oldTempo=$('tempoOut').onclick;$('tempoOut').onclick=()=>{if(cfg.playMode==='maker')makerOpenMark42('tempo',0);else oldTempo?.()};
 const barsChanged=$('bars').onchange;$('bars').onchange=e=>{barsChanged(e);if(cfg.playMode==='maker')generateMaker()};
 // Existing customization tempo/signature controls edit the opening Maker marking.
 for(const id of ['tempo','tempo2','bpm']){const fn=$(id).oninput;$(id).oninput=e=>{fn(e);if(cfg.playMode==='maker'){makerMarks42[0]={...makerMarks42[0],bpm:cfg.bpm};saveMaker();generateMaker()}}}
 for(const button of document.querySelectorAll('#signatures button')){const fn=button.onclick;button.onclick=e=>{if(cfg.playMode!=='maker')return fn(e);makerOpenMark42('meter',0);$('maker42Numerator').value=button.textContent.split('/')[0];$('maker42Denominator').value=button.textContent.split('/')[1]}}
 $('pauseRound').onclick=()=>breaking?($('flagPause').click(),syncEndlessHandoffControls()):setRoundPaused(!roundPaused);
 const load=$('loadCloud');load.onclick=()=>profileRun34('loadCloud',async()=>{if(!cloudUser)throw Error('Sign in first.');const state=await cloudFetch42('/api/save');if(!state.save)throw Error('No cloud save yet.');localBackup42(cloudUser.id);hydrateSave42(state.save);cloudVersion=state.etag;cloudReady42=true;localStorage.setItem('rhythms-revision42-'+cloudUser.id,state.etag);$('playerAlias').value=cloudUser.alias||'Player';localStorage.setItem('beatbounce-alias',cloudUser.alias||'Player');renderAvatar33();$('saveCloud').disabled=false;},'Cloud save loaded.');
 document.querySelector('.version-chip').textContent='v43';$('updatesDialog').querySelector('h2').textContent='Rhythms · Update 43';const audioLog=document.createElement('li');audioLog.textContent='Update 43: Silent Mode audio support for iPhone and iPad, with an older-iOS fallback. Start and Resume unlock sound without changing note timing. The fallback stops when paused, stopped, or leaving the page.';$('updatesDialog').querySelector('ul').prepend(audioLog);const log=document.createElement('li');log.textContent='Update 42: Cleaner Endless round badge; quieter mobile taps and steady button spacing; account-bound cloud saves load automatically on sign-in with a local backup; count-in startup has timeouts, fallback sounds, cancellation, and an audio-clock watchdog; Rhythm Maker uses note/rest insertion buttons, left/right navigation, delete, undo/redo, and tappable tempo/meter markings with changes restricted to barlines.';audioLog.after(log);
 editorDrawToolbar();
}
