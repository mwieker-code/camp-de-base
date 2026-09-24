/* Die Wortliste beim Lueckentext.

   Der Fehler, gegen den dieser Test steht (im Englisch-Trainer
   gefunden): Die Wortliste stand in derselben Reihenfolge wie die
   Luecken darunter. Damit war der Test durch blosses Abzaehlen zu
   loesen, ohne ein einziges Wort zu kennen.

   Geprueft wird beides: dass die Regel im Prompt steht, wo es eine
   Wortliste gibt - Klasse 7 (erstes Lernjahr) mit Lueckentext -, und
   dass sie fehlt, wo es keine gibt. */
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs'),vm=require('vm'),path=require('path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

function prompt(folder,typen){
  const html=fs.readFileSync(path.join(root,folder,'index.html'),'utf8');
  const stille=new VirtualConsole();
  stille.on('jsdomError',e=>{ if(!/getContext/.test(String(e.message))) throw e; });
  const dom=new JSDOM(html,{runScripts:'outside-only',virtualConsole:stille,
    url:'https://example.org/'+folder+'/'});
  const w=dom.window; w.scrollTo=()=>{};
  w.matchMedia=q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},
    addListener(){},removeListener(){}});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const c=dom.getInternalVMContext();
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
    if(m[1].trim())vm.runInContext(m[1],c);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/learning.js'),'utf8'),c);
  /* Ein paar Dutzend Vokabeln reichen: Alle 825 einzeln anzuhaken
     dauert in jsdom laenger als der ganze uebrige Test. */
  vm.runInContext("S.view='list';render();",c);
  const d=w.document;
  [...d.querySelectorAll('button')].find(b=>/Vokabeln auswählen/.test(b.textContent)).click();
  for(const i of [...d.querySelectorAll('.csv-check input')].slice(0,30)){
    if(!i.checked){i.checked=true;i.dispatchEvent(new w.Event('change',{bubbles:true}));}
  }
  d.getElementById('selectionPrompt').click();
  const dlg=d.querySelector('.test-prompt-dialog');
  assert.ok(dlg,folder+': kein Prompt-Dialog');
  dlg.querySelectorAll('[name=taskType]').forEach(i=>{i.checked=typen.includes(i.value);
    i.dispatchEvent(new w.Event('change',{bubbles:true}));});
  dlg.querySelector('#promptCount').value='4';
  dlg.querySelector('#promptBalance').click();
  dlg.querySelector('#promptConfig').dispatchEvent(new w.Event('submit',{cancelable:true}));
  const text=dlg.querySelector('#promptText').value;
  assert.ok(text,folder+': kein Prompt erzeugt ('+typen.join(',')+')');
  dom.window.close();
  return text;
}

const REGEL=/Sortiere sie alphabetisch nach dem deutschen Begriff/;
const KONTROLLE=/Die Wortliste zum Lückentext steht alphabetisch nach dem deutschen Begriff/;

/* ---- Klasse 7 mit Lueckentext: die Regel steht da ---- */
{
  const t=prompt('year7',['gap']);
  assert.match(t,/Wortliste aus den deutschen Bedeutungen/,'year7: keine Wortliste im Prompt');
  assert.match(t,REGEL,'year7: der Prompt sagt nicht, wie die Wortliste zu ordnen ist');
  assert.match(t,/niemals in der Reihenfolge der Lücken/,
    'year7: die Reihenfolge der Lücken ist nicht ausdrücklich verboten');
  assert.match(t,KONTROLLE,'year7: die Schlusskontrolle prüft die Wortliste nicht');
}

/* ---- Ohne Lueckentext gibt es keine Wortliste, also auch keine Regel ---- */
{
  const t=prompt('year7',['matching']);
  assert.ok(!REGEL.test(t),'year7 ohne Lückentext: die Wortlisten-Regel steht trotzdem da');
  assert.ok(!KONTROLLE.test(t),'year7 ohne Lückentext: die Schlusskontrolle steht trotzdem da');
}

/* ---- Ab Klasse 8 gibt es gar keine Wortliste ---- */
for(const jahr of ['year8','year9','year10']){
  const t=prompt(jahr,['gap']);
  assert.match(t,/ohne Wortliste/,jahr+': der Prompt erlaubt eine Wortliste');
  assert.ok(!REGEL.test(t),jahr+': die Wortlisten-Regel steht da, obwohl es keine Wortliste gibt');
  assert.ok(!KONTROLLE.test(t),jahr+': die Schlusskontrolle steht da, obwohl es keine Wortliste gibt');
}

console.log('Wortliste: alphabetisch statt in der Reihenfolge der Lücken, und nur dort erklärt, wo es sie gibt');
