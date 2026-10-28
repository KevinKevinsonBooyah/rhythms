import {applyAtlantisDefaults} from './atlantis-defaults.mjs?v=30';
import {marcherReadout,formatCardCoordinate} from './marcher-card.mjs?v=23';
import {setupDevice} from './device.mjs?v=22';
import {editAudio} from './audio-editor.mjs?v=7';
import {FIELD,coordinate,compile,reviewRow,identity,starts,locate,clock,validateTiming,canAddFiles,mergeRows,performerPhase} from './core.mjs?v=14';
import {extractPDF} from './parser.mjs?v=3';
import {Field} from './field.mjs?v=33';
import {isLetteredSet,nextVisibleSetIndex,visibleSetIndex} from './display-sets.mjs?v=1';
import {put,get,download} from './storage.mjs';
const uuid=()=>globalThis.crypto?.randomUUID?.()||'row-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const $=id=>document.getElementById(id),make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
/* Keep the web page at its intended mobile scale. SVG field pinch/pan uses pointer events. */
for(const event of ['gesturestart','gesturechange'])document.addEventListener(event,e=>e.preventDefault(),{passive:false});
document.addEventListener('touchmove',e=>{
  if(e.touches.length>1&&!(e.target instanceof Element&&e.target.closest('#field')))e.preventDefault();
},{passive:false});
let project={version:1,name:'My marching show',rows:[],pages:[],files:[],settings:{},field:{step:22.5,swap:false,flip:false,grid:false,colors:true,labels:true,paths:true,ghosts:false,calibration:false,ignoreLetterSets:false}};
let projectRevision=0;
let followId='',pathIds=new Set();
let playbackWarningSeen=false;
try{playbackWarningSeen=localStorage.getItem('fieldbook-playback-warning-seen')==='1';}catch{}
let editPersonId='',editSetId='';
let setEditorWarningShown=false;
let isolateId=''; // Session-only view state, never saved to the drill project.
let movements=[],active='',selected='',manualSet=null,count=0,playing=false,seconds=0,lastFrame=0,lastClick=-1,countInLeft=0,countInElapsed=0,busy=false,cancelled=false,rowPage=0,dirty=false,saveTimer;
let audio=new Audio(),audioUrls=new Map(),audioBlobs=new Map(),audioNames=new Map(),audioContext;
audio.preload='auto';audio.volume=.8;
const field=new Field($('field'),id=>{if(id===selected)return;selected=id;isolateId='';if(!selected)followId='';else renderDotChoices();renderPeople();draw();inspector();});
const current=()=>movements.find(m=>m.name===active),maxCount=()=>starts(current()?.sets||[]).at(-1)||0;
function retainMarcherView(){const ids=new Set(current()?.people.map(p=>p.id)||[]);if(!ids.has(selected))selected='';if(!ids.has(followId))followId='';if(!ids.has(isolateId))isolateId='';pathIds=new Set([...pathIds].filter(id=>ids.has(id)));editPersonId=ids.has(editPersonId)?editPersonId:'';editSetId='';$('movement').value=active;$('playerMovement').value=active;}

const located=()=>manualSet===null?locate(current()?.sets||[],count):{index:manualSet,next:Math.min(manualSet+1,(current()?.sets.length||1)-1),t:0};
function goSet(i){const m=current();if(!m)return;pause();if(m.sets.some(s=>s.timingIssue)){manualSet=i;draw();inspector();}else seek(starts(m.sets)[i]);}
const timing=()=>clock(current()?.settings||{bpm:120});
const status=(text,error=false)=>{$('status').textContent=text;$('status').classList.toggle('error',error);};
function open(id){pause();$(id).showModal();}
function close(id){$(id).close();}
function changed(){dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(()=>save(false),800);}
function snapshot(){for(const m of movements)project.settings[m.name]=m.settings;project.name=$('projectName').value||project.name;return project;}
async function save(notify=true){try{snapshot();await put('project',project);await put('audio',[...audioBlobs].map(([name,blob])=>({name,blob,label:audioNames.get(name)})));dirty=false;if(notify)status('Project and attached audio saved in this browser.');}catch(e){status('Browser save failed. Export JSON to keep your work. '+e.message,true);}}
function rebuild(preferred=active){snapshot();movements=compile(project.rows,project.settings,project.field.step/36);for(const m of movements)rebaseDotAnchors(m);active=movements.some(m=>m.name===preferred)?preferred:movements[0]?.name||'';for(const m of movements)project.settings[m.name]=m.settings;
  $('movement').replaceChildren();for(const m of movements)$('movement').append(new Option(m.name,m.name));if(!movements.length)$('movement').append(new Option('No movement yet',''));$('movement').value=active;$('playerMovement').replaceChildren(...[...$('movement').options].map(o=>new Option(o.text,o.value)));$('playerMovement').value=active;
  count=Math.min(count,maxCount());renderMovement();}
function attachCurrentAudio(){audio.pause();audio.removeAttribute('src');const url=audioUrls.get(active);if(url)audio.src=url;audio.load();}
function renderMovement(){const m=current();$('ignoreLetterSets').checked=!!project.field.ignoreLetterSets;$('playerIgnoreLetterSets').checked=!!project.field.ignoreLetterSets;$('toggleLabels').textContent=project.field.labels?'Hide labels':'Show labels';$('toggleLabels').setAttribute('aria-pressed',!project.field.labels);$('keepBright').checked=!!project.field.noSearchFade;$('movementTitle').textContent=m?.name||'Every dot has a place.';$('performerCount').textContent=`${m?.people.length||0} performers`;$('bpm').value=m?.settings.bpm||120;
  field.rebuild(m,project.field);$('legend').replaceChildren();for(const [name,color]of field.colors){const span=make('span'),i=make('i');i.style.background=color;span.append(i,document.createTextNode(name));$('legend').append(span);}
  renderSets();renderPeople();renderDotChoices();draw();inspector();updateFiles();}
function renderSets(){const m=current();$('setList').replaceChildren();for(const id of ['jumpSet','loopStart','loopEnd','playerSet'])$(id).replaceChildren();
  if(!m){$('setList').append(make('p','Your sets and subsets will appear here.','empty'));return;}
  const hide=!!project.field.ignoreLetterSets;
  const hasNumbered=m.sets.some(s=>!isLetteredSet(s));
  const ss=starts(m.sets);
  m.sets.forEach((s,i)=>{if(hide&&hasNumbered&&isLetteredSet(s))return;
    const btn=make('button',undefined,'set-row');btn.dataset.index=i;const label=make('span',s.title||'Untitled set');
    label.append(make('small',`${s.timingIssue?'Needs timing':i?`${s.duration} counts${s.holdCounts?` (${s.moveCounts} march + ${s.holdCounts} hold)`:''}${s.motionIssue?' · Split needs review':''}`:'Opening position'} · ${s.measure||'No measure'}`));
    btn.append(make('b',s.id),label);btn.onclick=()=>goSet(i);$('setList').append(btn);
    for(const id of ['jumpSet','loopStart','loopEnd','playerSet'])$(id).append(new Option(s.id,String(i)));
  });
  // Loop playback must still reach the true final set, even if its label is hidden.
  if(hide&&hasNumbered&&isLetteredSet(m.sets[m.sets.length-1]))
    $('loopEnd').append(new Option('End of show',String(m.sets.length-1)));
  $('loopEnd').selectedIndex=Math.max(0,$('loopEnd').options.length-1);
}
function toggleFollow(id){followId=followId===id?'':id;if(followId){if(selected!==id)isolateId='';selected=id;field.zoom=Math.max(field.zoom,2);}renderPeople();renderDotChoices();draw();inspector();}
function togglePaths(id){pathIds.has(id)?pathIds.delete(id):pathIds.add(id);renderPeople();draw();inspector();}
function toggleIsolate(id){if(!id||!current()?.people.some(p=>p.id===id))return;
  if(selected!==id){selected=id;renderDotChoices();}
  isolateId=isolateId===id?'':id;
  renderPeople();draw();inspector();
}
$('quickFollow').onclick=()=>{if(selected)toggleFollow(selected);};
$('quickPaths').onclick=()=>{if(selected)togglePaths(selected);};
$('quickIsolate').onclick=()=>{if(selected)toggleIsolate(selected);};
function renderPeople(){const m=current(),q=$('search').value.toLowerCase();$('peopleList').replaceChildren();for(const p of m?.people||[])if(`${p.instrument} ${p.symbol}${p.label} ${p.label}`.toLowerCase().includes(q)){const row=make('div',undefined,'person-row'),b=make('button',`${p.instrument} ${p.symbol}${p.label}`),follow=make('button',followId===p.id?'Following':'Follow'),paths=make('button','Paths');b.onclick=()=>{if(selected!==p.id)isolateId='';selected=p.id;renderDotChoices();draw();inspector();};follow.setAttribute('aria-pressed',followId===p.id);paths.setAttribute('aria-pressed',pathIds.has(p.id));follow.onclick=()=>toggleFollow(p.id);paths.onclick=()=>togglePaths(p.id);row.append(b,follow,paths);$('peopleList').append(row);}}

