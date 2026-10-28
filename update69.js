function syncBox69(){const on=cfg.playMode==='maker'&&!sharedView58&&!running&&!starting;$('makerSelectTools68').hidden=!on;$('viewport').classList.toggle('box-lock69',on&&makerBox68);$('score').classList.toggle('box-select68',on&&makerBox68)}
const decorateBefore69=editorDecorateScore;editorDecorateScore=function(){const r=decorateBefore69();if($('makerSelectTools68'))syncBox69();return r};
const syncBefore69=syncMode;syncMode=function(){const r=syncBefore69();if($('makerSelectTools68'))syncBox69();return r};
function installUpdate69(){
 $('kevinBell68')?.remove();$('onlineLink').removeAttribute('href');$('onlineLink').hidden=true;
 const past=document.createElement('a');past.id='pastVersions69';past.className='action-link';past.href='./past-versions.html';past.target='_blank';past.rel='noopener';past.textContent='Past Versions';$('onlineLink').after(past);
 const tools=$('makerSelectTools68');$('scoreStage').append(tools);$('makerBox68').textContent='▧ Box select';$('makerBox68').addEventListener('click',syncBox69);$('makerSelected68').hidden=true;
 document.addEventListener('selectstart',e=>e.preventDefault());document.addEventListener('dragstart',e=>e.preventDefault());
 const details=$('profileDetails55'),hero=details.querySelector('.profile-hero');const editor=document.createElement('section');editor.className='profile-editor69';for(const el of [details.querySelector('.profile-picture-actions'),$('playerAlias').closest('label'),$('playerBio').closest('label'),details.querySelector('.profile-save-row')])if(el)editor.append(el);hero.after(editor);
 const advanced=document.createElement('details');advanced.className='profile-advanced69';advanced.innerHTML='<summary>Save & transfer tools</summary>';const content=document.createElement('div');content.className='profile-transfer69';for(const id of ['saveCloud','loadCloud','exportSave','importSave','saveFile'])content.append($(id));advanced.append(content);details.append(advanced);details.append(past);$('accountDialog').querySelector('h2').textContent='Profile';$('accountStatus').classList.add('profile-status69');
 const oldStop=stop;stop=function(...a){const r=oldStop(...a);syncBox69();return r};syncBox69();
 $('viewport').addEventListener('touchmove',e=>{if($('viewport').classList.contains('box-lock69'))e.preventDefault()},{passive:false});
}
