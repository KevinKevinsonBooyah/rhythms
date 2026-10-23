/* Update 52: roaming companions, Kevin's workshop, and five new cosmetics. */
const petOriginalArt52=petArt;
function petSvg52(id){
 const face='<g class="pet-eyes52" fill="#172e39"><circle cx="41" cy="43" r="3"/><circle cx="59" cy="43" r="3"/></g><path class="face-happy52" d="M44 53q6 6 12 0" fill="none" stroke="#29434c" stroke-width="2.5" stroke-linecap="round"/><path class="face-sad52" d="M44 56q6-5 12 0" fill="none" stroke="#29434c" stroke-width="2.5" stroke-linecap="round"/>';
 const feet='<path class="pet-foot52 foot-left52" d="M34 73v12h-8"/><path class="pet-foot52 foot-right52" d="M65 73v12h8"/>';
 let body='';
 if(id==='mochi')body='<path d="M23 63q-21 7-13-14" fill="none" stroke="#e6c3b5" stroke-width="9" stroke-linecap="round"/><ellipse cx="50" cy="67" rx="25" ry="17" fill="#edd1c0"/><g stroke="#bd968c" stroke-width="2"><path d="M25 39V15l20 14m10 0 20-14v25" fill="#edd1c0"/><path d="m30 29 2-8 8 10m20 0 8-10 2 8" fill="#e7a7aa"/><rect x="24" y="28" width="52" height="36" rx="17" fill="#f6ddcc"/></g>'+face+'<path d="m47 48 3 3 3-3" fill="#c98389"/><path d="M30 53h-11m51 0h11" stroke="#c39e94" stroke-width="1.5"/><g stroke="#d0aa9a" stroke-width="7" stroke-linecap="round">'+feet+'</g>';
 else if(id==='pocketDragon')body='<path d="M68 70q28 5 22-18l-10 8" fill="#8fc8b4" stroke="#4d8d80" stroke-width="2"/><path class="dragon-wing52" d="M29 48 9 28v33l20-2m42-11 20-20v33l-20-2" fill="#899bce" stroke="#6076a6" stroke-width="2"/><ellipse cx="50" cy="65" rx="23" ry="20" fill="#8fc8b4"/><ellipse cx="50" cy="69" rx="12" ry="14" fill="#e1dda8"/><path d="m28 30 4-16 10 13m16 0 10-13 4 16" fill="#edce8f"/><rect x="25" y="27" width="50" height="34" rx="15" fill="#a5daca"/>'+face+'<g stroke="#5a9c8c" stroke-width="7" stroke-linecap="round">'+feet+'</g>';
 else if(id==='beatbot')body='<g stroke="#4b8b85" stroke-width="2"><path d="M50 24V13"/><circle cx="50" cy="10" r="4" fill="#edcc83"/><rect x="26" y="56" width="48" height="23" rx="10" fill="#87c6b8"/><rect x="22" y="25" width="56" height="38" rx="15" fill="#b0ead9"/><rect x="30" y="33" width="40" height="23" rx="8" fill="#244752"/><path d="M22 49 12 58m66-9 10 9" stroke-width="6" stroke-linecap="round"/></g><g class="pet-eyes52" fill="#c4ffeb"><rect x="38" y="40" width="5" height="7" rx="2"/><rect x="57" y="40" width="5" height="7" rx="2"/></g><path class="face-happy52" d="M45 51h10" stroke="#b8f9dd" stroke-width="2"/><path class="face-sad52" d="M45 52q5-4 10 0" stroke="#b8f9dd" fill="none" stroke-width="2"/><g stroke="#75a99c" stroke-width="7" stroke-linecap="round">'+feet+'</g>';
 else return petOriginalArt52(id).replace('viewBox="0 0 100 100">','viewBox="0 0 100 100"><g class="pet-body52">').replace('</svg>','</g></svg>');
 return '<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="91" rx="27" ry="4" fill="#0003"/><g class="pet-body52">'+body+'</g></svg>';
}
petArt=petSvg52;
let petFrame52=0,petWidth52=0,petVisible52=false,petLast52=0,petDecision52=0,petReaction52=0,petLastReact52=0,petX52=0,petTarget52=0,petMoodTimer52=0,petMood52='idle',petIdentity52='';
const reducedPet52=matchMedia('(prefers-reduced-motion: reduce)');
function petCanMove52(){return petVisible52&&!$('petWorld52')?.hidden&&!document.hidden&&!roundPaused&&!document.querySelector('dialog[open]')&&!reducedPet52.matches}
function petMotion52(){cancelAnimationFrame(petFrame52);petFrame52=0;petLast52=0;if(petCanMove52())petFrame52=requestAnimationFrame(petTick52)}
function setPetMood52(mood){if(petMood52===mood)return;petMood52=mood;const el=$('practiceBuddy');el.dataset.mood=mood;el.setAttribute('aria-label',petData().name+', '+(mood==='walk'?'walking':mood));const bubble=el.querySelector('.pet-bubble52');if(bubble)bubble.textContent=({cheer:'♪',gold:'✦',win:'★',miss:'…',sleep:'z',pet:'♥'})[mood]||''}
function petTick52(now){
 petFrame52=0;if(!petCanMove52())return;if(petLast52&&now-petLast52<32){petFrame52=requestAnimationFrame(petTick52);return}const dt=petLast52?Math.min(.06,(now-petLast52)/1000):.032;petLast52=now;
 if(now>=petReaction52){
  if(now>=petDecision52){const roam=Math.random()>.2;petTarget52=roam?Math.random()*Math.max(0,petWidth52-70):petX52;petDecision52=now+2400+Math.random()*2400}
  const dx=petTarget52-petX52;if(Math.abs(dx)>2){petX52+=Math.sign(dx)*Math.min(Math.abs(dx),dt*30);$('practiceBuddy').style.setProperty('--pet-face52',dx<0?'-1':'1');setPetMood52('walk')}else setPetMood52(!running&&now-petLastReact52>14000?'sleep':'idle');
 }
 $('practiceBuddy').style.transform='translate3d('+petX52.toFixed(1)+'px,0,0)';petFrame52=requestAnimationFrame(petTick52);
}
function reactPet52(mood){
 if($('petWorld52')?.hidden||roundPaused)return;const now=performance.now();if(['cheer','gold','miss'].includes(mood)&&now-petLastReact52<220)return;
 petLastReact52=now;petReaction52=now+(mood==='win'?1800:mood==='pet'?1000:480);setPetMood52(mood);clearTimeout(petMoodTimer52);petMoodTimer52=setTimeout(()=>{if(performance.now()>=petReaction52)setPetMood52('idle')},petReaction52-now+20);if(!petFrame52)petMotion52();
}
function syncPet52(){
 const floor=$('petWorld52');if(!floor)return;const id=cfg.modded&&cfg.showPet!==false?economy.buddy:'buddyNone',on=id!=='buddyNone';floor.hidden=!on;$('companionDock').hidden=true;$('practiceBuddy').hidden=!on;
 if(id!==petIdentity52){clearTimeout(petMoodTimer52);petIdentity52=id;const el=$('practiceBuddy');el.dataset.buddy=id;el.innerHTML=on?'<span class="pet-facing52">'+petSvg52(id)+'</span><span class="pet-bubble52" aria-hidden="true"></span>':'';petX52=Math.min(36,Math.max(0,petWidth52-70));petTarget52=Math.max(0,petWidth52-80);petDecision52=performance.now()+3500;petReaction52=0;petMood52='';if(on)setPetMood52('idle')}
 if($('showPet52'))$('showPet52').checked=cfg.showPet!==false;petMotion52();
}
syncPetDock=syncPet52;
syncCosmetics=function(){document.body.dataset.stage=cfg.modded?economy.stage:'stageNone';document.body.dataset.head=cfg.modded?economy.head:'headNone';syncPet52();syncComet52();syncRoom52()};
// Keep hit feedback and friendship saves, but stop moving the whole pet with a
// second animation. The sprite reacts independently of its walking position.
hitFx=function(n,perfect,gold){oldHit32(n,perfect,gold);if(cfg.modded&&economy.buddy!=='buddyNone'){petData().xp++;reactPet52(gold?'gold':'cheer');clearTimeout(petSaveTimer);petSaveTimer=setTimeout(saveEconomy,500)}};
const missBefore52=missFx;missFx=function(n){const r=missBefore52(n);reactPet52('miss');return r};
const expireBefore52=expireNotes;expireNotes=function(now){const previous=missCount,r=expireBefore52(now);if(missCount>previous)reactPet52('miss');return r};
const celebrateBefore52=celebrate;celebrate=function(){const r=celebrateBefore52();reactPet52('win');return r};
const pauseBefore52=syncPauseControl;syncPauseControl=function(){const r=pauseBefore52();petMotion52();return r};
function syncComet52(){
 const head=$('playhead');if(!head)return;const existing=head.querySelector('[data-comet52]');if(!cfg.modded||economy.head!=='cometTail'){existing?.remove();return}if(existing)return;
 const g=svgEl('g',{'data-comet52':'true','pointer-events':'none'});g.append(svgEl('path',{d:'M-48 78Q-17 67 0 82Q-18 85-48 78',fill:'#c3a8ed',opacity:.3}));g.append(svgEl('path',{d:'M0 67 3 77 12 80 3 83 0 94-3 83-12 80-3 77Z',fill:'#f4d7ff'}));for(let i=0;i<3;i++)g.append(svgEl('circle',{cx:-17-i*11,cy:78+i%2*4,r:2-i*.3,fill:'#dbbcff',opacity:.6-i*.12}));head.prepend(g);
}
function syncRoom52(){
 const stage=cfg.modded?economy.stage:'stageNone';let art=$('roomArt52');if(!['rooftop','deepReef'].includes(stage)){art?.remove();return}if(art?.dataset.stage===stage)return;
 if(!art){art=document.createElement('div');art.id='roomArt52';art.setAttribute('aria-hidden','true');$('scoreStage').append(art)}art.dataset.stage=stage;
 const rooftop='<circle cx="1040" cy="48" r="16" fill="#f7d8ae"/><path d="M0 280V231h65v-28h55v49h70v-45h55v39h70v-28h65v62h35v-67h90v34h55v-44h55v77h55v-48h100v-28h47v56h53v-46h78v32h60v-50h55v44h60v-23h62v47h70v-33h30v53Z" fill="#10202b"/><path d="M80 222h20m228 10h25m113-4h22m340 8h20m92-25h18m182 30h17" stroke="#e3c08c" stroke-width="3" opacity=".65"/>';
 const reef='<g fill="none" stroke="#6eaa91" stroke-width="5" stroke-linecap="round"><path d="M35 280q-20-23 4-50t-6-31m18 81q20-32 3-57m107 57q-20-23 0-39m878 39q30-35 3-63t9-30m20 93q-18-25 6-45m47 45q23-26-2-46"/></g><g fill="#b2c0a0"><path d="M780 239q17-15 31-1l10-8v18l-10-8q-17 13-31-1Z"/><path d="M300 219q12-10 23-1l8-6v14l-8-6q-12 9-23-1Z"/></g>';
 art.innerHTML='<svg viewBox="0 0 1200 280" preserveAspectRatio="none">'+(stage==='rooftop'?rooftop:reef)+'</svg>';
}
const renderBefore52=render;render=function(){const r=renderBefore52();syncComet52();return r};
const cosmeticBefore52=cosmeticPreview;
cosmeticPreview=function(item){
 if(item.category==='buddy'&&item.id!=='buddyNone')return petSvg52(item.id);
 if(item.id==='rooftop')return '<div class="room52 rooftop52"><span class="sun52"></span><span class="cloud52"></span><span class="skyline52"></span></div>';
 if(item.id==='deepReef')return '<div class="room52 reef52"><span class="reef-light52"></span><span class="kelp52"></span><span class="fish52">⌁</span><span class="bubbles52"></span></div>';
 if(item.id==='cometTail')return '<svg viewBox="0 0 200 80" class="comet-preview52"><path d="M20 45Q80 17 147 40Q84 52 20 45" fill="#b69bdf" opacity=".4"/><path d="m147 21 5 14 15 5-15 5-5 14-5-14-15-5 15-5Z" fill="#f2dfff"/><circle cx="110" cy="35" r="2" fill="#dcbfff"/><circle cx="80" cy="43" r="1.5" fill="#dcbfff"/></svg>';
 return cosmeticBefore52(item);
};
function installKevin52(){
 const sign=document.querySelector('.booth-sign');sign.innerHTML='<svg viewBox="0 0 44 44" aria-hidden="true"><path d="M17 31V10l16-4v22M17 15l16-4"/><ellipse cx="12" cy="32" rx="6" ry="4"/><ellipse cx="28" cy="29" rx="6" ry="4"/></svg><div><strong>KEVIN’S</strong><small>ODDS & ENDS</small></div><span class="booth-star52" aria-hidden="true">✦</span>';
 const scene=document.querySelector('.booth-scene');scene.insertAdjacentHTML('afterbegin','<svg class="booth-wall52" viewBox="0 0 300 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 5Q150 65 300 5" fill="none" stroke="#8e7658" stroke-width="2"/><g fill="#f2ce83"><circle cx="24" cy="14" r="4"/><circle cx="73" cy="28" r="4"/><circle cx="124" cy="34" r="4"/><circle cx="176" cy="34" r="4"/><circle cx="227" cy="28" r="4"/><circle cx="276" cy="14" r="4"/></g><g stroke="#80624b" fill="#413b34" stroke-width="4"><path d="M7 210h58v8H7m231-8h56v8h-56"/><rect x="20" y="168" width="27" height="40" rx="4" fill="#718a75"/><rect x="250" y="178" width="30" height="30" rx="5" fill="#a38965"/></g><g fill="none" stroke="#dfc28a" stroke-width="2"><circle cx="264" cy="192" r="8"/><path d="M32 182v16m-6-8h12"/></g><path d="M10 325h280" stroke="#79604a" stroke-width="3"/></svg>');
 const guy=$('kevinGuy');guy.innerHTML='<defs><linearGradient id="kevinWood52" x2="0" y2="1"><stop stop-color="#977152"/><stop offset="1" stop-color="#5c4436"/></linearGradient></defs><ellipse cx="120" cy="213" rx="103" ry="6" fill="#100d0b66"/><g class="kevin-idle" stroke="#f8e4bb" stroke-width="5" stroke-linecap="round" fill="none"><circle cx="120" cy="62" r="27" fill="#283937"/><path d="M120 91V152M120 111L84 130L60 113M120 110L152 117L173 84M120 152L96 202M120 152L145 202"/><path class="kevin-apron52" d="M109 96h22l8 48h-38Z" fill="#538779" stroke="#305a50" stroke-width="2"/><path d="M112 114h16v13h-16Z" stroke="#c2dbbd" stroke-width="1.5"/><g stroke-width="2.5"><path d="M109 59v3m22-3v3M109 73q11 10 22 0"/><path d="M105 54q4-3 8 0m15 0q4-3 8 0" stroke="#95b8a2" stroke-width="1.5"/></g><g stroke-width="2"><path d="M89 43q5-30 31-27t29 27" fill="#678e77" stroke="#365c50"/><path d="M85 42q35-10 70 1l-4 7q-31-6-65 0Z" fill="#c9b47c" stroke="#746344"/><path d="m125 23 2 5 5 1-4 3v5l-4-3-5 2 1-5-3-3 5-1Z" fill="#f4d68f" stroke="none"/></g></g><path d="M20 164h200v51H20Z" fill="url(#kevinWood52)" stroke="#4a352c" stroke-width="2"/><path d="M18 160h204v9H18Z" fill="#c8a06d" stroke="#e5c18b" stroke-width="1.5"/><path d="M24 174h192m-192 32h192M32 170v41m176-41v41" stroke="#b9916770" stroke-width="2"/><rect x="71" y="177" width="98" height="27" rx="5" fill="#263f3b" stroke="#c3a477" stroke-width="1.5"/><text x="120" y="196" text-anchor="middle" fill="#f6e4bd" font-size="15" letter-spacing="3" font-family="system-ui" font-weight="800">KEVIN</text><g fill="#dec08a"><circle cx="28" cy="180" r="2"/><circle cx="212" cy="180" r="2"/><circle cx="28" cy="204" r="2"/><circle cx="212" cy="204" r="2"/></g><path d="M39 139h20v19H39Z" fill="#bdceac55" stroke="#c4d9bd" stroke-width="1.5"/><ellipse cx="49" cy="139" rx="10" ry="3" fill="#d3d7b0"/><g fill="#e7bf67" stroke="#f7d995"><ellipse cx="49" cy="152" rx="5" ry="2"/><ellipse cx="49" cy="148" rx="5" ry="2"/></g><path d="M179 141h18v17h-18Z" fill="#94bba7"/><path d="M197 144q12-1 6 8h-6" fill="none" stroke="#94bba7" stroke-width="3"/><path d="M184 134q-5-5 0-10m7 10q-5-5 0-10" stroke="#e9d4a4" opacity=".4" fill="none" stroke-width="2"/>';
}
function installUpdate52(){
 for(const item of catalog)if(item.introPrice52)item.price=item.introPrice52;
 const wallet=$('shopGold').parentElement;for(const node of [...wallet.childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();const coin=document.createElement('span');coin.className='wallet-coin50';coin.setAttribute('aria-hidden','true');wallet.prepend(coin);wallet.setAttribute('aria-label','Shop gold wallet');
 installKevin52();
 const floor=document.createElement('div');floor.id='petWorld52';floor.hidden=true;floor.setAttribute('aria-label','Companion space');document.querySelector('.score-scroll50').after(floor);floor.append($('practiceBuddy'));$('companionDock').hidden=true;$('petDialog').hidden=true;$('petManage').onclick=null;
 const pet=$('practiceBuddy');pet.removeAttribute('aria-hidden');pet.setAttribute('role','button');pet.tabIndex=0;pet.title='Say hello';pet.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();reactPet52('pet')});pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();reactPet52('pet')}});
 const setting=document.createElement('div');setting.className='setting';setting.innerHTML='<label for="showPet52">Show companion<small>Equip a companion at Kevin’s booth.</small></label><input id="showPet52" type="checkbox">';$('experienceSettings47').append(setting);$('showPet52').onchange=e=>{cfg.showPet=e.target.checked;save();syncPet52()};
 new ResizeObserver(entries=>{petWidth52=entries[0].contentRect.width;petX52=Math.min(petX52,Math.max(0,petWidth52-70));petTarget52=petTarget52?Math.min(petTarget52,Math.max(0,petWidth52-70)):Math.max(0,petWidth52-80)}).observe(floor);
 new IntersectionObserver(entries=>{petVisible52=entries[0].isIntersecting;petMotion52()},{rootMargin:'60px'}).observe(floor);
 new MutationObserver(petMotion52).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});document.addEventListener('visibilitychange',petMotion52);reducedPet52.addEventListener('change',petMotion52);
 syncCosmetics();
}