function draw(){const m=current();field.draw(count,selected,$('search').value,manualSet,followId,pathIds,isolateId===selected?isolateId:'');const chosen=!!m?.people.some(p=>p.id===selected);$('marcherQuickActions').hidden=!chosen;$('quickFollow').textContent=followId===selected?'Stop following':'Follow';$('quickFollow').setAttribute('aria-pressed',String(chosen&&followId===selected));$('quickPaths').textContent=pathIds.has(selected)?'Hide paths':'Show paths';$('quickPaths').setAttribute('aria-pressed',String(chosen&&pathIds.has(selected)));$('quickIsolate').textContent=isolateId===selected?'Show everyone':'Isolate';$('quickIsolate').setAttribute('aria-pressed',String(chosen&&isolateId===selected));const l=located();
  const at=l.holding?l.next:l.index,hide=!!project.field.ignoreLetterSets;
  const show=m?visibleSetIndex(m.sets,at,hide):-1;
  const upcoming=m?nextVisibleSetIndex(m.sets,at,hide):-1;
  $('currentSet').textContent=(m?.sets[show]?.id||'·')+(l.holding?' · Hold':'');
  $('nextSet').textContent=m?.sets[upcoming]?.id||'·';
  $('playerReadout').textContent=`Count ${count.toFixed(1)} · ${formatTime(audioUrls.has(active)?audio.currentTime:seconds)}${l.holding?' · HOLD':''}`;
  $('currentCount').textContent=countInLeft>0?`In ${Math.ceil(countInLeft)}`:manualSet!==null?'?':count.toFixed(1);
  $('timeline').max=maxCount()||1;$('timeline').value=count;
  $('jumpSet').value=show;$('playerSet').value=show;$('playerMovement').value=active;
  $('play').textContent=playing?'Ⅱ Pause':'▶ Play';$('play').setAttribute('aria-label',playing?'Pause playback':'Start playback');
  for(const b of $('setList').children)b.classList.toggle('active',+b.dataset.index===show);
  const unknown=m?.people.filter(p=>!p.positions[m.sets[l.index]?.id]||(l.t>0&&!p.positions[m.sets[l.next]?.id])).length||0;
  const setCount=hide?m?.sets.filter(s=>!isLetteredSet(s)).length:m?.sets.length;
  $('fieldHint').textContent=m?`${setCount} ${hide?'numbered sets':'sets'} · ${unknown} unknown positions · ${m.sets.filter(s=>s.motionIssue).length} timing conflicts${m.sets.some(s=>s.timingIssue)?' · Timing review needed':''}`:'Import cards to place your marchers. Drag to pan, scroll or pinch to zoom.';
  $('audioReadout').textContent=audioUrls.has(active)?`${audioNames.get(active)||'Show audio'} · ${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`:'No audio attached';
}
function formatTime(s){return Number.isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00';}
function inspector(){const m=current(),p=m?.people.find(p=>p.id===selected);$('detail').replaceChildren(make('span','MARCHER INSPECTOR','eyebrow'));if(!p){$('detail').append(make('p','Select a dot to inspect its position and next transition.'));return;}
  const l=located(),hide=!!project.field.ignoreLetterSets,shown=visibleSetIndex(m.sets,l.index,hide),target=hide?nextVisibleSetIndex(m.sets,l.index,true):l.next,a=p.positions[m.sets[l.index]?.id],b=target>=0?p.positions[m.sets[target]?.id]:null;$('detail').append(make('h2',`${p.instrument} ${p.symbol}${p.label}`));const actions=make('div',undefined,'inspector-actions'),follow=make('button',followId===p.id?'Stop following':'Follow'),paths=make('button',pathIds.has(p.id)?'Hide paths':'Show paths');follow.setAttribute('aria-pressed',followId===p.id);paths.setAttribute('aria-pressed',pathIds.has(p.id));follow.onclick=()=>toggleFollow(p.id);paths.onclick=()=>togglePaths(p.id);const isolate=make('button',isolateId===p.id?'Show everyone':'Isolate');isolate.setAttribute('aria-pressed',String(isolateId===p.id));isolate.onclick=()=>toggleIsolate(p.id);actions.append(follow,paths,isolate);$('detail').append(actions);const dl=make('dl');
  const pair=(k,v)=>dl.append(make('dt',k),make('dd',v));pair('Identity',`Symbol ${p.symbol} · label ${p.label}`);const phase=performerPhase(p,m.sets,count);pair('Set',m.sets[shown]?.id||'');pair('Phase',phase.waiting?'Waiting to step off':phase.holding?'Holding at next dot':'Marching transition');if(phase.estimated)pair('Timing','Estimated early arrival from step size');if(phase.custom)pair('Timing','Custom marcher phase');if(phase.issue)pair('Timing warning',phase.issue);
  const info=marcherReadout(p,m,count,project.field.step/36,manualSet);
  pair('Current dot',hide&&shown!==l.index?'Intermediate position (subset hidden)':info.status);
  pair('Left / right',info.side);pair('Front / back',info.depth);
  if(hide){if(target>=0){const row=p.positions[m.sets[target].id]?.row;pair(`Go to ${m.sets[target].id} L/R`,row?.side||'Unknown');pair(`Go to ${m.sets[target].id} F/B`,row?.depth||'Unknown');}}
  else if(info.hasNext){pair(`Go to ${info.nextSet} L/R`,info.nextSide);pair(`Go to ${info.nextSet} F/B`,info.nextDepth);}
  if(a&&b&&hide){let distance=0,previous=a;
    for(let j=l.index+1;j<=target;j++){const point=p.positions[m.sets[j]?.id];if(point){distance+=Math.hypot(point.x-previous.x,point.y-previous.y);previous=point;}}
    pair('Route distance',`${distance.toFixed(3)} yd · ${(distance*36/project.field.step).toFixed(2)} standard steps (through subsets)`);
  }else if(a&&b){const d=Math.hypot(b.x-a.x,b.y-a.y);pair('Distance',`${d.toFixed(3)} yd · ${(d*36/project.field.step).toFixed(2)} standard steps`);const duration=m.sets[l.next]?.duration;if(duration>0)pair('Step length',`${(d*36/(p.motionPhases[m.sets[l.next]?.id]?.move||duration)).toFixed(2)} inches/count`);}
  const dotNote=m.settings.dotNotes?.[p.id]?.[m.sets[l.index]?.id];if(dotNote)pair('Dot note',dotNote);
  $('detail').append(dl);const edit=make('button','Edit this performer');edit.onclick=()=>{$('rowSearch').value=`${p.instrument} ${p.symbol} ${p.label}`;rowPage=0;renderReview();open('reviewDialog');};$('detail').append(edit);const phaseButton=make('button','Marcher timing');phaseButton.onclick=()=>openPerformerTiming(p.id);$('detail').append(phaseButton);}
function pause(){playing=false;audio.pause();countInLeft=0;draw();}
function seek(c){manualSet=null;count=Math.max(0,Math.min(maxCount(),+c||0));seconds=timing().toSeconds(count);if(audioUrls.has(active)&&Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,Math.max(0,seconds));lastClick=-1;draw();inspector();}
function beep(accent=false){if(!$('metronome').checked)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=accent?1250:850;g.gain.setValueAtTime(.09,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.05);o.connect(g).connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.055);}catch{}}
async function startAudio(){if(audioUrls.has(active)){audio.playbackRate=+$('speed').value;audio.currentTime=Math.max(0,seconds);try{await audio.play();}catch(e){pause();status('Audio could not play. Try Play again or reattach a supported audio file. '+e.message,true);}}}
async function play(){if(playing){pause();return;}const m=current();if(!m?.sets.length){status('Import and generate your drill first.',true);return;}if(m.sets.some(s=>s.timingIssue)){status('Review missing or conflicting transition counts before playback.',true);renderSetEditor();open('setsDialog');return;}
  if(maxCount()<=0){status('Add at least two sets with a positive transition duration.',true);return;}
  if($('loop').checked && +$('loopEnd').value<=+$('loopStart').value){status('Choose a loop end after the loop start.',true);return;}
  if($('playbackWarningDialog').open)return;
  if(!playbackWarningSeen){$('playbackWarningDialog').showModal();playbackWarningSeen=true;try{localStorage.setItem('fieldbook-playback-warning-seen','1');}catch{}return;}
  if(count>=maxCount())seek(0);if($('loop').checked){const ss=starts(m.sets);if(count<ss[+$('loopStart').value]||count>=ss[+$('loopEnd').value])seek(ss[+$('loopStart').value]);}
  seconds=audioUrls.has(active)&&count===0?(audio.currentTime<timing().toSeconds(0)?audio.currentTime:0):timing().toSeconds(count);playing=true;lastFrame=performance.now();lastClick=-1;
  countInLeft=+m.settings.countIn||0;countInElapsed=0;if(countInLeft){beep(true);}else await startAudio();draw();}
