// Versioned cloud snapshots share the existing account-private save document.
export const BACKUP_LIMIT55=50,BACKUP_BYTES55=850000;
const encoder=new TextEncoder(),MAX_DECODE55=3500000;
const bytes55=value=>encoder.encode(JSON.stringify(value)).length;
async function streamBytes55(stream,limit){const reader=stream.getReader(),parts=[];let size=0;try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Backup is too large');parts.push(value)}}finally{await reader.cancel().catch(()=>{})}const all=new Uint8Array(size);let at=0;for(const part of parts){all.set(part,at);at+=part.length}return all}
async function pack55(save){const raw=JSON.stringify(save);if(typeof CompressionStream!=='function')return{encoding:'json',body:raw};const data=await streamBytes55(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip')),MAX_DECODE55);let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));return{encoding:'gzip',body:btoa(binary)}}
export async function unpackBackup55(item,history){
 if(!item||typeof item.body!=='string')throw Error('Backup unavailable');let raw;
 if(item.encoding==='gzip'){if(typeof DecompressionStream!=='function')throw Error('This browser cannot open compressed backups. Please update your browser.');const binary=atob(item.body),data=Uint8Array.from(binary,c=>c.charCodeAt(0));raw=new TextDecoder().decode(await streamBytes55(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip')),MAX_DECODE55))}
 else if(item.encoding==='json')raw=item.body;else throw Error('Unknown backup format');
 const save=JSON.parse(raw);if(item.avatar&&history.avatars?.[item.avatar])save.data['rhythms-avatar-v1']=history.avatars[item.avatar];return save;
}
export function readHistory55(payload){const h=payload?.backups55;return h?.version===1&&Array.isArray(h.items)?{version:1,items:h.items.filter(i=>i&&typeof i.id==='string'&&typeof i.body==='string').slice(0,BACKUP_LIMIT55),avatars:h.avatars&&typeof h.avatars==='object'?h.avatars:{}}:{version:1,items:[],avatars:{}}}
export function backupMeta55(save){let cfg={},economy={};try{cfg=JSON.parse(save.data['pulse-rhythm-v1']||'{}');economy=JSON.parse(save.data['pulse-modded-v1']||'{}')}catch(e){}return{mode:String(cfg.playMode||'standard').slice(0,20),level:Number(cfg.level)||0,bpm:Number(cfg.bpm)||60,meter:String(cfg.meter||'4/4').slice(0,10),bars:Number(cfg.bars)||8,gold:Math.max(0,Number(economy.gold)||0)}}
export function listBackups55(payload,etag){const history=readHistory55(payload);if(payload&&etag&&!history.items.length)return[{id:etag,at:payload.savedAt55||null,reason:'previous',meta:backupMeta55(payload),current:true}];return history.items.map(({id,at,reason,meta})=>({id,at,reason,meta,current:id===etag}))}
export async function appendBackup55(previous,save,{id,at,reason='manual',legacyId}){
 const history=readHistory55(previous),avatars={...history.avatars};
 async function entry(value,entryId,date,why){const data={...value.data},avatar=data['rhythms-avatar-v1'];let avatarId;
  if(avatar){avatarId=Object.keys(avatars).find(key=>avatars[key]===avatar)||'avatar-'+entryId;avatars[avatarId]=avatar;delete data['rhythms-avatar-v1']}
  return{id:entryId,at:date,reason:why,meta:backupMeta55(value),...await pack55({format:'beatbounce-save',version:1,data}),...(avatarId?{avatar:avatarId}:{})};
 }
 const items=history.items.filter(item=>item.id!==id);
 if(previous&&!items.length&&previous.data&&legacyId&&legacyId!==id)items.push(await entry(previous,legacyId,previous.savedAt55||null,'previous'));
 items.unshift(await entry(save,id,at,reason));items.splice(BACKUP_LIMIT55);
 const payload={...save,savedAt55:at,backups55:{version:1,items,avatars}};
 const prune=()=>{const used=new Set(items.map(i=>i.avatar).filter(Boolean));for(const key of Object.keys(avatars))if(!used.has(key))delete avatars[key]};prune();
 while(items.length>1&&bytes55(payload)>BACKUP_BYTES55){items.pop();prune()}
 if(bytes55(payload)>BACKUP_BYTES55)throw Error('This save is too large for cloud storage. Export a device save to keep it.');return payload;
}
