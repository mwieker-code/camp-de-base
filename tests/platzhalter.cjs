/* Jemand und etwas.

   Im Bestand stehen die Platzhalter abgekuerzt: "regarder qn/qc",
   "jdn/etw. ansehen". Getippt wird auch ausgeschrieben - "regarder
   quelque chose" ist dieselbe Antwort, und "etwas erzählen" auch.

   Der heikle Teil ist das ausgeschriebene Wort: "quelque chose" und
   "quelqu'un" sind in Klasse 7 selbst Vokabeln (etwas, jemand), "etwas"
   ist ihre deutsche Loesung. Wuerden sie einfach gestrichen, verloeren
   sie ihre eigene Loesung. Beides wird hier mitgeprueft. */
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs'),vm=require('vm'),path=require('path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

function seite(folder){
  const html=fs.readFileSync(path.join(root,folder,'index.html'),'utf8');
  const stille=new VirtualConsole();
  stille.on('jsdomError',e=>{ if(!/getContext/.test(String(e.message))) throw e; });
  const dom=new JSDOM(html,{runScripts:'outside-only',virtualConsole:stille,
    url:'https://example.org/'+folder+'/'});
  const w=dom.window; w.scrollTo=()=>{};
  w.matchMedia=q=>({matches:false,media:q,addEventListener(){},removeEventListener(){},
    addListener(){},removeListener(){}});
  const c=dom.getInternalVMContext();
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
    if(m[1].trim())vm.runInContext(m[1],c);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/learning.js'),'utf8'),c);
  return (eingabe,ziel,dir)=>vm.runInContext('S.mode="type";S.view="session";S.dir='+JSON.stringify(dir)+';checkTyped('+JSON.stringify(eingabe)+','+JSON.stringify(ziel)+')',c);
}

const pruefe=seite('year7');
const fr=(e,z)=>pruefe(e,z,'de2en'), de=(e,z)=>pruefe(e,z,'en2de');

/* ---- qn und qc, abgekuerzt und ausgeschrieben ---- */
for(const e of ['regarder','regarder qn','regarder qc','regarder quelque chose',"regarder quelqu'un",'regarder qn/qc'])
  assert.equal(fr(e,'regarder qn/qc'),'ok','Eingabe: '+e);
assert.equal(fr('écouter','écouter (qn/qc)'),'ok');
assert.equal(fr('être fan de','être fan de qn/qc'),'ok');
assert.equal(fr('être fan de quelque chose','être fan de qn/qc'),'ok');

/* ---- jdn, jdm und etw. auf der deutschen Seite ---- */
for(const e of ['erzählen','etw. erzählen','etw erzählen','etwas erzählen'])
  assert.equal(de(e,'etw. erzählen'),'ok','Eingabe: '+e);
assert.equal(de('ansehen','jdn/etw. ansehen, jdn/etw. anschauen'),'ok');
assert.equal(de('jemanden ansehen','jdn/etw. ansehen, jdn/etw. anschauen'),'ok');
assert.equal(de('zuhören','(jdm) zuhören, etw. (an-)hören'),'ok');

/* ---- Was dabei nicht verlorengehen darf ---- */
assert.equal(fr('quelque chose','quelque chose'),'ok','"quelque chose" behaelt seine eigene Loesung');
assert.equal(fr("quelqu'un","quelqu'un"),'ok','"quelqu\'un" behaelt seine eigene Loesung');
assert.equal(de('etwas','etwas'),'ok','"etwas" behaelt seine eigene Loesung');
assert.equal(de('jemand','jemand'),'ok','"jemand" behaelt seine eigene Loesung');
assert.equal(fr('qc','regarder qn/qc'),'no','nur der Platzhalter ist keine Antwort');
assert.equal(fr('','regarder qn/qc'),'no');
assert.equal(fr('chercher','regarder qn/qc'),'no');

console.log('Platzhalter: qn/qc und jdn/etw. gelten auch ausgeschrieben, "quelque chose" und "etwas" behalten ihre Loesung');