// Marcher selection, Follow, Isolate and Paths carry into the next movement.
async function finishMovement(){
  pause();const next=movements[movements.findIndex(m=>m.name===active)+1];
  if(!next){status('Show complete.');return;}
  active=next.name;count=0;seconds=0;manualSet=null;retainMarcherView();
  attachCurrentAudio();renderMovement();status(`Continuing to ${active}.`);await play();
}
function frame(now){if(playing){const dt=((now-lastFrame)/1000)*+$('speed').value;const m=current();
    if(countInLeft>0){const before=Math.ceil(countInLeft);countInLeft-=dt*m.settings.bpm*m.settings.subdivision/60;if(Math.ceil(countInLeft)!==before&&countInLeft>0)beep();if(countInLeft<=0){countInLeft=0;startAudio();}}
    else {
      if(audioUrls.has(active)){seconds=audio.currentTime;if(audio.ended&&!$('loop').checked){finishMovement();lastFrame=now;requestAnimationFrame(frame);return;}}
      else seconds+=dt;
      count=timing().toCount(seconds);const end=$('loop').checked?starts(m.sets)[+$('loopEnd').value]:maxCount();
      if(count>=end){if($('loop').checked){seek(starts(m.sets)[+$('loopStart').value]);if(audioUrls.has(active)&&audio.paused)startAudio();}else if(!audioUrls.has(active)){finishMovement();lastFrame=now;requestAnimationFrame(frame);return;}else{count=maxCount();}}
      const pulse=Math.floor(count);if(pulse!==lastClick&&seconds>=timing().toSeconds(0)){beep(pulse%(m.settings.beats*m.settings.subdivision)===0);lastClick=pulse;inspector();}
    }draw();}lastFrame=now;requestAnimationFrame(frame);}
function stepSet(delta){pause();const m=current();if(!m)return;const l=located(),hide=!!project.field.ignoreLetterSets;
  let i=visibleSetIndex(m.sets,l.holding?l.next:l.index,hide);
  if(delta){const direction=Math.sign(delta);let next=i;
    do{next+=direction;}while(next>=0&&next<m.sets.length&&hide&&isLetteredSet(m.sets[next]));
    if(next>=0&&next<m.sets.length)i=next;
  }
  if(i>=0)goSet(i);
}
function updateFiles(){$('fileCount').textContent=`${project.files.length} / 3 PDFs`;$('fileList').replaceChildren();for(const file of project.files){const div=make('div',undefined,'file-entry'),span=make('span',`${file.name} · ${file.pages||0} pages${file.error?' · '+file.error:''}`),b=make('button','Remove');b.disabled=busy;b.onclick=()=>{pause();project.files=project.files.filter(f=>f.id!==file.id);project.rows=project.rows.filter(r=>{r.sources=(r.sources||[r.fileId]).filter(id=>id!==file.id);if(r.fileId===file.id)r.fileId=r.sources[0];return r.sources.length||!r.source||r.source==='Manual';});project.pages=project.pages.filter(p=>p.fileId!==file.id);rebuild();changed();};div.append(span,b);$('fileList').append(div);}$('pickPDF').disabled=busy||project.files.length>=3;$('cancelImport').disabled=!busy;}
async function addPDFs(files){files=[...files];if(!files.length)return;if(busy){status('Wait for the current import to finish.',true);return;}if(!canAddFiles(project.files.length,files.length)){$('importStatus').textContent='3 PDFs maximum. Remove a PDF before adding another.';return;}if(files.some(f=>!(/\.pdf$/i.test(f.name)||f.type==='application/pdf'))){$('importStatus').textContent='Choose only PDF files.';return;}
  pause();busy=true;cancelled=false;const imported=[];let duplicateCount=0;updateFiles();
  for(const file of files){if(cancelled)break;const entry={id:uuid(),name:file.name,pages:0};project.files.push(entry);updateFiles();
    try{const data=await extractPDF(file,(page,total,phase)=>{$('progress').max=total;$('progress').value=page-1;$('importStatus').textContent=`${phase}: ${file.name}, page ${page} of ${total}`;entry.pages=total;},{ocr:$('ocr').checked,cancelled:()=>cancelled});
      for(const r of data.rows){r.id=uuid();r.fileId=entry.id;}for(const p of data.pages)p.fileId=entry.id;
      const merged=mergeRows(project.rows,data.rows);project.rows=merged.rows;duplicateCount+=merged.duplicates;project.pages.push(...data.pages);imported.push(data.rows.length);$('progress').value=entry.pages;
    }catch(e){entry.error=e.message;}
  }
  busy=false;updateFiles();changed();const problems=project.files.filter(f=>f.error).map(f=>`${f.name}: ${f.error}`).join(' · ');$('importStatus').textContent=`${imported.reduce((a,b)=>a+b,0)} rows extracted. ${duplicateCount} exact duplicates skipped. ${problems||'Open review to check identities, coordinates and timing.'}`;status('Import complete. Review extracted rows before generating the field.');}
const fields=['movement','instrument','symbol','label','set','title','measure','counts','side','depth'];
function rowIssues(r){const warnings=reviewRow({...r,parseWarning:r.parseWarning?.startsWith('Conflicting duplicate')?'':r.parseWarning},project.field.step/36).warnings;const matches=project.rows.filter(a=>a!==r&&a.movement===r.movement&&identity(a)===identity(r)&&a.set===r.set);if(matches.some(a=>a.side!==r.side||a.depth!==r.depth))warnings.push('Conflicting coordinates for this performer/set');return warnings;}
function filteredRows(){const q=$('rowSearch').value.toLowerCase();return project.rows.filter(r=>(!q||fields.map(k=>r[k]).join(' ').toLowerCase().includes(q))&&(!$('issuesOnly').checked||rowIssues(r).length));}
function renderReview(){const rows=filteredRows();rowPage=Math.max(0,Math.min(rowPage,Math.ceil(rows.length/100)-1));$('reviewBody').replaceChildren();$('reviewSummary').textContent=`${project.rows.length} total rows · ${rows.length} matching · edits are saved locally automatically`;
  for(const r of rows.slice(rowPage*100,rowPage*100+100)){const issues=rowIssues(r),tr=make('tr',undefined,issues.length?'issue':r.status==='verified'?'verified':'');const td=make('td',`${r.status} · ${r.source||'Manual'} p.${r.page||1}`);td.append(make('div',issues.join(' · ')));tr.append(td);
    for(const k of fields){const cell=make('td'),input=make('input');input.value=r[k]??'';input.setAttribute('aria-label',`${k} for set ${r.set}`);input.onchange=()=>{r[k]=input.value.trim();r.status='corrected';if(r.parseWarning?.startsWith('Conflicting duplicate'))r.parseWarning='';changed();renderReview();};cell.append(input);tr.append(cell);}
    const del=make('button','Delete');del.onclick=()=>{project.rows=project.rows.filter(a=>a.id!==r.id);changed();renderReview();};const action=make('td');action.append(del);tr.append(action);$('reviewBody').append(tr);}
  $('rowPage').textContent=`Page ${rowPage+1} of ${Math.max(1,Math.ceil(rows.length/100))}`;$('prevRows').disabled=rowPage===0;$('nextRows').disabled=(rowPage+1)*100>=rows.length;}
