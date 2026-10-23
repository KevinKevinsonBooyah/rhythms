/* Shared by the profile UI and Firebase gateway. No external service required. */
(() => {
 const words=['fuck','fucker','fuckers','fucking','fucked','motherfucker','motherfuckers','motherfucking','shit','shits','shitty','bullshit','bullshitting','bitch','bitches','bitching','bastard','bastards','asshole','assholes','arsehole','arseholes','cunt','cunts','dick','dicks','dickhead','dickheads','cock','cocks','cocksucker','cocksuckers','pussy','pussies','twat','twats','wanker','wankers','whore','whores','slut','sluts','porn','porno','pornography','nigger','niggers','nigga','niggas','faggot','faggots','fag','fags','kike','kikes','chink','chinks','spic','spics','tranny','trannies','retard','retarded','retards'];
 const substitutions={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','@':'a','$':'s','!':'i','|':'i','а':'a','е':'e','о':'o','р':'p','с':'c','х':'x','у':'y','і':'i','ѕ':'s','α':'a','ο':'o','ι':'i'};
 const normalize=value=>String(value??'').normalize('NFKD').toLowerCase().replace(/[\p{M}\p{Cf}]/gu,'').replace(/[аеорсхуіѕαοι]/g,c=>substitutions[c]||c);
 const leet=value=>value.replace(/[0134578@$!|]/g,c=>substitutions[c]||c);
 // Match whole words, repeated letters, and separators without matching words
 // such as bass, class, Scunthorpe, Dickens, or grape.
 const prefixes=['fuck','bitch','cunt','nigger','nigga','faggot'].map(word=>new RegExp('(?:^|[^a-z])'+[...word].map(c=>c+'+').join('[^a-z]*'),'i'));
 const patterns=words.map(word=>new RegExp('(?:^|[^a-z])'+[...word].map(c=>c+'+').join('[^a-z]*')+'(?=$|[^a-z])','i'));
 const blocked=value=>{const plain=normalize(value),forms=[plain,leet(plain),leet(plain.replace(/\d+(?=$|[^a-z0-9])/g,' '))];return [...patterns,...prefixes].some(pattern=>forms.some(text=>pattern.test(text)))};
 const publicName=value=>{const name=typeof value==='string'?value.replace(/[\x00-\x1f]/g,'').trim().slice(0,20):'';return !name||blocked(name)?'Player':name};
 const publicBio=value=>{const bio=typeof value==='string'?value.slice(0,180):'';return blocked(bio)?'Bio hidden by the text filter.':bio};
 const validate=(value,field)=>{if(blocked(value))throw Error('Please change your '+field+'. Profanity and slurs are not allowed.');return value};
 globalThis.rhythmsTextFilter=Object.freeze({blocked,publicName,publicBio,validate});
})();
