/* Wo die Luecke im Beispielsatz sitzt.

   Die Beispielsaetze von Camp de Base sind eigens geschrieben, und jeder
   traegt seine Luecke selbst: in content/beispiele-aplusN.tsv in
   eckigen Klammern, auf der Seite als "luecke" samt Stelle "luecke_bei".

   Der Fehler, gegen den dieser Test steht: Gesucht wurde die Luecke
   zuerst mit indexOf - und "en" stand dann in "grands-parents", "ou" in
   "rouge". Die Stelle muss stimmen, nicht nur das Wort.

   Ohne Markierung sucht die Seite das Stichwort selbst. Auch das wird
   geprueft, mit franzoesischen Woertern: \w und \b kennen kein "é". */
const fs=require('fs'), path=require('path'), vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');

const quelle=fs.readFileSync(path.join(root,'assets/learning.js'),'utf8')
  .match(/const BUCHSTABE = [^\n]*\n  clozeParts = function\(v\)\{[\s\S]*?\n  \};/);
assert.ok(quelle,'clozeParts steht nicht mehr in learning.js');
const ctx=vm.createContext({String,RegExp,Math});
vm.runInContext('var clozeParts;'+quelle[0],ctx);
const zerlege=v=>vm.runInContext('clozeParts('+JSON.stringify(v)+')',ctx);

let geprueft=0;
const falsch=[];
for(const f of ['year7','year8','year9','year10']){
  const html=fs.readFileSync(path.join(root,f,'index.html'),'utf8');
  const SETS=eval('('+html.match(/const SETS = (\{[\s\S]*?\n\});/)[1]+')');
  for(const [id,liste] of Object.entries(SETS)) for(const v of liste){
    if(!v.example_en) continue;
    geprueft++;
    const r=zerlege(v);
    if(!r || r.word!==v.luecke || r.before.length!==v.luecke_bei
       || r.before+r.word+r.after!==v.example_en)
      falsch.push(f+' '+id+': '+JSON.stringify(v.en)+' -> '+JSON.stringify(r)+' im Satz "'+v.example_en+'"');
  }
}
assert.equal(falsch.length,0,'Die Luecke sitzt nicht, wo sie markiert ist:\n  '+falsch.slice(0,10).join('\n  '));
assert.ok(geprueft>=700,'nur '+geprueft+' Luecken gefunden');

/* Die gemeldeten Faelle namentlich - mit Stelle. */
for(const satz of ['Mes grands-parents habitent en France.','Tu préfères le rouge ou le bleu ?']){
  const luecke=satz.includes(' en ')?'en':'ou';
  const bei=satz.indexOf(' '+luecke+' ')+1;
  const r=zerlege({en:luecke,example_en:satz,luecke,luecke_bei:bei});
  assert.equal(r && r.before.length, bei, JSON.stringify(luecke)+': Luecke sitzt im falschen Wort');
}

/* Ohne Markierung: das Stichwort selbst finden, auch mit Akzent und
   Artikel davor. */
for(const [fr,satz,erwartet] of [
    ['écouter (qn/qc)','Le soir, nous écoutons la radio.','écoutons'],
    ["l'école","Ma sœur va à l'école.",'école'],
    ['la fenêtre',"Ouvre la fenêtre, s'il te plaît.",'fenêtre'],
    ['réfléchir (à qc)','Je réfléchis souvent à mes vacances.','réfléchis']]){
  const r=zerlege({en:fr,example_en:satz});
  assert.equal(r && r.word, erwartet, JSON.stringify(fr)+': Luecke sitzt falsch');
}
console.log('Lücken: '+geprueft+' markierte Lücken sitzen an ihrer Stelle, die Suche ohne Markierung kennt Akzente');
