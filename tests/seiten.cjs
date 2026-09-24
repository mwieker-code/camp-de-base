/* Die Klassenseiten entstehen aus content/ (tools/seiten.cjs). Wer die
   Tabelle der Beispielsaetze oder die Vorlage year7/index.html aendert
   und das Werkzeug vergisst, liefert veraltete Seiten aus. */
const {execFileSync}=require('node:child_process');
const path=require('node:path');
execFileSync(process.execPath,[path.join(__dirname,'..','tools','seiten.cjs'),'--check'],{stdio:'inherit'});
console.log('Seiten: alle vier Klassen entsprechen content/ und der Vorlage');
