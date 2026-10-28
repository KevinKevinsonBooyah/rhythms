import {createOwner61} from './owner-gateway61.js';
import './release.js?v=68';
import {createSocial57} from './social-gateway57.js?v=68';
import {appendBackup55,readHistory55,listBackups55,unpackBackup55} from './save-history55.js';
import './text-filter.js?v=46';
const filter=globalThis.rhythmsTextFilter;
const MODES=['standard','endless','impossible','echo','polyrhythms','maker'];
// Reuse the retired legacy score slot with an explicit format marker. This keeps
// Maker scores compatible with the already-published Firestore rules. Unmarked
// Strange scores are never shown as Maker scores or included in Overall.
const makerRecord=s=>s?.mode==='strange'&&typeof s.date==='string'&&s.date.startsWith('maker:');
const visibleBest=best=>Object.fromEntries(MODES.map(mode=>[mode,mode==='maker'?(best.maker||(makerRecord(best.strange)?{...best.strange,mode:'maker',date:best.strange.date.slice(6)}:null)):best[mode]]).filter(([,v])=>v));
const SAVE_KEYS=['pulse-rhythm-v1','pulse-modded-v1','pulse-maker-v1','beatbounce-scores','beatbounce-alias','rhythms-avatar-v1'];
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const name=filter.publicName;
const conflict=()=>Object.assign(new Error('Another device changed your cloud save. Load it before saving again.'),{status:409});
function cleanSave(save){
 if(save?.format!=='beatbounce-save'||save.version!==1||!save.data||typeof save.data!=='object')throw Error('Invalid save');
 const data={};for(const key of SAVE_KEYS){const val=save.data[key];if(val===undefined)continue;if(typeof val!=='string'||val.length>500000)throw Error('Invalid save entry');if(key!=='beatbounce-alias'&&key!=='rhythms-bio-v1')JSON.parse(val);
  if(key==='rhythms-bio-v1'&&val.length>180)throw Error('Bio is too long');
  if(key==='rhythms-avatar-v1'){const avatar=JSON.parse(val);if(!avatar||typeof avatar.image!=='string'||avatar.image.length>120000||!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(avatar.image))throw Error('Invalid profile picture')}
  if(key==='beatbounce-alias')filter.validate(val,'name');
  data[key]=val;
 }return {format:'beatbounce-save',version:1,data};
}
function cleanScore(s){
 if(!s||!MODES.includes(s.mode))throw Error('Unknown mode');
 filter.validate(s.alias,'name');
 for(const key of ['hits','misses','extras','best','level'])if(!Number.isInteger(s[key])||s[key]<0||s[key]>100000)throw Error('Invalid score');
 if(s.level>13||s.best>s.hits||s.hits+s.misses<4)throw Error('Invalid run');
 const score=Math.max(0,Math.round((s.hits*100+s.best*15)*(1+s.level*.1)*(s.hits/Math.max(1,s.hits+s.misses+s.extras))));
 return {mode:s.mode,score,alias:name(s.alias),level:s.level,accuracy:Math.round(s.hits/Math.max(1,s.hits+s.misses+s.extras)*10000)/100,date:new Date().toISOString()};
}
function cleanProfile(p){
 filter.validate(p?.alias,'name');filter.validate(p?.bio,'bio');
 if(typeof p?.bio!=='string'||p.bio.length>180||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(p.bio))throw Error('Invalid bio');
 if(typeof p?.avatar!=='string'||p.avatar.length>120000||(p.avatar&&!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(p.avatar)))throw Error('Invalid profile picture');
 return {alias:name(p.alias),bio:p.bio,avatar:p.avatar};
}
export function createGateway({auth,db,sdk,randomId=()=>crypto.randomUUID()}){
 const {doc,getDoc,setDoc,collection,getDocs,runTransaction}=sdk;
 const social57=createSocial57({auth,db,sdk});
 const ref=(path,id)=>doc(db,path,id);
 async function ownerIds(){try{const data=(await getDoc(ref('meta','owner'))).data()||{};return new Set([data.uid,data.uid2,...(Array.isArray(data.uids)?data.uids:[])].filter(id=>typeof id==='string'&&id.length>0))}catch(e){return new Set()}}
 const owner61=createOwner61({auth,db,sdk,ownerIds,cleanSave,appendBackup55,randomId,conflict,json});
 async function api(path,options={}){
  const url=new URL(path,location.origin),method=options.method||'GET',uid=auth.currentUser?.uid,user=auth.currentUser;
  try{
   if(url.pathname.startsWith('/api/owner/')||url.pathname==='/api/gifts/claim')return await owner61(url,options);
   if(url.pathname.startsWith('/api/community/'))return await social57(url,options);
   if(url.pathname==='/api/me'&&method==='GET'){
    let alias=null;
    if(uid){
     const profile=ref('profiles',uid),existing=await getDoc(profile);
     alias=existing.exists()?name(existing.data()?.alias):name(user.displayName);
     if(!existing.exists())await setDoc(profile,{alias,bio:'',avatar:'',picture:(user.photoURL||'').slice(0,500)});
     const rank=await getDoc(ref('ranks',uid)),rankAlias=rank.data()?.alias;
     if(rankAlias&&rankAlias!=='Player'&&alias===name(user.displayName)&&rankAlias!==alias){alias=name(rankAlias);await setDoc(profile,{alias},{merge:true})}
    }
    const owners=uid?await ownerIds():new Set();
    return json({user:uid?{id:uid,signedIn:true,name:alias,alias,picture:user.photoURL||'',isOwner:owners.has(uid)}:null});
   }
   if(url.pathname==='/api/leaderboard'&&method==='GET'){
    const mode=url.searchParams.get('mode')||'all';if(mode!=='all'&&!MODES.includes(mode))throw Error('Unknown mode');
    const [snap,owners]=await Promise.all([getDocs(collection(db,'ranks')),ownerIds()]);
    const rows=[];snap.forEach(item=>{const data=item.data(),best=visibleBest(data.best||{});
     const score=mode==='all'?Object.values(best).reduce((n,v)=>n+Number(v?.score||0),0):Number(best[mode]?.score||0);
     if(score>0)rows.push({alias:name(data.alias),score,profileId:item.id,isOwner:owners.has(item.id)});
    });rows.sort((a,b)=>b.score-a.score);return json({rows:rows.slice(0,100)});
   }
   if(url.pathname.startsWith('/api/profile/')&&url.pathname!=='/api/profile/me'&&method==='GET'){
    const id=url.pathname.slice('/api/profile/'.length);if(!/^[A-Za-z0-9_-]{5,128}$/.test(id))return json({error:'Profile unavailable'},404);
    const [p,r,owners]=await Promise.all([getDoc(ref('profiles',id)),getDoc(ref('ranks',id)),ownerIds()]);
    if(!p.exists()&&!r.exists())return json({error:'Profile unavailable'},404);const data=p.data()||{};
    return json({alias:name(data.alias||r.data()?.alias),bio:filter.publicBio(data.bio),avatar:data.avatar||'',picture:data.picture||'',isOwner:owners.has(id)});
   }
   if(!uid)return json({error:'Sign in required'},401);
   if(url.pathname==='/api/profile/me'&&method==='GET'){
    const p=await getDoc(ref('profiles',uid)),data=p.data()||{alias:user.displayName,bio:'',avatar:''};return json({...data,alias:name(data.alias),bio:filter.publicBio(data.bio)});
   }
   if(url.pathname==='/api/profile'&&method==='PUT'){
    const data=cleanProfile(JSON.parse(options.body));await setDoc(ref('profiles',uid),{...data,picture:user.photoURL||''},{merge:true});
    const rank=ref('ranks',uid);await runTransaction(db,async t=>{const old=await t.get(rank);if(old.exists())t.set(rank,{...old.data(),alias:data.alias})});
    return json({saved:true});
   }
   if(url.pathname==='/api/owner-grant'&&method==='POST'){
    if(!(await ownerIds()).has(uid))return json({error:'Owner access required'},403);
    const body=JSON.parse(options.body),incoming=cleanSave(body.save),release=globalThis.RHYTHMS_RELEASE,newTag=randomId();let output;
    await runTransaction(db,async t=>{const r=ref('saves',uid),snap=await t.get(r),old=snap.data(),ledger=old?.payload?.ownerRewards58||{};
     if(ledger[release]){output={granted:false,release};return}
     if((old?.etag||null)!==body.etag)throw conflict();
     const economy=JSON.parse(incoming.data['pulse-modded-v1']||'{}');economy.gold=Math.max(0,Math.floor(Number(economy.gold)||0))+100000;
     const save={...incoming,data:{...incoming.data,'pulse-modded-v1':JSON.stringify(economy)}};
     const at=new Date().toISOString(),payload=await appendBackup55(old?.payload,save,{id:newTag,at,reason:'manual',legacyId:old?.etag});
     payload.ownerRewards58={...ledger,[release]:at};t.set(r,{payload,etag:newTag});output={granted:true,release,amount:100000,save:cleanSave(payload),etag:newTag};
    });return json(output);
   }
   if(url.pathname==='/api/save'&&method==='GET'){
    const s=await getDoc(ref('saves',uid));return json({save:s.data()?.payload||null,etag:s.data()?.etag||null});
   }
   if(url.pathname==='/api/save'&&method==='PUT'){
    const body=JSON.parse(options.body),save=cleanSave(body.save);
    if(body.etag!==null&&typeof body.etag!=='string')throw Error('Invalid save version');
    const etag=typeof body.requestId==='string'&&/^[A-Za-z0-9_-]{8,80}$/.test(body.requestId)?body.requestId:randomId(),at=new Date().toISOString(),reason=['run','manual','before-restore','recovery'].includes(body.reason)?body.reason:'manual';
    await runTransaction(db,async t=>{const r=ref('saves',uid),s=await t.get(r),old=s.data();if(old?.etag===etag)return;
     if((s.exists()?old?.etag:null)!==body.etag)throw conflict();const payload=await appendBackup55(old?.payload,save,{id:etag,at,reason,legacyId:old?.etag});payload.ownerRewards58=old?.payload?.ownerRewards58||{};t.set(r,{payload,etag});
    });return json({etag});
   }
   if(url.pathname==='/api/backups'&&method==='GET'){
    const s=await getDoc(ref('saves',uid)),data=s.data();return json({backups:listBackups55(data?.payload,data?.etag),limit:50,etag:data?.etag||null});
   }
   const backupMatch=url.pathname.match(/^\/api\/backups\/([A-Za-z0-9_-]{8,80})(\/restore)?$/);
   if(backupMatch){
    const id=backupMatch[1];
    if(!backupMatch[2]&&method==='GET'){const s=await getDoc(ref('saves',uid)),payload=s.data()?.payload,history=readHistory55(payload),item=history.items.find(i=>i.id===id);if(!item&&s.data()?.etag===id&&payload)return json({backup:{id,at:payload.savedAt55||null,reason:'previous'},save:cleanSave(payload),etag:id});if(!item)return json({error:'Backup unavailable'},404);return json({backup:{id:item.id,at:item.at,reason:item.reason,meta:item.meta},save:cleanSave(await unpackBackup55(item,history)),etag:s.data()?.etag||null})}
    if(backupMatch[2]&&method==='POST'){
     const body=JSON.parse(options.body),before=cleanSave(body.before),etag=randomId(),beforeId=randomId(),at=new Date().toISOString();let save;
     await runTransaction(db,async t=>{const r=ref('saves',uid),s=await t.get(r),old=s.data();if(!old||old.etag!==body.etag)throw conflict();const history=readHistory55(old.payload),item=history.items.find(i=>i.id===id);if(id==='device-recovery')save=cleanSave(body.recovery);else if(item)save=cleanSave(await unpackBackup55(item,history));else if(id===old.etag)save=cleanSave(old.payload);else throw Error('Backup unavailable');const protectedPayload=await appendBackup55(old.payload,before,{id:beforeId,at,reason:'before-restore',legacyId:old.etag});const payload=await appendBackup55(protectedPayload,save,{id:etag,at,reason:'restored',legacyId:beforeId});payload.ownerRewards58=old?.payload?.ownerRewards58||{};t.set(r,{payload,etag})});return json({save,etag});
    }
   }
   if(url.pathname==='/api/score'&&method==='POST'){
    const score=cleanScore(JSON.parse(options.body)),rank=ref('ranks',uid);
    let bestScore=score.score;await runTransaction(db,async t=>{const profile=await t.get(ref('profiles',uid));if(profile.exists())score.alias=name(profile.data()?.alias);const old=await t.get(rank),data=old.data()||{best:{}},best={...(data.best||{})};
     const prior=visibleBest(best)[score.mode];
     if(!prior||prior.score<score.score){if(score.mode==='maker')best.strange={...score,mode:'strange',date:'maker:'+score.date};else best[score.mode]=score.level===13?{...score,level:12,date:'level13:'+score.date}:score}
     bestScore=visibleBest(best)[score.mode].score;t.set(rank,{alias:score.alias,best});
    });return json({score:bestScore});
   }
   return json({error:'Not found'},404);
  }catch(e){return json({error:e?.message||'Request failed.'},e?.status||(/permission-denied/.test(e?.code||'')?403:400))}
 }
 return api;
}
export {cleanSave,cleanScore,cleanProfile};

