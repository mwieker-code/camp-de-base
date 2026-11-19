/* Spiele: Descente en luge, Vers le sommet und Tour des coups francs in
   Klasse 7 bis 10 (aus dem Englisch-Trainer: Sled Run, Summit Climb, Free
   Kick Tour). Daten und Seiten kommen aus tools/spiele.cjs, jede Klasse hat
   eine Spieleseite und eine Kachel. Im Spiel waehlt man Unité und
   Abschnitt; Bestwerte sind je Klasse getrennt.
   Gespielt wird ohne Zeichenflaeche. */
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
const {dateien,FAECHER,MIN_TEIL}=require('../tools/spiele.cjs');
const alle=dateien();
for(const [datei,inhalt] of Object.entries(alle))ok(fs.existsSync(path.join(root,datei))&&fs.readFileSync(path.join(root,datei),'utf8')===inhalt,datei+' ist aktuell (sonst: node tools/spiele.cjs)');
const learning=fs.readFileSync(path.join(root,'assets/learning.js'),'utf8');
ok(/function spieleKachel\(\)/.test(learning)&&learning.includes('href="games/"')&&/spieleKachel\(\); \};/.test(learning),'Spiele-Kachel auf den Klassenseiten');
ok(!learning.includes('href="sled/"')&&!learning.includes('href="climb/"'),'die Spiele stehen nicht einzeln auf der Klassenseite');
ok(fs.readFileSync(path.join(root,'spiele/kick/game.js'),'utf8').includes('AUF FRANZÖSISCH'),'Frage auf Franzoesisch');
const fassung=JSON.parse(fs.readFileSync(path.join(root,'fassung.json'),'utf8')).fassung;
const laden=(dir,spiel,vorher)=>{
 const html=fs.readFileSync(path.join(root,dir,spiel,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.org/'+dir+'/'+spiel+'/',virtualConsole:new VirtualConsole()});
 if(vorher)for(const [k,v] of Object.entries(vorher))dom.window.localStorage.setItem(k,v);
 const srcs=[...html.matchAll(/<script src="([^"?]+)\?v=([^"]+)"><\/script>/g)];
 for(const [,src,v] of srcs){ok(v===fassung,dir+'/'+spiel+': '+src+' mit aktueller Versionsnummer');dom.window.eval(fs.readFileSync(path.resolve(root,dir,spiel,src),'utf8'));}
 return dom.window;
};
for(const f of FAECHER){
 const w0={};new Function('window',fs.readFileSync(path.join(root,f.dir,'games/data.js'),'utf8'))(w0);const Q=w0.GAME_DATA;
 ok(Q.fach===f.fach&&Q.units.length>=1&&Q.units.every(u=>u.parts.length&&u.parts.every(p=>p.words.every(v=>v.en&&v.de))),f.fach+': Daten mit Units und Abschnitten');
 ok(Q.units.every(u=>u.parts.reduce((n,p)=>n+p.words.length,0)>=6),f.fach+': jede Unit hat genug Woerter');
 /* Spieleseite */
 const hub=fs.readFileSync(path.join(root,f.dir,'games/index.html'),'utf8');
 ok(hub.includes('href="../sled/"')&&hub.includes('href="../climb/"')&&hub.includes('href="../kick/"')&&hub.includes('← '+f.fach)&&/data-eigenes-design/.test(hub),f.fach+': Spieleseite mit beiden Spielen und Weg zurueck');
 const hw=new JSDOM(hub,{runScripts:'outside-only',url:'https://example.org/'+f.dir+'/games/',virtualConsole:new VirtualConsole()}).window;
 hw.localStorage.setItem(f.schluessel+':sled:v1',JSON.stringify({best:{x:120,y:340},finishes:{x:2,y:1}}));
 hw.localStorage.setItem(f.schluessel+':kick:v1',JSON.stringify({best:{x:510},tours:{x:2}}));
 for(const m of hub.matchAll(/<script(?: src="([^"?]+)[^"]*")?>([\s\S]*?)<\/script>/g))hw.eval(m[1]?fs.readFileSync(path.resolve(root,f.dir,'games',m[1]),'utf8'):m[2]);
 ok(/Bestwert 340 P · 3× im Ziel/.test(hw.document.querySelector('[data-stand="sled"]').textContent)&&/Noch nicht gespielt/.test(hw.document.querySelector('[data-stand="climb"]').textContent)&&/Bestwert 510 P · 2× Tour geschafft/.test(hw.document.querySelector('[data-stand="kick"]').textContent),f.fach+': Spieleseite zeigt den eigenen Stand');
 for(const spiel of ['sled','climb','kick']){
  const w=laden(f.dir,spiel),d=w.document,S=spiel==='sled'?w.SledGame:spiel==='kick'?w.KickGame:w.ClimbGame;
  ok(d.querySelector('header a').getAttribute('href')==='../games/'&&d.title.includes(f.fach),f.fach+' '+spiel+': Titel und Weg zur Spieleseite');
  const units=d.querySelectorAll('#units [data-unit]');
  if(Q.units.length>1){
   ok(units.length===Q.units.length,f.fach+' '+spiel+': Unit-Auswahl');
   for(const u of Q.units){
    d.querySelector('[data-unit="'+u.id+'"]').click();
    const knoepfe=[...d.querySelectorAll('#levels [data-part]')].map(b=>b.dataset.part);
    ok(knoepfe.length===u.parts.filter(p=>p.words.length>=MIN_TEIL).length+1&&knoepfe.at(-1)==='all',f.fach+' '+spiel+' '+u.name+': Abschnitte (ohne ganz kleine) und ganze Unit');
    ok(d.querySelector('[data-unit="'+u.id+'"]').getAttribute('aria-pressed')==='true',f.fach+' '+spiel+': gewaehlte Unit markiert');
   }
   ok(JSON.parse(w.localStorage.getItem(f.schluessel+':'+spiel+':v1')).unit===Q.units.at(-1).id,f.fach+' '+spiel+': gewaehlte Unit gemerkt');
  }else{
   ok(units.length===0||d.getElementById('units').hidden,f.fach+' '+spiel+': nur eine Unit, keine Auswahl');
   ok(/Alle Themen/.test(d.querySelector('[data-part="all"]').textContent),f.fach+' '+spiel+': "Alle Themen"');
  }
  /* ganze Unit spielen: Antworten kommen aus der Unit */
  const u=Q.units.at(-1),unitWorte=new Set(u.parts.flatMap(p=>p.words.map(v=>v.en)));
  d.querySelector('[data-part="all"]').click();
  if(spiel==='sled'){const G=S.G;let n=0;while(G.mode!=='ride'&&n++<200)S.update(0.02);
   ok(G.mode==='ride'&&G.options.length===3&&G.options.every(o=>unitWorte.has(o.en)),f.fach+' sled: drei Antworten aus der gewaehlten Unit');}
  else if(spiel==='kick'){const G=S.G;ok((G.mode==='intro'||G.mode==='aim')&&G.options.length===4&&G.options.every(o=>unitWorte.has(o.en)),f.fach+' kick: vier Antworten aus der gewaehlten Unit');}
  else{const G=S.G;ok(G.holds.length===3&&G.holds.every(h=>unitWorte.has(h.w.en)),f.fach+' climb: drei Antworten aus der gewaehlten Unit');}
  ok(d.getElementById('stage').hidden===false,f.fach+' '+spiel+': Spiel laeuft');
 }
}
/* Bestwerte je Klasse getrennt */
{const w=laden('year8','sled',{'fr8:sled:v1':JSON.stringify({best:{all:777},finishes:{all:4},rider:'kid',modus:'normal'})});
 ok(w.localStorage.getItem('fr9:sled:v1')===null&&w.localStorage.getItem('vt6:sled:v1')===null,'andere Klassen und der Englisch-Trainer unberuehrt');
 ok([...w.document.querySelectorAll('button[lang]')].every(b=>b.lang==='fr'),'Antworten als Franzoesisch ausgezeichnet');}
ok(/spielSeiten=.*'games','sled','climb','kick'/.test(fs.readFileSync(path.join(root,'build.cjs'),'utf8')),'Build prueft die Spieleseiten');
console.log('spiele: '+checks+' Pruefungen bestanden');
