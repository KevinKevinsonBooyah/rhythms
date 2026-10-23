/* Update 46: profile text filtering, controls below stats, and new-update notes. */
const RELEASE46='46',filter46=globalThis.rhythmsTextFilter;
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
function installUpdate46(){
 cleanLocalProfile46();const aliasChange=$('playerAlias').onchange,saveProfile=$('saveProfile').onclick;
 $('playerAlias').onchange=event=>{try{filter46.validate(event.target.value,'name');event.target.setCustomValidity('');event.target.removeAttribute('aria-invalid');return aliasChange(event)}catch(error){event.target.setCustomValidity(error.message);event.target.setAttribute('aria-invalid','true');$('profileActionStatus').textContent=error.message}};
 $('saveProfile').onclick=event=>{if(validProfile46())return saveProfile(event)};
 for(const id of ['playerAlias','playerBio'])$(id).addEventListener('input',()=>{$(id).setCustomValidity('');$(id).removeAttribute('aria-invalid')});
 const stats=document.querySelector('main>.stats'),toolbar=document.querySelector('.toolbar');stats.after(toolbar);placeSliders44();
 const dialog=$('updatesDialog');dialog.querySelector('h2').textContent='Rhythms · Update '+RELEASE46;dialog.querySelector('ul').replaceChildren();
 for(const message of ['Names and bios now filter profanity and slurs. Existing matching profile and leaderboard text is hidden.','Level, Intensity, and Tempo controls now sit directly below Accuracy, Hits, and Best streak.','New update notes open once after an update. This log shows only the current release.','Modded is on by default. Your saved toggle choice is preserved.']){const item=document.createElement('li');item.textContent=message;dialog.querySelector('ul').append(item)}
 document.querySelector('.version-chip').textContent='v'+RELEASE46;
}
