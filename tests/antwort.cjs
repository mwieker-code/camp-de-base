/* Was beim Tippen als richtig zaehlt.
   Der Eintrag traegt Klammern, Schraegstriche, Etiketten und Platzhalter
   - die Antwort eines Schuelers traegt sie nicht. Geprueft wird, dass
   beide Schreibweisen dasselbe bedeuten, dass Akzent und Artikel auf der
   franzoesischen Seite "fast" sind und nicht "richtig", und dass die
   Nachsicht dort endet, wo zwei verschiedene Woerter stehen. */
const {JSDOM,VirtualConsole}=require('jsdom');
const vm=require('node:vm');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

function seite(folder){
  const html=fs.readFileSync(path.join(root,folder,'index.html'),'utf8');
  const stille=new VirtualConsole();
  stille.on('jsdomError',e=>{ if(!/getContext/.test(String(e.message))) throw e; });
  const dom=new JSDOM(html,{runScripts:'outside-only',virtualConsole:stille,
    url:'https://example.org/'+folder+'/'});
  const w=dom.window;w.scrollTo=()=>{};
  w.matchMedia=q=>({matches:false,media:q,addEventListener(){},removeEventListener(){}});
  const c=dom.getInternalVMContext();
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],c);
  vm.runInContext(fs.readFileSync(path.join(root,'assets/learning.js'),'utf8'),c);
  return {pruefe:(i,t,dir)=>vm.runInContext('S.mode="type";S.view="session";S.dir='+JSON.stringify(dir||'de2en')+';checkTyped('+JSON.stringify(i)+','+JSON.stringify(t)+')',c),
          sets:vm.runInContext('SETS',c)};
}

/* Auf Franzoesisch geantwortet (DE -> FR) */
const RICHTIG=[
  ['la maison','la maison'],['La Maison','la maison'],["l'île","l'île"],["l’île","l'île"],
  /* œ darf als oe getippt werden */
  ["l'oeuf","l'œuf"],['la soeur','la sœur'],
  /* Platzhalter und Hinweise gehoeren nicht zur Antwort */
  ['écouter','écouter (qn/qc)'],['écouter quelque chose','écouter (qn/qc)'],['regarder','regarder qn/qc'],
  ['adorer','adorer qn/qc/(+ inf.)'],['sympa','sympa (fam.) / sympathique'],['sympathique','sympa (fam.) / sympathique'],
  ["l'EPS","l'EPS (= l'Éducation physique et sportive)"],['les maths','les maths (fam.) / les mathématiques'],
  /* Klammern sind Wahl, Schraegstriche Alternativen */
  ['le foot','le foot(ball)'],['le football','le foot(ball)'],['petit','petit/petite'],['petite','petit/petite'],
  ['le cousin','le cousin / la cousine'],['la cousine','le cousin / la cousine'],['le fan','le/la fan'],['la fan','le/la fan'],
  ['il s\'appelle',"il/elle s'appelle"],['elle s\'appelle',"il/elle s'appelle"],['Madame','Madame/Mme'],
  /* Satzzeichen und franzoesische Leerzeichen davor */
  ['Salut','Salut !'],["Tu t'appelles comment?","Tu t'appelles comment ?"],['ne pas','ne … pas'],
  /* Wer abschreibt, was dasteht, hat richtig geantwortet */
  ['aimer bien qn/qc/(+ inf.)','aimer bien qn/qc/(+ inf.)']
];
const FAST=[
  ['maison','la maison','Artikel fehlt'],['le maison','la maison','Artikel falsch'],['ile',"l'île",'Artikel und Akzent'],
  ['le chateau','le château','Akzent fehlt'],['ecouter','écouter (qn/qc)','Akzent fehlt'],['la fenetre','la fenêtre','Akzent fehlt'],
  ['la maisn','la maison','Tippfehler']
];
const FALSCH=[['la chaise','la table'],['le chat','le chien'],['petit','grand/grande'],['','la maison']];

/* Auf Deutsch geantwortet (FR -> DE): der Artikel ist frei */
const DEUTSCH=[
  ['Haus','das Haus'],['das Haus','das Haus'],['Hallo','Hallo! (auch:) Tschüss!'],['Tschüss','Hallo! (auch:) Tschüss!'],
  ['ansehen','jdn/etw. ansehen, jdn/etw. anschauen'],['anschauen','jdn/etw. ansehen, jdn/etw. anschauen'],
  ['und dir','(hier:) Und dir?'],['Freund','der/die Freund/in'],['erzählen','etw. erzählen'],['etwas erzählen','etw. erzählen']
];

for(const folder of ['year7','year8','year9','year10']){
  const {pruefe,sets}=seite(folder);
  for(const [antwort,eintrag] of RICHTIG)
    assert.equal(pruefe(antwort,eintrag),'ok',folder+': "'+antwort+'" sollte zu "'+eintrag+'" passen');
  for(const [antwort,eintrag,warum] of FAST)
    assert.equal(pruefe(antwort,eintrag),'near',folder+': "'+antwort+'" zu "'+eintrag+'" ist fast richtig ('+warum+')');
  for(const [antwort,eintrag] of FALSCH)
    assert.equal(pruefe(antwort,eintrag),'no',folder+': "'+antwort+'" darf nicht als "'+eintrag+'" durchgehen');
  for(const [antwort,eintrag] of DEUTSCH)
    assert.equal(pruefe(antwort,eintrag,'en2de'),'ok',folder+': "'+antwort+'" sollte zu "'+eintrag+'" passen');

  /* Und die Probe aufs Ganze: Wer abschreibt, was als Loesung dasteht,
     hat richtig geantwortet - in beiden Richtungen. */
  const daneben=[];
  for(const v of Object.values(sets).flat()){
    if(pruefe(v.en,v.en)!=='ok') daneben.push(v.en);
    if(pruefe(v.de,v.de,'en2de')!=='ok') daneben.push(v.de);
  }
  assert.equal(daneben.length,0,folder+': Loesung abgetippt und nicht anerkannt: '+daneben.slice(0,5).join(' | '));

  console.log(folder+': Akzent, Artikel, Platzhalter, Alternativen und alle '+
    Object.values(sets).flat().length+' Eintraege passen');
}
