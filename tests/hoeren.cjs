/* Hoerrunde: Die Seite spricht ein Wort, man schreibt es auf.

   Geprueft wird ohne echte Stimme: speechSynthesis ist nachgebaut und
   merkt sich, was gesprochen werden sollte. Gesprochen wird beim Start,
   beim Weiter und auf Knopfdruck, langsam mit kleinerem Tempo. Ohne
   franzoesische Stimme (aber mit anderen) gibt es keinen Startknopf. */
const {JSDOM,VirtualConsole}=require('jsdom');
const vm=require('node:vm');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

function seite(folder,stimmen){
  const html=fs.readFileSync(path.join(root,folder,'index.html'),'utf8');
  const stille=new VirtualConsole();
  stille.on('jsdomError',e=>{ if(!/getContext/.test(String(e.message))) throw e; });
  const dom=new JSDOM(html,{runScripts:'outside-only',virtualConsole:stille,url:'https://example.org/'+folder+'/'});
  const w=dom.window;w.scrollTo=()=>{};
  w.matchMedia=q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
  const gesprochen=[];
  w.SpeechSynthesisUtterance=function(t){this.text=t;};
  w.speechSynthesis={speaking:false,pending:false,paused:false,getVoices:()=>stimmen,
    speak(u){gesprochen.push({text:u.text,rate:u.rate,lang:u.lang});},cancel(){},resume(){},addEventListener(){}};
  const c=dom.getInternalVMContext();
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],c);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/verben.js'),'utf8'),c);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/learning.js'),'utf8'),c);
  return {w,d:w.document,gesprochen,lauf:code=>vm.runInContext(code,c)};
}
const FR=[{name:'Thomas',lang:'fr-FR',localService:true}];
for(const folder of ['year7','year8','year9','year10']){
  const s=seite(folder,FR);
  s.d.getElementById('practiceAcross').click();
  const knopf=s.d.getElementById('startHoeren');
  assert.ok(knopf,folder+': kein Startknopf fuer die Hoerrunde');
  knopf.click();
  const woerter=JSON.parse(s.lauf('JSON.stringify(S.hr.woerter)'));
  assert.equal(woerter.length,10,folder+': zehn Woerter');
  assert.ok(woerter.every(v=>!/[\/…]/.test(v.en.replace(/\b(?:qn|qc)(?:\/(?:qn|qc))?\b/g,''))),folder+': kein Eintrag mit Schraegstrich oder Auslassung');
  assert.equal(s.gesprochen.length,1,folder+': beim Start wird gesprochen');
  assert.equal(s.gesprochen[0].lang,'fr-FR');
  /* Nochmal und langsam */
  s.d.getElementById('hrLangsam').click();
  assert.ok(s.gesprochen.at(-1).rate<0.9,folder+': langsam ist langsamer');
  s.d.getElementById('hrNochmal').click();
  assert.equal(s.gesprochen.at(-1).rate,0.9);
  for(let i=0;i<10;i++){
    const v=woerter[i];
    const feld=s.d.getElementById('typeIn');
    /* Richtig, ohne Artikel (fast) oder falsch - abwechselnd */
    const ohneArt=v.en.replace(/^(le|la|les|l['’]|un|une)\s*/i,'');
    feld.value=i%3===0?v.en:i%3===1&&ohneArt!==v.en?ohneArt:'xqzw';
    const erwartet=i%3===0?'ok':i%3===1&&ohneArt!==v.en?'near':'no';
    s.d.getElementById('submit').click();
    assert.ok(s.d.querySelector('.hr-loesung.'+erwartet),folder+': '+feld.value+' / '+v.en+' sollte '+erwartet+' sein');
    assert.ok(s.d.querySelector('.hr-loesung').textContent.includes(v.de),folder+': Bedeutung nach der Antwort');
    const vorher=s.gesprochen.length;
    s.d.getElementById('hrWeiter').click();
    if(i<9)assert.equal(s.gesprochen.length,vorher+1,folder+': Weiter spricht das naechste Wort');
  }
  assert.match(s.d.querySelector('.summary-number').textContent,/^\d+ \/ 10$/);
  const nochmal=s.d.getElementById('missedPractice');
  assert.ok(nochmal&&/noch einmal hören/.test(nochmal.textContent),folder+': Fehler noch einmal hoeren');
  nochmal.click();
  assert.ok(s.lauf('S.hr.woerter.length')<10,folder+': nur die falschen');
  s.w.close();
}
/* Stimmen da, aber keine franzoesische: keine Hoerrunde */
{const s=seite('year7',[{name:'Daniel',lang:'en-GB',localService:true}]);
 s.d.getElementById('practiceAcross').click();
 assert.equal(s.d.getElementById('startHoeren'),null,'ohne franzoesische Stimme keine Hoerrunde');
 s.w.close();}
/* Liste noch leer (iOS am Anfang): die Runde wird angeboten */
{const s=seite('year7',[]);
 s.d.getElementById('practiceAcross').click();
 assert.ok(s.d.getElementById('startHoeren'),'leere Stimmenliste: Hoerrunde trotzdem da');
 s.w.close();}
console.log('Hörrunde: zehn Wörter, sprechen beim Start, Weiter und auf Knopfdruck, prüfen wie beim Tippen, in allen vier Klassen');
