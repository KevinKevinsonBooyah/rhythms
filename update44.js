/* Update 44: optional coin flights, mobile title controls, and a compact Maker. */
function creditHiddenCoins44(txn,amount){
 if(!txn||txn.cancelled)return;
 const count=Math.max(0,Math.min(amount,txn.amount-txn.arrived));if(!count)return;
 txn.arrived+=count;economy.gold+=count;saveEconomy();$('wallet').textContent=economy.gold.toLocaleString();$('shopGold').textContent=economy.gold.toLocaleString();
}
function settleCoinFlights44(){
 const batches=new Map();for(const p of fxItems)if(p.type==='coin'&&!p.arrived){p.arrived=true;if(p.txn&&!p.txn.cancelled)batches.set(p.txn,(batches.get(p.txn)||0)+1)}
 fxItems=fxItems.filter(p=>p.type!=='coin');for(const [txn,count] of batches)creditHiddenCoins44(txn,count);clearFxPixels();
}
const launchBefore44=launchCoins;
launchCoins=function(point,amount,txn){if(cfg.coinVisuals===false){creditHiddenCoins44(txn,amount);return}return launchBefore44(point,amount,txn)};
const addFxBefore44=addFx;
addFx=function(p){if(p.type==='coin'&&cfg.coinVisuals===false){creditHiddenCoins44(p.txn,1);return}return addFxBefore44(p)};

// All randomized tempos share a comfortable pulse range, regardless of the
// printed beat unit. The manual tempo sliders retain their full range.
function tempoPool44(meter,level=generatedLevel){
 const levelNumber=Math.round(clamp(level,0,13));if(levelNumber<9)return tempoSets[tempoKind(meter)];
 const [lo,hi]=({9:[72,108],10:[72,108],11:[72,104],12:[72,104],13:[80,120]})[levelNumber],unit=meterInfo(meter).unit;
 return [...new Set(Array.from({length:Math.floor((hi-lo)/4)+1},(_,i)=>Math.round(clamp((lo+i*4)/unit,30,240))))];
}
const pickTempoBefore44=pickTempo;
pickTempo=function(meter,avoid){const pool=tempoPool44(meter),different=pool.filter(n=>n!==avoid);return choose(different.length?different:pool)};
pickEndlessTempo=function(meter,avoid,round){
 const pool=tempoPool44(meter,endlessDifficulty(round)),center=Math.min(Math.max(0,pool.length-2),2+endlessPressure(round));
 const nearby=pool.slice(Math.max(0,center-1),Math.min(pool.length,center+2)).filter(n=>n!==avoid);return choose(nearby.length?nearby:pool);
};
const boundBefore44=impBoundBpm;
impBoundBpm=function(meter,bpm){const cap=({10:72,11:68,12:64})[cfg.level]||72;return Math.min(boundBefore44(meter,bpm),Math.round(clamp(cap/meterInfo(meter).unit,30,240)))};
let generating44=false,randomTempoRoll44=false;
const fitTempoBefore44=fitTempo;
fitTempo=function(bpm,from,to){const value=fitTempoBefore44(bpm,from,to);if(!generating44||!randomTempoRoll44||generatedLevel<9)return value;return Math.min(value,Math.max(...tempoPool44(to==='s'?'5/16':to==='e'?'7/8':to==='dq'?'6/8':'4/4')))};
const generateBefore44=generate;
generate=function(options={}){const before=generating44,randomBefore=randomTempoRoll44;generating44=true;randomTempoRoll44=!!options.randomize&&cfg.randomTempo!==false;try{return generateBefore44(options)}finally{generating44=before;randomTempoRoll44=randomBefore}};

let mobileControls44=[];
function placeSliders44(){
 if(!$('mobileSliders44'))return;
 const mobile=document.body.dataset.device==='mobile';
 for(const {control,marker} of mobileControls44){if(mobile)$('mobileSliders44').append(control);else marker.after(control)}
 $('mobileSliders44').hidden=!mobile;
}
const chooseDeviceBefore44=chooseDevice;
chooseDevice=function(kind){chooseDeviceBefore44(kind);placeSliders44()};
function syncUpdate44(){
 if($('coinVisuals'))$('coinVisuals').checked=cfg.coinVisuals!==false;
 const maker=cfg.playMode==='maker';
 if(maker&&$('makerEditorStatus')?.textContent==='Choose a value, then tap the score.')$('makerEditorStatus').textContent='Choose a value to insert. Arrows move the cursor.';
 $('makerMarkHint44')?.toggleAttribute('hidden',!maker||running||starting);
 $('makerBeta44')?.remove();
}
const syncBefore44=sync;sync=function(){const result=syncBefore44();syncUpdate44();return result};
const syncModeBefore44=syncMode;syncMode=function(){const result=syncModeBefore44();syncUpdate44();return result};
const drawToolbarBefore44=editorDrawToolbar;
editorDrawToolbar=function(){const result=drawToolbarBefore44();if($('maker42Rest')){$('maker42Rest').textContent=makerRest?'Rests':'Notes';$('maker42Rest').title='Switch between inserting notes and rests'}return result};
const decorateBefore44=editorDecorateScore;
editorDecorateScore=function(){const result=decorateBefore44();syncUpdate44();return result};
function installUpdate44(){
 const playback=$('guide').closest('.section'),setting=document.createElement('div');setting.className='setting';setting.innerHTML='<label for="coinVisuals">Flying coins<small>Off: gold goes straight to your wallet.</small></label><input id="coinVisuals" type="checkbox" checked>';playback.append(setting);
 $('coinVisuals').onchange=e=>{cfg.coinVisuals=e.target.checked;if(!cfg.coinVisuals)settleCoinFlights44();save()};
 const sliders=document.createElement('div');sliders.id='mobileSliders44';sliders.hidden=true;sliders.setAttribute('aria-label','Rhythm settings');document.querySelector('.title-controls').append(sliders);
 for(const id of ['level','strangeIntensity','tempo']){const control=$(id).closest('.control'),marker=document.createComment('Desktop '+id+' control');control.before(marker);mobileControls44.push({control,marker})}placeSliders44();
 const hint=document.createElement('p');hint.id='makerMarkHint44';hint.hidden=true;hint.textContent='Tap the tempo or time signature on the score below to edit.';document.querySelector('.score-head>div').append(hint);
 const head=$('makerWorkbench').querySelector('.maker42-head');head.querySelector('strong').textContent='Compose';head.querySelector('span').innerHTML='<span class="maker44-desktop-help">Choose a value to add it</span><span class="maker44-mobile-help">Swipe for more values →</span>';
 $('maker42Meter').textContent='＋ Meter';$('maker42Meter').setAttribute('aria-label','Add time signature at a barline');
 $('randomTempo').closest('.setting').querySelector('small').textContent='Comfortable tempo rolls, eased further at higher levels.';
 document.querySelector('.version-chip').textContent='v45';$('updatesDialog').querySelector('h2').textContent='Rhythms · Update 45';const log=document.createElement('li');log.textContent='Update 44: Flying coins can be disabled in Playback & practice without losing gold. Mobile tempo and level/intensity sliders sit with the score title controls. High-level random tempos are more relaxed. Rhythm Maker has a compact note palette, highlighted editable opening markings, and a Beta badge.';$('updatesDialog').querySelector('ul').prepend(log);const echoLog=document.createElement('li');echoLog.textContent='Update 45: Echo’s Listen only popup appears when the count-in finishes, at the start of the listening pass.';$('updatesDialog').querySelector('ul').prepend(echoLog);syncUpdate44();editorDrawToolbar();
}
