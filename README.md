# Camp de Base – Französisch-Vokabeltrainer

Statischer Vokabeltrainer für Französisch als zweite Fremdsprache, Klasse 7 bis 10, zum Lehrwerk *À plus !* (Band 1–4). Schwesterprojekt von [English Basecamp](https://github.com/mwieker-code/vokabeltrainer): Das technische Gerüst ist dasselbe, getrennt sind Vokabular, Gestaltung und Speicher.

| Seite     | Lehrwerk   | Wörter | eigene Beispielsätze |
|-----------|------------|-------:|---------------------:|
| `year7/`  | À plus ! 1 |    729 |                  729 |
| `year8/`  | À plus ! 2 |    513 |        – (noch offen) |
| `year9/`  | À plus ! 3 |    311 |        – (noch offen) |
| `year10/` | À plus ! 4 |    350 |        – (noch offen) |

Einträge der Wortart „civ“ (Landeskunde: Städte, Flüsse, Bauwerke) werden nicht übernommen.

## Was anders ist als im Englisch-Trainer

- **Aussprache** auf Französisch (`fr-FR`, auf Apple-Geräten bevorzugt die Stimme „Thomas“). Platzhalter und Hinweise wie `qn/qc`, `(fam.)`, `(+ inf.)` werden nicht mitgesprochen.
- **Antwortprüfung:** Nomen werden mit Artikel gelernt. Fehlt der Artikel oder ein Akzent, zählt die Antwort als „Fast“ und bekommt einen eigenen Hinweis. `oe` statt `œ` gilt als richtig. Auf der deutschen Seite ist der Artikel frei. `qn/qc` und `jdn/jdm/etw.` sind Platzhalter, auch ausgeschrieben (`quelque chose`, `etwas`).
- **Tastatur:** Auf dem Handy gibt es QWERTZ mit einer Akzentreihe (é è ê à â ç ù û ô î) und einem Apostroph neben dem „l“; ï, ë und œ liegen auf der 123-Ebene. Am Rechner steht unter dem Eingabefeld eine Leiste mit den Sonderzeichen, weil ç und œ auf deutschen Tastaturen fehlen.
- **Lückensatz** nur, wo es Beispielsätze gibt (bisher Klasse 7). In Klasse 8–10 ist die Übungsart ausgeblendet.
- **KI-Prompt** für Vokabeltests auf Französisch: Lückentext (in Klasse 7 mit alphabetischer Wortliste), Übersetzen DE → FR, Gegensätze, eigene Sätze; Zeitformen présent bis futur simple.
- **Speicher:** Die Schlüssel beginnen mit `fr7:` … `fr10:` statt `vt…`. Beide Trainer liegen auf derselben GitHub-Pages-Domain und teilen sich den Browserspeicher, deshalb überschreiben sie sich so nicht gegenseitig.
- **Gestaltung „L'heure bleue“:** das Nachtaufstieg-Gerüst mit Mohnrot (`#FF6B7A`) und Kornblumenblau (`#7AA2FF`) statt Alpenglühen und Gletscher; eigene Symbole auf der Startseite und ein eigenes App-Symbol.

## Vokabular pflegen

Die Klassenseiten tragen ihre Vokabeln selbst, werden aber aus `content/` geschrieben:

```
content/aplusN.json           Stichwort, Bedeutung, Wortart, Fundstelle
                              (aus den Excel-Listen des Verlags)
content/beispiele-aplusN.tsv  eigene Beispielsätze und fehlende Wortarten
```

**Excel-Liste neu einlesen** (die Excel-Dateien gehören nicht ins Repository):

```
pip install openpyxl
python3 tools/import-aplus.py Aplus1.xlsx Aplus2.xlsx Aplus3.xlsx Aplus4.xlsx
```

Übernommen werden nur Fundstelle, Stichwort, Bedeutung, Genus und Wortart, nicht die Kontextsätze des Verlags. Ein unregelmäßiger Plural (`le château / ((!))les châteaux`) wandert in den Hinweis.

**Beispielsätze** stehen in `content/beispiele-aplusN.tsv`. Die Datei ist tabulatorgetrennt und lässt sich in Excel öffnen und wieder als „Text (Tabstopp-getrennt)“ speichern. Die drei Spalten:

1. Schlüssel `Fundstelle|Stichwort`, genau wie in der Liste, z. B. `2/3|écouter (qn/qc)`
2. Wortart (`-` = die aus der Liste gilt), z. B. `Verb` oder `Nomen, f.`
3. Satz mit genau einer Lücke in eckigen Klammern, z. B. `Le soir, j'[écoute] la radio.` (`-` = kein Satz)

Die Lücke darf eine gebeugte Form sein. Gefragt wird im Lückensatz genau das, was in der Klammer steht.

**Danach immer:**

```
node tools/seiten.cjs    # schreibt year7–year10 neu
node tools/nacht.cjs     # dunkle Farben
npm test
```

Wer am App-Code etwas ändert, ändert ihn in `year7/index.html` (der Vorlage für alle vier Seiten) oder in `assets/`. `tools/seiten.cjs` überträgt die Vorlage auf die anderen Klassen. Im Datenblock heißt das französische Stichwort aus historischen Gründen `en` und der Satz `example_en`: Die Feldnamen stammen aus dem gemeinsamen Code des Englisch-Trainers.

## Starten und prüfen

Lokal: `python3 -m http.server 8765`, danach http://localhost:8765 öffnen. Für GitHub Pages die Startseite, `manifest.webmanifest`, `fassung.json`, `sw.js`, `assets/` und die vier Klassenordner gemeinsam veröffentlichen.

`npm ci` installiert nur die Entwicklungsabhängigkeit für die Tests. `npm test` prüft alle vier Klassen mit einem simulierten Browser, auch ob die Seiten zu `content/` passen. `npm run build` erzeugt `dist/` und prüft JavaScript-Syntax und lokale Verweise.

## Noch offen

- Beispielsätze für À plus ! 2–4 (Klasse 8–10).
- Sprachliche Durchsicht der Beispielsätze für Klasse 7 durch die Fachschaft.
- Echte Titel der Unités: Die Seiten zeigen bisher „Unité 1“, „Teil A“, „Vocabulaire“, „Module 1“, abgeleitet aus der Fundstelle.
- Wortarten in Band 1: Die Excel-Liste hat keine Wortart-Spalte; sie sind beim Schreiben der Beispielsätze ergänzt worden und sollten mitgeprüft werden.
- Grammatik (wie im Englisch-Trainer für Klasse 6) ist noch nicht vorgesehen.
