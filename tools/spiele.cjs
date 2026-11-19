/* Spiele: erzeugt fuer Klasse 7 bis 10
     yearN/games/data.js      alle Unités und Abschnitte mit Vokabeln (window.GAME_DATA)
     yearN/games/index.html   Spieleseite mit den drei Spielen
     yearN/sled/index.html    Descente en luge      (Code in spiele/sled/)
     yearN/climb/index.html   Vers le sommet        (Code in spiele/climb/)
     yearN/kick/index.html    Tour des coups francs (Code in spiele/kick/)
   Die Spiele stammen aus dem Englisch-Trainer (Sled Run, Summit Climb,
   Free Kick Tour). "en" ist dort wie hier die Zielsprache.
   Quelle sind die Vokabelseiten des Fachs (TOPICS und SETS) und die
   Vorlagen in tools/vorlagen/. Die Versionsnummer kommt aus fassung.json.
   Aufruf:  node tools/spiele.cjs          schreibt alle Dateien
            node tools/spiele.cjs --check  meldet, ob etwas veraltet ist */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const MIN_TEIL=6;   // kleinere Abschnitte gibt es nur ueber "Ganze Unit" bzw. "Alle Themen"
const FAECHER=[7,8,9,10].map(j=>({dir:'year'+j,fach:'Klasse '+j,schluessel:'fr'+j}));
const rel=(von,nach)=>{const r=path.relative(path.join(ROOT,von),path.join(ROOT,nach)).split(path.sep).join('/');return r;};
function lies(datei){
 const s=fs.readFileSync(path.join(ROOT,datei),'utf8');
 const teil=(name,zu)=>{const a=s.indexOf('const '+name+' = '),b=s.indexOf('\n'+zu+';',a)+2;return (0,eval)('('+s.slice(a+name.length+9,b)+')');};
 return {TOPICS:teil('TOPICS',']'),SETS:teil('SETS','}')};
}
function daten(f){
 const {TOPICS,SETS}=lies(f.dir+'/index.html'),units=[];
 for(const t of TOPICS){
  const unitName=f.eineUnit||t.unitName,unitId=f.eineUnit?'alle':t.unit;
  if(!unitName||(f.ohne||[]).includes(unitName))continue;
  const words=(SETS[t.id]||[]).filter(v=>v.en&&v.de).map(v=>({id:v.id,en:v.en,de:v.de,pos:v.pos||''}));
  if(!words.length)continue;
  let u=units.find(x=>x.id===unitId);if(!u)units.push(u={id:unitId,name:unitName,parts:[]});
  u.parts.push({id:t.id,name:t.name,words,klein:words.length<MIN_TEIL||undefined});
 }
 const d={fach:f.fach,schluessel:f.schluessel,trainer:'../',units:units.filter(u=>u.parts.reduce((n,p)=>n+p.words.length,0)>=6)};
 if(f.start)d.start=f.start;if(f.altAll)d.altAll=f.altAll;if(f.alleName)d.alleName=f.alleName;
 return '/* Erzeugt von tools/spiele.cjs aus '+f.dir+'/index.html - nicht von Hand aendern. */\nwindow.GAME_DATA = '+JSON.stringify(d)+';\n';
}
function seite(vorlage,f,unter){
 const v=JSON.parse(fs.readFileSync(path.join(ROOT,'fassung.json'),'utf8')).fassung;
 const ort=f.dir+'/'+unter;
 return fs.readFileSync(path.join(__dirname,'vorlagen',vorlage),'utf8')
  .replaceAll('{{WURZEL}}',rel(ort,'')+'/')
  .replaceAll('{{CODE}}',(rel(ort,'spiele/'+vorlage.replace('.html',''))||'.')+'/')
  .replaceAll('{{FIGUREN}}',rel(ort,'spiele/figuren.js'))
  .replaceAll('{{FACH_GROSS}}',f.fach.toUpperCase())
  .replaceAll('{{FACH}}',f.fach)
  .replaceAll('{{V}}',v)
  .replace('href="./style.css','href="style.css').replace(/src="\.\/(musik|game|spieler)\.js/g,'src="$1.js');
}
function dateien(){
 const out={};
 for(const f of FAECHER){
  out[f.dir+'/games/data.js']=daten(f);
  out[f.dir+'/games/index.html']=seite('games.html',f,'games');
  out[f.dir+'/sled/index.html']=seite('sled.html',f,'sled');
  out[f.dir+'/climb/index.html']=seite('climb.html',f,'climb');
  out[f.dir+'/kick/index.html']=seite('kick.html',f,'kick');
 }
 return out;
}
module.exports={dateien,FAECHER,MIN_TEIL};
if(require.main===module){
 const alle=dateien();let alt=0;
 for(const [datei,inhalt] of Object.entries(alle)){
  const ziel=path.join(ROOT,datei),jetzt=fs.existsSync(ziel)?fs.readFileSync(ziel,'utf8'):null;
  if(jetzt===inhalt)continue;
  if(process.argv.includes('--check')){console.error('veraltet: '+datei);alt++;continue;}
  fs.mkdirSync(path.dirname(ziel),{recursive:true});fs.writeFileSync(ziel,inhalt);console.log('geschrieben: '+datei);
 }
 if(process.argv.includes('--check')){if(alt){console.error('Bitte "node tools/spiele.cjs" laufen lassen.');process.exit(1);}console.log('Spiele-Dateien aktuell.');}
}
