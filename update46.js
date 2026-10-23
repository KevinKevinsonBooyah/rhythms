/* Update 46: profile text filtering, controls below stats, and new-update notes. */
const RELEASE46='50',filter46=globalThis.rhythmsTextFilter;
function cleanLocalProfile46(){
 const raw=localStorage.getItem('beatbounce-alias');if(raw&&filter46.blocked(raw)){localStorage.setItem('beatbounce-alias','Player');$('playerAlias').value='Player'}
 const bio=localStorage.getItem(BIO_KEY);if(bio&&filter46.blocked(bio))localStorage.setItem(BIO_KEY,'');
}
const avatarBefore46=renderAvatar33;renderAvatar33=function(){cleanLocalProfile46();return avatarBefore46()};
const boardBefore46=renderBoard;renderBoard=function(rows,label){return boardBefore46(rows.map(row=>({...row,alias:filter46.publicName(row.alias)})),label)};
const leaderBefore46=openLeaderProfile36;openLeaderProfile36=async function(row,online){await leaderBefore46({...row,alias:filter46.publicName(row.alias)},online);const bio=$('leaderProfileBio');bio.textContent=filter46.publicBio(bio.textContent);if(filter46.blocked($('leaderProfileName').textContent))$('leaderProfileName').textContent='Player'};
const cloudBefore46=initCloud;initCloud=async function(){try{return await cloudBefore46()}finally{cleanLocalProfile46();$('playerAlias').value=filter46.publicName($('playerAlias').value);if(filter46.blocked($('playerBio').value)){$('playerBio').value='';localStorage.removeItem(BIO_KEY)}syncBioCount36();renderAvatar33()}};
function validProfile46(){
 for(const [id,field] of [['playerAlias','name'],['playerBio','bio']]){const input=$(id);try{filter46.validate(input.value,field);input.setCustomValidity('');input.removeAttribute('aria-invalid')}catch(error){input.setCustomValidity(error.message);input.setAttribute('aria-invalid','true');$('profileActionStatus').textContent=error.message;input.reportValidity();return false}}
 return true;
}
placeSliders44=function(){
 const panel=$('mobileSliders44');if(!panel)return;const mobile=document.body.dataset.device==='mobile';
 document.querySelector('.toolbar').prepend(panel);
 for(const {control,marker} of mobileControls44){if(mobile)panel.append(control);else marker.after(control)}panel.hidden=!mobile;
};
function maybeShowUpdate46(){
 let seen=null;try{seen=localStorage.getItem('rhythms-last-seen-update')}catch(e){}
 if(seen===RELEASE46)return;
 if($('deviceChoice').open){$('deviceChoice').addEventListener('close',maybeShowUpdate46,{once:true});return}
 if(!document.querySelector('dialog[open]')){$('updatesDialog').showModal();try{localStorage.setItem('rhythms-last-seen-update',RELEASE46)}catch(e){}}
}
// Keep the existing controls and handlers while consolidating their location.
const syncMenuBefore47=syncMode;
syncMode=function(){const result=syncMenuBefore47();const tools=$('moddedTools');if(tools?.parentElement?.classList.contains('modifier-controls'))tools.parentElement.hidden=tools.hidden;return result};
function installMenu47(){
 $('help').replaceWith($('device'));$('updates').textContent='Updates';
 const notice=$('impossibleLockNotice');
 const experience=document.createElement('section');experience.id='experienceSettings47';experience.className='section poly-keep';experience.innerHTML='<h3>Modded</h3><div class="setting"><label for="moddedToggle">Modded<small>Gold, cosmetics, and the shop.</small></label></div>';
 const oldModded=$('moddedToggle').closest('label');experience.querySelector('.setting').append($('moddedToggle'));oldModded.remove();notice.after(experience);
 const hints=document.createElement('section');hints.id='hintSettings47';hints.className='section poly-keep';hints.innerHTML='<h3>Hints & display</h3>';
 for(const [id,title,description] of [['showCounts','Beat counts','Show counting hints below the score.'],['showPlayhead','Moving bar','Off: pulse at each measure. The camera still follows.']]){const row=document.createElement('div');row.className='setting';const label=document.createElement('label');label.htmlFor=id;label.append(document.createTextNode(title));const small=document.createElement('small');small.textContent=description;label.append(small);row.append(label,$(id));hints.append(row)}experience.after(hints);
 $('description').after($('roundLabel'));document.querySelector('main>.hints-bar').remove();
 const guideRow=$('guide').closest('.setting'),playback=guideRow.closest('.section');
 for(const [id,title] of [['loop','Repeat rhythm'],['metro','Metronome']]){const row=document.createElement('div');row.className='setting';const label=document.createElement('span');label.className='setting-label47';label.textContent=title;row.append(label,$(id));playback.insertBefore(row,guideRow)}
 $('guide').hidden=true;guideRow.querySelector('label').removeAttribute('for');guideRow.append($('snare'));
 for(const id of ['loop','metro','snare'])$(id).classList.add('settings-button47');
 const nav=$('settingsNav');for(const [id,title] of [['hintSettings47','Hints & display'],['experienceSettings47','Modded']]){const button=document.createElement('button');button.type='button';button.textContent=title;button.dataset.section=id;button.onclick=()=>{const body=$('settings').querySelector('.modal-body'),top=body.scrollTop+$(id).getBoundingClientRect().top-body.getBoundingClientRect().top-nav.getBoundingClientRect().height-14;body.scrollTo({top:Math.max(0,top),behavior:'instant'})};nav.prepend(button)}
 syncMode();
}
function installUpdate46(){
 installMenu47();cleanLocalProfile46();const aliasChange=$('playerAlias').onchange,saveProfile=$('saveProfile').onclick;
 $('playerAlias').onchange=event=>{try{filter46.validate(event.target.value,'name');event.target.setCustomValidity('');event.target.removeAttribute('aria-invalid');return aliasChange(event)}catch(error){event.target.setCustomValidity(error.message);event.target.setAttribute('aria-invalid','true');$('profileActionStatus').textContent=error.message}};
 $('saveProfile').onclick=event=>{if(validProfile46())return saveProfile(event)};
 for(const id of ['playerAlias','playerBio'])$(id).addEventListener('input',()=>{$(id).setCustomValidity('');$(id).removeAttribute('aria-invalid')});
 const stats=document.querySelector('main>.stats'),toolbar=document.querySelector('.toolbar');stats.after(toolbar);placeSliders44();
 const dialog=$('updatesDialog');dialog.querySelector('h2').textContent='Rhythms · Update '+RELEASE46;dialog.querySelector('ul').replaceChildren();
 for(const message of ['Count-in loading status and Stop controls that only appear during a run.','Removed Legacy modes and Strange. The browser tab is now simply Rhythms.','Rhythm Maker supports wheel/swipe scrolling, clickable barlines for meter changes, and deleting notes into equal-value rests, including tuplets.','All scores have a visible bottom scrollbar. Endless round labels are centered.','Shop prices are halved, with a gold Shop button and a matching wallet coin.','A dismissible sign-in reminder appears once after device selection.','High-level tempos are checked against note density, with gentler changes between measures.','Rhythm Maker has its own leaderboard; complete a rhythm with at least four notes to rank.']){const item=document.createElement('li');item.textContent=message;dialog.querySelector('ul').append(item)}
 document.querySelector('.version-chip').textContent='v'+RELEASE46;
}