function renderRaw(){$('rawPage').replaceChildren();project.pages.forEach((p,i)=>$('rawPage').append(new Option(`${p.source} · page ${p.page} · ${p.method}`,i)));showRaw();}
function showRaw(){const p=project.pages[+$('rawPage').value];$('rawText').textContent=p?`${p.warnings.join('\n')}\n\n${p.text}`:'No extracted pages yet.';}
function renderSetEditor(){const m=current();$('setEditor').replaceChildren();if(!m){$('setEditor').append(make('p','Generate a movement first.'));return;}
  m.sets.forEach((s,i)=>{const row=make('div',undefined,'set-edit'),name=make('input');name.value=s.id;name.setAttribute('aria-label','Set name');name.onchange=()=>{const id=name.value.trim();if(!id||m.sets.some(a=>a!==s&&a.id===id)){name.value=s.id;return;}for(const r of project.rows)if(r.movement===active&&r.set===s.id){r.set=id;r.status='corrected';}m.settings.durations??={};if(s.duration!==null)m.settings.durations[id]=s.duration;delete m.settings.durations[s.id];for(const map of [m.settings.motionCounts,m.settings.editDotAnchors])if(map&&Object.hasOwn(map,s.id)){map[id]=map[s.id];delete map[s.id];}for(const map of Object.values(m.settings.dotNotes||{}))if(Object.hasOwn(map,s.id)){map[id]=map[s.id];delete map[s.id];}for(const map of Object.values(m.settings.performerPhases||{}))if(Object.hasOwn(map,s.id)){map[id]=map[s.id];delete map[s.id];}if(editSetId===s.id)editSetId=id;s.id=id;m.settings.order=m.sets.map(a=>a.id);changed();};
    const duration=make('input');duration.type='number';duration.min='1';duration.step='0.25';duration.value=i?s.duration??'':0;duration.disabled=i===0;duration.setAttribute('aria-label',`Arrival counts for ${s.id}`);duration.onchange=()=>{m.settings.durations??={};const n=+duration.value;if(n>0){s.duration=n;s.timingIssue=false;m.settings.durations[s.id]=n;}else{s.duration=null;s.timingIssue=true;delete m.settings.durations[s.id];}changed();};
    const up=make('button','↑'),down=make('button','↓'),del=make('button','×');up.disabled=i===0;down.disabled=i===m.sets.length-1;
    const move=d=>{[m.sets[i],m.sets[i+d]]=[m.sets[i+d],m.sets[i]];m.settings.order=m.sets.map(a=>a.id);rebuild();renderSetEditor();changed();};up.onclick=()=>move(-1);down.onclick=()=>move(1);del.onclick=()=>{project.rows=project.rows.filter(r=>!(r.movement===active&&r.set===s.id));rebuild();renderSetEditor();changed();};const march=make('input');march.type='number';march.min='0';march.max=s.duration||0;march.step='0.25';march.value=i?s.moveCounts??s.duration??'':0;march.disabled=i===0;march.setAttribute('aria-label',`March counts into ${s.id}`);march.onchange=()=>{const n=+march.value;if(Number.isFinite(n)&&n>=0&&n<=s.duration){m.settings.motionCounts??={};m.settings.motionCounts[s.id]=n;changed();}else{march.value=s.moveCounts??s.duration;}};row.append(name,make('span',i?'Total / march counts':'opening dot'),duration,march,up,down,del);if(s.motionIssue){const warning=make('small',s.motionIssue);row.append(warning);}$('setEditor').append(row);});}
function renderTimingAudit(m){
  const box=$('timingAudit');box.replaceChildren();
  const resolved=m.sets.filter(s=>s.holdCounts>0),issues=m.sets.filter(s=>s.motionIssue);
  box.append(make('p',`${resolved.length} intervals have separate marching and holding phases. ${issues.length} title/count conflicts need review.`));
  const list=make('ul');for(const s of issues)list.append(make('li',`Set ${s.id}: ${s.motionIssue}`));box.append(list);
  if(audioUrls.has(active)&&Number.isFinite(audio.duration))box.append(make('p',`Last dot: ${timing().toSeconds(maxCount()).toFixed(2)}s. Recording: ${audio.duration.toFixed(2)}s. Matching end times does not confirm individual sets.`));
  const edit=make('button','Edit march / hold counts');edit.onclick=()=>{close('timingDialog');renderSetEditor();open('setsDialog');};box.append(edit);
}
function openTiming(){const m=current();if(!m){status('Generate a movement first.',true);return;}for(const [id,key]of [['baseBpm','bpm'],['offset','offset'],['beats','beats'],['subdivision','subdivision'],['countIn','countIn']])$(id).value=m.settings[key];$('timingSource').textContent=m.settings.scoreNote||'';$('titleHolds').checked=m.settings.holdMode==='title';$('naturalArrival').checked=!!m.settings.naturalArrival;renderTimingAudit(m);$('tempoMap').value=m.settings.tempo.map(t=>`${t.count}, ${t.bpm}`).join('\n');$('timingPreview').src=audioUrls.get(active)||'';$('alignSet').replaceChildren();m.sets.forEach((s,i)=>$('alignSet').append(new Option(s.id,String(i))));$('syncMap').value=m.settings.markers.map(t=>`${t.count}, ${t.seconds}`).join('\n');open('timingDialog');}
function parsePairs(value,key){return value.split('\n').filter(s=>s.trim()).map(s=>{const p=s.split(',').map(x=>Number(x.trim()));if(p.length!==2||!p.every(Number.isFinite))throw Error('Use two numbers separated by a comma on each line.');return {count:p[0],[key]:p[1]};});}
async function addAudio(file){if(!file)return;if(!current()){status('Generate a movement before attaching audio.',true);return;}pause();if($('timingDialog').open)close('timingDialog');await editAudio(file,movements,async clips=>{for(const c of clips){const m=movements.find(m=>m.name===c.name);if(!m)continue;const old=audioUrls.get(c.name);if(old)URL.revokeObjectURL(old);audioBlobs.set(c.name,c.blob);audioNames.set(c.name,`${file.name} · ${c.name}`);audioUrls.set(c.name,URL.createObjectURL(c.blob));m.settings.offset=Math.max(0,(+m.settings.offset||0)-c.start);m.settings.markers=[];for(const anchor of Object.values(m.settings.editDotAnchors||{})){delete anchor.seconds;delete anchor.syncCount;}m.settings.audioCut={start:c.start,end:c.end,source:file.name};}attachCurrentAudio();seek(0);changed();status('Separate movement clips saved. Delay and sync times are now relative to each clip; calibrate sets in Audio & timing.');});}

function applyProject(data){if(!data||data.version!==1||!Array.isArray(data.rows)||data.rows.length>200000||!data.field||!data.settings||!Array.isArray(data.files)||data.files.length>3)throw Error('This is not a supported Fieldbook project.');
  for(const r of data.rows){if(!fields.every(k=>typeof r[k]==='string'))throw Error('Invalid row data.');r.id||=uuid();}if(!(data.field.step>0&&data.field.step<=100))throw Error('Invalid step size.');
  if(data.name==='Atlantis'&&data.templateRevision>=8&&data.templateRevision<14){for(const s of Object.values(data.settings)){s.holdMode='title';s.naturalArrival??=true;}data.templateRevision=14;}
  applyAtlantisDefaults(data);
  for(const s of Object.values(data.settings))validateTiming(s);projectRevision++;pause();for(const url of audioUrls.values())URL.revokeObjectURL(url);audioUrls.clear();audioBlobs.clear();audioNames.clear();movements=[];project=data;project.pages??=[];$('projectName').value=project.name;count=0;manualSet=null;selected='';isolateId='';editPersonId='';editSetId='';rebuild();attachCurrentAudio();syncFieldInputs();}
