/* =========================================================================
   VERBEN KONJUGIEREN
   -------------------------------------------------------------------------
   In den Vokabellisten stehen nur Infinitive. Die Formen entstehen hier:
   die regelmaessigen Verben auf -er nach Regel (mit den Schreibwechseln
   mangeons, commençons, achète, appelle, préfère, paie), alle anderen
   nach einer Familie (finir, partir, ouvrir, vendre, venir, prendre ...)
   oder aus einer eigenen Zeile. Ein Verb, das hier keine Familie hat,
   wird nicht abgefragt - lieber gar nicht als falsch.

   Zeitformen: présent, passé composé, imparfait, futur simple.
   Das imparfait kommt aus der nous-Form des présent (ausser être), das
   futur aus dem Futurstamm. Im passé composé mit être richtet sich das
   Partizip nach dem Subjekt; bei je, tu und vous gelten beide Formen.

   Die Datei laeuft im Browser (window.Verben) und unter Node (Tests).
   ========================================================================= */
(function (global) {
  'use strict';

  const ZEITEN = ['present', 'pc', 'imparfait', 'futur'];
  const ZEIT_NAME = { present: 'présent', pc: 'passé composé', imparfait: 'imparfait', futur: 'futur simple' };
  /* Welche Zeitformen in welcher Klasse. Bitte mit dem Lehrplan
     abgleichen - die Staffelung ist ein Vorschlag. */
  const ZEITEN_JE_KLASSE = { 7: ['present'], 8: ['present', 'pc'], 9: ['present', 'pc', 'imparfait', 'futur'], 10: ['present', 'pc', 'imparfait', 'futur'] };

  const ENDUNG = {
    imparfait: ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
    futur: ['ai', 'as', 'a', 'ons', 'ez', 'ont']
  };

  /* ---- Unregelmaessige Verben, einzeln ----
     p: présent je..ils · pp: Partizip · fu: Futurstamm · im: Imparfaitstamm,
     nur wo er nicht aus "nous" folgt. */
  const EIGEN = {
    'être':    { p: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], pp: 'été', fu: 'ser', im: 'ét' },
    'avoir':   { p: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], pp: 'eu', fu: 'aur' },
    'aller':   { p: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], pp: 'allé', fu: 'ir' },
    'faire':   { p: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], pp: 'fait', fu: 'fer' },
    'dire':    { p: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], pp: 'dit', fu: 'dir' },
    'lire':    { p: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], pp: 'lu', fu: 'lir' },
    'boire':   { p: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'], pp: 'bu', fu: 'boir' },
    'voir':    { p: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], pp: 'vu', fu: 'verr' },
    'revoir':  { p: ['revois', 'revois', 'revoit', 'revoyons', 'revoyez', 'revoient'], pp: 'revu', fu: 'reverr' },
    'croire':  { p: ['crois', 'crois', 'croit', 'croyons', 'croyez', 'croient'], pp: 'cru', fu: 'croir' },
    'devoir':  { p: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'], pp: 'dû', fu: 'devr' },
    'pouvoir': { p: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], pp: 'pu', fu: 'pourr' },
    'vouloir': { p: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], pp: 'voulu', fu: 'voudr' },
    'savoir':  { p: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], pp: 'su', fu: 'saur' },
    'recevoir':   { p: ['reçois', 'reçois', 'reçoit', 'recevons', 'recevez', 'reçoivent'], pp: 'reçu', fu: 'recevr' },
    'apercevoir': { p: ['aperçois', 'aperçois', 'aperçoit', 'apercevons', 'apercevez', 'aperçoivent'], pp: 'aperçu', fu: 'apercevr' },
    'décevoir':   { p: ['déçois', 'déçois', 'déçoit', 'décevons', 'décevez', 'déçoivent'], pp: 'déçu', fu: 'décevr' },
    'courir':  { p: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'], pp: 'couru', fu: 'courr' },
    'parcourir': { p: ['parcours', 'parcours', 'parcourt', 'parcourons', 'parcourez', 'parcourent'], pp: 'parcouru', fu: 'parcourr' },
    'mourir':  { p: ['meurs', 'meurs', 'meurt', 'mourons', 'mourez', 'meurent'], pp: 'mort', fu: 'mourr' },
    'naître':  { p: ['nais', 'nais', 'naît', 'naissons', 'naissez', 'naissent'], pp: 'né', fu: 'naîtr' },
    'vivre':   { p: ['vis', 'vis', 'vit', 'vivons', 'vivez', 'vivent'], pp: 'vécu', fu: 'vivr' },
    'survivre': { p: ['survis', 'survis', 'survit', 'survivons', 'survivez', 'survivent'], pp: 'survécu', fu: 'survivr' },
    'suivre':  { p: ['suis', 'suis', 'suit', 'suivons', 'suivez', 'suivent'], pp: 'suivi', fu: 'suivr' },
    'poursuivre': { p: ['poursuis', 'poursuis', 'poursuit', 'poursuivons', 'poursuivez', 'poursuivent'], pp: 'poursuivi', fu: 'poursuivr' },
    'rire':    { p: ['ris', 'ris', 'rit', 'rions', 'riez', 'rient'], pp: 'ri', fu: 'rir' },
    'sourire': { p: ['souris', 'souris', 'sourit', 'sourions', 'souriez', 'sourient'], pp: 'souri', fu: 'sourir' },
    'plaire':  { p: ['plais', 'plais', 'plaît', 'plaisons', 'plaisez', 'plaisent'], pp: 'plu', fu: 'plair' },
    'déplaire': { p: ['déplais', 'déplais', 'déplaît', 'déplaisons', 'déplaisez', 'déplaisent'], pp: 'déplu', fu: 'déplair' },
    'taire':   { p: ['tais', 'tais', 'tait', 'taisons', 'taisez', 'taisent'], pp: 'tu', fu: 'tair' },
    'fuir':    { p: ['fuis', 'fuis', 'fuit', 'fuyons', 'fuyez', 'fuient'], pp: 'fui', fu: 'fuir' },
    'conclure': { p: ['conclus', 'conclus', 'conclut', 'concluons', 'concluez', 'concluent'], pp: 'conclu', fu: 'conclur' },
    'interrompre': { p: ['interromps', 'interromps', 'interrompt', 'interrompons', 'interrompez', 'interrompent'], pp: 'interrompu', fu: 'interrompr' },
    'envoyer':  { p: ['envoie', 'envoies', 'envoie', 'envoyons', 'envoyez', 'envoient'], pp: 'envoyé', fu: 'enverr' },
    'renvoyer': { p: ['renvoie', 'renvoies', 'renvoie', 'renvoyons', 'renvoyez', 'renvoient'], pp: 'renvoyé', fu: 'renverr' },
    'cueillir':   { p: ['cueille', 'cueilles', 'cueille', 'cueillons', 'cueillez', 'cueillent'], pp: 'cueilli', fu: 'cueiller' },
    'accueillir': { p: ['accueille', 'accueilles', 'accueille', 'accueillons', 'accueillez', 'accueillent'], pp: 'accueilli', fu: 'accueiller' }
  };

  /* ---- Familien ---- */
  const FINIR = new Set(('finir choisir réfléchir réussir grandir grossir maigrir remplir punir obéir désobéir '
    + 'rougir applaudir agir avertir bâtir nourrir guérir saisir établir fournir garantir ralentir vieillir '
    + 'rajeunir atterrir accomplir envahir investir unir réunir définir enrichir aboutir rôtir salir trahir '
    + 'élargir approfondir démolir divertir convertir franchir frémir gémir subir réagir pâlir blanchir jaunir '
    + 'noircir rafraîchir épanouir éblouir').split(' '));
  const PARTIR = new Set('partir repartir sortir ressortir dormir endormir rendormir sentir ressentir consentir servir desservir mentir'.split(' '));
  const OUVRIR = new Set('ouvrir rouvrir offrir couvrir découvrir recouvrir souffrir'.split(' '));
  const VENDRE = new Set(('vendre revendre attendre entendre répondre perdre descendre redescendre rendre dépendre défendre '
    + 'mordre tordre tondre détendre tendre étendre prétendre correspondre fondre confondre pondre suspendre').split(' '));

  function familie(inf) {
    if (EIGEN[inf]) return EIGEN[inf];
    let m;
    if (FINIR.has(inf)) {
      const s = inf.slice(0, -2);
      return { p: [s + 'is', s + 'is', s + 'it', s + 'issons', s + 'issez', s + 'issent'], pp: s + 'i', fu: inf };
    }
    if (PARTIR.has(inf)) {
      const s = inf.slice(0, -3), k = inf.slice(-3, -2);
      return { p: [s + 's', s + 's', s + 't', s + k + 'ons', s + k + 'ez', s + k + 'ent'], pp: inf.slice(0, -1), fu: inf };
    }
    if (OUVRIR.has(inf)) {
      const s = inf.slice(0, -2);
      return { p: [s + 'e', s + 'es', s + 'e', s + 'ons', s + 'ez', s + 'ent'], pp: inf.slice(0, -3) + 'ert', fu: inf };
    }
    if (VENDRE.has(inf)) {
      const s = inf.slice(0, -2);
      return { p: [s + 's', s + 's', s, s + 'ons', s + 'ez', s + 'ent'], pp: s + 'u', fu: inf.slice(0, -1) };
    }
    if ((m = /^(.*)([vt])enir$/.exec(inf))) {
      const s = m[1] + m[2];
      return { p: [s + 'iens', s + 'iens', s + 'ient', s + 'enons', s + 'enez', s + 'iennent'], pp: s + 'enu', fu: s + 'iendr' };
    }
    if ((m = /^(.*)prendre$/.exec(inf))) {
      const s = m[1] + 'pren';
      return { p: [s + 'ds', s + 'ds', s + 'd', s + 'ons', s + 'ez', s + 'nent'], pp: m[1] + 'pris', fu: s + 'dr' };
    }
    if ((m = /^(.*)mettre$/.exec(inf))) {
      const s = m[1] + 'met';
      return { p: [s + 's', s + 's', s, s + 'tons', s + 'tez', s + 'tent'], pp: m[1] + 'mis', fu: s + 'tr' };
    }
    if ((m = /^(.*)battre$/.exec(inf))) {
      const s = m[1] + 'bat';
      return { p: [s + 's', s + 's', s, s + 'tons', s + 'tez', s + 'tent'], pp: s + 'tu', fu: s + 'tr' };
    }
    if ((m = /^(.+)aître$/.exec(inf)) && inf !== 'naître') {
      const s = m[1];
      return { p: [s + 'ais', s + 'ais', s + 'aît', s + 'aissons', s + 'aissez', s + 'aissent'], pp: s + 'u', fu: s + 'aîtr' };
    }
    if ((m = /^(.*)uire$/.exec(inf)) && m[1] && !/^n?luire$|^nuire$/.test(inf)) {
      const s = m[1] + 'ui';
      return { p: [s + 's', s + 's', s + 't', s + 'sons', s + 'sez', s + 'sent'], pp: s + 't', fu: s + 'r' };
    }
    if ((m = /^(.*[aeo])indre$/.exec(inf))) {
      const s = m[1];
      return { p: [s + 'ins', s + 'ins', s + 'int', s + 'ignons', s + 'ignez', s + 'ignent'], pp: s + 'int', fu: s + 'indr' };
    }
    if ((m = /^(.*)crire$/.exec(inf))) {
      const s = m[1] + 'cri';
      return { p: [s + 's', s + 's', s + 't', s + 'vons', s + 'vez', s + 'vent'], pp: s + 't', fu: s + 'r' };
    }
    if (/er$/.test(inf) && inf !== 'aller') return erVerb(inf);
    return null;
  }

  /* ---- Die regelmaessigen Verben auf -er, mit Schreibwechseln ---- */
  const DOPPELT = new Set('appeler rappeler jeter rejeter épeler renouveler'.split(' '));
  const KONS = 'bcdfghjklmnpqrstvwxzç';
  function erVerb(inf) {
    const s = inf.slice(0, -2);
    const stumm = [true, true, true, false, false, true];       // je tu il / ils: stummes e
    let stammStumm = s, futurStamm = inf, futurAuch = null;
    if (DOPPELT.has(inf)) {
      stammStumm = s + s.slice(-1);
      futurStamm = stammStumm + 'er';
    } else if (/e[bcdfghjklmnpqrstvz]$/.test(s) && KONS.includes(s.slice(-3, -2) || 'x')) {
      /* lever, acheter, promener: e vor einem Konsonanten wird è */
      stammStumm = s.slice(0, -2) + 'è' + s.slice(-1);
      futurStamm = stammStumm + 'er';
    } else if (/é[bcdfghjklmnpqrstvz]{1,2}$/.test(s)) {
      /* préférer, répéter, régler: é wird è vor stummer Endung; im futur
         gelten beide Schreibungen. */
      const i = s.lastIndexOf('é');
      stammStumm = s.slice(0, i) + 'è' + s.slice(i + 1);
      futurAuch = stammStumm + 'er';
    } else if (/[aou]y$/.test(s)) {
      /* paie, nettoie, ennuie; bei -ayer ist auch payerai richtig */
      stammStumm = s.slice(0, -1) + 'i';
      futurStamm = stammStumm + 'er';
      if (/ay$/.test(s)) futurAuch = inf;
    }
    const nousStamm = /g$/.test(s) ? s + 'e' : /c$/.test(s) ? s.slice(0, -1) + 'ç' : s;
    const end = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
    const p = end.map((e, i) => (stumm[i] ? stammStumm : (i === 3 ? nousStamm : s)) + e);
    const auch = /ay$/.test(s) ? { p: end.map((e, i) => s + e) } : null;
    return { p, pp: s + 'é', fu: futurStamm.replace(/er$/, 'er'), fuAuch: futurAuch, auch, regel: true };
  }

  /* ---- passé composé ---- */
  const MIT_ETRE = new Set(('aller venir revenir devenir parvenir arriver partir repartir sortir ressortir entrer rentrer '
    + 'rester tomber retomber naître mourir monter remonter descendre redescendre retourner').split(' '));
  /* Reflexive Verben, deren se kein direktes Objekt ist - dort bleibt das
     Partizip unveraendert. */
  const OHNE_ANGLEICHUNG = new Set('parler téléphoner dire demander écrire plaire sourire succéder rendre_compte'.split(' '));

  const PERSONEN = [['je'], ['tu'], ['il', 'elle'], ['nous'], ['vous'], ['ils', 'elles']];
  const REFL = ['me', 'te', 'se', 'nous', 'vous', 'se'];
  const H_ASPIRE = /^(hurl|hach|haï|heurt|hiss|hu[ée]|hât|hont|hauss)/;
  const vokal = w => /^[aeiouyàâéèêëîïôûùœ]/i.test(w) || (/^h/i.test(w) && !H_ASPIRE.test(w));

  /* Die Partizipformen, die bei dieser Person gelten: erst die angezeigte,
     dann die ebenfalls richtigen. */
  function partizipien(pp, person, subjekt, gleicht) {
    if (!gleicht) return [pp];
    const f = pp + 'e', mp = /s$/.test(pp) ? pp : pp + 's', fp = pp + 'es';
    if (person === 2) return subjekt === 'elle' ? [f] : [pp];
    if (person === 5) return subjekt === 'elles' ? [fp] : [mp];
    if (person === 3) return [mp, fp];
    if (person === 4) return [mp, fp, pp, f];
    return [pp, f];
  }

  function zerlege(eintrag) {
    let s = String(eintrag).replace(/\([^)]*\)/g, ' ').replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
    let refl = false;
    if (/^se /.test(s)) { refl = true; s = s.slice(3); }
    else if (/^s'/.test(s)) { refl = true; s = s.slice(2); }
    const teile = s.split(' ');
    const inf = teile.shift();
    const erlaubt = /^(qn|qc|à|de|d'|sur|avec|pour|en|par|chez|contre|dans|que|comme|\.\.\.|…)?$/;
    if (!inf || !teile.every(t => t.split('/').every(x => erlaubt.test(x)))) return null;
    if (!/^[a-zàâçéèêëîïôûùœ]+$/.test(inf)) return null;
    return { inf, refl };
  }

  /* Alle Formen eines Verbs in einer Zeitform: je Person die angezeigte
     Form mit Subjekt und die Liste der richtigen Antworten (mit und ohne
     Subjekt). */
  function konjugiere(eintrag, zeit, subjekte) {
    const z = typeof eintrag === 'string' ? zerlege(eintrag) : eintrag;
    if (!z) return null;
    const f = familie(z.inf);
    if (!f) return null;
    const subj = subjekte || PERSONEN.map(p => p[0]);
    return subj.map((subjekt, person) => {
      let teile;                      // Varianten des Verbteils, ohne Subjekt
      if (zeit === 'present') {
        teile = [f.p[person]];
        if (f.auch) teile.push(f.auch.p[person]);
      } else if (zeit === 'imparfait') {
        let st = f.im || f.p[3].replace(/ons$/, '');
        const e = ENDUNG.imparfait[person];
        if (e[0] === 'i') st = st.replace(/ge$/, 'g').replace(/ç$/, 'c');
        teile = [st + e];
      } else if (zeit === 'futur') {
        teile = [f.fu + ENDUNG.futur[person]];
        if (f.fuAuch) teile.push(f.fuAuch + ENDUNG.futur[person]);
      } else if (zeit === 'pc') {
        const etre = z.refl || MIT_ETRE.has(z.inf);
        const hilf = (etre ? EIGEN['être'] : EIGEN['avoir']).p[person];
        const gleicht = etre && !(z.refl && OHNE_ANGLEICHUNG.has(z.inf));
        teile = partizipien(f.pp, person, subjekt, gleicht).map(pp => hilf + ' ' + pp);
      } else return null;
      if (z.refl) teile = teile.map(t => (vokal(t) && REFL[person].length === 2 && person !== 3 && person !== 4
        ? REFL[person][0] + "'" : REFL[person] + ' ') + t);
      const mitSubjekt = t => (subjekt === 'je' && vokal(t) ? "j'" : subjekt + ' ') + t;
      return {
        subjekt: subjekt === 'je' && vokal(teile[0]) ? "j'" : subjekt,
        form: teile[0],
        anzeige: mitSubjekt(teile[0]),
        richtig: [...new Set(teile.flatMap(t => [t, mitSubjekt(t)]))]
      };
    });
  }

  /* Verben, die fast nur in der dritten Person vorkommen: "je coûte"
     waere richtig gebildet, aber eine seltsame Aufgabe. */
  const NUR_DRITTE = new Set('coûter durer falloir pleuvoir neiger'.split(' '));
  const abfragbar = eintrag => {
    const z = typeof eintrag === 'string' ? zerlege(eintrag) : eintrag;
    return !!(z && !NUR_DRITTE.has(z.inf) && familie(z.inf));
  };
  const infinitiv = z => z.refl ? (vokal(z.inf) ? "s'" : 'se ') + z.inf : z.inf;

  const regelmaessig = eintrag => {
    const z = typeof eintrag === 'string' ? zerlege(eintrag) : eintrag;
    const f = z && familie(z.inf);
    return !!(f && (f.regel || FINIR.has(z.inf) || VENDRE.has(z.inf)));
  };

  /* Antwort pruefen: 'ok', 'akzent' (nur Akzente falsch) oder 'falsch'. */
  const glatt = s => String(s || '').toLowerCase().replace(/[’`´]/g, "'").replace(/oe/g, 'œ')
    .replace(/[.!?;,]+$/g, '').replace(/\s*'\s*/g, "'").replace(/\s+/g, ' ').trim();
  const ohneAkzent = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe');
  function pruefe(eingabe, richtig) {
    const a = glatt(eingabe);
    if (!a) return 'falsch';
    const liste = richtig.map(glatt);
    if (liste.includes(a)) return 'ok';
    if (liste.map(ohneAkzent).includes(ohneAkzent(a))) return 'akzent';
    return 'falsch';
  }

  /* Die Verben, die auf jeder Seite abgefragt werden koennen - auch wenn
     sie in der Liste dieser Klasse nicht stehen. In Klasse 7 nur die
     ersten vier, ab Klasse 8 alle. */
  const KERN = [
    ['être', 'sein', 7], ['avoir', 'haben', 7], ['aller', 'gehen, fahren', 7], ['faire', 'machen, tun', 7],
    ['pouvoir', 'können, dürfen', 8], ['vouloir', 'wollen', 8], ['devoir', 'müssen', 8], ['savoir', 'wissen, können', 8],
    ['prendre', 'nehmen', 8], ['venir', 'kommen', 8], ['mettre', 'legen, stellen, anziehen', 8], ['voir', 'sehen', 8],
    ['dire', 'sagen', 8], ['lire', 'lesen', 8], ['écrire', 'schreiben', 8], ['partir', 'weggehen, abfahren', 8],
    ['sortir', 'ausgehen, hinausgehen', 8], ['dormir', 'schlafen', 8], ['boire', 'trinken', 8], ['connaître', 'kennen', 8]
  ];

  global.Verben = { ZEITEN, ZEIT_NAME, ZEITEN_JE_KLASSE, KERN, PERSONEN, zerlege, konjugiere, regelmaessig, abfragbar, infinitiv, pruefe };
  if (typeof module === 'object' && module.exports) module.exports = global.Verben;
})(typeof window !== 'undefined' ? window : globalThis);
