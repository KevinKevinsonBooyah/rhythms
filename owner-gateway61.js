export function createOwner61({auth,db,sdk,ownerIds,cleanSave,appendBackup55,randomId,conflict,json}){
 const {doc,getDoc,setDoc,collection,getDocs,query,where,limit,orderBy,runTransaction}=sdk,ref=(id)=>doc(db,'coinGrants61',id),rows=s=>{const a=[];s.forEach(x=>a.push({id:x.id,...x.data()}));return a};
 return async(url,options)=>{
 const uid=auth.currentUser?.uid,method=options.method||'GET';if(!uid)return json({error:'Sign in required'},401);
 if(url.pathname==='/api/gifts/claim'&&method==='POST'){
  const list=rows(await getDocs(query(collection(db,'coinGrants61'),where('recipientId','==',uid)))).filter(g=>g.status==='pending').slice(0,100);if(!list.length)return json({claimed:false});
  const b=JSON.parse(options.body),incoming=cleanSave(b.save),etag=randomId();let output={claimed:false};
  await runTransaction(db,async t=>{const saveRef=doc(db,'saves',uid),s=await t.get(saveRef),old=s.data(),gifts=[];for(const g of list){const snap=await t.get(ref(g.id));if(snap.exists()&&snap.data().status==='pending'&&snap.data().recipientId===uid)gifts.push({id:g.id,...snap.data()})}if(!gifts.length)return;if((old?.etag||null)!==b.etag)throw conflict();
   const amount=gifts.reduce((a,g)=>a+g.amount,0),economy=JSON.parse(incoming.data['pulse-modded-v1']||'{}');const balance=Math.max(0,Math.floor(Number(economy.gold)||0))+amount;if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(balance))throw Error('This gift would exceed the accurately supported wallet balance.');economy.gold=balance;const save={...incoming,data:{...incoming.data,'pulse-modded-v1':JSON.stringify(economy)}},at=new Date().toISOString(),payload=await appendBackup55(old?.payload,save,{id:etag,at,reason:'manual',legacyId:old?.etag});payload.ownerRewards58=old?.payload?.ownerRewards58||{};t.set(saveRef,{payload,etag});for(const g of gifts){const {id,...data}=g;t.set(ref(id),{...data,status:'claimed',claimedAt:Date.now()})}output={claimed:true,amount,count:gifts.length,save:cleanSave(payload),etag};
  });return json(output);
 }
 if(!(await ownerIds()).has(uid))return json({error:'Owner access required'},403);
 if(url.pathname==='/api/owner/players'&&method==='GET'){
  const term=(url.searchParams.get('name')||'').trim();if(!term||term.length>128)throw Error('Enter a nickname or user ID.');const matches=new Map();
  if(/^[A-Za-z0-9_-]{5,128}$/.test(term)){const s=await getDoc(doc(db,'profiles',term));if(s.exists())matches.set(term,{id:term,...s.data()})}
  const result=await getDocs(query(collection(db,'profiles'),where('alias','==',term),limit(20)));for(const r of rows(result))matches.set(r.id,r);
  return json({players:[...matches.values()].map(p=>({id:p.id,alias:p.alias,avatar:p.avatar||p.picture||''}))});
 }
 if(url.pathname==='/api/owner/grants'&&method==='GET'){const result=await getDocs(query(collection(db,'coinGrants61'),orderBy('createdAt','desc'),limit(50)));return json({grants:rows(result)})}
 if(url.pathname==='/api/owner/grants'&&method==='POST'){
  const b=JSON.parse(options.body);if(!/^[A-Za-z0-9_-]{5,128}$/.test(b.recipientId||'')||!Number.isSafeInteger(b.amount)||b.amount<1||typeof b.reason!=='string'||b.reason.length>120||!/^[-\w]{8,80}$/.test(b.requestId||''))throw Error('Choose a player and enter a positive whole coin amount, with a note up to 120 characters.');
  const p=await getDoc(doc(db,'profiles',b.recipientId));if(!p.exists())throw Error('Player not found.');const data={recipientId:b.recipientId,recipientAlias:p.data().alias,amount:b.amount,reason:b.reason.trim(),ownerId:uid,status:'pending',createdAt:Date.now()};
  await runTransaction(db,async t=>{const old=await t.get(ref(b.requestId));if(old.exists()){if(old.data().ownerId!==uid||old.data().recipientId!==b.recipientId||old.data().amount!==b.amount)throw Error('Request ID already used.');return}t.set(ref(b.requestId),data)});return json({saved:true,id:b.requestId});
 }
 const cancel=url.pathname.match(/^\/api\/owner\/grants\/([-\w]{8,80})\/cancel$/);if(cancel&&method==='POST'){await runTransaction(db,async t=>{const r=ref(cancel[1]),s=await t.get(r);if(!s.exists())throw Error('Grant not found');if(s.data().status!=='pending')throw Error('Only uncollected grants can be cancelled.');t.set(r,{...s.data(),status:'cancelled',cancelledAt:Date.now()})});return json({cancelled:true})}
 return json({error:'Not found'},404);
 };
}
