/* Verben konjugieren und le ou la ?

   Erstens die Formen selbst: eine Liste von Formen, die jemand
   nachgeschlagen hat, quer durch die Familien und Schreibwechsel. Wer
   assets/verben.js aendert, sieht hier, ob etwas kippt.

   Zweitens beide Uebungen auf der Seite: die Kachel, eine Verbenrunde
   bis zum Ende, und das Genus-Spiel mit einem Treffer und einem Fehler. */
const {JSDOM,VirtualConsole}=require('jsdom');
const vm=require('node:vm');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const V=require(path.join(root,'assets/verben.js'));

const SUBJ=['je','tu','il','nous','vous','ils'];
const form=(inf,zeit,person,subj)=>{const s=SUBJ.slice();if(subj)s[person]=subj;return V.konjugiere(inf,zeit,s)[person].anzeige;};
for(const [inf,zeit,person,erwartet,subj] of [
  ['être','present',3,'nous sommes'],['avoir','present',0,"j'ai"],['aller','present',5,'ils vont'],
  ['faire','present',4,'vous faites'],['manger','present',3,'nous mangeons'],['commencer','present',3,'nous commençons'],
  ['acheter','present',0,"j'achète"],['appeler','present',5,'ils appellent'],['préférer','present',1,'tu préfères'],
  ['payer','present',0,'je paie'],['finir','present',5,'ils finissent'],['partir','present',2,'il part'],
  ['ouvrir','present',0,"j'ouvre"],['attendre','present',2,'il attend'],['venir','present',5,'ils viennent'],
  ['comprendre','present',5,'ils comprennent'],['mettre','present',2,'il met'],['connaître','present',2,'il connaît'],
  ['écrire','present',3,'nous écrivons'],['boire','present',5,'ils boivent'],['pouvoir','present',0,'je peux'],
  ['se lever','present',0,'je me lève'],["s'habiller",'present',2,"il s'habille"],['envoyer','present',0,"j'envoie"],
  ['aller','pc',2,'elle est allée','elle'],['partir','pc',5,'elles sont parties','elles'],['se lever','pc',1,"tu t'es levé"],
  ['prendre','pc',0,"j'ai pris"],['ouvrir','pc',3,'nous avons ouvert'],['naître','pc',2,'il est né'],['être','pc',0,"j'ai été"],
  ['manger','imparfait',3,'nous mangions'],['commencer','imparfait',0,'je commençais'],['être','imparfait',4,'vous étiez'],
  ['faire','imparfait',2,'il faisait'],['finir','imparfait',5,'ils finissaient'],['rire','imparfait',3,'nous riions'],
  ['aller','futur',0,"j'irai"],['acheter','futur',0,"j'achèterai"],['appeler','futur',2,'il appellera'],
  ['voir','futur',3,'nous verrons'],['venir','futur',5,'ils viendront'],['envoyer','futur',1,'tu enverras'],
  ['pouvoir','futur',0,'je pourrai'],['savoir','futur',4,'vous saurez'],['vendre','futur',0,'je vendrai']]){
  assert.equal(form(inf,zeit,person,subj),erwartet,inf+' '+zeit);
}
/* Antworten: mit und ohne Subjekt, beide Partizipien bei je, Akzente */
const pc=V.konjugiere('aller','pc');
assert.equal(V.pruefe('suis allée',pc[0].richtig),'ok');
assert.equal(V.pruefe('je suis allé',pc[0].richtig),'ok');
assert.equal(V.pruefe('suis alle',pc[0].richtig),'akzent');
assert.equal(V.pruefe('suis allés',pc[0].richtig),'falsch');
assert.equal(V.pruefe("j ’ai",V.konjugiere('avoir','present')[0].richtig),'ok');
assert.equal(V.konjugiere('pleuvoir','present'),null,'ein Verb ohne Familie wird nicht geraten');
assert.ok(!V.abfragbar('coûter'),'coûter nur in der dritten Person');
console.log('Verben: Formen, Schreibwechsel und Antwortpruefung stimmen');

