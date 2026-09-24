/* Die Buchangabe war im Englisch-Trainer in allen Jahrgaengen leer. Wo
   sie ohne Pruefung eingesetzt wird, steht auf jeder Karte "Year 5 () -
   alle Units" und in der Uebersicht eine leere Zeile neben dem Jahrgang.
   Camp de Base traegt sie ("À plus ! 1") - die Pruefung bleibt, damit
   eine Klasse ohne Buch nicht wieder leere Klammern zeigt. */
{
  const fs=require('fs'), path=require('path'), assert=require('node:assert/strict');
  const wurzel=path.resolve(__dirname,'..');
  for(const jahr of ['year7','year8','year9','year10']){
    const html=fs.readFileSync(path.join(wurzel,jahr,'index.html'),'utf8');
    assert.ok(!/\+ " \(" \+ y\.book \+ "\)"/.test(html),
      jahr+': die Buchangabe steht ungeprueft in der Rundenzeile');
    assert.ok(!/^\s*<span class="name">\$\{esc\(y\.book\)\}<\/span>/m.test(html),
      jahr+': die Buchangabe steht ungeprueft in der Uebersicht');
  }
  console.log('Buchangabe: keine leeren Klammern, keine leeren Zeilen');
}
