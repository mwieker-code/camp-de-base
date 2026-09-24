#!/usr/bin/env python3
"""Vokabellisten des Lehrwerks (Excel) -> content/klasseN.json

Aufruf:
    python3 tools/import-liste.py Klasse7.xlsx Klasse8.xlsx Klasse9.xlsx Klasse10.xlsx

Welcher Band in einer Datei steckt, steht in ihrer Spalte "Band"; Band 1
ist Klasse 7, Band 4 Klasse 10. Die Excel-Dateien selbst gehoeren nicht
ins Repository.

Uebernommen werden nur Fundstelle, das franzoesische Stichwort, die
deutsche Bedeutung, Genus und Wortart. Die Kontextsaetze des Verlags
(Spalten "Kontext mit Tilde" bis "Kontextsatz Deutsch") bleiben
bewusst aussen vor: Die Beispielsaetze im Trainer sind eigene und
stehen in content/beispiele-klasseN.tsv.

Eintraege der Wortart "civ" (Landeskunde: Staedte, Fluesse,
Bauwerke) werden nicht uebernommen - sie sind Sachinformation, kein
Lernwortschatz, und ihre "Bedeutung" ist oft eine Beschreibung.

Benoetigt openpyxl (pip install openpyxl).
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent

# Band -> Jahrgang
JAHRGANG = {1: 7, 2: 8, 3: 9, 4: 10}

WORTART = {
    'nom': 'Nomen', 'verbe': 'Verb', 'adj': 'Adjektiv', 'adv': 'Adverb',
    'prép': 'Präposition', 'conj': 'Konjunktion', 'conj sub': 'Konjunktion',
    'conj coord': 'Konjunktion', 'pron': 'Pronomen', 'pron rel': 'Pronomen',
    'pron interr': 'Pronomen', 'pron indéf': 'Pronomen', 'interj': 'Ausruf',
    'adj ord': 'Adjektiv', 'adj interr': 'Adjektiv', 'adj dém': 'Adjektiv',
    'adj indéf': 'Adjektiv', 'adv nég': 'Adverb', 'adv interr': 'Adverb',
    'loc': 'Ausdruck', 'loc verb': 'Ausdruck', 'loc adv': 'Ausdruck',
    'loc prép': 'Ausdruck',
}


def zelle(x):
    if x is None:
        return ''
    s = str(x).replace('_x000D_', ' ')
    return re.sub(r'\s+', ' ', s).strip()


def spalten(kopf):
    """Spaltennummern nach Ueberschrift - die Baende benennen sie leicht
    verschieden ("Französisch", "Artikel + Französisch", ...)."""
    idx = {}
    for i, name in enumerate(kopf):
        n = zelle(name).lower()
        if n == 'band':
            idx['band'] = i
        elif n == 'fundstelle':
            idx['fund'] = i
        elif 'französisch' in n:
            idx['fr'] = i
        elif n == 'deutsch':
            idx['de'] = i
        elif n == 'genus':
            idx['genus'] = i
        elif n == 'wortart':
            idx['wortart'] = i
    return idx


def einheit_und_teil(fund):
    """"1/Voc" -> ("1", "Voc"), "M3" -> ("M3", None), "C" -> ("C", None)."""
    if '/' in fund:
        a, b = fund.split('/', 1)
        return a.strip(), b.strip()
    return fund.strip(), None


def teilname(teil):
    if teil == 'A':
        return 'Teil A'
    if teil == 'Voc':
        return 'Vocabulaire'
    return 'Teil ' + teil


def stichwort(roh):
    """Der unregelmaessige Plural steht im Stichwort hinter "((!))":
    "le château / ((!))les châteaux". Gefragt wird der Singular; der
    Plural wandert in den Hinweis.

    Zwei Eintraege der Liste tragen ihren Artikel doppelt ("l'l'heure",
    "le le quart") - der zweite faellt weg."""
    roh = re.sub(r"^(l['’])\1", r"\1", roh)
    roh = re.sub(r"^(le|la|les) \1 ", r"\1 ", roh)
    m = re.search(r'\s*/\s*\(\(!\)\)\s*(.+)$', roh)
    if not m:
        return roh, ''
    return roh[:m.start()].strip(), 'Plural: ' + m.group(1).strip()


def wortart(pos, genus, fr):
    art = WORTART.get(pos, '')
    if not art and not pos:
        # Band 1 hat keine Wortart-Spalte: Nur der Artikel verraet das Nomen.
        # Die uebrigen Wortarten ergaenzt content/beispiele-klasse7.tsv.
        if re.match(r"^(?:(?:le|la|les)\s+|l[’'])\S", fr) and '/' not in fr.split(' ')[0]:
            art = 'Nomen'
            if fr.startswith('le '):
                genus = 'm.'
            elif fr.startswith('la '):
                genus = 'f.'
            elif fr.startswith('les '):
                genus = 'pl.'
    if art and genus:
        return art + ', ' + genus
    return art


def lies(pfad):
    ws = openpyxl.load_workbook(pfad, read_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    kopf_i = next(i for i, r in enumerate(rows) if r and zelle(r[0]).lower() == 'band')
    idx = spalten(rows[kopf_i])
    band = None
    eintraege = []
    for r in rows[kopf_i + 1:]:
        if not r or not isinstance(r[idx['band']], (int, float)):
            continue
        band = int(r[idx['band']])
        pos = zelle(r[idx['wortart']]) if 'wortart' in idx else ''
        if pos == 'civ':
            continue
        fr_roh = zelle(r[idx['fr']])
        de = zelle(r[idx['de']])
        if not fr_roh or not de:
            continue
        fr, hinweis = stichwort(fr_roh)
        genus = zelle(r[idx['genus']]) if 'genus' in idx else ''
        eintraege.append({
            'fund': zelle(r[idx['fund']]),
            'fr': fr,
            'de': de,
            'pos': wortart(pos, genus, fr),
            'hinweis': hinweis,
        })
    return band, eintraege


def gliedern(band, eintraege):
    """Einheiten und Teile in der Reihenfolge der Liste. Ein Module (M1,
    M2 ...) folgt im Buch seiner Unité und wird als letzter Teil an sie
    gehaengt; Module ohne Nummer (MA-MD in Band 4) bilden zusammen eine
    eigene Einheit."""
    einheiten = []
    nach_id = {}

    def einheit(uid, name):
        if uid not in nach_id:
            nach_id[uid] = {'id': uid, 'name': name, 'teile': []}
            einheiten.append(nach_id[uid])
        return nach_id[uid]

    def teil(e, tid, name):
        for t in e['teile']:
            if t['id'] == tid:
                return t
        t = {'id': tid, 'name': name, 'woerter': []}
        e['teile'].append(t)
        return t

    letzte_unite = None
    for w in eintraege:
        a, b = einheit_und_teil(w['fund'])
        if b is not None:                                  # "1/Voc"
            letzte_unite = a
            e = einheit('u' + a, 'Unité ' + a)
            t = teil(e, re.sub(r'\W', '', b.lower()), teilname(b))
        elif re.fullmatch(r'M\d+', a):                      # "M3"
            nr = a[1:]
            ziel = nr if ('u' + nr) in nach_id else letzte_unite
            e = einheit('u' + ziel, 'Unité ' + ziel) if ziel else einheit('mod', 'Modules')
            t = teil(e, 'm' + nr, 'Module ' + nr)
        elif re.fullmatch(r'M[A-Z]', a):                    # "MA"
            e = einheit('mod', 'Modules')
            t = teil(e, a.lower(), 'Module ' + a[1:])
        else:                                               # "C"
            e = einheit('u0', 'Einstieg')
            t = teil(e, re.sub(r'\W', '', a.lower()), 'Einstieg')
        t['woerter'].append({k: v for k, v in w.items() if v})
    return {'jahrgang': JAHRGANG[band], 'einheiten': einheiten}


def main(pfade):
    if not pfade:
        sys.exit(__doc__)
    for pfad in pfade:
        band, eintraege = lies(pfad)
        daten = gliedern(band, eintraege)
        ziel = ROOT / 'content' / ('klasse%d.json' % daten['jahrgang'])
        ziel.parent.mkdir(exist_ok=True)
        ziel.write_text(json.dumps(daten, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        n = sum(len(t['woerter']) for e in daten['einheiten'] for t in e['teile'])
        print('%s: Klasse %d, %d Woerter -> %s' % (Path(pfad).name, daten['jahrgang'], n, ziel.relative_to(ROOT)))


if __name__ == '__main__':
    main(sys.argv[1:])
