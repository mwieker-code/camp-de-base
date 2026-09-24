/* =========================================================================
   SEITEN AUS DEM BESTAND
   -------------------------------------------------------------------------
   Die vier Klassenseiten tragen ihre Vokabeln selbst, wie die Seiten von
   English Basecamp. Geschrieben werden sie aber nicht von Hand, sondern
   aus content/:

     content/aplusN.json            Stichwort, Bedeutung, Wortart, Fundstelle
                                    (aus den Excel-Listen, tools/import-aplus.py)
     content/beispiele-aplusN.tsv   eigene Beispielsaetze, Luecke in [ ], und
                                    Wortarten, wo die Liste keine nennt.
                                    Tabulatorgetrennt - laesst sich in Excel
                                    oeffnen und wieder als Text speichern.
                                    Schluessel ist "Fundstelle|Stichwort".

   Der App-Teil aller vier Seiten ist derselbe. Vorlage ist year7/index.html:
   Wer dort etwas am Code aendert, ruft danach dieses Werkzeug auf, und die
   anderen drei Seiten ziehen nach. Ersetzt werden nur der Datenblock, die
   Unite-Farben, Titel und Unterzeile.

   Im Datenblock heisst das franzoesische Stichwort "en" und der Satz
   "example_en": So heissen die Felder im gemeinsamen Code, der aus dem
   Englisch-Trainer stammt. Gemeint ist die Zielsprache.

   Aufruf:  node tools/seiten.cjs          schreibt alle vier Seiten
            node tools/seiten.cjs --check  meldet, ob eine Seite veraltet ist
   Danach:  node tools/nacht.cjs           (dunkle Farben der Unite-Regeln)
   ========================================================================= */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const VORLAGE = path.join(ROOT, 'year7', 'index.html');
const BAENDE = [1, 2, 3, 4];

/* Eine Farbe je Kapitel, in der Reihenfolge des Buchs. Hell geschrieben;
   tools/nacht.cjs rechnet das dunkle Gegenstueck. */
const FARBEN = [
  ['#0E5A66', '#E4EFF1', '#083C45'],   // Petrol
  ['#2B5F8A', '#E6EDF4', '#1B3C56'],   // Blau
  ['#B0472A', '#F5E7E1', '#6E2C1A'],   // Terrakotta
  ['#5B7A2E', '#EBF0E1', '#374A1C'],   // Olive
  ['#7A5C9E', '#EEE8F3', '#4B3763'],   // Violett
  ['#A36B1A', '#F5ECD9', '#63400F'],   // Ocker
  ['#8A3B5C', '#F3E6EC', '#57233A'],   // Brombeer
];

function lies(datei, ersatz) {
  const p = path.join(ROOT, 'content', datei);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : ersatz;
}

/* Die Tabelle: erste Zeile Ueberschrift, dann Schluessel, Wortart
   ("-" = die aus der Liste gilt) und Satz ("-" = keiner). */
function tabelle(datei) {
  const p = path.join(ROOT, 'content', datei);
  if (!fs.existsSync(p)) return {};
  const out = {};
  const zeilen = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).slice(1);
  zeilen.forEach((z, i) => {
    if (!z.trim()) return;
    const [schluessel, wortart, satz] = z.split('\t');
    if (!schluessel || satz === undefined) throw new Error(datei + ', Zeile ' + (i + 2) + ': drei Spalten erwartet');
    if (satz !== '-' && (satz.match(/\[/g) || []).length !== 1)
      throw new Error(datei + ', Zeile ' + (i + 2) + ': genau eine Luecke [ ] erwartet');
    out[schluessel] = { wortart: wortart === '-' ? '' : wortart, satz: satz === '-' ? '' : satz };
  });
  return out;
}

/* "Je [réfléchis] souvent." -> Satz ohne Klammern, die Luecke und ihre
   Stelle. Die Stelle zaehlt mit: "en" steht auch in "grands-parents",
   "ou" in "rouge" - gesucht wuerde die Luecke im falschen Wort. */
function beispiel(satz) {
  const m = /\[([^\]]+)\]/.exec(satz);
  if (!m) return { example_en: satz };
  return { example_en: satz.replace(/\[([^\]]+)\]/g, '$1'), luecke: m[1], luecke_bei: m.index };
}