/* ---- Auf der Seite ---- */
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
for(const [folder,zeiten] of [['year7',1],['year8',2],['year9',4],['year10',4]]){
  const html=fs.readFileSync(path.join(root,folder,'index.html'),'utf8');
  assert.ok(/<script src="\.\.\/assets\/verben\.js\?v=[^"]+"><\/script>\s*<script src="\.\.\/assets\/learning\.js/.test(html),
    folder+': verben.js fehlt vor learning.js');
  const s=seite(folder);
  const kachel=s.d.getElementById('verbenStart');
  assert.ok(kachel,folder+': keine Verben-Kachel');
  kachel.click();
  assert.equal(s.d.querySelectorAll('[data-zeit]').length,zeiten,folder+': Zeitformen');
  s.d.querySelector('[data-anzahl="10"]').click();
  const aufgaben=JSON.parse(s.lauf('JSON.stringify(S.vb.aufgaben)'));
  assert.equal(aufgaben.length,10,folder+': zehn Aufgaben');
  for(let i=0;i<10;i++){
    const feld=s.d.getElementById('typeIn');
    assert.equal(s.d.querySelector('.vb-subjekt').textContent,aufgaben[i].subjekt);
    feld.value=i%2?'xyz':aufgaben[i].form;
    s.d.getElementById('submit').click();
    assert.ok(s.d.querySelector('.vb-loesung.'+(i%2?'no':'ok')),folder+': Urteil zu Aufgabe '+(i+1));
    s.d.getElementById('vbWeiter').click();
  }
  assert.equal(s.d.querySelector('.summary-number').textContent,'5 / 10',folder+': Ergebnis');
  assert.match(s.d.getElementById('missedPractice').textContent,/Diese 5 Formen/);
  s.d.getElementById('missedPractice').click();
  assert.equal(s.lauf('S.vb.aufgaben.length'),5,folder+': die falschen Formen noch einmal');
  s.d.getElementById('back').click();
  s.d.getElementById('vbBack').click();

  /* le ou la ? */
  s.d.getElementById('practiceAcross').click();
  s.d.getElementById('startGenus').click();
  const v=JSON.parse(s.lauf('JSON.stringify(S.gv.queue[0])'));
  const richtig=/(^|[\s,])m\./.test(v.pos)?'m':'f';
  const wort=s.d.querySelector('.gv-wort').textContent;
  assert.ok(!/^(le|la|l')/i.test(wort)&&v.en.endsWith(wort.split(' ').pop()),folder+': Wort ohne Artikel: '+wort+' / '+v.en);
  s.d.querySelector('.gv-wahl[data-g="'+richtig+'"]').click();
  assert.equal(s.lauf('S.gv.punkte'),1,folder+': Treffer zaehlt');
  assert.ok(s.d.querySelector('.gv-wahl.gv-richtig'),folder+': Treffer markiert');
  s.lauf('clearInterval(S.gv.uhr);S.gv.wahl=null;S.gv.i++;render()');
  const v2=JSON.parse(s.lauf('JSON.stringify(S.gv.queue[1])'));
  const falsch=/(^|[\s,])m\./.test(v2.pos)?'f':'m';
  s.d.querySelector('.gv-wahl[data-g="'+falsch+'"]').click();
  assert.equal(s.lauf('S.gv.falsch.length'),1,folder+': Fehler zaehlt');
  assert.match(s.d.querySelector('.gv-loesung').textContent,/masculin|féminin/);
  s.lauf('S.gv.wahl=null;S.gv.done=true;render()');
  assert.match(s.d.getElementById('missedPractice').textContent,/Dieses Nomen/);
  /* Nur eindeutige Nomen: kein Plural, kein m./f., kein Schraegstrich */
  const pool=JSON.parse(s.lauf('JSON.stringify(S.gv.pool)'));
  assert.ok(pool.length>=100,folder+': nur '+pool.length+' Nomen im Spiel');
  for(const n of pool) assert.ok(!/pl\.|m\.\s*\/\s*f\./.test(n.pos)&&!/\//.test(n.en.replace(/\([^)]*\)/g,'')),folder+': '+n.en+' gehoert nicht ins Spiel');
  s.w.close();
}
console.log('Verben und le ou la ?: Kachel, Runde, Ergebnis und Genus-Spiel in allen vier Klassen');
