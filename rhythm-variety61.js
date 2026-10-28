/* Choose a rhythm family first so the growing tuplet catalog cannot dominate. */
function choosePattern61(choices,last,state,level){
 const unique=[...new Map(choices.map(p=>[p.id,p])).values()],straight=unique.filter(p=>!p.tuplet),tuplets=unique.filter(p=>p.tuplet);
 const chance=level>=12?.30:level>=9?.25:.20;
 let pool=straight.length&&tuplets.length?(state.tuplets<2&&Math.random()<chance?tuplets:straight):unique;
 const different=pool.filter(p=>p.id!==last);if(different.length)pool=different;
 // Favor short, varied attacks at advanced levels without flooding the score with tuplets.
 const weight=p=>level<8?1:Math.max(.1,Math.min(5,(p.ds?.length||1)/(p.span||1)/2))*(p.level>=level-2?1.8:1)*(level>=9?Math.pow(Math.max(1,(p.ds?.length||1)/(p.span||1)),.35):1);
 const sum=pool.reduce((n,p)=>n+weight(p),0);let roll=Math.random()*sum;const selected=pool.find(p=>(roll-=weight(p))<0)||pool.at(-1);state.tuplets=selected?.tuplet?state.tuplets+1:0;return selected;
}
