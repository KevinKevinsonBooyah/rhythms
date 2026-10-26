/* Choose a rhythm family first so the growing tuplet catalog cannot dominate. */
function choosePattern61(choices,last,state,level){
 const unique=[...new Map(choices.map(p=>[p.id,p])).values()],straight=unique.filter(p=>!p.tuplet),tuplets=unique.filter(p=>p.tuplet);
 const chance=level>=12?.30:level>=9?.25:.20;
 let pool=straight.length&&tuplets.length?(state.tuplets<2&&Math.random()<chance?tuplets:straight):unique;
 const different=pool.filter(p=>p.id!==last);if(different.length)pool=different;
 const selected=pool[Math.floor(Math.random()*pool.length)];state.tuplets=selected?.tuplet?state.tuplets+1:0;return selected;
}
