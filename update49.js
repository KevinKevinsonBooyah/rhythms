/* Update 49: bounded reward effects, character dialogue, and faithful settings. */
let walletDirty49=false,walletSaveTimer49=0,lastWalletPop49=0,lastCoinSound49=0;
const COIN_LIMIT49=48,COINS_PER_REWARD49=18;
function coinValue49(p){return Math.max(1,Math.floor(p.value||1))}
function paintWallet49(animate=false){
 if(!walletDirty49)return;walletDirty49=false;const value=economy.gold.toLocaleString();$('wallet').textContent=value;$('shopGold').textContent=value;
 const now=performance.now();if(animate&&now-lastWalletPop49>140){lastWalletPop49=now;walletPop()}
}
function persistWallet49(){clearTimeout(walletSaveTimer49);walletSaveTimer49=0;saveEconomy()}
function dirtyWallet49(){walletDirty49=true;if(!walletSaveTimer49)walletSaveTimer49=setTimeout(persistWallet49,250)}
function creditReward49(txn,amount){
 if(!txn||txn.cancelled)return 0;const count=Math.max(0,Math.min(Math.floor(amount),txn.amount-txn.arrived));if(!count)return 0;
 txn.arrived+=count;economy.gold+=count;dirtyWallet49();return count;
}
creditHiddenCoins44=function(txn,amount){creditReward49(txn,amount);paintWallet49()};
arriveCoin=function(p){
 if(p.arrived||!p.txn||p.txn.cancelled)return;p.arrived=true;
 if(!creditReward49(p.txn,coinValue49(p)))return;
 const now=performance.now();if(!document.hidden&&now-lastCoinSound49>90){lastCoinSound49=now;sfx(Math.random()<.5?3:4,.18)}
};
launchCoins=function(point,amount,txn){
 if(!txn||txn.cancelled)return;amount=Math.min(Math.max(0,Math.floor(amount)),txn.amount-txn.arrived);if(!amount)return;
 if(cfg.coinVisuals===false||!fxContext||document.hidden){creditHiddenCoins44(txn,amount);return}
 const free=COIN_LIMIT49-fxItems.filter(p=>p.type==='coin'&&!p.arrived&&!p.txn?.cancelled).length;
 if(free<=0){creditHiddenCoins44(txn,amount);return}
 const count=Math.min(amount,COINS_PER_REWARD49,free),base=Math.floor(amount/count),remainder=amount%count,r=$('wallet').getBoundingClientRect(),tx=r.left+r.width/2,ty=r.top+r.height/2;
 for(let i=0;i<count;i++)addFx({origin:point.anchor,type:'coin',value:base+(i<remainder?1:0),x:point.x,y:point.y,x0:point.x+(Math.random()-.5)*22,y0:point.y+(Math.random()-.5)*16,tx,ty,cx:(point.x+tx)/2+(Math.random()-.5)*140,cy:Math.min(point.y,ty)-55-Math.random()*90,life:.58+Math.random()*.22,delay:i*.022,txn});
};
settleCoinFlights44=function(){
 for(const p of fxItems)if(p.type==='coin')arriveCoin(p);
 fxItems=fxItems.filter(p=>p.type!=='coin');paintWallet49();persistWallet49();clearFxPixels();
};
snapshotSave=function(){
 const payload=snapshotBefore42(),pending=fxItems.reduce((sum,p)=>sum+(p.type==='coin'&&!p.arrived&&!p.txn?.cancelled?coinValue49(p):0),0);
 if(pending){const value=JSON.parse(payload.data['pulse-modded-v1']);value.gold+=pending;payload.data['pulse-modded-v1']=JSON.stringify(value)}return payload;
};
const hydrateBefore49=hydrateSave42;
hydrateSave42=function(payload,replace=true){validateSave42(payload);settleCoinFlights44();return hydrateBefore49(payload,replace)};
const pointBefore49=worldPoint;
worldPoint=function(anchor){const r=window.rhythmsFxFrame49?.score;if(!r)return pointBefore49(anchor);const scale=r.width/width;return{x:r.left+anchor.x*scale,y:r.top+anchor.y*scale}};
const frameBefore49=effectFrame;
effectFrame=function(timestamp){
 window.rhythmsFxFrame49={wallet:$('wallet').getBoundingClientRect(),score:$('score').getBoundingClientRect()};
 try{return frameBefore49(timestamp)}finally{window.rhythmsFxFrame49=null;paintWallet49(true)}
};
window.addEventListener('pagehide',()=>{settleCoinFlights44();persistWallet49()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)settleCoinFlights44()});