function syncFieldInputs(){$('dotSize').value=project.field.dotSize||1;for(const id of ['labels','paths','ghosts','grid','colors','calibration','swap'])$(id).checked=project.field[id];$('ignoreLetterSets').checked=!!project.field.ignoreLetterSets;$('playerIgnoreLetterSets').checked=!!project.field.ignoreLetterSets;$('orientation').checked=project.field.flip;$('stepSize').value=project.field.step;}
async function load(){const data=await get('project');if(!data){status('No browser save found.');return;}const storedAudio=await get('audio')||[];applyProject(data);for(const {name,blob,label}of storedAudio){audioBlobs.set(name,blob);audioNames.set(name,label);audioUrls.set(name,URL.createObjectURL(blob));}attachCurrentAudio();status('Loaded your saved project.');draw();}
function exportCSV(){const cols=['movement','instrument','symbol','label','set','title','measure','counts','side','depth','x_yards','y_yards','status','source','page'];const lines=[cols,...project.rows.map(r=>{const p=coordinate(r.side,r.depth,project.field.step/36);return cols.map(k=>k==='x_yards'?p.x??'':k==='y_yards'?p.y??'':r[k]??'');})];download('fieldbook-coordinates.csv',lines.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv');}
// Set-linked audio/tempo anchors follow the set when its count changes.
function rebaseDotAnchors(m){const anchors=m.settings.editDotAnchors||{},times=starts(m.sets);
  for(const [id,a] of Object.entries(anchors)){
    const i=m.sets.findIndex(s=>s.id===id);if(i<0)continue;
    if(a.tempoCount!==undefined)m.settings.tempo=m.settings.tempo.filter(t=>!(t.count===a.tempoCount&&t.bpm===a.bpm));
    if(a.syncCount!==undefined)m.settings.markers=m.settings.markers.filter(t=>!(t.count===a.syncCount&&t.seconds===a.seconds));
    if(i===0){if(a.bpm!==undefined)m.settings.bpm=a.bpm;if(a.seconds!==undefined)m.settings.offset=a.seconds;continue;}
    const c=times[i];if(a.bpm!==undefined){m.settings.tempo=m.settings.tempo.filter(t=>t.count!==c);m.settings.tempo.push({count:c,bpm:a.bpm});a.tempoCount=c;}
    if(a.seconds!==undefined){m.settings.markers=m.settings.markers.filter(t=>t.count!==c);m.settings.markers.push({count:c,seconds:a.seconds});a.syncCount=c;}
  }
  m.settings.tempo.sort((a,b)=>a.count-b.count);m.settings.markers.sort((a,b)=>a.count-b.count);
}
function editContext(){const m=current(),p=m?.people.find(a=>a.id===editPersonId),i=m?.sets.findIndex(a=>a.id===editSetId)??-1;return {m,p,i,s:m?.sets[i]};}
function renderDotChoices(){const m=current();$('dotPerson').replaceChildren();$('dotSet').replaceChildren();if(!m){$('dotSource').textContent='Load a show to edit dots.';return;}
  m.people.forEach(p=>$('dotPerson').append(new Option(`${p.instrument} ${p.symbol}${p.label}`,p.id)));m.sets.forEach(s=>$('dotSet').append(new Option(`${s.id} · ${s.title||'Untitled'}`,s.id)));
  if(selected&&m.people.some(p=>p.id===selected))editPersonId=selected;
  if(!m.people.some(p=>p.id===editPersonId))editPersonId=m.people[0]?.id||'';
  if(!m.sets.some(s=>s.id===editSetId))editSetId=m.sets[m.sets.length>1?Math.max(1,located().next):0]?.id||'';
  $('dotPerson').value=editPersonId;$('dotSet').value=editSetId;refreshDotEditor();
}
function refreshDotEditor(){const {m,p,i,s}=editContext();if(!m||!p||!s)return;
  $('dotSetWarning').textContent=`Check your set first! You are editing set ${s.id} in ${m.name}. Choose a different set above before changing its settings. Playback does not change this selection.`;
  $('dotSave').textContent=`Save set ${s.id} changes`;
  const pos=p.positions[s.id],phase=p.motionPhases?.[s.id],anchor=m.settings.editDotAnchors?.[s.id],c=starts(m.sets)[i],sync=m.settings.markers.find(a=>a.count===c);
  $('dotSource').textContent=`${p.instrument} ${p.symbol}${p.label} · set ${s.id} · ${pos?.row?.status||'missing'} position`;
  $('dotX').value=pos?.x?.toFixed(4)??'';$('dotY').value=pos?.y?.toFixed(4)??'';$('dotSide').value=pos?.row?.side||'';$('dotDepth').value=pos?.row?.depth||'';
  $('dotStart').value=i?phase?.start??0:'';$('dotMove').value=i?phase?.move??s.moveCounts??0:'';
  $('dotDuration').value=i?s.duration??'':'';$('dotSetMove').value=i?s.moveCounts??'':'';
  for(const id of ['dotStart','dotMove','dotDuration','dotSetMove','dotShift','dotShiftApply','dotTimingReset'])$(id).disabled=i===0;
  $('dotShift').value=0;$('dotHorizontal').value=0;$('dotVertical').value=0;
  $('dotBpm').value=i?(anchor?.bpm??m.settings.tempo.filter(t=>t.count<=c).at(-1)?.bpm??m.settings.bpm):m.settings.bpm;
  $('dotSync').value=i?(anchor?.seconds??sync?.seconds??''):m.settings.offset;
  $('dotBpm').dataset.edited='';$('dotSync').dataset.edited='';
  $('dotStart').dataset.edited='';$('dotMove').dataset.edited='';
  $('dotTitle').value=s.title||'';$('dotMeasure').value=s.measure||'';$('dotNote').value=m.settings.dotNotes?.[p.id]?.[s.id]||'';
  updateDotHold();$('dotEditStatus').textContent='';
}
function updateDotHold(){const total=+$('dotDuration').value,start=+$('dotStart').value,move=+$('dotMove').value;
  $('dotHold').textContent=$('dotStart').disabled?'Opening dot has no transition.':`After marching: ${Math.max(0,total-start-move).toFixed(2)} counts holding at the destination.`;
}
function setEditorPoint(point){if(!point)return;const n=formatCardCoordinate(point,project.field.step/36);$('dotX').value=point.x.toFixed(4);$('dotY').value=point.y.toFixed(4);$('dotSide').value=n.side;$('dotDepth').value=n.depth;}
function dotError(message){$('dotEditStatus').textContent=message;}
function saveDotEdits(){const {m,p,i,s}=editContext();if(!m||!p||!s)return;
  const step=project.field.step/36,x=$('dotX').value.trim(),y=$('dotY').value.trim(),side=$('dotSide').value.trim(),depth=$('dotDepth').value.trim();
  const editingPosition=[x,y,side,depth].some(Boolean),point=editingPosition?coordinate(side,depth,step):null;
  if(editingPosition&&(!x||!y||!point?.valid||point.errors.length||Math.abs(point.x-+x)>.02||Math.abs(point.y-+y)>.02)){dotError('Check X/Y and card coordinates. They must describe the same place on the field.');return;}
  const duration=i?+$('dotDuration').value:0,setMove=i?+$('dotSetMove').value:0,start=i?+$('dotStart').value:0,move=i?+$('dotMove').value:0;
  const performerEdited=!!($('dotStart').dataset.edited||$('dotMove').dataset.edited);
  if(i&&(!(duration>0)||setMove<0||setMove>duration||(performerEdited&&(start<0||move<0||start+move>duration)))){dotError('Marching and any marcher wait must fit within this set’s total counts.');return;}
  const old=p.positions[s.id],previous=i?p.positions[m.sets[i-1].id]:null;
  if(i&&performerEdited&&move===0&&previous&&point?.valid&&Math.hypot(previous.x-point.x,previous.y-point.y)>1e-7){dotError('A marcher changing position needs positive march counts.');return;}
  const bpm=+$('dotBpm').value,seconds=+$('dotSync').value;
  if($('dotBpm').dataset.edited&&!(bpm>0&&bpm<=600)){dotError('BPM must be between 1 and 600.');return;}
  if($('dotSync').dataset.edited&&($('dotSync').value===''||!Number.isFinite(seconds)||seconds<0)){dotError('Enter a nonnegative audio time, or use Remove set audio anchor.');return;}
  try{const trial=structuredClone(m.settings),trialSets=m.sets.map(a=>({...a}));if(i)trialSets[i].duration=duration;
    if($('dotBpm').dataset.edited||$('dotSync').dataset.edited){trial.editDotAnchors??={};const a=trial.editDotAnchors[s.id]??={};if($('dotBpm').dataset.edited)a.bpm=bpm;if($('dotSync').dataset.edited)a.seconds=seconds;}
    rebaseDotAnchors({sets:trialSets,settings:trial});validateTiming(trial);
  }catch(e){dotError('Timing conflict: '+e.message);return;}
  pause();
  if(point?.valid&&(old?.row?.side!==side||old?.row?.depth!==depth||!old)){
    let rows=project.rows.filter(r=>r.movement===active&&r.set===s.id&&identity(r)===p.id);
  if(!rows.length){const source=project.rows.find(r=>r.movement===active&&identity(r)===p.id);const r={...source,id:uuid(),set:s.id,counts:'',title:s.title||'',measure:s.measure||'',side,depth,originalSide:'',originalDepth:'',source:'Manual',status:'corrected',method:'manual'};project.rows.push(r);rows=[r];}
    for(const r of rows){r.originalSide??=r.side;r.originalDepth??=r.depth;r.side=side;r.depth=depth;r.status='corrected';r.parseWarning='';}
  }
  if(i){m.settings.durations??={};m.settings.motionCounts??={};m.settings.durations[s.id]=duration;m.settings.motionCounts[s.id]=setMove;
    if(performerEdited){m.settings.performerPhases??={};m.settings.performerPhases[p.id]??={};m.settings.performerPhases[p.id][s.id]={start,move};}
  }
  if(s.title!==$('dotTitle').value||s.measure!==$('dotMeasure').value)for(const r of project.rows.filter(r=>r.movement===active&&r.set===s.id)){r.title=$('dotTitle').value;r.measure=$('dotMeasure').value;r.status='corrected';}
  m.settings.dotNotes??={};m.settings.dotNotes[p.id]??={};if($('dotNote').value.trim())m.settings.dotNotes[p.id][s.id]=$('dotNote').value.trim().slice(0,500);else delete m.settings.dotNotes[p.id][s.id];
  if($('dotBpm').dataset.edited||$('dotSync').dataset.edited){m.settings.editDotAnchors??={};const a=m.settings.editDotAnchors[s.id]??={};if($('dotBpm').dataset.edited)a.bpm=bpm;if($('dotSync').dataset.edited)a.seconds=seconds;}
  rebuild();seek(count);changed();status(`Saved changes to set ${s.id}.`);dotError('Set saved.');
}
// UI wiring.
$('dotSize').oninput=()=>{project.field.dotSize=+$('dotSize').value;draw();changed();};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('importButton').onclick=()=>open('importDialog');$('pickPDF').onclick=()=>$('pdfInput').click();$('pdfInput').onchange=e=>{addPDFs(e.target.files);e.target.value='';};$('cancelImport').onclick=()=>{cancelled=true;$('importStatus').textContent='Cancelling after the current page…';};
$('dropZone').ondragover=e=>{e.preventDefault();$('dropZone').classList.add('drag');};$('dropZone').ondragleave=()=>$('dropZone').classList.remove('drag');$('dropZone').ondrop=e=>{e.preventDefault();$('dropZone').classList.remove('drag');addPDFs(e.dataTransfer.files);};
$('reviewButton').onclick=()=>{rowPage=0;renderReview();close('importDialog');open('reviewDialog');};$('openReview').onclick=()=>{renderReview();close('projectDialog');open('reviewDialog');};$('rawButton').onclick=()=>{renderRaw();open('rawDialog');};$('rawPage').onchange=showRaw;
$('rowSearch').oninput=$('issuesOnly').onchange=()=>{rowPage=0;renderReview();};$('prevRows').onclick=()=>{rowPage--;renderReview();};$('nextRows').onclick=()=>{rowPage++;renderReview();};
$('addRow').onclick=()=>{const r=Object.fromEntries(fields.map(k=>[k,'']));Object.assign(r,{id:uuid(),movement:active||'Movement 1',status:'corrected',source:'Manual',page:1,method:'manual'});project.rows.push(r);$('rowSearch').value='';$('issuesOnly').checked=false;rowPage=Math.floor((project.rows.length-1)/100);renderReview();changed();};
$('markReviewed').onclick=()=>{for(const r of filteredRows().slice(rowPage*100,rowPage*100+100)){if(coordinate(r.side,r.depth,project.field.step/36).valid&&r.instrument&&r.symbol&&r.label){r.status='verified';r.method='verified';r.parseWarning='';}}changed();renderReview();};
$('generate').onclick=()=>{rebuild();attachCurrentAudio();changed();close('reviewDialog');status(`Generated ${movements.length} movement(s). Check arrival counts in Set sequence → Edit before rehearsing.`);};
$('movement').onchange=()=>{pause();active=$('movement').value;manualSet=null;count=0;retainMarcherView();attachCurrentAudio();renderMovement();};
function showAsideTab(tab){const enteringEditor=tab==='dots'&&$('dotsPanel').hidden;for(const [name,panel]of [['sets','setsPanel'],['people','peoplePanel'],['dots','dotsPanel']]){$(panel).hidden=name!==tab;$(name==='sets'?'setsTab':name==='people'?'peopleTab':'dotsTab').classList.toggle('active',name===tab);}if(tab==='dots'){renderDotChoices();if(enteringEditor&&!setEditorWarningShown&&current()?.sets.length){setEditorWarningShown=true;const {m,s}=editContext();$('setEditorWarningSelected').textContent=`Currently selected: ${m.name}, set ${s?.id||'none'}.`;$('setEditorWarningDialog').showModal();}}}
$('setsTab').onclick=()=>showAsideTab('sets');$('peopleTab').onclick=()=>showAsideTab('people');$('dotsTab').onclick=()=>showAsideTab('dots');$('confirmSetSelection').onclick=()=>{close('setEditorWarningDialog');$('dotSet').focus();};$('search').oninput=()=>{renderPeople();draw();};$('keepBright').onchange=()=>{project.field.noSearchFade=$('keepBright').checked;draw();changed();};
$('dotPerson').onchange=()=>{editPersonId=$('dotPerson').value;if(selected!==editPersonId)isolateId='';selected=editPersonId;refreshDotEditor();draw();inspector();};
$('dotSet').onchange=()=>{editSetId=$('dotSet').value;refreshDotEditor();};
for(const id of ['dotStart','dotMove'])$(id).oninput=()=>{$(id).dataset.edited='yes';updateDotHold();};
$('dotDuration').oninput=()=>{const n=+$('dotDuration').value;if(n>0&&+$('dotSetMove').value>n)$('dotSetMove').value=n;updateDotHold();};
for(const id of ['dotBpm','dotSync'])$(id).oninput=()=>{$(id).dataset.edited='yes';};
for(const id of ['dotX','dotY'])$(id).onchange=()=>{const x=+$('dotX').value,y=+$('dotY').value;if($('dotX').value!==''&&$('dotY').value!==''&&x>=0&&x<=100&&y>=0&&y<=FIELD.width)setEditorPoint({x,y});};
for(const id of ['dotSide','dotDepth'])$(id).onchange=()=>{const point=coordinate($('dotSide').value,$('dotDepth').value,project.field.step/36);if(point.valid&&!point.errors.length){$('dotX').value=point.x.toFixed(4);$('dotY').value=point.y.toFixed(4);dotError('');}else dotError('Check the dot-card coordinate wording.');};
$('dotApplyNudge').onclick=()=>{const x=+$('dotX').value,y=+$('dotY').value,dx=+$('dotHorizontal').value,dy=+$('dotVertical').value,step=project.field.step/36;if(!$('dotX').value||!$('dotY').value||![x,y,dx,dy].every(Number.isFinite)||x+dx*step<0||x+dx*step>100||y+dy*step<0||y+dy*step>FIELD.width){dotError('Enter a valid dot and keep it on the field.');return;}setEditorPoint({x:x+dx*step,y:y+dy*step});dotError('Moved in the editor. Press Save dot and timing.');};
for(const [id,d] of [['dotPrev',-1],['dotNext',1]])$(id).onclick=()=>{const {m,p,i}=editContext(),point=p?.positions[m.sets[i+d]?.id];if(!point){dotError('There is no known dot in that neighboring set.');return;}setEditorPoint(point);dotError('Copied in the editor. Press Save dot and timing.');};
$('dotShiftApply').onclick=()=>{const shift=+$('dotShift').value,duration=+$('dotDuration').value;if(!Number.isFinite(shift)||!(duration+shift>0)){dotError('Arrival shift must leave a positive transition length.');return;}$('dotDuration').value=duration+shift;$('dotDuration').dispatchEvent(new Event('input'));$('dotShift').value=0;dotError('Arrival updated here. Press Save set changes.');};
$('dotSave').onclick=saveDotEdits;
$('dotReset').onclick=()=>{const {m,p,s}=editContext();if(!m||!p||!s)return;const rows=project.rows.filter(r=>r.movement===active&&r.set===s.id&&identity(r)===p.id);if(!rows.some(r=>r.originalSide!==undefined)){dotError('No original position is recorded for this dot.');return;}for(const r of rows){if(r.originalSide!==undefined){r.side=r.originalSide;r.depth=r.originalDepth;r.status='corrected';r.parseWarning='';delete r.originalSide;delete r.originalDepth;}}rebuild();changed();dotError('Original dot restored.');};
$('dotTimingReset').onclick=()=>{const {m,p,s}=editContext();if(!m||!p||!s)return;delete m.settings.performerPhases?.[p.id]?.[s.id];rebuild();changed();dotError('Default marcher timing restored.');};
$('dotRemoveSync').onclick=()=>{const {m,i,s}=editContext();if(!m||!s)return;const a=m.settings.editDotAnchors?.[s.id];if(a){if(a.syncCount!==undefined)m.settings.markers=m.settings.markers.filter(t=>!(t.count===a.syncCount&&t.seconds===a.seconds));delete a.seconds;delete a.syncCount;if(i===0)m.settings.offset=0;}else if(i>0)m.settings.markers=m.settings.markers.filter(t=>t.count!==starts(m.sets)[i]);else m.settings.offset=0;rebuild();seek(count);changed();dotError('Set audio anchor removed.');};
$('previous').onclick=()=>stepSet(-1);$('next').onclick=()=>stepSet(1);$('play').onclick=play;$('acceptPlaybackWarning').onclick=()=>{close('playbackWarningDialog');play();};$('stop').onclick=()=>{pause();seek(0);};$('restart').onclick=()=>{pause();seek(0);play();};$('timeline').oninput=()=>seek($('timeline').value);$('jump').onclick=()=>seek($('jumpCount').value);$('jumpSet').onchange=()=>goSet(+$('jumpSet').value);$('speed').onchange=()=>{audio.playbackRate=+$('speed').value;};$('bpm').onchange=()=>{const m=current(),n=+$('bpm').value;if(m&&n>0){pause();m.settings.bpm=n;seek(count);changed();}};
$('resetView').onclick=()=>{followId='';renderPeople();field.reset();inspector()};$('zoomIn').onclick=()=>{field.zoom=Math.min(8,field.zoom*1.3);field.view();};$('zoomOut').onclick=()=>{field.zoom=Math.max(1,field.zoom/1.3);field.view();};$('flip').onclick=()=>{project.field.flip=!project.field.flip;renderMovement();syncFieldInputs();changed();};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('fieldPanel').requestFullscreen();}catch{status('Fullscreen is unavailable in this browser.');}};
for(const id of ['labels','paths','ghosts'])$(id).onchange=()=>{project.field[id]=$(id).checked;renderMovement();changed();};
for(const id of ['ignoreLetterSets','playerIgnoreLetterSets'])$(id).onchange=()=>{
  const oldStart=+$('loopStart').value,oldEnd=+$('loopEnd').value;
  project.field.ignoreLetterSets=$(id).checked;
  $('ignoreLetterSets').checked=$('playerIgnoreLetterSets').checked=project.field.ignoreLetterSets;
  renderSets();
  const values=[...$('loopStart').options].map(o=>+o.value);
  const startsAt=values.filter(v=>v<=oldStart).at(-1)??values[0];
  const endValues=[...$('loopEnd').options].map(o=>+o.value);
  const endsAt=endValues.find(v=>v>=oldEnd)??endValues.at(-1);
  if(startsAt!==undefined)$('loopStart').value=String(startsAt);
  if(endsAt!==undefined)$('loopEnd').value=String(endsAt);
  draw();inspector();changed();
};
$('settingsButton').onclick=()=>{syncFieldInputs();open('settingsDialog');};$('applySettings').onclick=()=>{const n=+$('stepSize').value;if(!(n>0&&n<=100))return;project.field.step=n;for(const id of ['swap','grid','colors','calibration'])project.field[id]=$(id).checked;project.field.flip=$('orientation').checked;rebuild();changed();close('settingsDialog');};
$('editSets').onclick=()=>{if(document.body.dataset.device==='mobile')document.querySelector('[data-mobile-view="edit"]').click();else showAsideTab('dots');};$('saveSets').onclick=()=>{rebuild();changed();seek(0);close('setsDialog');};$('outgoingCounts').onclick=()=>{const m=current();if(!m)return;m.settings.durations={};for(let i=1;i<m.sets.length;i++){const values=[...new Set(project.rows.filter(r=>r.movement===active&&r.set===m.sets[i-1].id).map(r=>r.counts))];m.settings.durations[m.sets[i].id]=values.length===1&&+values[0]>0?+values[0]:null;}rebuild();renderSetEditor();changed();};
$('addSet').onclick=()=>{const m=current();if(!m)return;const name=prompt('New set identifier (for example 6B)');if(!name||m.sets.some(s=>s.id===name))return;const people=m.people.length?m.people:[{instrument:'',symbol:'',label:''}];for(const p of people)project.rows.push({id:uuid(),movement:active,instrument:p.instrument,symbol:p.symbol,label:p.label,set:name,title:'',measure:'',counts:'',side:'',depth:'',source:'Manual',page:1,method:'manual',status:'missing'});rebuild();renderSetEditor();changed();};
$('syncButton').onclick=openTiming;$('audioButton').onclick=()=>{if(!current()){status('Import and generate a movement before attaching show audio.',true);return;}$('audioInput').click();};$('attachAudio').onclick=()=>$('audioInput').click();$('audioInput').onchange=e=>{addAudio(e.target.files[0]);e.target.value='';};$('removeAudio').onclick=()=>{pause();const url=audioUrls.get(active);if(url)URL.revokeObjectURL(url);audioUrls.delete(active);audioBlobs.delete(active);audioNames.delete(active);attachCurrentAudio();changed();draw();};$('volume').oninput=()=>{audio.volume=+$('volume').value;};
$('applyTiming').onclick=()=>{const m=current();if(!m)return;try{const settings={...m.settings,holdMode:$('titleHolds').checked?'title':'off',naturalArrival:$('naturalArrival').checked,bpm:+$('baseBpm').value,offset:+$('offset').value,beats:+$('beats').value,subdivision:+$('subdivision').value,countIn:+$('countIn').value,tempo:parsePairs($('tempoMap').value,'bpm'),markers:parsePairs($('syncMap').value,'seconds'),editDotAnchors:{}};validateTiming(settings);if(!(settings.beats>0&&settings.countIn>=0&&settings.countIn<=32))throw Error('Check beats and count-in.');m.settings=settings;rebuild();$('bpm').value=settings.bpm;seek(count);changed();close('timingDialog');status('Timing saved. Sync markers align your drill to the audio clock.');}catch(e){alert(e.message);}};
$('projectButton').onclick=()=>open('projectDialog');$('saveProject').onclick=()=>save();$('loadProject').onclick=()=>load().catch(e=>status(e.message,true));$('projectName').onchange=changed;$('exportJSON').onclick=()=>download('fieldbook-project.json',JSON.stringify(snapshot(),null,2),'application/json');$('exportCSV').onclick=exportCSV;$('importJSON').onclick=()=>$('jsonInput').click();$('jsonInput').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{applyProject(JSON.parse(await file.text()));changed();close('projectDialog');status('Project imported. Reattach audio files for this device.');}catch(err){status(err.message,true);}e.target.value='';};$('newProject').onclick=()=>{if(!confirm('Start an empty project? Export JSON first if you want to keep the current one.'))return;applyProject({version:1,name:'My marching show',rows:[],pages:[],files:[],settings:{},field:{step:22.5,swap:false,flip:false,grid:false,colors:true,labels:true,paths:true,ghosts:false,calibration:false}});changed();close('projectDialog');};
audio.addEventListener('loadedmetadata',()=>{seek(count);draw();});audio.addEventListener('error',()=>{if(audioUrls.has(active)){pause();status('This audio format could not be decoded. Try MP3 or WAV.',true);}});
document.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea,button')||document.querySelector('dialog[open]'))return;if(e.code==='Space'){e.preventDefault();play();}else if(e.key==='ArrowRight'){e.preventDefault();stepSet(1);}else if(e.key==='ArrowLeft'){e.preventDefault();stepSet(-1);}else if(e.key==='Escape'){pause();seek(0);}});
window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
rebuild();syncFieldInputs();requestAnimationFrame(frame);

