/* Beispielsaetze: eigene, nicht aus dem Lehrwerk.

   Jede Klasse traegt zu jedem Eintrag einen Satz aus
   content/beispiele-klasseN.tsv. Die Seite muss genau diesen Satz zeigen,
   ohne die eckigen Klammern der Luecke, und im Woerterbuch muss jeder
   Satz auftauchen. Klassen ohne Saetze duerfen keine leeren Zeilen
   zeigen. */
const {JSDOM}=require('jsdom'),fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const tabelle=klasse=>{
  const p='content/beispiele-klasse'+klasse+'.tsv';
  if(!fs.existsSync(p))return {};
  const out={};
  for(const z of fs.readFileSync(p,'utf8').split(/\r?\n/).slice(1)){
    if(!z.trim())continue;
    const [k,,satz]=z.split('\t');
    if(satz!=='-')out[k]=satz.replace(/[\[\]]/g,'');
  }
  return out;
};
let count=0;
for(const [year,klasse] of [['year7',7],['year8',8],['year9',9],['year10',10]]){
 const html=fs.readFileSync(year+'/index.html','utf8');const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.org/'+year+'/'}),w=dom.window,run=s=>vm.runInContext(s,dom.getInternalVMContext());w.scrollTo=()=>{};
 for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())run(m[1]);run(fs.readFileSync('assets/learning.js','utf8'));
 const words=run('Object.values(SETS).flat()');
 const buch=JSON.parse(fs.readFileSync('content/klasse'+klasse+'.json','utf8'));
 const saetze=tabelle(klasse);
 const erwartet=buch.einheiten.flatMap(e=>e.teile.flatMap(t=>t.woerter.map(x=>saetze[x.fund+'|'+x.fr]||'')));
 assert.equal(words.length,erwartet.length,year+': Anzahl der Eintraege');
 words.forEach((v,i)=>{
  assert.equal(v.example_en||'',erwartet[i],year+': Satz zu "'+v.en+'"');
  if(v.example_en){assert(!/[\[\]]/.test(v.example_en),year+': Klammer im Satz');assert(v.example_en.split(/\s+/).length>=2,year+': Satz zu kurz: '+v.example_en);}
 });
 const mit=words.filter(v=>v.example_en).length;
 assert.equal(mit,words.length,year+': nicht jedes Wort hat einen Satz');
 const d=w.document;d.querySelector('#allBtn').click();assert.equal(d.querySelectorAll('.vex').length,mit,year+' example rows');
 for(const el of d.querySelectorAll('.vex'))assert(el.textContent.trim());
 count+=mit;console.log(year+': '+mit+' von '+words.length+' Eintraegen mit eigenem Beispielsatz, Woerterbuch zeigt sie');w.close();
}
console.log(count+' Beispielsaetze geprueft');
