const fs=require('fs'),vm=require('vm'),{JSDOM}=require('jsdom'),assert=require('assert');
for(const year of ['year7','year8','year9','year10']){
 const html=fs.readFileSync(year+'/index.html','utf8'),dom=new JSDOM(html,{runScripts:'outside-only',url:'https://example.org/'+year+'/'}),w=dom.window,c=dom.getInternalVMContext();w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.dispatchEvent(new w.Event('close'))};
 for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],c);vm.runInContext(fs.readFileSync('assets/learning.js','utf8'),c);
 const d=w.document;d.querySelector('#allBtn').click();const button=d.querySelector('#promptFromSelection');assert(button.disabled);d.querySelector('#lcsv').click();d.querySelector('[data-csv-group]').click();assert(!button.disabled);button.click();const form=d.querySelector('#promptConfig'),count=d.querySelector('#promptCount');
 /* Der Hinweis zur Zaehlweise gehoert zu Opposites und darf nur dann
    dastehen, wenn Opposites auch gewaehlt ist. */
 const hint=d.querySelector('#promptCountHint');
 assert(hint,'Hinweis zur Zaehlweise fehlt');
 assert(hint.hidden,'Hinweis steht da, obwohl Opposites nicht gewaehlt ist');
 assert(/gesuchte Gegenteil/.test(hint.textContent));
 d.querySelector('[value=opposites]').checked=true;d.querySelector('#promptBalance').click();
 assert(!hint.hidden,'Hinweis fehlt, obwohl Opposites gewaehlt ist');
 d.querySelector('[value=opposites]').checked=false;d.querySelector('#promptBalance').click();
 assert(hint.hidden,'Hinweis bleibt stehen, nachdem Opposites abgewaehlt wurde');
 count.value='5';d.querySelector('#promptBalance').click();form.dispatchEvent(new w.Event('submit',{cancelable:true}));let prompt=d.querySelector('#promptText').value;
 const klasse=Number(year.replace('year',''));
 for(const muss of ['genau 5','Total : / 5','Klasse '+klasse,(klasse-6)+'. Lernjahr','Französisch-Vokabeltest',
   'zwei getrennte','EINER einzigen Zeile','fett UND kursiv','Name / Klasse / Datum',
   'Écris le mot français. Pour les noms, écris aussi l\'article.','Die Übersetzungsaufgabe enthält nur deutsche Bedeutungen',
   'Aufbau: {"Unité": [["Französisch","Deutsch","Wortart"]','qn und qc','derselben Wortfamilie','nummerierten Liste der gewählten Zielwörter',
   'Leerzeichen vor ? ! : ;','legt die Lehrkraft fest'])
  assert(prompt.includes(muss),year+': im Prompt fehlt "'+muss+'"');
 for(const nicht of ['Englisch','englisch','British','britisch','Answer Key','Word Bank','Definition-Matching','Opposites','2 × N verschiedene Listeneinträge','Bei jedem Gegensatzpaar'])
  assert(!prompt.includes(nicht),year+': im Prompt steht noch "'+nicht+'"');
 /* Wortliste zum Lueckentext nur im ersten Lernjahr */
 assert(prompt.includes(klasse===7?'Wortliste aus den deutschen Bedeutungen':'ohne Wortliste'),year+': Wortliste');
 count.value=Number(count.max)+1;d.querySelector('#promptBalance').click();form.dispatchEvent(new w.Event('submit',{cancelable:true}));assert(d.querySelector('#promptError').textContent);
 count.value=5;d.querySelectorAll('[name=taskType]').forEach(i=>i.checked=false);d.querySelector('#promptBalance').click();form.dispatchEvent(new w.Event('submit',{cancelable:true}));assert(d.querySelector('#promptError').textContent.includes('mindestens einen'));
 d.querySelector('[value=opposites]').checked=true;d.querySelector('#promptBalance').click();form.dispatchEvent(new w.Event('submit',{cancelable:true}));
 prompt=d.querySelector('#promptText').value;
 for(const muss of ['ausschließlich Gegensätze','Sowohl das vorgegebene Wort als auch das gesuchte Gegenteil','Erstelle noch keinen Test','2 × N verschiedene Listeneinträge','Bei jedem Gegensatzpaar'])
  assert(prompt.includes(muss),year+': Gegensätze: "'+muss+'" fehlt');
 assert(!prompt.includes('Die Übersetzungsaufgabe enthält nur'),year+': Übersetzungsregel ohne Übersetzen');
 assert(!prompt.includes('Wortliste zum Lückentext steht'),year+': Wortlisten-Kontrolle ohne Lückentext');
 d.querySelector('#promptClose').click();assert(!d.querySelector('dialog'));
 w.close();
}
console.log('Alle Klassen, Prompt: Umfang, Anzahl, Aufgabentypen, Regeln, bedingte Hinweise und Schliessen passen');