$('updatesButton').onclick=()=>open('updatesDialog');
$('templatesButton').onclick=()=>open('templatesDialog');
let atlantisLoading=false;
async function loadAtlantis(startup=false){if(atlantisLoading)return;if(!startup&&project.rows.length&&!confirm('Load Atlantis and replace the current project? Export your project first to keep it.'))return;atlantisLoading=true;const revision=projectRevision;const button=$('atlantisTemplate');button.disabled=true;if(startup)status('Loading Atlantis…');$('templateStatus').textContent='Loading Atlantis and three movement tracks…';try{const pr=await fetch('templates/atlantis/project.json?v=14');if(!pr.ok)throw Error('Template could not load.');const data=await pr.json();const tracks=await Promise.all(Object.entries(data.settings).map(async([name,s])=>{if(!/^movement-[123]\.mp3$/.test(s.audioFile))throw Error('Invalid template audio file.');const r=await fetch('templates/atlantis/'+s.audioFile);if(!r.ok)throw Error('Movement audio could not load.');return {name,blob:await r.blob(),label:s.audioFile.replace('movement-','AtlantisMvnt')};}));if(startup&&(projectRevision!==revision||project.rows.length||busy))return;applyProject(data);followId='';pathIds.clear();for(const {name,blob,label}of tracks){audioBlobs.set(name,blob);audioNames.set(name,label);audioUrls.set(name,URL.createObjectURL(blob));}attachCurrentAudio();if(!startup)changed();if($('templatesDialog').open)close('templatesDialog');status('Atlantis loaded with separate movement tracks and score tempos. Movement 1 delay: 12.7s. See Audio & timing for score/recording alignment notes.');}catch(e){$('templateStatus').textContent=e.message;if(startup)status('Atlantis could not load. Open Current shows to try again. '+e.message,true);}finally{button.disabled=false;atlantisLoading=false;}}
$('atlantisTemplate').onclick=()=>loadAtlantis();

