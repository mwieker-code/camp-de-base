/* Sachfelder: jedes Wort hat eins, das Woerterbuch filtert danach, und
   die Suche findet ein Feld ueber seinen Namen und seine Suchwoerter
   ("Arbeit", "Job"). */
const {JSDOM,VirtualConsole}=require('jsdom');
const vm=require('node:vm');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const FELDER=JSON.parse(fs.readFileSync(path.join(root,'content/sachfelder.json'),'utf8')).felder;
const IDS=new Set(FELDER.map(f=>f.id));
assert.equal(FELDER.length,20,'zwanzig Sachfelder');

function seite(folder){
  const html=fs.readFileSync(path.join(root,folder,'index.html'),'utf8');
  const stille=new VirtualConsole();
  stille.on('jsdomError',e=>{ if(!/getContext/.test(String(e.message))) throw e; });
  const dom=new JSDOM(html,{runScripts:'outside-only',virtualConsole:stille,url:'https://example.org/'+folder+'/'});
  const w=dom.window;w.scrollTo=()=>{};
  w.matchMedia=q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
  const c=dom.getInternalVMContext();
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],c);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/verben.js'),'utf8'),c);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/learning.js'),'utf8'),c);
  return {w,d:w.document,lauf:code=>vm.runInContext(code,c)};
}
const sichtbar=d=>[...d.querySelectorAll('#vlist .vrow')].filter(r=>!r.classList.contains('off')&&!r.closest('.lsec.off'));
const tippe=(s,text)=>{const q=s.d.getElementById('lq');q.value=text;q.oninput.call(q);};

for(const folder of ['year7','year8','year9','year10']){
  const s=seite(folder);
  const SETS=JSON.parse(s.lauf('JSON.stringify(SETS)'));
  const alle=Object.values(SETS).flat();
  for(const v of alle){
    assert.ok(Array.isArray(v.sf)&&v.sf.length&&v.sf.every(id=>IDS.has(id)),folder+': '+v.en+' ohne gueltiges Sachfeld');
  }
  s.lauf("S.view='list';render()");
  const knoepfe=[...s.d.querySelectorAll('#sfLeiste [data-sf]')];
  assert.ok(knoepfe.length>=10,folder+': zu wenige Sachfeld-Knoepfe');
  /* Ein Feld waehlen: nur seine Woerter */
  const feld=FELDER.find(f=>alle.filter(v=>v.sf.includes(f.id)).length>=5);
  s.d.querySelector('#sfLeiste [data-sf="'+feld.id+'"]').click();
  const n=alle.filter(v=>v.sf.includes(feld.id)).length;
  assert.equal(sichtbar(s.d).length,n,folder+': '+feld.name+' zeigt '+n+' Woerter');
  assert.match(s.d.getElementById('lcount').textContent,new RegExp(n+' W'));
  /* Suche wirkt im Feld weiter */
  tippe(s,'xqzw');
  assert.equal(sichtbar(s.d).length,0,folder+': Suche im Feld');
  tippe(s,'');
  /* Alle */
  s.d.querySelector('#sfLeiste [data-sf=""]').click();
  assert.equal(s.d.querySelectorAll('#vlist .vrow.off').length,0,folder+': Alle zeigt wieder alles');
  /* Sachfeld unter dem Wort */
  assert.ok(s.d.querySelector('#vlist .vrow .vsf'),folder+': Sachfeld steht unter dem Wort');
  /* Suche nach dem Feldnamen und einem Suchwort */
  const arbeit=alle.filter(v=>v.sf.includes('arbeit'));
  if(arbeit.length){
    for(const wort of ['Arbeit','Job','beruf']){
      tippe(s,wort);
      const ids=new Set(sichtbar(s.d).map(r=>r.querySelector('.ven').textContent));
      assert.ok(arbeit.every(v=>ids.has(v.en)),folder+': Suche "'+wort+'" findet alle Woerter aus Arbeit & Beruf');
      assert.match(s.d.getElementById('sfHinweis').textContent,/Arbeit & Beruf/,folder+': Hinweis auf das Sachfeld');
    }
    s.d.querySelector('#sfHinweis [data-sf="arbeit"]').click();
    assert.equal(s.d.getElementById('lq').value,'',folder+': Hinweis leert die Suche');
    assert.equal(sichtbar(s.d).length,arbeit.length,folder+': Hinweis zeigt nur das Feld');
  }
  /* Kurze Suchen loesen kein Feld aus */
  tippe(s,'an');
  assert.ok(s.d.getElementById('sfHinweis').hidden,folder+': zwei Buchstaben, kein Sachfeld');
  s.w.close();
}
console.log('Sachfelder: jedes Wort zugeordnet, Filter, Suche nach Feld und Suchwort, Hinweis in allen vier Klassen');
