/* Rueckblick am Rundenende (wie im Englisch-Trainer, #88).
   Rot und offen, was in der Runde mindestens einmal falsch oder unsicher
   war - dieselbe Zaehlung wie "Woerter zum Weiterueben" -, gruen und
   eingeklappt der Rest. "Diese Woerter ueben" startet eine Runde nur mit
   den roten. Ohne Fehler: kein roter Teil, das Gewusste offen. */
const {JSDOM}=require('jsdom'),fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
for(const folder of ['year7','year10']){
  const html=fs.readFileSync(folder+'/index.html','utf8');
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.org/'+folder+'/'}),w=dom.window;w.scrollTo=()=>{};
  const run=s=>vm.runInContext(s,dom.getInternalVMContext());
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())run(m[1]);
  run(fs.readFileSync('assets/learning.js','utf8'));
  const d=w.document;
  d.querySelector('[data-topic]').click();d.querySelector('[data-scope="short"]').click();
  const woerter=JSON.parse(run('JSON.stringify(S.queue.slice(0,S.initialCount).map(v=>v.en))'));
  /* Erstes Wort: Nochmal, zweites: Unsicher, der Rest gewusst. */
  let n=0;
  while(!d.getElementById('doneHome')){
    run('S.revealed=true;rate('+(n===0?0:n===1?1:2)+')');
    if(++n>40)throw new Error(folder+': Runde endet nicht');
  }
  const liste=sel=>[...d.querySelectorAll(sel+' .rb-en')].map(e=>e.textContent);
  assert.deepEqual(liste('li.rb-no'),[woerter[0],woerter[1]],folder+': Weiterüben stimmt nicht');
  assert.deepEqual(liste('.rb-gewusst'),woerter.slice(2),folder+': Gewusst stimmt nicht');
  assert.match(d.querySelector('.rb-kopf.rb-no').textContent,/Weiterüben · 2/);
  const gewusst=d.querySelector('details.rb-gewusst');
  assert.ok(gewusst&&!gewusst.open,folder+': Gewusst ist nicht eingeklappt');
  assert.match(gewusst.querySelector('summary').textContent,new RegExp('Gewusst · '+(woerter.length-2)));
  for(const li of d.querySelectorAll('.rb-liste li'))
    assert.match(li.querySelector('.rb-zeichen').textContent,li.classList.contains('rb-no')?/✗/:/✓/,folder+': Zeichen fehlt');
  assert.equal(d.querySelector('.rb-en').getAttribute('lang'),'fr',folder+': Sprache der Wörter');
  /* Nachueben: eine Runde nur mit den beiden roten Woertern. */
  const knopf=d.getElementById('missedPractice');
  assert.match(knopf.textContent,/Diese 2 Wörter üben/);
  knopf.click();
  const neu=JSON.parse(run('JSON.stringify(S.queue.map(v=>v.en).sort())'));
  assert.deepEqual(neu,[woerter[0],woerter[1]].sort(),folder+': Nachüben übt andere Wörter');
  /* Alles gewusst: kein roter Teil, Gewusst offen. */
  while(!d.getElementById('doneHome'))run('S.revealed=true;rate(2)');
  assert.equal(d.querySelectorAll('.rb-no').length,0,folder+': rote Einträge ohne Fehler');
  assert.match(d.querySelector('.rb-alle').textContent,/Alles gewusst/);
  assert.ok(d.querySelector('details.rb-gewusst').open,folder+': Gewusst ohne Fehler eingeklappt');
  w.close();
  console.log(folder+': Rückblick zeigt 2 zum Weiterüben, '+(woerter.length-2)+' gewusst, Nachüben mit den roten');
}