$('toggleLabels').onclick=()=>{project.field.labels=!project.field.labels;$('labels').checked=project.field.labels;renderMovement();changed();};
$('alignAtAudio').onclick=()=>{try{const m=current();if(!m||!audioUrls.has(active))throw Error('Attach movement audio first.');if(m.sets.some(s=>s.timingIssue))throw Error('Correct missing transition counts before aligning sets.');const i=+$('alignSet').value,c=starts(m.sets)[i],seconds=$('timingPreview').currentTime;if(i===0)$('offset').value=seconds.toFixed(3);else{const markers=parsePairs($('syncMap').value,'seconds').filter(a=>a.count!==c);markers.push({count:c,seconds});markers.sort((a,b)=>a.count-b.count);$('syncMap').value=markers.map(a=>`${a.count}, ${a.seconds.toFixed(3)}`).join('\n');}}catch(e){alert(e.message);}};
$('timingDialog').addEventListener('close',()=>$('timingPreview').pause());

$('playerSet').onchange=()=>goSet(+$('playerSet').value);
$('playerMovement').onchange=()=>{$('movement').value=$('playerMovement').value;$('movement').dispatchEvent(new Event('change'));};
setupDevice({pause,fit:()=>{followId='';renderPeople();field.reset();inspector();}});

let phasePersonId='';
function refreshPerformerTiming(){const m=current(),p=m?.people.find(p=>p.id===phasePersonId),i=+$('performerTarget').value,s=m?.sets[i];if(!p||!s)return;const phase=p.motionPhases[s.id];$('performerStart').value=phase.start;$('performerMove').value=phase.move;$('performerPhaseInfo').textContent=`${m.sets[i-1].id} → ${s.id}: ${s.duration} total counts. ${phase.custom?'Custom timing.':phase.estimated?'Estimated earlier arrival.':'Phrase default.'} Remaining counts after marching hold at the destination.`;}
function openPerformerTiming(id){const m=current(),p=m?.people.find(p=>p.id===id);if(!p)return;phasePersonId=id;$('performerPhaseName').textContent=`${p.instrument} ${p.symbol}${p.label}`;$('performerTarget').replaceChildren();m.sets.forEach((s,i)=>{if(i)$('performerTarget').append(new Option(`${m.sets[i-1].id} → ${s.id}`,i));});$('performerTarget').value=Math.max(1,located().next);refreshPerformerTiming();open('performerTimingDialog');}
$('performerTarget').onchange=refreshPerformerTiming;
$('savePerformerPhase').onclick=()=>{const m=current(),p=m.people.find(p=>p.id===phasePersonId),i=+$('performerTarget').value,s=m.sets[i],start=+$('performerStart').value,move=+$('performerMove').value,a=p.positions[m.sets[i-1].id],b=p.positions[s.id];if(!Number.isFinite(start)||!Number.isFinite(move)||start<0||move<0||start+move>s.duration||(move===0&&a&&b&&Math.hypot(a.x-b.x,a.y-b.y)>1e-8)){alert('Keep start + march counts within the total. A moving marcher needs positive march counts.');return;}m.settings.performerPhases??={};m.settings.performerPhases[p.id]??={};m.settings.performerPhases[p.id][s.id]={start,move};rebuild();changed();close('performerTimingDialog');};
$('resetPerformerPhase').onclick=()=>{const m=current(),s=m.sets[+$('performerTarget').value];delete m.settings.performerPhases?.[phasePersonId]?.[s.id];rebuild();changed();refreshPerformerTiming();};

// Resume saved corrections automatically; new browsers start with Atlantis.
(async()=>{try{const data=await get('project');if(data?.rows?.length&&!project.rows.length&&!busy){const savedAudio=await get('audio')||[];applyProject(data);for(const {name,blob,label}of savedAudio){audioBlobs.set(name,blob);audioNames.set(name,label);audioUrls.set(name,URL.createObjectURL(blob));}attachCurrentAudio();status('Your saved show and dot corrections are ready.');return;}}catch(e){status('Could not restore your browser save. '+e.message,true);}if(!project.rows.length&&!busy)loadAtlantis(true);})();