function daten(band) {
  const buch = lies('aplus' + band + '.json');
  const saetze = tabelle('beispiele-aplus' + band + '.tsv');
  const j = buch.jahrgang;
  const years = [{ id: 'y' + j, label: 'Klasse ' + j, book: 'À plus ! ' + band, units: [] }];
  const topics = [];
  const sets = {};
  const hoechste = Math.max(0, ...buch.einheiten.filter(e => /^u\d+$/.test(e.id)).map(e => Number(e.id.slice(1))));
  buch.einheiten.forEach(e => {
    /* Unite-Nummern bleiben Nummern; Einstieg ist 0, die Module ohne
       Nummer folgen auf das letzte Kapitel. */
    const nr = /^u\d+$/.test(e.id) ? e.id.slice(1) : String(hoechste + 1);
    const unit = 'y' + j + 'u' + nr;
    years[0].units.push({ id: unit, name: e.name });
    for (const t of e.teile) {
      const tid = unit + '-' + t.id;
      topics.push({ id: tid, year: String(j), yearName: 'À plus ! ' + band,
                    unit, unitName: e.name, name: t.name });
      sets[tid] = t.woerter.map((w, i) => {
        const extra = saetze[w.fund + '|' + w.fr];
        const v = { id: tid + '-' + String(i + 1).padStart(3, '0'), en: w.fr, de: w.de,
                    pos: [(extra && extra.wortart) || w.pos, w.hinweis].filter(Boolean).join(' · ') };
        if (extra && extra.satz) Object.assign(v, beispiel(extra.satz));
        return v;
      });
    }
  });
  /* Ein Schluessel, der zu keinem Eintrag passt, ist fast immer ein
     Tippfehler in der Tabelle - oder die Liste hat sich geaendert. */
  const bekannt = new Set(buch.einheiten.flatMap(e => e.teile.flatMap(t => t.woerter.map(w => w.fund + '|' + w.fr))));
  const fremd = Object.keys(saetze).filter(k => !bekannt.has(k));
  if (fremd.length) throw new Error('Band ' + band + ': Schluessel ohne Eintrag: ' + fremd.slice(0, 5).join(' ; '));
  return { j, band, years, topics, sets };
}

function datenblock(d) {
  const js = x => JSON.stringify(x, null, 1);
  return 'const YEARS = ' + js(d.years) + ';\n\nconst TOPICS = ' + js(d.topics)
    + ';\n\nconst SETS = ' + js(d.sets) + ';\n';
}

function farbregeln(d) {
  return d.years[0].units.map(u => {
    const [a, b, c] = FARBEN[Number(u.id.split('u')[1]) % FARBEN.length];
    return '.' + u.id + '{--unit:' + a + '; --unit-bg:' + b + '; --unit-ink:' + c + '}';
  }).join('\n');
}

function seite(vorlage, d) {
  let s = vorlage;
  const start = s.indexOf('const YEARS = [');
  const ende = s.indexOf('</script>', start);
  if (start < 0 || ende < 0) throw new Error('Datenblock nicht gefunden');
  s = s.slice(0, start) + datenblock(d) + s.slice(ende);

  /* Die Unite-Farben: alle alten Regeln fort, die neuen an die Stelle
     der ersten. Nur im hellen Block - der dunkle entsteht neu. */
  const hell = s.indexOf('<style>'), hellEnde = s.indexOf('</style>', hell);
  let css = s.slice(hell, hellEnde);
  const regel = /^\.y\d+u\d+\{--unit:[^}]*\}[^\n]*\n/m;
  const erste = css.search(regel);
  if (erste < 0) throw new Error('Unite-Farben nicht gefunden');
  css = css.replace(new RegExp(regel.source, 'gm'), '');
  css = css.slice(0, erste) + farbregeln(d) + '\n' + css.slice(erste);
  s = s.slice(0, hell) + css + s.slice(hellEnde);

  s = s.replace(/<title>[^<]*<\/title>/, '<title>Camp de Base – Klasse ' + d.j + '</title>')
       .replace(/<meta name="apple-mobile-web-app-title" content="[^"]*">/,
                '<meta name="apple-mobile-web-app-title" content="Camp de Base">')
       .replace(/<h1>[\s\S]*?<\/h1>/, '<h1>Camp de <span class="title-accent">Base</span></h1>')
       .replace(/<div class="sub">[^<]*<\/div>/,
                '<div class="sub">Klasse ' + d.j + ' · À plus ! ' + d.band + '</div>')
       .replace(/&larr; Alle Jahrg&auml;nge/, '&larr; Alle Klassen')
       .replace(/"fr\d+:(progress|test)"/g, (_, k) => '"fr' + d.j + ':' + k + '"');
  return s;
}

/* Den dunklen Block und den Hell/Nacht-Schalter schreibt tools/nacht.cjs,
   nicht dieses Werkzeug - verglichen wird deshalb ohne sie. */
const ohneNacht = s => s.replace(/<style media="screen" data-nacht>[\s\S]*?<\/style>\n?/g, '')
                         .replace(/<script data-nacht src="[^"]*"><\/script>\n?/g, '');

const pruefen = process.argv.includes('--check');
const vorlage = fs.readFileSync(VORLAGE, 'utf8');
let veraltet = 0;
for (const band of BAENDE) {
  const d = daten(band);
  const ziel = path.join(ROOT, 'year' + d.j, 'index.html');
  const neu = seite(vorlage, d);
  const alt = fs.existsSync(ziel) ? fs.readFileSync(ziel, 'utf8') : '';
  if (ohneNacht(alt) === ohneNacht(neu)) continue;
  if (pruefen) { console.error('veraltet: year' + d.j + '/index.html'); veraltet++; continue; }
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, neu);
  const n = Object.values(d.sets).reduce((a, l) => a + l.length, 0);
  const b = Object.values(d.sets).reduce((a, l) => a + l.filter(v => v.example_en).length, 0);
  console.log('year' + d.j + '/index.html: ' + n + ' Woerter, ' + b + ' mit Beispielsatz');
}
if (pruefen && veraltet) {
  console.error('Bitte "node tools/seiten.cjs" und danach "node tools/nacht.cjs" ausfuehren.');
  process.exit(1);
}