// Kevin uses short synthesized syllables, never text-to-speech.
let kevinLetters49=0,kevinTicket49=0,kevinSound49=0,kevinPose49=-1;
function kevinBlip49(){
 if(cfg.kevinVoice===false||cfg.volume<=0||!audio||audio.state!=='running'||performance.now()-kevinSound49<75)return;
 kevinSound49=performance.now();const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(175+Math.random()*75,t);o.frequency.exponentialRampToValueAtTime(130,t+.035);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12*Math.min(1,(cfg.volume??70)/70),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+.045);o.connect(g);g.connect(audio.destination);o.onended=()=>{o.disconnect();g.disconnect()};o.start(t);o.stop(t+.05);
}
kevinTalk=function(force=false){
 if(!$('shopDialog').open)return;clearTimeout(kevinLetters49);const ticket=++kevinTicket49;
 const pool=kevinLines.map((_,i)=>i).filter(i=>i!==kevinLine);kevinLine=choose(pool);const line=kevinLines[kevinLine],speech=$('kevinSpeech');let index=0;speech.textContent='';speech.setAttribute('aria-label',line);speech.setAttribute('aria-live','off');$('kevinGuy').classList.add('talking');
 const step=()=>{if(ticket!==kevinTicket49||!$('shopDialog').open)return;const c=line[index++];speech.textContent=line.slice(0,index);if(/[a-z0-9]/i.test(c))kevinBlip49();if(index<line.length)kevinLetters49=setTimeout(step,/[.!?]/.test(c)?180:/[,;]/.test(c)?100:29);else $('kevinGuy').classList.remove('talking')};step();
};
closeKevin=function(){clearInterval(kevinTimer);kevinTimer=0;clearTimeout(kevinLetters49);kevinLetters49=0;kevinTicket49++;$('kevinGuy').classList.remove('talking');globalThis.speechSynthesis?.cancel()};
function poseKevin49(){
 const poses=[
  'M120 91V152M120 110L88 104L69 68M120 110L152 99L169 61M120 152L94 202M120 152L147 202',
  'M120 91V152M120 110L87 128L69 112M120 110L149 84L145 46M120 152L96 202M120 152L145 202',
  'M120 91V152M120 110L87 125L112 139M120 110L153 124L128 139M120 152L105 202M120 152L147 202',
  'M120 91V152M120 111L89 92L74 58M120 111L155 132L185 132M120 152L99 202M120 152L151 198',
  'M120 91L125 151M121 111L89 116L72 144M121 111L153 95L174 103M125 151L97 198M125 151L154 198',
  'M120 91V152M120 111L91 88L100 58M120 111L150 88L159 55M120 152L87 196M120 152L157 196'
 ];
 kevinPose49=choose(poses.map((_,i)=>i).filter(i=>i!==kevinPose49));const path=$('kevinGuy').querySelector('.kevin-idle>path');path?.setAttribute('d',poses[kevinPose49]);$('kevinGuy').dataset.pose=String(kevinPose49);$('kevinGuy').setAttribute('aria-label','Kevin, posing at his booth');
}

