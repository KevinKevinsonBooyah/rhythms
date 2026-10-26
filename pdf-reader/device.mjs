// Layout preferences are independent of the saved show.
export function setupDevice({pause,fit}) {
  const $=id=>document.getElementById(id),body=document.body;
  const transport=document.querySelector('.transport');$('player').append(transport);
  const landscape=matchMedia('(orientation: landscape)'),phone=matchMedia('(max-height: 600px), (pointer: coarse)');
  let device='',dismissed=false;
  const active=()=>body.classList.contains('player-mode');
  let hideTimer;
  function wake(){body.classList.remove('controls-hidden');clearTimeout(hideTimer);if(active())hideTimer=setTimeout(()=>{if(!body.classList.contains('drawer-open')&&!document.querySelector('dialog[open]')&&!$('player').querySelector(':focus-visible'))body.classList.add('controls-hidden');},3000);}
  // A first tap reveals hidden controls; it does not also select a marcher.
  $('player').addEventListener('pointerdown',e=>{if(active()&&body.classList.contains('controls-hidden')){e.preventDefault();e.stopImmediatePropagation();}wake();},true);
  $('player').addEventListener('pointermove',wake,{passive:true});
  $('player').addEventListener('keydown',wake);
  $('player').addEventListener('focusout',wake);
  function view(name){body.dataset.mobileView=name;document.querySelectorAll('button[data-mobile-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mobileView===name));if(name!=='field')$(name==='sets'?'setsTab':name==='edit'?'dotsTab':'peopleTab').click();}
  function enter(){body.classList.add('player-mode');wake();body.classList.remove('drawer-open');fit();}
  function leave(){if(active())pause();body.classList.remove('player-mode','drawer-open');if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
  function orient(){if(device==='mobile'&&landscape.matches&&phone.matches&&!dismissed)enter();else leave();}
  function choose(value){device=value;body.dataset.device=value;dismissed=false;try{localStorage.setItem('fieldbook-device',value);}catch{}$('deviceDialog').close();view('field');orient();}
  document.querySelectorAll('button[data-device]').forEach(b=>b.onclick=()=>choose(b.dataset.device));
  $('deviceButton').onclick=()=>{pause();$('deviceDialog').showModal();};
  document.querySelectorAll('button[data-mobile-view]').forEach(b=>b.onclick=()=>view(b.dataset.mobileView));
  $('exitPlayer').onclick=()=>{dismissed=true;leave();};
  landscape.addEventListener('change',()=>{dismissed=false;orient();});
  phone.addEventListener('change',orient);
  $('fullscreen').onclick=async()=>{if(active()){dismissed=true;leave();return;}dismissed=false;enter();try{await document.documentElement.requestFullscreen();}catch{/* Fitted in-page player also works on iPhone. */}};
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&active()){dismissed=true;leave();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active()&&!document.querySelector('dialog[open]')){dismissed=true;leave();}});
  $('playerFit').onclick=fit;
  for(const [id,tab] of [['playerSets','setsTab'],['playerMarchers','peopleTab'],['playerEditDots','dotsTab']])$(id).onclick=()=>{body.classList.toggle('drawer-open',!body.classList.contains('drawer-open')||!$(tab).classList.contains('active'));$(tab).click();};
  $('closeDrawer').onclick=()=>body.classList.remove('drawer-open');
  // Keep loop controls as the same DOM elements, so there is only one playback state.
  const loopHomes=['loopStart','loopEnd'].map(id=>({id,parent:$(id).parentElement,next:$(id).nextSibling}));
  $('playerTools').onclick=()=>{pause();$('playerDotSize').value=$('dotSize').value;$('playerSpeed').value=$('speed').value;$('playerVolume').value=$('volume').value;$('playerLoop').checked=$('loop').checked;$('playerClick').checked=$('metronome').checked;for(const id of ['loopStart','loopEnd'])$('playerLoopControls').append($(id));$('playerToolsDialog').showModal();};
  $('playerToolsDialog').addEventListener('close',()=>{for(const {id,parent,next}of loopHomes)parent.insertBefore($(id),next);});
  document.querySelectorAll('[data-player-action]').forEach(b=>b.onclick=()=>{$('playerToolsDialog').close();$(b.dataset.playerAction).click();});
  $('playerTiming').onclick=()=>{$('playerToolsDialog').close();$('syncButton').click();};
  for(const [a,b,event] of [['playerDotSize','dotSize','input'],['playerSpeed','speed','change'],['playerVolume','volume','input']])$(a).addEventListener(event,()=>{$(b).value=$(a).value;$(b).dispatchEvent(new Event(event));});
  for(const [a,b] of [['playerLoop','loop'],['playerClick','metronome']])$(a).onchange=()=>{$(b).checked=$(a).checked;};
  try{device=localStorage.getItem('fieldbook-device')||'';}catch{}
  if(['mobile','computer'].includes(device))choose(device);else{body.dataset.device=matchMedia('(max-width:750px)').matches?'mobile':'computer';view('field');$('deviceDialog').showModal();}
}
