// Reconstruct the printed table geometrically instead of trusting PDF item order.
export function linesFromItems(items) {
  const lines=[];
  for(const item of [...items].sort((a,b)=>a.y-b.y||a.x-b.x)) {
    if(!item.text?.trim())continue;
    let line=lines.find(l=>Math.abs(l.y-item.y)<Math.max(2,item.height*.5));
    if(!line){line={y:item.y,items:[]};lines.push(line);}line.items.push(item);
  }
  return lines.sort((a,b)=>a.y-b.y).map(l=>({...l,items:l.items.sort((a,b)=>a.x-b.x),text:l.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').replace(/\s+/g,' ').trim()}));
}
function metadata(lines,fallback) {
  const text=lines.map(l=>l.text).join('\n');
  const value=(name)=>text.match(new RegExp('(?:^|\\n|\\s)'+name+'\\s*:\\s*(.*?)(?=\\s+(?:Performer|Symbol|Label|Printed|Page)\\s*:|\\n|$)','i'))?.[1]?.trim()||'';
  const movementLine=lines.find(l=>/\b(?:Mvt\.?|Movement)\s*\d+/i.test(l.text)&&!/^Printed/i.test(l.text))?.text||fallback;
  const movement=movementLine.replace(/^.*?Label\s*:\s*\S+\s*/i,'').trim()||fallback;
  return {instrument:value('Performer'),symbol:value('Symbol'),label:value('Label').split(/\s/)[0],movement};
}
export function parsePage(items,{source='PDF',page=1,method='pdf',fallback='Unassigned movement'}={}) {
  const lines=linesFromItems(items),meta=metadata(lines,fallback),text=lines.map(l=>l.text).join('\n');
  const header=lines.find(l=>/\bSet\b/i.test(l.text)&&/Counts/i.test(l.text)&&/Front/i.test(l.text));
  let columns=null;
  if(header) {
    const patterns=[/^Set$/i,/^Title$/i,/^Measure/i,/^Counts$/i,/^Side(?:\s*1)?(?:\s*-\s*Side\s*2)?$/i,/^Front(?:\s*-?\s*Back)?$/i];
    const xs=patterns.map(p=>header.items.find(i=>p.test(i.text.trim()))?.x);
    if(xs.every(x=>Number.isFinite(x))) columns=xs;
  }
  const rows=[]; const blocks=[]; let current=null;
  const footerY=lines.find(l=>l.y>(header?.y??-Infinity)&&/Performer\s*:/i.test(l.text))?.y??Infinity;
  if(columns) {
    const bounds=columns.map((x,i)=>i?x-3:-Infinity);
    for(const l of lines){
      if(l.y<=header.y||l.y>=footerY||/^(?:Printed:|Page \d)/i.test(l.text))continue;
      const cells=Array(6).fill('');
      for(const item of l.items){let c=5;while(c>0&&item.x<bounds[c])c--;cells[c]+=(cells[c]?' ':'')+item.text;}
      if(/^\d+[A-Za-z]*$/.test(cells[0].trim())){current=cells;blocks.push(current);}
      else if(current && !cells[0].trim())for(let i=1;i<6;i++)current[i]+=(cells[i]?' '+cells[i]:'');
    }
  } else {
    // Conservative text fallback. A guessed column boundary is always review flagged.
    for(const l of lines){
      if(l.y>=footerY)continue;
      if(/^\d+[A-Za-z]*\s/.test(l.text)){current=[l.text];blocks.push(current);}
      else if(current&&!/Set\s+Title|Printed:|Page \d/.test(l.text))current[0]+=' '+l.text;
    }
  }
  for(const b of blocks){
    let set,title,measure,counts,side,depth,parseWarning='';
    if(columns){[set,title,measure,counts,side,depth]=b.map(s=>s.trim());}
    else {
      const raw=b[0],m=raw.match(/^(\d+[A-Za-z]*)\s+(.*?)\s+(Side\s*[12]\s*:.*?)(?=\s+(?:On\s+(?:Front|Back)|[\d¼½¾][\d\s./¼½¾]*\s+steps?\s+(?:in front of|behind)\s+(?:Front|Back)))\s+((?:On|[\d¼½¾]).*(?:Front|Back).*)$/i);
      if(!m){const id=raw.match(/^(\d+[A-Za-z]*)\s/);if(id) rows.push({...meta,set:id[1],title:'',measure:'',counts:'',side:'',depth:'',source,page,method,status:'missing',raw,parseWarning:'Could not split this row; use original PDF to correct'});continue;}
      set=m[1];side=m[3];depth=m[4];
      const prefix=m[2].trim();const parts=prefix.match(/^(.*?)\s+(Subset|(?:[A-Za-z]\d?\s*)?\d+(?:-\d+)?)\s+(\d+)$/i);
      if(parts){title=parts[1];measure=parts[2];counts=parts[3];}
      else {title=prefix;measure='';counts='';}
      parseWarning='Text fallback: verify title, measures and counts';
    }
    rows.push({...meta,set,title,measure,counts,side,depth,source,page,method,status:method==='ocr'?'ocr':'extracted',raw:columns?b.join(' | '):b[0],parseWarning});
  }
  return {rows,text,warnings:!rows.length?['No table rows detected. Review the page text or enter rows manually.']:[]};
}
export async function extractPDF(file,onProgress,{ocr=true,cancelled=()=>false}={}) {
  const pdfjs=await import('./vendor/pdfjs/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
  const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
  let worker;const rows=[],pages=[];
  try {
    for(let n=1;n<=pdf.numPages;n++){
      if(cancelled())throw Error('Import cancelled');
      onProgress(n,pdf.numPages,'Reading');
      const page=await pdf.getPage(n),content=await page.getTextContent();
      let items=content.items.filter(i=>i.str).map(i=>({text:i.str,x:i.transform[4],y:-i.transform[5],height:i.height||10})),method='pdf';
      if(items.reduce((sum,i)=>sum+i.text.trim().length,0)<40 && ocr){
        onProgress(n,pdf.numPages,'OCR');
        if(!globalThis.Tesseract)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='./vendor/ocr/tesseract.min.js';s.onload=resolve;s.onerror=()=>reject(Error('OCR library failed to load'));document.head.append(s);});
        worker??=await globalThis.Tesseract.createWorker('eng',1,{workerPath:new URL('./vendor/ocr/worker.min.js',import.meta.url).href,corePath:new URL('./vendor/ocr/tesseract-core-lstm.wasm.js',import.meta.url).href,langPath:new URL('./vendor/ocr/',import.meta.url).href,gzip:false});
        const viewport=page.getViewport({scale:2}),canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;
        await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
        const {data}=await worker.recognize(canvas,{}, {text:true,blocks:true});method='ocr';
        items=(data.blocks||[]).flatMap(b=>b.paragraphs||[]).flatMap(p=>p.lines||[]).flatMap(l=>l.words||[]).map(w=>({text:w.text,x:w.bbox.x0,y:w.bbox.y1,height:w.bbox.y1-w.bbox.y0}));
        canvas.width=canvas.height=0;
      }
      const parsed=parsePage(items,{source:file.name,page:n,method,fallback:file.name.replace(/\.pdf$/i,'')});
      rows.push(...parsed.rows);pages.push({page:n,source:file.name,text:parsed.text,warnings:parsed.warnings,method});
      page.cleanup();await new Promise(r=>setTimeout(r,0));
    }
  } finally {await worker?.terminate();await pdf.destroy();}
  return {rows,pages};
}