let settingsRestored49=false;
function restoreStartupSettings49(){
 try{const raw=localStorage.getItem('pulse-rhythm-v1');if(!raw)return;const saved=JSON.parse(raw);if(!saved||typeof saved!=='object'||Array.isArray(saved))return;
  cfg={...cfg,...saved};cfg.level=Math.round(clamp(cfg.level,0,13));cfg.bpm=Math.round(clamp(cfg.bpm,20,240));cfg.count=Math.round(clamp(cfg.count,0,2));cfg.standardBars=Math.round(clamp(cfg.standardBars||cfg.bars||8,1,32));cfg.bars=cfg.playMode==='endless'?Math.round(clamp(cfg.endlessBars||8,1,32)):cfg.playMode==='impossible'?cfg.standardBars+2:Math.round(clamp(cfg.bars,1,32));if(!meters.includes(cfg.meter))cfg.meter='4/4';
  cfg.enabled=Array.isArray(saved.enabled)?saved.enabled.filter(id=>patterns.some(p=>p.id===id)):patterns.filter(p=>!p.manual&&p.level<=cfg.level).map(p=>p.id);if(!cfg.enabled.length)cfg.enabled=['quarter'];isCustom=!!saved.custom;settingsRestored49=true;
 }catch(e){}
}

perfectCelebrate=function(){
 if(!cfg.modded||mode!=='practice')return;
 const overlay=$('perfectOverlay');document.body.append(overlay);clearTimeout(perfectTimer);overlay.hidden=true;void overlay.offsetWidth;
 overlay.querySelector('.perfect-detail49').textContent=hitCount+' notes · No misses · No extra taps';overlay.hidden=false;
 const cx=innerWidth/2,cy=innerHeight*.43;
 for(let i=0;i<36;i++){const a=i*Math.PI*2/36,s=80+Math.random()*220;addFx({type:'spark',skin:'starforge',x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-65,life:.7+Math.random()*.7,color:i%3?'#ffe3a2':'#b5ffe6',size:2+Math.random()*2})}
 for(let i=0;i<3;i++)addFx({type:'ring',x:cx,y:cy,life:.8+i*.2,delay:i*.12,color:i%2?'#b5ffe6':'#ffe3a2'});
 perfectTimer=setTimeout(()=>overlay.hidden=true,6500);
};
const resultsBefore49=showRunResults;
showRunResults=function(title){const result=resultsBefore49(title);if(!$('perfectOverlay').hidden&&$('resultsDialog').open)$('resultsDialog').append($('perfectOverlay'));return result};
function installUpdate49(){
 restoreStartupSettings49();
 const board=document.createElement('div');board.id='leaderboardScroll49';board.setAttribute('role','region');board.setAttribute('aria-label','Leaderboard scores');board.tabIndex=0;$('boardRows').before(board);board.append($('boardRows'));
 const shopBefore49=$('shop').onclick;$('shop').onclick=event=>{if(!cfg.modded)return;poseKevin49();const ready=initAudio();ready.catch(()=>{});return shopBefore49(event)};
 $('kevinVoice').textContent=cfg.kevinVoice===false?'Sounds off':'Sounds on';$('kevinVoice').setAttribute('aria-pressed',String(cfg.kevinVoice!==false));$('kevinVoice').onclick=()=>{cfg.kevinVoice=cfg.kevinVoice===false;save();$('kevinVoice').textContent=cfg.kevinVoice?'Sounds on':'Sounds off';$('kevinVoice').setAttribute('aria-pressed',String(cfg.kevinVoice));if(cfg.kevinVoice){initAudio().then(()=>kevinBlip49()).catch(()=>{})}};
 $('shopDialog').addEventListener('close',closeKevin);$('kevinSpeech').setAttribute('aria-live','off');
 const obsolete=kevinLines.indexOf('Swing by anytime. Literally. We have swing now.');if(obsolete>=0)kevinLines[obsolete]='Every meter is a good meter. Some just take longer to count.';
 $('perfectOverlay').innerHTML='<div class="perfect-rays" aria-hidden="true"></div><div class="perfect-content"><div class="perfect-medal49" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="36"/><path d="M24 33l14 12 12-21 12 21 14-12-7 33H31z"/><path d="M33 73h34"/></svg></div><span class="perfect-kicker49">FLAWLESS TIMING</span><strong>PERFECT RUN</strong><b>100%</b><span class="perfect-detail49"></span><small>+500 BONUS GOLD</small><button type="button" class="perfect-dismiss49">Continue</button></div>';
 $('perfectOverlay').querySelector('button').onclick=hidePerfect;
}
