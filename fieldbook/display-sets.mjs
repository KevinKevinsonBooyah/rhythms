// Display-only set navigation. Marching timing and positions always use the full set list.
export const isLetteredSet=set=>/[a-z]/i.test(String(set?.id??''));
export function nextVisibleSetIndex(sets,index,hideLettered=false){
  for(let i=Math.max(-1,index)+1;i<sets.length;i++)if(!hideLettered||!isLetteredSet(sets[i]))return i;
  return -1;
}
export function visibleSetIndex(sets,index,hideLettered=false){
  if(!sets.length)return -1;
  const at=Math.max(0,Math.min(index,sets.length-1));
  if(!hideLettered)return at;
  for(let i=at;i>=0;i--)if(!isLetteredSet(sets[i]))return i;
  for(let i=at+1;i<sets.length;i++)if(!isLetteredSet(sets[i]))return i;
  return at;
}
