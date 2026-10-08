(() => {
'use strict';
/* ====== Project settings ====== */
const CONFIG = {
  version: '0.6.4',
  author: 'aSamu3l',
  github: 'https://github.com/aSamu3l',
  repo: 'https://github.com/aSamu3l/FlussoLab',
  donate: '',        // donation page, e.g. 'https://ko-fi.com/mariorossi'
};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem('flussolab.' + k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('flussolab.' + k, v); } catch (e) {} },
};

/* ================= i18n ================= */
const I18N = {
  it: {
    new: 'Nuovo', open: 'Apri', save: 'Salva', png: 'Immagine', undo: 'Annulla (Ctrl+Z)', redo: 'Ripeti (Ctrl+Y)', help: 'Guida',
    run: 'Esegui', step: 'Passo', stop: 'Stop', speed: 'Velocità',
    tabBlock: 'Blocco', tabRun: 'Esecuzione', tabCode: 'Codice',
    progName: 'Nome del programma', untitled: 'Programma senza nome',
    hint: 'Clicca o tocca un + per inserire un blocco. Tasto destro, o tocco prolungato, per altre azioni.',
    START: 'INIZIO', END: 'FINE', T: 'V', F: 'F', TRUE: 'VERO', FALSE: 'FALSO',
    types: { decl: 'VAR · Dichiarazione', input: 'IN · Input', output: 'OUT · Output', outln: 'OUTLN · Output a capo', assign: 'Assegnazione', comment: 'Commento', if: 'IF · Se', while: 'WHILE · Mentre', do: 'DO WHILE · Ripeti mentre', for: 'FOR · Per' },
    typeHint: {
      decl: 'Facoltativo: fissa il tipo di una o più variabili', input: 'Legge uno o più valori da tastiera', output: 'Scrive a schermo e resta sulla stessa riga', outln: 'Scrive a schermo e poi va a capo', comment: 'Una nota per chi legge, non viene eseguita', assign: 'Calcola un valore e lo salva in una variabile',
      if: 'Due strade, in base a una condizione', while: 'Controlla la condizione, poi ripete finché è vera',
      do: 'Esegue almeno una volta, poi ripete se la condizione è vera', for: 'Ripete contando con una variabile',
    },
    f_vars: 'Variabili da leggere', f_expr: 'Espressione da mostrare',
    f_var: 'Variabile', f_cond: 'Condizione',
    f_from: 'Da', f_to: 'A', f_step: 'Passo',
    f_ln: 'Vai a capo (OUTLN)', f_assign: 'Assegnazione', e_noeq: 'Manca il segno =: scrivi variabile = espressione (oppure i++ / i--)', f_comment: 'Testo del commento', n_cm: 'commento: non viene eseguito',
    loopEnd: 'fine ciclo', trace: 'Traccia', traceT: 'Mostra nella console ogni blocco eseguito', cut: 'Taglia', pasteAfter: 'Incolla dopo',
    showPy: 'Mostra anche Python', codeLink: 'Collega diagramma e codice',
    e_cmpmix: op => `Stai confrontando un testo con un numero (${op}). Forse mancano le parentesi, ad esempio "Risultato: " + (x > 5)`, mFile: 'File', mEdit: 'Modifica', mView: 'Visualizza', mHelp: 'Aiuto',
    undoM: 'Annulla', redoM: 'Ripeti', optSymShort: 'Simboli ≥ ≤ ≠', zoomIn: 'Ingrandisci', zoomOut: 'Riduci', zoom100: 'Zoom 100%',
    helpT: 'Guida', language: 'Lingua', offline: 'Offline', offlineT: 'Sei offline: FlussoLab funziona lo stesso e salva tutto su questo dispositivo.',
    tooMany: n => `Puoi tenere aperti al massimo ${n} diagrammi: chiudine uno.`, newTab: 'Nuovo diagramma', closeTab: 'Chiudi',
    closeT: 'Chiudere il diagramma?', closeMsg: n => `«${n}» ha modifiche che non hai salvato in un file. Se lo chiudi, le perdi.`,
    closeAnyway: 'Chiudi senza salvare', unsaved: 'Modifiche non salvate in un file', fitT: 'Adatta allo schermo',
    zipM: 'Esporta consegna (ZIP)…', zipTitle: 'Esporta la consegna', zipNote: 'Crea un unico file .zip con i diagrammi scelti, pronto da consegnare.',
    zipWho: 'Nome e cognome', zipWhoPh: 'Mario Rossi', zipWhich: 'Diagrammi da includere', zipEmpty: 'vuoto',
    zipFlusso: 'File .flusso', zipPng: 'Immagini PNG', zipGo: 'Scarica ZIP', zipWorking: 'Preparazione…',
    zipNone: 'Scegli almeno un diagramma e un tipo di file', zipDone: n => `ZIP pronto: ${n} file`, zipFail: 'Non è stato possibile creare lo ZIP',
    inEmpty: 'Scrivi un valore prima di premere Invio',
    installAsk: 'Vuoi installare FlussoLab come app? Funziona anche offline.', installBtn: 'Installa', installHowBtn: 'Come si fa',
    installM: 'Installa come app…', installT: 'Installa FlussoLab', installed: 'FlussoLab è installato',
    installHow: '<p>FlussoLab si installa come un\'app e poi funziona anche senza internet.</p><ul><li><b>Chrome o Edge (Windows, Chromebook, Android)</b>: menu del browser → «Installa FlussoLab» o «Aggiungi a schermata Home».</li><li><b>iPhone e iPad</b>: apri il sito con Safari, tocca Condividi → «Aggiungi alla schermata Home».</li></ul>',
    updAvail: 'È disponibile una nuova versione.', updNow: 'Aggiorna', aboutM: 'Informazioni su FlussoLab', version: 'Versione',
    aboutText: 'Editor di diagrammi di flusso che funziona nel browser, pensato per la scuola. Non serve installare niente.',
    devBy: 'Sviluppato da', license: 'Licenza', freeOpen: 'gratuito, codice aperto, vietato l\'uso commerciale', source: 'Codice sorgente',
    supportText: 'FlussoLab è gratuito. Se ti è utile, puoi aiutare a mantenerlo con una piccola donazione.', support: 'Sostieni il progetto',
    e_nodef: n => `Nessuna variabile trovata con il nome «${n}»`,
    e_notcond: 'Questa non è una condizione: serve un confronto, ad esempio x > 0', invert: 'Inverti condizione', swap: 'Scambia rami V e F',
    inverted: 'Condizione invertita', swapped: 'Rami scambiati',
    explain: 'Spiegazione', 
    
    optExplain: 'Modalità spiegazione', 
    optTheme: 'Aspetto', thAuto: 'Automatico', thLight: 'Chiaro', thDark: 'Scuro',
    n_in: v => `legge da tastiera ${v}`,
    n_out: (x, ln) => `scrive a schermo ${x}` + (ln ? ' e va a capo' : ''),
    n_val: 'il valore', n_as: v => `calcola e salva in ${v}`,
    n_if: 'se è vera esegue V, se è falsa esegue F', n_while: 'finché è vera ripete il ciclo',
    n_do: 'esegue il ciclo, poi lo ripete se è vera', n_for: (v, a, b) => `ripete con ${v} = ${a}, …, ${b}`,
    up: 'Su', down: 'Giù', dup: 'Duplica', copy: 'Copia', del: 'Elimina',
    noSel: 'Tocca un blocco del diagramma per modificarlo, oppure un <b>+</b> su una linea per inserirne uno nuovo.',
    legendT: 'I blocchi',
    insertHere: 'Inserisci qui', pasteHere: 'Incolla il blocco copiato',
    console: 'Console', vars: 'Variabili', noVars: 'Nessuna variabile ancora.', thName: 'Nome', thVal: 'Valore', thType: 'Tipo',
    ty: { int: 'int', float: 'float', str: 'string', bool: 'bool', arr: 'vettore' },
    tyk: { int: 'int', float: 'float', str: 'string', bool: 'bool' }, f_type: 'Tipo', f_declvars: 'Variabili',
    n_decl: k => `le variabili saranno di tipo ${k}`, n_inc: (v, op) => op === '++' ? `aumenta ${v} di 1` : `diminuisce ${v} di 1`, vecOf: 'vettore di',
    e_tdecl: (n, k, v) => `«${n}» è di tipo ${t('tyk')[k]}: non può contenere ${v}`,
    e_tin: (v, k, n) => `«${v}» non è un valore ${t('tyk')[k]} valido per ${n}`,
    e_tarr: (n, k) => `«${n}» è un vettore di ${t('tyk')[k]}: assegna i singoli elementi, ad esempio ${n}[0]`,
    e_incint: (op, n) => `${op} si può usare solo su variabili intere: «${n}» non è un intero`,
    e_reserved: n => `«${n}» è il nome di un tipo: non si può usare come nome di variabile`,
    e_assigneq: 'Per confrontare si usa ==',
    e_redecl: n => `«${n}» è già stata dichiarata con un altro tipo`,
    e_declname: x => `«${x}» non è un nome di variabile valido`, e_kind: 'Scegli un tipo',
    consoleIdle: 'Premi Esegui per avviare il programma, oppure Passo per seguirlo un blocco alla volta.',
    inputAsk: n => `Inserisci il valore di ${n}`, send: 'Invio', done: 'Programma terminato.', stopped: 'Esecuzione interrotta.',
    errAt: 'Errore', codePseudo: 'Pseudocodice', copyCode: 'Copia codice', copied: 'Copiato negli appunti',
    pyNote: 'Codice Python con sole funzioni standard. Attenzione: in Python / tra variabili non dichiarate int dà sempre un risultato con la virgola, e % con i numeri negativi può dare un risultato diverso dal diagramma.',
    pseudoNote: 'Pseudocodice generato dal diagramma. Si aggiorna a ogni modifica.',
    saveTitle: 'Salva il diagramma', fileName: 'Nome del file', download: 'Scarica il file', 
    saveNote: 'Il file .flusso contiene tutto il diagramma: si riapre da File → Apri.',
    openTitle: 'Apri un diagramma', pickFile: 'Scegli un file…', dropHere: 'oppure trascina qui un file .flusso',
    examples: 'Esempi pronti',
    pngTitle: 'Esporta come immagine', pngDl: 'Scarica PNG', pngNote: 'Se il download non parte, tieni premuto sull\'immagine (o clic destro) e scegli «Salva immagine».',
    cancel: 'Annulla', close: 'Chiudi',
    loadedOk: 'Diagramma caricato', badFile: 'Questo file non contiene un diagramma valido.', deleted: 'Blocco eliminato', copiedBlk: 'Blocco copiato',
    e_syntax: x => `Non capisco «${x}» in questo punto`, e_end: 'L\'espressione è incompleta', e_str: 'Manca la virgoletta di chiusura',
    e_empty: 'Il campo è vuoto', e_undef: n => `La variabile ${n} non ha ancora un valore`, e_div0: 'Divisione per zero',
    e_type: op => `Tipi di dato non adatti all'operazione ${op}`, e_fn: n => `Funzione sconosciuta: ${n}`, e_args: (n, k) => `${n} vuole ${k} argomenti`,
    e_idx: i => `Indice non valido: ${i}`, e_notarr: n => `${n} non è un vettore`, e_lv: 'Qui serve il nome di una variabile',
    e_bool: 'La condizione deve risultare VERO o FALSO (ad esempio x > 0)', e_loop: 'Troppi passi: forse è un ciclo infinito?',
    e_step0: 'Il passo del ciclo non può essere 0', e_sqrt: 'Radice quadrata di un numero negativo', e_num: x => `«${x}» non è un numero`,
  },
  en: {
    new: 'New', open: 'Open', save: 'Save', png: 'Image', undo: 'Undo (Ctrl+Z)', redo: 'Redo (Ctrl+Y)', help: 'Guide',
    run: 'Run', step: 'Step', stop: 'Stop', speed: 'Speed',
    tabBlock: 'Block', tabRun: 'Run', tabCode: 'Code',
    progName: 'Program name', untitled: 'Untitled program',
    hint: 'Click or tap a + to insert a block. Right-click, or long-press, for more actions.',
    START: 'START', END: 'END', T: 'T', F: 'F', TRUE: 'TRUE', FALSE: 'FALSE',
    types: { decl: 'VAR · Declaration', input: 'IN · Input', output: 'OUT · Output', outln: 'OUTLN · Output + new line', assign: 'Assignment', comment: 'Comment', if: 'IF', while: 'WHILE', do: 'DO WHILE', for: 'FOR' },
    typeHint: {
      decl: 'Optional: fixes the type of one or more variables', input: 'Reads one or more values from the keyboard', output: 'Writes on screen and stays on the same line', outln: 'Writes on screen, then starts a new line', comment: 'A note for the reader, never executed', assign: 'Computes a value and stores it in a variable',
      if: 'Two paths, depending on a condition', while: 'Checks the condition, then repeats while it is true',
      do: 'Runs at least once, then repeats if the condition is true', for: 'Repeats while counting with a variable',
    },
    f_vars: 'Variables to read', f_expr: 'Expression to show',
    f_var: 'Variable', f_cond: 'Condition',
    f_from: 'From', f_to: 'To', f_step: 'Step',
    f_ln: 'New line (OUTLN)', f_assign: 'Assignment', e_noeq: 'The = sign is missing: write variable = expression (or i++ / i--)', f_comment: 'Comment text', n_cm: 'comment: it is not executed',
    loopEnd: 'loop ends', trace: 'Trace', traceT: 'Show every executed block in the console', cut: 'Cut', pasteAfter: 'Paste after',
    showPy: 'Also show Python', codeLink: 'Link diagram and code',
    e_cmpmix: op => `You are comparing text with a number (${op}). Maybe parentheses are missing, for example "Result: " + (x > 5)`, mFile: 'File', mEdit: 'Edit', mView: 'View', mHelp: 'Help',
    undoM: 'Undo', redoM: 'Redo', optSymShort: 'Symbols ≥ ≤ ≠', zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoom100: 'Zoom 100%',
    helpT: 'Guide', language: 'Language', offline: 'Offline', offlineT: 'You are offline: FlussoLab still works and keeps everything on this device.',
    tooMany: n => `You can keep at most ${n} diagrams open: close one.`, newTab: 'New diagram', closeTab: 'Close',
    closeT: 'Close the diagram?', closeMsg: n => `“${n}” has changes you have not saved to a file. If you close it, they are lost.`,
    closeAnyway: 'Close without saving', unsaved: 'Changes not saved to a file', fitT: 'Fit to screen',
    zipM: 'Export submission (ZIP)…', zipTitle: 'Export submission', zipNote: 'Creates a single .zip file with the chosen diagrams, ready to hand in.',
    zipWho: 'Full name', zipWhoPh: 'Jane Smith', zipWhich: 'Diagrams to include', zipEmpty: 'empty',
    zipFlusso: '.flusso files', zipPng: 'PNG images', zipGo: 'Download ZIP', zipWorking: 'Preparing…',
    zipNone: 'Choose at least one diagram and one file type', zipDone: n => `ZIP ready: ${n} files`, zipFail: 'The ZIP could not be created',
    inEmpty: 'Type a value before pressing Enter',
    installAsk: 'Install FlussoLab as an app? It also works offline.', installBtn: 'Install', installHowBtn: 'How to',
    installM: 'Install as app…', installT: 'Install FlussoLab', installed: 'FlussoLab is installed',
    installHow: '<p>FlussoLab installs like an app and then works without internet too.</p><ul><li><b>Chrome or Edge (Windows, Chromebook, Android)</b>: browser menu → “Install FlussoLab” or “Add to Home screen”.</li><li><b>iPhone and iPad</b>: open the site in Safari, tap Share → “Add to Home Screen”.</li></ul>',
    updAvail: 'A new version is available.', updNow: 'Update', aboutM: 'About FlussoLab', version: 'Version',
    aboutText: 'A flowchart editor that runs in the browser, made for school. Nothing to install.',
    devBy: 'Developed by', license: 'License', freeOpen: 'free, open code, no commercial use', source: 'Source code',
    supportText: 'FlussoLab is free. If you find it useful, you can help keep it going with a small donation.', support: 'Support the project',
    e_nodef: n => `No variable found with the name “${n}”`,
    e_notcond: 'This is not a condition: it needs a comparison, for example x > 0', invert: 'Invert condition', swap: 'Swap T and F branches',
    inverted: 'Condition inverted', swapped: 'Branches swapped',
    explain: 'Explain', 
    
    optExplain: 'Explain mode', 
    optTheme: 'Appearance', thAuto: 'Automatic', thLight: 'Light', thDark: 'Dark',
    n_in: v => `reads ${v} from the keyboard`,
    n_out: (x, ln) => `writes ${x} on screen` + (ln ? ' and starts a new line' : ''),
    n_val: 'the value', n_as: v => `computes and stores in ${v}`,
    n_if: 'if true runs T, if false runs F', n_while: 'repeats the loop while it is true',
    n_do: 'runs the loop, then repeats it if true', n_for: (v, a, b) => `repeats with ${v} = ${a}, …, ${b}`,
    up: 'Up', down: 'Down', dup: 'Duplicate', copy: 'Copy', del: 'Delete',
    noSel: 'Tap a block in the diagram to edit it, or a <b>+</b> on a line to insert a new one.',
    legendT: 'Blocks',
    insertHere: 'Insert here', pasteHere: 'Paste copied block',
    console: 'Console', vars: 'Variables', noVars: 'No variables yet.', thName: 'Name', thVal: 'Value', thType: 'Type',
    ty: { int: 'int', float: 'float', str: 'string', bool: 'bool', arr: 'array' },
    tyk: { int: 'int', float: 'float', str: 'string', bool: 'bool' }, f_type: 'Type', f_declvars: 'Variables',
    n_decl: k => `the variables will be of type ${k}`, n_inc: (v, op) => op === '++' ? `adds 1 to ${v}` : `subtracts 1 from ${v}`, vecOf: 'array of',
    e_tdecl: (n, k, v) => `“${n}” is of type ${t('tyk')[k]}: it cannot hold ${v}`,
    e_tin: (v, k, n) => `“${v}” is not a valid ${t('tyk')[k]} value for ${n}`,
    e_tarr: (n, k) => `“${n}” is an array of ${t('tyk')[k]}: assign single elements, for example ${n}[0]`,
    e_incint: (op, n) => `${op} works only on integer variables: “${n}” is not an integer`,
    e_reserved: n => `“${n}” is a type name: it cannot be used as a variable name`,
    e_assigneq: 'To compare use ==',
    e_redecl: n => `“${n}” was already declared with another type`,
    e_declname: x => `“${x}” is not a valid variable name`, e_kind: 'Choose a type',
    consoleIdle: 'Press Run to start the program, or Step to follow it one block at a time.',
    inputAsk: n => `Enter the value of ${n}`, send: 'Enter', done: 'Program finished.', stopped: 'Run stopped.',
    errAt: 'Error', codePseudo: 'Pseudocode', copyCode: 'Copy code', copied: 'Copied to clipboard',
    pyNote: 'Python code using only standard functions. Note: in Python / between variables not declared int always gives a decimal result, and % with negative numbers may differ from the diagram.',
    pseudoNote: 'Pseudocode generated from the diagram. It updates on every change.',
    saveTitle: 'Save the diagram', fileName: 'File name', download: 'Download file', 
    saveNote: 'The .flusso file holds the whole diagram: reopen it from File → Open.',
    openTitle: 'Open a diagram', pickFile: 'Choose a file…', dropHere: 'or drop a .flusso file here',
    examples: 'Ready-made examples',
    pngTitle: 'Export as image', pngDl: 'Download PNG', pngNote: 'If the download does not start, long-press (or right-click) the image and choose “Save image”.',
    cancel: 'Cancel', close: 'Close',
    loadedOk: 'Diagram loaded', badFile: 'This file does not contain a valid diagram.', deleted: 'Block deleted', copiedBlk: 'Block copied',
    e_syntax: x => `I don't understand “${x}” here`, e_end: 'The expression is incomplete', e_str: 'Missing closing quote',
    e_empty: 'The field is empty', e_undef: n => `Variable ${n} has no value yet`, e_div0: 'Division by zero',
    e_type: op => `Wrong data types for ${op}`, e_fn: n => `Unknown function: ${n}`, e_args: (n, k) => `${n} takes ${k} arguments`,
    e_idx: i => `Invalid index: ${i}`, e_notarr: n => `${n} is not an array`, e_lv: 'A variable name is needed here',
    e_bool: 'The condition must give TRUE or FALSE (for example x > 0)', e_loop: 'Too many steps: maybe an infinite loop?',
    e_step0: 'The loop step cannot be 0', e_sqrt: 'Square root of a negative number', e_num: x => `“${x}” is not a number`,
  },
};
let lang = store.get('lang') === 'en' ? 'en' : 'it';
const opts = Object.assign({ explain: false, sym: false, theme: 'auto', trace: true, py: false, link: true }, (() => { try { return JSON.parse(store.get('prefs') || '{}'); } catch (e) { return {}; } })());
function saveOpts() { store.set('prefs', JSON.stringify(opts)); }
function applyTheme() { const r = document.documentElement; if (opts.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', opts.theme); }
applyTheme();
function t(k, ...a) { const v = I18N[lang][k] ?? I18N.it[k]; return typeof v === 'function' ? v(...a) : v; }
function emsg(e) { if (e instanceof FL.FErr) return t('e_' + e.key, ...e.args); console.error(e); return String(e && e.message || e); }

/* ================= examples ================= */
const EX = [
  { it: ['Media dei voti', 'Per, Se'], en: ['Average of grades', 'For, If'], name: 'Media dei voti', main: [
    { t: 'output', e: '"Quanti voti? "', ln: false }, { t: 'input', v: 'n' }, { t: 'assign', v: 's', e: '0' },
    { t: 'for', v: 'i', a: '1', b: 'n', s: '1', body: [{ t: 'output', e: '"Voto "', ln: false }, { t: 'output', e: 'i', ln: false }, { t: 'output', e: '": "', ln: false }, { t: 'input', v: 'voto' }, { t: 'assign', v: 's', e: 's + voto' }] },
    { t: 'assign', v: 'float media', e: '(float) s / n' }, { t: 'output', e: '"Media: "', ln: false }, { t: 'output', e: 'round(media * 100) / 100.0' },
    { t: 'if', c: 'media >= 6', y: [{ t: 'output', e: '"Sufficiente"' }], n: [{ t: 'output', e: '"Insufficiente"' }] }] },
  { it: ['Tabellina', 'Per'], en: ['Times table', 'For'], name: 'Tabellina', main: [
    { t: 'input', v: 'n' },
    { t: 'for', v: 'i', a: '1', b: '10', s: '1', body: [{ t: 'output', e: 'n', ln: false }, { t: 'output', e: '" x "', ln: false }, { t: 'output', e: 'i', ln: false }, { t: 'output', e: '" = "', ln: false }, { t: 'output', e: 'n * i' }] }] },
  { it: ['Numero primo', 'Mentre, AND, mod'], en: ['Prime number', 'While, AND, mod'], name: 'Numero primo', main: [
    { t: 'input', v: 'n' }, { t: 'assign', v: 'd', e: '2' }, { t: 'assign', v: 'primo', e: 'vero' },
    { t: 'while', c: 'd * d <= n AND primo', body: [
      { t: 'if', c: 'n mod d == 0', y: [{ t: 'assign', v: 'primo', e: 'falso' }], n: [] }, { t: 'assign', v: 'd', e: 'd + 1' }] },
    { t: 'if', c: 'primo AND n > 1', y: [{ t: 'output', e: 'n', ln: false }, { t: 'output', e: '" è primo"' }], n: [{ t: 'output', e: 'n', ln: false }, { t: 'output', e: '" non è primo"' }] }] },
  { it: ['Somma fino a zero', 'Ripeti… mentre'], en: ['Sum until zero', 'Do… while'], name: 'Somma fino a zero', main: [
    { t: 'assign', v: 's', e: '0' },
    { t: 'do', c: 'x != 0', body: [{ t: 'input', v: 'x' }, { t: 'assign', v: 's', e: 's + x' }] },
    { t: 'output', e: '"Totale: "', ln: false }, { t: 'output', e: 's' }] },
  { it: ['Massimo di un vettore', 'Vettori'], en: ['Array maximum', 'Arrays'], name: 'Massimo di un vettore', main: [
    { t: 'input', v: 'n' },
    { t: 'for', v: 'i', a: '0', b: 'n - 1', s: '1', body: [{ t: 'input', v: 'v[i]' }] },
    { t: 'assign', v: 'max', e: 'v[0]' },
    { t: 'for', v: 'i', a: '1', b: 'n - 1', s: '1', body: [{ t: 'if', c: 'v[i] > max', y: [{ t: 'assign', v: 'max', e: 'v[i]' }], n: [] }] },
    { t: 'output', e: '"Massimo: "', ln: false }, { t: 'output', e: 'max' }] },
];

/* ================= state ================= */
let prog = { name: '', main: [] };
let sel = null;      // selected block id
let clip = null;     // copied block (JSON)
let zoom = 1;
let idN = 0;
let hist = [], fut = [];
const nid = () => 'b' + (++idN);
const kids = b => b.t === 'if' ? [b.y, b.n] : (b.body ? [b.body] : []);
function assignIds(seq) { for (const b of seq) { b.id = nid(); kids(b).forEach(assignIds); } }
function find(id, seq = prog.main) {
  for (let i = 0; i < seq.length; i++) {
    const b = seq[i]; if (b.id === id) return { b, arr: seq, idx: i };
    for (const s of kids(b)) { const r = find(id, s); if (r) return r; }
  }
  return null;
}
function mk(type) {
  switch (type) {
    case 'input': return { t: type, v: '' };
    case 'output': return { t: type, e: '', ln: true };
    case 'outln': return { t: 'output', e: '', ln: true };
    case 'comment': return { t: 'comment', text: '' };
    case 'decl': return { t: 'decl', k: 'int', v: '' };
    case 'assign': return { t: type, v: '', e: '' };
    case 'if': return { t: type, c: '', y: [], n: [] };
    case 'while': case 'do': return { t: type, c: '', body: [] };
    case 'for': return { t: type, v: 'i', a: '1', b: '10', s: '1', body: [] };
  }
}
const replacer = (k, v) => (k === 'id' || k[0] === '_') ? undefined : v;
const ser = () => JSON.stringify({ name: prog.name, main: prog.main }, replacer);
function snap() { hist.push(ser()); if (hist.length > 150) hist.shift(); fut.length = 0; markDirty(); }
function restore(s) { const o = JSON.parse(s); prog = { name: o.name || '', main: o.main }; assignIds(prog.main); sel = null; $('#pname').value = prog.name; }
function undo() { if (!hist.length) return; stopRun(); fut.push(ser()); restore(hist.pop()); markDirty(); afterChange(true); }
function redo() { if (!fut.length) return; stopRun(); hist.push(ser()); restore(fut.pop()); markDirty(); afterChange(true); }

/* ================= tabs ================= */
const MAXTABS = 10;
let tabs = [], cur = 0, tabSeq = 0;
function markDirty() { if (tabs[cur] && !tabs[cur].dirty) { tabs[cur].dirty = true; renderTabs(); } }
function isBlank() { return !prog.main.length && !String(prog.name).trim(); }
function tabSnapshot() { const T = tabs[cur]; if (!T) return; T.data = ser(); T.hist = hist; T.fut = fut; T.zoom = zoom; }
function activate(i) {
  stopRun(true); closePop(); if (typeof tip !== 'undefined') tip.hidden = true;
  tabSnapshot();
  cur = i; const T = tabs[i], o = JSON.parse(T.data);
  prog = { name: o.name || '', main: o.main }; assignIds(prog.main);
  hist = T.hist || []; fut = T.fut || []; zoom = T.zoom || 1; sel = null;
  $('#pname').value = prog.name; $('#errBox').hidden = true;
  clearConsole(); renderTabs(); afterChange(true);
  $('#canvas').scrollTop = 0;
}
function addTab(o, dirty) {
  if (tabs.length >= MAXTABS) { toast(t('tooMany', MAXTABS)); return false; }
  tabSnapshot();
  tabs.push({ id: ++tabSeq, data: JSON.stringify({ name: o.name || '', main: o.main }, replacer), hist: [], fut: [], dirty: !!dirty, zoom: 1 });
  activate(tabs.length - 1);
  requestAnimationFrame(() => { const el = $('#tabbar .tab.on'); if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
  return true;
}
function openDoc(o) {
  if (!o || !Array.isArray(o.main) || !o.main.every(validBlock)) throw new Error('bad');
  if (isBlank() && !tabs[cur].dirty) { loadObj(o, false); hist = []; fut = []; tabs[cur].dirty = false; renderTabs(); afterChange(true); return true; }
  return addTab(o, false);
}
function closeTab(i, force) {
  const T = tabs[i];
  if (!force && T.dirty) {
    openDlg(`<h2>${esc(t('closeT'))}</h2><p>${esc(t('closeMsg', tabLabel(i)))}</p>
      <div class="foot"><button class="btn" data-close>${esc(t('cancel'))}</button><button class="btn danger" id="closeNo">${esc(t('closeAnyway'))}</button><button class="btn primary" id="closeSave">${esc(t('save'))}…</button></div>`);
    $('#closeNo').onclick = () => { dlg.close(); closeTab(i, true); };
    $('#closeSave').onclick = () => { if (i !== cur) activate(i); cmdSave(); };
    return;
  }
  if (i === cur) stopRun(true);
  if (i !== cur) tabSnapshot();
  tabs.splice(i, 1);
  if (!tabs.length) { tabs.push({ id: ++tabSeq, data: JSON.stringify({ name: '', main: [] }), hist: [], fut: [], dirty: false, zoom: 1 }); cur = -1; }
  const next = i < cur ? cur - 1 : (i === cur ? Math.min(i, tabs.length - 1) : cur);
  cur = -1; activate(Math.max(0, next));
}
function tabLabel(i) {
  if (i === cur) return prog.name.trim() || t('untitled');
  try { return JSON.parse(tabs[i].data).name.trim() || t('untitled'); } catch (e) { return t('untitled'); }
}
function renderTabs() {
  const bar = $('#tabbar'); if (!bar) return;
  bar.innerHTML = tabs.map((T, i) => `<div class="tab${i === cur ? ' on' : ''}" data-i="${i}" role="tab" aria-selected="${i === cur}" title="${esc(tabLabel(i))}">
      <span class="tl">${esc(tabLabel(i))}</span>${T.dirty ? `<span class="td" title="${esc(t('unsaved'))}"></span>` : ''}
      <button class="tx" data-x="${i}" aria-label="${esc(t('closeTab'))}">×</button></div>`).join('') +
    `<button class="tadd" id="tabAdd" aria-label="${esc(t('newTab'))}" title="${esc(t('newTab'))}" ${tabs.length >= MAXTABS ? 'disabled' : ''}>+</button>`;
}
$('#tabbar').addEventListener('click', e => {
  const x = e.target.closest('[data-x]'); if (x) { e.stopPropagation(); closeTab(+x.dataset.x); return; }
  if (e.target.closest('#tabAdd')) { addTab({ name: '', main: [] }, false); return; }
  const tb = e.target.closest('.tab'); if (tb && +tb.dataset.i !== cur) activate(+tb.dataset.i);
});
$('#tabbar').addEventListener('auxclick', e => { const tb = e.target.closest('.tab'); if (tb && e.button === 1) { e.preventDefault(); closeTab(+tb.dataset.i); } });
addEventListener('beforeunload', e => { if (tabs.some(T => T.dirty)) { e.preventDefault(); e.returnValue = ''; } });

const TYPES = ['decl', 'input', 'output', 'assign', 'if', 'while', 'do', 'for', 'comment'];
const MENU = ['decl', 'input', 'output', 'outln', 'assign', 'if', 'while', 'do', 'for', 'comment'];
function validBlock(b) {
  if (!b || typeof b !== 'object' || !TYPES.includes(b.t)) return false;
  const str = k => { if (b[k] == null) b[k] = ''; b[k] = String(b[k]); };
  const arr = k => Array.isArray(b[k]) && b[k].every(validBlock);
  switch (b.t) {
    case 'input': str('v'); return true;
    case 'output': str('e'); b.ln = b.ln !== false; return true;
    case 'comment': str('text'); return true;
    case 'assign': str('v'); str('e'); if (b.inc !== '++' && b.inc !== '--') delete b.inc; return true;
    case 'decl': str('v'); if (b.k === 'real') b.k = 'float'; if (!FL.KINDS.includes(b.k)) b.k = 'int'; return true;
    case 'if': str('c'); if (!b.n) b.n = []; return arr('y') && arr('n');
    case 'while': case 'do': str('c'); return arr('body');
    case 'for': ['v', 'a', 'b', 's'].forEach(str); return arr('body');
  }
  return false;
}
function loadObj(o, fromUser) {
  if (!o || !Array.isArray(o.main) || !o.main.every(validBlock)) throw new Error('bad');
  if (fromUser) snap();
  stopRun();
  prog = { name: String(o.name || ''), main: o.main };
  assignIds(prog.main); sel = null;
  $('#pname').value = prog.name;
  clearConsole();
}

/* ================= layout & drawing ================= */
const BH = 38, DH = 54, G = 30, HG = 44, LM = 30, TH = 34;
const FONT = '13px "JetBrains Mono", ui-monospace, Consolas, monospace';
const SVGFONT = "'JetBrains Mono', ui-monospace, Consolas, monospace";
const mctx = document.createElement('canvas').getContext('2d');
function tw(s) { mctx.font = FONT; return mctx.measureText(String(s)).width; }
const dots = s => (String(s ?? '').trim() ? s : '…');
const symz = s => opts.sym ? String(s).replace(/>=/g, '\u2265').replace(/<=/g, '\u2264').replace(/!=|<>/g, '\u2260') : String(s);
function label(b) {
  switch (b.t) {
    case 'input': return dots(b.v);
    case 'output': return dots(b.e);
    case 'assign': return b.inc ? `${dots(b.v)}${b.inc}` : `${dots(b.v)} = ${symz(dots(b.e))}`;
    case 'decl': return `${t('tyk')[b.k] || ''} ${dots(b.v)}`;
    case 'if': case 'while': case 'do': return symz(dots(b.c));
    case 'comment': return dots(b.text);
    case 'for': { const st = String(b.s ?? '').trim(); return `${dots(b.v)} = ${dots(b.a)} TO ${dots(b.b)}${st && st !== '1' ? ' STEP ' + st : ''}`; }
  }
}
function kw(b) { return { decl: 'VAR', input: 'IN', output: b.ln === false ? 'OUT' : 'OUTLN', if: 'IF', while: 'WHILE', do: 'DO WHILE', for: 'FOR' }[b.t] || ''; }
function fullLabel(b) { const k = kw(b); return (k ? k + ' ' : '') + label(b); }
function noteOf(b) {
  switch (b.t) {
    case 'input': return t('n_in', dots(b.v));
    case 'output': {
      let x = t('n_val');
      try { const a = FL.parse(b.e); if (a.k === 'str') x = `«${a.v}»`; else if (a.k === 'var') x = t('n_val') + ' ' + a.n; } catch (e) {}
      return t('n_out', x, b.ln !== false);
    }
    case 'assign': return b.inc ? t('n_inc', dots(b.v), b.inc) : t('n_as', dots(b.v));
    case 'decl': return t('n_decl', t('tyk')[b.k] || '');
    case 'if': return t('n_if');
    case 'while': return t('n_while');
    case 'do': return t('n_do');
    case 'for': return t('n_for', dots(b.v), dots(b.a), dots(b.b));
    case 'comment': return t('n_cm');
  }
  return '';
}
function measureSeq(seq) {
  let w = 70, h = G;
  for (const b of seq) { measure(b); w = Math.max(w, b._w); h += b._h + G; }
  return { w, h };
}
const bw = s => s.length * 6.3 + 10;
function measure(b) {
  const lw = tw(label(b)), kW = bw(kw(b));
  switch (b.t) {
    case 'input': case 'output': b._w = Math.max(lw + 54, 2 * (kW + 30)); b._h = BH; break;
    case 'assign': b._w = lw + 32; b._h = BH; break;
    case 'decl': b._w = Math.max(lw + 44, 2 * (kW + 30)); b._h = BH; break;
    case 'comment': b._w = tw('// ' + label(b)) + 34; b._h = BH - 6; break;
    case 'if': {
      const dw = Math.max(120, lw + 70), Y = measureSeq(b.y), N = measureSeq(b.n);
      const col = Math.max(Y.w, N.w, 70);
      const off = Math.max(col / 2 + HG / 2, dw / 2 + 20);
      Object.assign(b, { _dw: dw, _off: off, _yh: Y.h, _nh: N.h, _bh: Math.max(Y.h, N.h) });
      b._w = 2 * off + col; b._h = DH + b._bh + 16; break;
    }
    case 'while': case 'for': {
      const isFor = b.t === 'for';
      const dw = isFor ? Math.max(130, lw + 46) : Math.max(130, lw + 70), dh = isFor ? 42 : DH;
      const B = measureSeq(b.body);
      Object.assign(b, { _dw: dw, _dh: dh, _bh: B.h });
      b._w = Math.max(dw, B.w) + 2 * LM; b._h = 20 + dh + B.h + 26; break;
    }
    case 'do': {
      const dw = Math.max(140, lw + 70), B = measureSeq(b.body);
      Object.assign(b, { _dw: dw, _dh: DH, _bh: B.h });
      b._w = Math.max(dw, B.w) + 2 * LM; b._h = 10 + B.h + DH + 14; break;
    }
  }
}
const SCREEN = {
  wire: 'var(--wire)', ink: 'var(--ink)', muted: 'var(--muted)', paper: null,
  io: ['var(--io-f)', 'var(--io-s)'], as: ['var(--as-f)', 'var(--as-s)'], if: ['var(--if-f)', 'var(--if-s)'],
  lp: ['var(--lp-f)', 'var(--lp-s)'], tm: ['var(--tm-f)', 'var(--tm-s)'], hl: 'var(--hl)', badge: 'var(--surface)', cm: ['var(--paper)', 'var(--faint)'], dc: ['var(--dc-f)', 'var(--dc-s)'],
};
const PRINT = {
  wire: '#3a4657', ink: '#172230', muted: '#56657a', paper: '#ffffff',
  io: ['#e0f3e7', '#2b8150'], as: ['#e6eefc', '#3960b2'], if: ['#fdf0d3', '#a5720e'],
  lp: ['#f7e4ef', '#993873'], tm: ['#eceef2', '#4a5362'], hl: '#f2b705', badge: '#ffffff', cm: ['#ffffff', '#8c98a8'], dc: ['#ddf2f2', '#1f7378'],
};
const KIND = { decl: 'dc', input: 'io', output: 'io', assign: 'as', if: 'if', while: 'lp', do: 'lp', for: 'lp', comment: 'cm' };

let slotMap = new Map();
function buildSVG(P, interactive) {
  slotMap = new Map(); let slotN = 0;
  const body = measureSeq(prog.main);
  const W = Math.max(body.w, 160) + 60, H = 20 + TH + body.h + TH + 20;
  const cx = W / 2, o = [];
  const line = (d, arrow) => o.push(`<path d="${d}" style="fill:none;stroke:${P.wire};stroke-width:1.6;stroke-linejoin:round"${arrow ? ' marker-end="url(#ah)"' : ''}/>`);
  const text = (x, y, s, size = 13, fill = P.ink, weight = 400, anchor = 'middle') =>
    o.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="central" style="fill:${fill};font-family:${SVGFONT};font-size:${size}px;font-weight:${weight};font-variant-ligatures:none">${esc(s)}</text>`);
  const st = (k) => `fill:${P[k][0]};stroke:${P[k][1]};stroke-width:1.6`;
  const badge = (bx, by, s, k) => { if (!s) return; const w = bw(s);
    o.push(`<rect class="badge" x="${bx}" y="${by}" width="${w}" height="14" rx="3" style="fill:${P[k][1]}"/><text x="${bx + w / 2}" y="${by + 7.5}" text-anchor="middle" dominant-baseline="central" style="fill:${P.badge};font-family:${SVGFONT};font-size:9.5px;font-weight:600;letter-spacing:.03em">${s}</text>`); };
  const runCur = R && R.cur, runErr = R && R.errId;
  const known = interactive ? FL.knownVars(prog.main) : null;
  function terminal(y, s) {
    const w = Math.max(100, tw(s) + 40);
    o.push(`<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${TH}" rx="${TH / 2}" style="${st('tm')}"/>`);
    text(cx, y + TH / 2, s, 12.5, P.ink, 600);
  }
  function seq(arr, x, y, final) {
    for (let i = 0; i <= arr.length; i++) {
      const arrow = i < arr.length || final;
      line(`M${x} ${y}V${y + G}`, arrow);
      if (interactive) {
        const id = ++slotN; slotMap.set(id, { arr, idx: i });
        const my = y + G / 2 - 1;
        o.push(`<g class="slot" data-s="${id}"><circle cx="${x}" cy="${my}" r="18" style="fill:transparent"/><circle class="dot" cx="${x}" cy="${my}" r="7.5"/><path class="plus" d="M${x - 3.5} ${my}h7M${x} ${my - 3.5}v7"/></g>`);
      }
      y += G;
      if (i < arr.length) { block(arr[i], x, y); y += arr[i]._h; }
    }
  }
  function block(b, x, y) {
    const k = KIND[b.t], lab = label(b);
    let cls = 'blk';
    if (interactive) {
      if (FL.staticErr(b, known)) cls += ' bad';
      if (b.id === sel) cls += ' sel';
      if (b.id === runCur) cls += ' cur';
      if (b.id === runErr) cls += ' err';
    }
    const g0 = `<g class="${cls}" data-b="${b.id}">`;
    if (b.t === 'comment') {
      const w = b._w, l = x - w / 2, h = b._h, f = 9;
      o.push(g0, `<path class="shape" d="M${l} ${y}H${l + w - f}L${l + w} ${y + f}V${y + h}H${l}Z" style="fill:${P.cm[0]};stroke:${P.cm[1]};stroke-width:1.3;stroke-dasharray:4 3"/>`,
        `<path d="M${l + w - f} ${y}V${y + f}H${l + w}" style="fill:none;stroke:${P.cm[1]};stroke-width:1.1"/>`);
      o.push(`<text x="${x}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" style="fill:${P.muted};font-family:${SVGFONT};font-size:12.5px;font-style:italic;font-variant-ligatures:none">${esc('// ' + label(b))}</text>`);
      o.push('</g>');
      return;
    }
    if (b.t === 'decl') {
      const w = b._w, l = x - w / 2;
      o.push(g0, `<rect class="shape" x="${l}" y="${y}" width="${w}" height="${BH}" rx="2" style="${st(k)}"/>`,
        `<path d="M${l + 7} ${y}V${y + BH}M${l + w - 7} ${y}V${y + BH}" style="fill:none;stroke:${P[k][1]};stroke-width:1.2"/>`);
      badge(Math.min(l + 16, x - 14 - bw(kw(b))), y - 7, kw(b), k);
      text(x, y + BH / 2 + 1, lab);
      o.push('</g>');
      return;
    }
    if (b.t === 'input' || b.t === 'output' || b.t === 'assign') {
      const w = b._w, l = x - w / 2;
      o.push(g0);
      if (b.t === 'assign') o.push(`<rect class="shape" x="${l}" y="${y}" width="${w}" height="${BH}" rx="4" style="${st(k)}"/>`);
      else { const sk = 12; o.push(`<polygon class="shape" points="${l + sk},${y} ${l + w},${y} ${l + w - sk},${y + BH} ${l},${y + BH}" style="${st(k)}"/>`); badge(Math.min(l + 16, x - 14 - bw(kw(b))), y - 7, kw(b), k); }
      text(x, y + BH / 2 + (b.t === 'assign' ? 0 : 1), lab);
      o.push('</g>');
      return;
    }
    if (b.t === 'if') {
      const dw = b._dw, off = b._off, my = y + DH / 2;
      o.push(g0, `<polygon class="shape" points="${x},${y} ${x + dw / 2},${my} ${x},${y + DH} ${x - dw / 2},${my}" style="${st(k)}"/>`);
      text(x, my, lab); badge(x - dw / 2 + 2, y, kw(b), k); o.push('</g>');
      line(`M${x + dw / 2} ${my}H${x + off}V${y + DH}`);
      line(`M${x - dw / 2} ${my}H${x - off}V${y + DH}`);
      text(x + dw / 2 + 8, my - 9, t('T'), 11.5, P.muted, 600, 'start');
      text(x - dw / 2 - 8, my - 9, t('F'), 11.5, P.muted, 600, 'end');
      seq(b.y, x + off, y + DH, false);
      seq(b.n, x - off, y + DH, false);
      const mY = y + DH + b._bh + 8;
      line(`M${x + off} ${y + DH + b._yh}V${mY}H${x}`);
      line(`M${x - off} ${y + DH + b._nh}V${mY}H${x}`);
      line(`M${x} ${mY}V${y + b._h}`);
      o.push(`<circle cx="${x}" cy="${mY}" r="3.2" style="fill:${P.wire}"/>`);
      return;
    }
    if (b.t === 'while' || b.t === 'for') {
      const dw = b._dw, dh = b._dh, dT = y + 20, my = dT + dh / 2, xl = x - b._w / 2 + 10, xr = x + b._w / 2 - 10;
      line(`M${x} ${y}V${dT}`, true);
      o.push(g0);
      if (b.t === 'for') {
        const l = x - dw / 2, r = x + dw / 2, c = 14;
        o.push(`<polygon class="shape" points="${l + c},${dT} ${r - c},${dT} ${r},${my} ${r - c},${dT + dh} ${l + c},${dT + dh} ${l},${my}" style="${st(k)}"/>`);
      } else {
        o.push(`<polygon class="shape" points="${x},${dT} ${x + dw / 2},${my} ${x},${dT + dh} ${x - dw / 2},${my}" style="${st(k)}"/>`);
      }
      text(x, my, lab);
      if (b.t === 'for') badge(x - dw / 2 + 18, dT - 7, kw(b), k); else badge(x - dw / 2 + 2, dT, kw(b), k);
      o.push('</g>');
      seq(b.body, x, dT + dh, false);
      const yb = dT + dh + b._bh;
      line(`M${x} ${yb}V${yb + 10}H${xl}V${y + 7}H${x - 1}`, true);
      line(`M${x + dw / 2} ${my}H${xr}V${y + b._h - 6}H${x}V${y + b._h}`);
      text(x + 7, dT + dh + 9, t('T'), 11.5, P.muted, 600, 'start');
      text(x + dw / 2 + 8, my - 9, t('F'), 11.5, P.muted, 600, 'start');
      return;
    }
    if (b.t === 'do') {
      const dw = b._dw, xl = x - b._w / 2 + 10;
      line(`M${x} ${y}V${y + 10}`);
      seq(b.body, x, y + 10, true);
      const dT = y + 10 + b._bh, my = dT + DH / 2;
      o.push(g0, `<polygon class="shape" points="${x},${dT} ${x + dw / 2},${my} ${x},${dT + DH} ${x - dw / 2},${my}" style="${st(k)}"/>`);
      text(x, my, lab); badge(x - dw / 2 + 2, dT, kw(b), k); o.push('</g>');
      line(`M${x - dw / 2} ${my}H${xl}V${y + 5}H${x - 1}`, true);
      line(`M${x} ${dT + DH}V${y + b._h}`);
      text(x - dw / 2 - 8, my - 9, t('T'), 11.5, P.muted, 600, 'end');
      text(x + 7, dT + DH + 7, t('F'), 11.5, P.muted, 600, 'start');
    }
  }
  let y = 20;
  terminal(y, t('START')); y += TH;
  seq(prog.main, cx, y, true); y += body.h;
  terminal(y, t('END'));
  const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 1L10 5L0 9z" style="fill:${P.wire}"/></marker></defs>`;
  return { W, H, inner: defs + o.join('') };
}

function renderDiagram() {
  const { W, H, inner } = buildSVG(SCREEN, true);
  $('#svgHost').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * zoom}" height="${H * zoom}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(prog.name || t('untitled'))}">${inner}</svg>`;
  $('#zLbl').textContent = Math.round(zoom * 100) + '%';
}
let rafPending = false;
function renderSoon() { if (rafPending) return; rafPending = true; requestAnimationFrame(() => { rafPending = false; renderDiagram(); renderCode(); persist(); }); }

/* ================= insertion popover ================= */
const ICON = {
  io: (f, s) => `<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><polygon points="6,3 29,3 24,17 1,17" style="fill:${f};stroke:${s}" stroke-width="1.4"/></svg>`,
  as: (f, s) => `<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><rect x="2" y="3" width="26" height="14" rx="2.5" style="fill:${f};stroke:${s}" stroke-width="1.4"/></svg>`,
  dia: (f, s) => `<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><polygon points="15,1 29,10 15,19 1,10" style="fill:${f};stroke:${s}" stroke-width="1.4"/></svg>`,
  hex: (f, s) => `<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><polygon points="7,3 23,3 29,10 23,17 7,17 1,10" style="fill:${f};stroke:${s}" stroke-width="1.4"/></svg>`,
};
function typeIcon(type) {
  if (type === 'outln') type = 'output';
  if (type === 'decl') return `<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><rect x="2" y="3" width="26" height="14" rx="1.5" style="fill:var(--dc-f);stroke:var(--dc-s)" stroke-width="1.4"/><path d="M6 3v14M24 3v14" style="stroke:var(--dc-s)" stroke-width="1.1"/></svg>`;
  if (type === 'comment') return `<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><path d="M2 3h21l5 5v9H2z" style="fill:var(--paper);stroke:var(--faint)" stroke-width="1.3" stroke-dasharray="3 2"/></svg>`;
  const k = KIND[type], f = `var(--${k}-f)`, s = `var(--${k}-s)`;
  if (type === 'input' || type === 'output') return ICON.io(f, s);
  if (type === 'assign') return ICON.as(f, s);
  if (type === 'for') return ICON.hex(f, s);
  return ICON.dia(f, s);
}
let popSlot = null;
function openPop(slotId, cx, cy) {
  const pop = $('#pop'), stage = $('.stage');
  popSlot = slotMap.get(slotId);
  $$('.slot.on').forEach(e => e.classList.remove('on'));
  const el = $(`.slot[data-s="${slotId}"]`); if (el) el.classList.add('on');
  pop.innerHTML = `<h4>${esc(t('insertHere'))}</h4>` +
    MENU.map(ty => `<button type="button" data-ins="${ty}">${typeIcon(ty)}<b>${esc(t('types')[ty])}</b></button>`).join('') +
    (clip ? `<hr><button type="button" data-ins="__paste"><svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true"><rect x="8" y="2" width="14" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11 8h8M11 12h8" stroke="currentColor" stroke-width="1.4"/></svg><b>${esc(t('pasteHere'))}</b></button>` : '');
  pop.hidden = false;
  const r = stage.getBoundingClientRect();
  let x = cx - r.left + 12, y = cy - r.top - 20;
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  if (x + pw > r.width - 8) x = Math.max(8, cx - r.left - pw - 12);
  if (y + ph > r.height - 8) y = Math.max(8, r.height - ph - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  const first = pop.querySelector('button'); if (first) first.focus({ preventScroll: true });
}
function closePop() { $('#pop').hidden = true; popSlot = null; $$('.slot.on').forEach(e => e.classList.remove('on')); }
function insertType(ty) {
  if (!popSlot) return;
  stopRun(); snap();
  let nb;
  if (ty === '__paste') { nb = JSON.parse(clip); assignIds([nb]); }
  else { nb = mk(ty); if (ty === 'output') nb.ln = false; nb.id = nid(); }
  popSlot.arr.splice(popSlot.idx, 0, nb);
  closePop();
  sel = nb.id;
  afterChange(true);
  switchTab('block');
  const f = $('#tab-block input[data-k]'); if (f && ty !== '__paste') f.focus();
}
$('#pop').addEventListener('click', e => { const btn = e.target.closest('[data-ins]'); if (btn) insertType(btn.dataset.ins); });

/* ================= canvas events ================= */
$('#svgHost').addEventListener('click', e => {
  const s = e.target.closest('.slot');
  if (s) { e.stopPropagation(); openPop(+s.dataset.s, e.clientX, e.clientY); return; }
  const b = e.target.closest('.blk');
  closePop();
  if (b) { sel = b.dataset.b; tip.hidden = true; renderDiagram(); renderPanel(); updBlkErr(); if (curTab !== 'code') switchTab('block'); else renderCode(); return; }
  if (sel) { sel = null; renderDiagram(); renderPanel(); }
});
$('#canvas').addEventListener('click', e => { if (e.target === e.currentTarget || e.target.id === 'svgHost') { closePop(); if (sel) { sel = null; renderDiagram(); renderPanel(); } } });
document.addEventListener('pointerdown', e => { if (!$('#pop').hidden && !e.target.closest('#pop') && !e.target.closest('.slot')) closePop(); });
/* context menu (right click) */
const ctx = $('#ctx');
let ctxSlot = null;
function showCtx(items, x, y) {
  ctx.innerHTML = items.map(it => {
    if (it === '-') return '<div class="msep"></div>';
    const [cmd, lab, key, dis] = it;
    return `<button class="mi" data-cmd="${cmd}" ${dis ? 'disabled' : ''}><span class="mk"></span><span>${esc(lab)}</span><kbd class="ks">${esc(key || '')}</kbd></button>`;
  }).join('');
  ctx.hidden = false;
  const vw = innerWidth, vh = innerHeight;
  ctx.style.left = Math.min(x, vw - ctx.offsetWidth - 8) + 'px';
  ctx.style.top = Math.min(y, vh - ctx.offsetHeight - 8) + 'px';
}
function hideCtx() { ctx.hidden = true; }
ctx.addEventListener('click', e => { const it = e.target.closest('.mi'); if (!it || it.disabled) return; hideCtx(); runCmd(it.dataset.cmd); });
document.addEventListener('pointerdown', e => { if (!ctx.hidden && !e.target.closest('#ctx')) hideCtx(); });
let lp = null, lpFired = false;
$('#svgHost').addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse') return;
  const target = e.target.closest('.blk,.slot'); if (!target) return;
  lpFired = false;
  lp = { x: e.clientX, y: e.clientY, timer: setTimeout(() => {
    lpFired = true; lp = null;
    target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }));
  }, 550) };
});
const lpCancel = () => { if (lp) { clearTimeout(lp.timer); lp = null; } };
$('#svgHost').addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 8) lpCancel(); });
$('#svgHost').addEventListener('pointerup', lpCancel);
$('#svgHost').addEventListener('pointercancel', lpCancel);
$('#svgHost').addEventListener('click', e => { if (lpFired) { e.stopImmediatePropagation(); e.preventDefault(); lpFired = false; } }, true);
$('#svgHost').addEventListener('contextmenu', e => {
  e.preventDefault(); closePop(); tip.hidden = true;
  if (e.isTrusted && lpFired) return;
  const s = e.target.closest('.slot'), b = e.target.closest('.blk');
  if (b) {
    sel = b.dataset.b; renderDiagram(); renderPanel(); updBlkErr(); renderCode();
    const f = find(sel); const hasC = f && f.b.c !== undefined;
    const items = [['copy', t('copy'), 'Ctrl+C'], ['cut', t('cut'), ''], ['paste', t('pasteAfter'), 'Ctrl+V', !clip], ['dup', t('dup'), ''], '-',
      ['up', '\u2191 ' + t('up'), '', !f || f.idx === 0], ['down', '\u2193 ' + t('down'), '', !f || f.idx === f.arr.length - 1]];
    if (hasC) items.push('-', ['inv', t('invert'), '']);
    if (f && f.b.t === 'if') items.push(['swap', t('swap'), '']);
    items.push('-', ['del', t('del'), 'Canc']);
    showCtx(items, e.clientX, e.clientY);
    return;
  }
  if (s) {
    ctxSlot = slotMap.get(+s.dataset.s);
    showCtx([['pasteSlot', t('pasteHere'), '', !clip], '-', ...MENU.map(ty => ['ins:' + ty, t('types')[ty], ''])], e.clientX, e.clientY);
  }
});
const tip = $('#tip');
(function calmOverlays() {
  const st = $('.stage'), c = $('#canvas'); let tm = 0;
  const busy = () => { st.classList.add('busy'); clearTimeout(tm); tm = setTimeout(() => st.classList.remove('busy'), 2200); };
  c.addEventListener('pointerdown', e => { if (!e.target.closest('.blk,.slot')) busy(); });
  c.addEventListener('scroll', busy, { passive: true });
  c.addEventListener('wheel', busy, { passive: true });
  c.addEventListener('pointermove', e => { if (e.buttons || e.pointerType !== 'mouse') busy(); }, { passive: true });
})();
$('#svgHost').addEventListener('mouseover', e => {
  const g = e.target.closest('.blk'); if (!g) return;
  const f = find(g.dataset.b); if (!f) return;
  if (opts.link) { $$('#code .cl.hov').forEach(x => x.classList.remove('hov')); $$(`#code .cl[data-b="${f.b.id}"]`).forEach(x => x.classList.add('hov')); }
  const err = FL.staticErr(f.b, FL.knownVars(prog.main));
  if (!err && !opts.explain) return;
  tip.className = 'tip' + (err ? ' tip-err' : '');
  tip.innerHTML = err ? `<b>${esc(t('errAt'))}</b> ${esc(emsg(err))}` : `<b>${esc(fullLabel(f.b))}</b>${esc(noteOf(f.b))}`;
  tip.hidden = false; moveTip(e);
});
$('#svgHost').addEventListener('mousemove', e => { if (!tip.hidden) moveTip(e); });
$('#svgHost').addEventListener('mouseout', e => { const g = e.target.closest('.blk'); if (g && !g.contains(e.relatedTarget)) { tip.hidden = true; $$('#code .cl.hov').forEach(x => x.classList.remove('hov')); } });
function moveTip(e) {
  const r = $('.stage').getBoundingClientRect();
  let x = e.clientX - r.left + 14, y = e.clientY - r.top + 16;
  if (x + tip.offsetWidth > r.width - 8) x = e.clientX - r.left - tip.offsetWidth - 10;
  if (y + tip.offsetHeight > r.height - 8) y = e.clientY - r.top - tip.offsetHeight - 10;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
(function pan() {
  const c = $('#canvas'); let drag = null, moved = false;
  c.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('.blk,.slot,.zoom')) return;
    drag = { x: e.clientX, y: e.clientY, l: c.scrollLeft, t: c.scrollTop }; moved = false;
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) > 4) { moved = true; c.classList.add('panning'); closePop(); tip.hidden = true; }
    if (moved) { c.scrollLeft = drag.l - dx; c.scrollTop = drag.t - dy; }
  });
  window.addEventListener('pointerup', () => { if (drag) { drag = null; c.classList.remove('panning'); } });
  c.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
})();
function setZoom(z) { zoom = Math.min(2, Math.max(0.25, Math.round(z * 20) / 20)); renderDiagram(); persist(); }
function fitZoom() {
  const svg = $('#svgHost svg'), c = $('#canvas'); if (!svg) return;
  const vb = svg.viewBox.baseVal, f = Math.min((c.clientWidth - 48) / vb.width, (c.clientHeight - 48) / vb.height, 1);
  const z = Math.max(0.25, Math.floor(f * 20) / 20);
  setZoom(Math.abs(zoom - z) < 0.01 ? 1 : z);
  c.scrollTop = 0; c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2;
}
$('#zLbl').onclick = fitZoom;
$('#zIn').onclick = () => setZoom(zoom + 0.1);
$('#zOut').onclick = () => setZoom(zoom - 0.1);

/* ================= block panel ================= */
const FIELDS = {
  input: [['v', 'f_vars', 'a, b', 'list']],
  output: [['e', 'f_expr', '"Ciao"', 'expr']],
  assign: [['_as', 'f_assign', 's = s + voto', 'assign']],
  if: [['c', 'f_cond', 'x > 0', 'expr']],
  while: [['c', 'f_cond', 'x > 0', 'expr']],
  do: [['c', 'f_cond', 'x > 0', 'expr']],
  comment: [['text', 'f_comment', null, 'text']],
  decl: [['k', 'f_type', null, 'kind'], ['v', 'f_declvars', 'n, i, v[]', 'decl']],
  for: [['v', 'f_var', null, 'lv'], ['a', 'f_from', null, 'expr'], ['b', 'f_to', null, 'expr'], ['s', 'f_step', null, 'opt']],
};
function splitAssign(str) {
  const s = String(str); let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '=' && !'<>!='.includes(s[i - 1] || '') && s[i + 1] !== '=') return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
  }
  return null;
}
const INCRE = /^\s*(?:(\+\+|--)\s*([^=+\-][^=]*?)|([^=]*?[^=+\-\s])\s*(\+\+|--))\s*$/;
function splitInc(str) { const m = INCRE.exec(String(str)); return m ? { v: (m[2] || m[3]).trim(), op: m[1] || m[4] } : null; }
const fieldVal = (b, key) => key === '_as' ? (b.inc ? `${b.v}${b.inc}` : (b.v || b.e) ? `${b.v}${b.e !== '' || b.v ? ' = ' : ''}${b.e}` : '') : (b[key] ?? '');
function fieldErr(kind, val) {
  try {
    if (kind === 'text') return '';
    if (kind === 'kind') return '';
    if (kind === 'decl') { FL.parseDecl(val); return ''; }
    if (kind === 'assign') {
      if (!String(val).trim()) throw new FL.FErr('empty');
      const inc = splitInc(val); if (inc) { FL.parseLV(inc.v); return ''; }
      const p = splitAssign(val); if (!p) return t('e_noeq');
      FL.lvTyped(p[0]); FL.parse(p[1]); return '';
    }
    if (kind === 'list') { const n = FL.splitList(val); if (!n.length) throw new FL.FErr('empty'); n.forEach(FL.lvTyped); }
    else if (kind === 'lv') FL.lvTyped(val);
    else if (kind === 'opt') { if (String(val).trim()) FL.parse(val); }
    else FL.parse(val);
    return '';
  } catch (e) { return emsg(e); }
}
function legendHTML() {
  return `<div class="legend"><b style="font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">${esc(t('legendT'))}</b>` +
    MENU.map(ty => `<div>${typeIcon(ty)}<span><b>${esc(t('types')[ty])}</b> · <span style="color:var(--muted)">${esc(t('typeHint')[ty])}</span></span></div>`).join('') + '</div>';
}
function renderPanel() {
  const box = $('#tab-block');
  const f = sel && find(sel);
  if (!f) { sel = null; box.innerHTML = `<div class="empty"><p style="margin:0">${t('noSel')}</p>${legendHTML()}</div>`; return; }
  const b = f.b, defs = FIELDS[b.t];
  const fieldHTML = ([key, lab, ph, kind]) => {
    const val = fieldVal(b, key);
    const showErr = String(val).trim() ? fieldErr(kind, val) : '';
    if (kind === 'kind') return `<div class="field"><label for="f-${key}">${esc(t(lab))}</label>
      <select id="f-${key}" data-k="${key}" data-kind="kind">${FL.KINDS.map(k => `<option value="${k}" ${b.k === k ? 'selected' : ''}>${esc(t('tyk')[k])}</option>`).join('')}</select></div>`;
    return `<div class="field"><label for="f-${key}">${esc(t(lab))}</label>
      <input id="f-${key}" data-k="${key}" data-kind="${kind}" value="${esc(val)}" placeholder="${esc(ph || '')}" spellcheck="false" autocapitalize="off" autocomplete="off" class="${showErr ? 'bad' : ''}">
      <div class="msg" id="m-${key}">${esc(showErr)}</div></div>`;
  };
  let fields;
  if (b.t === 'for') fields = fieldHTML(defs[0]) + `<div class="row3">${defs.slice(1).map(fieldHTML).join('')}</div>`;
  else fields = defs.map(fieldHTML).join('');
  const tk = b.t === 'output' && b.ln !== false ? 'outln' : b.t;
  if (b.t === 'output') fields += `<label class="check"><input type="checkbox" id="f-ln" ${b.ln !== false ? 'checked' : ''}> ${esc(t('f_ln'))}</label>`;
  if (b.c !== undefined) {
    let ok = true; try { FL.parse(b.c); } catch (e) { ok = false; }
    fields += `<div class="grp" style="margin:-2px 0 12px"><button class="btn" data-act="inv" ${ok ? '' : 'disabled'}>⇄ ${esc(t('invert'))}</button>${b.t === 'if' ? `<button class="btn" data-act="swap">${esc(t('swap'))}</button>` : ''}</div>`;
  }
  box.innerHTML = `<div class="bhead">${typeIcon(tk)}<div><h3>${esc(t('types')[tk])}</h3><p>${esc(noteOf(b))}</p></div></div>
    ${fields}<div class="perr" id="blkErr" hidden></div>
    <div class="actions">
      <button class="btn" data-act="up" ${f.idx === 0 ? 'disabled' : ''}>↑ ${esc(t('up'))}</button>
      <button class="btn" data-act="down" ${f.idx === f.arr.length - 1 ? 'disabled' : ''}>↓ ${esc(t('down'))}</button>
      <button class="btn" data-act="dup">${esc(t('dup'))}</button>
      <button class="btn" data-act="copy">${esc(t('copy'))}</button>
      <button class="btn danger" data-act="del">${esc(t('del'))}</button>
    </div>`;
}
function updBlkErr() {
  const el = $('#blkErr'); const f = sel && find(sel); if (!el || !f) return;
  const fieldBad = $$('#tab-block input.bad').length > 0;
  const err = fieldBad ? null : FL.staticErr(f.b, FL.knownVars(prog.main));
  const empty = err && err.key === 'empty';
  el.hidden = !err || empty; el.textContent = err && !empty ? emsg(err) : '';
}
let editSnapDone = false;
$('#tab-block').addEventListener('focusin', e => { if (e.target.matches('[data-k]')) editSnapDone = false; });
$('#tab-block').addEventListener('input', e => {
  const inp = e.target.closest('[data-k]'); if (!inp) return;
  const f = sel && find(sel); if (!f) return;
  if (!editSnapDone) { snap(); editSnapDone = true; stopRun(); }
  if (inp.dataset.k === '_as') {
    const inc = splitInc(inp.value), sp = inc ? null : splitAssign(inp.value);
    if (inc) { f.b.v = inc.v; f.b.e = ''; f.b.inc = inc.op; }
    else { delete f.b.inc; if (sp) { f.b.v = sp[0]; f.b.e = sp[1]; } else { f.b.v = inp.value.trim(); f.b.e = ''; } }
  } else f.b[inp.dataset.k] = inp.value;
  if (inp.tagName === 'SELECT') { editSnapDone = false; renderSoon(); updBlkErr(); const h = $('#tab-block .bhead p'); if (h) h.textContent = noteOf(f.b); return; }
  const err = inp.value.trim() ? fieldErr(inp.dataset.kind, inp.value) : '';
  inp.classList.toggle('bad', !!err);
  const m = $('#m-' + inp.dataset.k); if (m) m.textContent = err;
  updBlkErr();
  renderSoon();
});
$('#tab-block').addEventListener('change', e => {
  if (e.target.id !== 'f-ln') return;
  const f = sel && find(sel); if (!f) return;
  stopRun(); snap(); f.b.ln = e.target.checked; afterChange(true);
});
$('#tab-block').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input[data-k]')) e.target.blur(); });
$('#tab-block').addEventListener('click', e => { const btn = e.target.closest('[data-act]'); if (btn) blockAct(btn.dataset.act); });
function blockAct(act) {
  const f = sel && find(sel); if (!f) return;
  if (act === 'copy') { clip = JSON.stringify(f.b, replacer); toast(t('copiedBlk')); return; }
  stopRun(); snap();
  if (act === 'up' && f.idx > 0) { f.arr.splice(f.idx - 1, 0, f.arr.splice(f.idx, 1)[0]); }
  if (act === 'down' && f.idx < f.arr.length - 1) { f.arr.splice(f.idx + 1, 0, f.arr.splice(f.idx, 1)[0]); }
  if (act === 'dup') { const c = JSON.parse(JSON.stringify(f.b, replacer)); assignIds([c]); f.arr.splice(f.idx + 1, 0, c); sel = c.id; }
  if (act === 'del') { deleteSel(f); return; }
  if (act === 'inv') { try { f.b.c = FL.invertCond(f.b.c); toast(t('inverted')); } catch (e) {} }
  if (act === 'swap') { const y = f.b.y; f.b.y = f.b.n; f.b.n = y; toast(t('swapped')); }
  afterChange(true);
}
function deleteSel(f) {
  f.arr.splice(f.idx, 1);
  sel = f.arr[Math.min(f.idx, f.arr.length - 1)]?.id || null;
  afterChange(true); toast(t('deleted'));
}
function afterChange(panel) { renderDiagram(); if (panel) { renderPanel(); updBlkErr(); } renderCode(); persist(); }

/* ================= side panel tabs ================= */
let curTab = 'block';
function switchTab(name) {
  curTab = name;
  $$('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  ['block', 'run', 'code'].forEach(n => { $('#tab-' + n).hidden = n !== name; });
  if (name === 'code') renderCode();
}
$$('.tabs [data-tab]').forEach(b => b.onclick = () => switchTab(b.dataset.tab));

/* ================= code view ================= */
let codeMode = 'pseudo';
function renderCode() {
  $('#codePyBtn').hidden = !opts.py;
  if (!opts.py && codeMode === 'py') { codeMode = 'pseudo'; $$('#codeSeg button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.c === 'pseudo'))); }
  if (curTab !== 'code') return;
  const pre = $('#code');
  if (codeMode === 'py') pre.textContent = FL.toPython(prog.main, lang);
  else pre.innerHTML = FL.toPseudoLines(prog.main, lang).map(l => `<span class="cl${l.id && l.id === sel ? ' on' : ''}"${l.id ? ` data-b="${l.id}"` : ''}>${esc(l.s) || ' '}</span>`).join('');
  $('#codeNote').textContent = codeMode === 'py' ? t('pyNote') : t('pseudoNote');
}
function hoverLink(id, on) {
  if (!opts.link) return;
  $$('.blk.hov').forEach(e => e.classList.remove('hov'));
  $$('#code .cl.hov').forEach(e => e.classList.remove('hov'));
  if (!on || !id) return;
  const g = $(`.blk[data-b="${id}"]`); if (g) g.classList.add('hov');
  $$(`#code .cl[data-b="${id}"]`).forEach(e => e.classList.add('hov'));
}
$('#code').addEventListener('mouseover', e => { const l = e.target.closest('.cl[data-b]'); hoverLink(l && l.dataset.b, !!l); });
$('#code').addEventListener('mouseleave', () => hoverLink(null, false));
$('#code').addEventListener('click', e => {
  const l = e.target.closest('.cl[data-b]'); if (!l || !opts.link) return;
  sel = l.dataset.b; renderDiagram(); renderPanel(); updBlkErr(); renderCode();
  const g = $(`.blk[data-b="${sel}"]`); if (g) scrollToEl(g);
});
$$('#codeSeg button').forEach(b => b.onclick = () => {
  codeMode = b.dataset.c; $$('#codeSeg button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderCode();
});
$('#bCopyCode').onclick = () => copyText($('#code').textContent, $('#code'));
function copyText(txt, el) {
  const fallback = () => {
    if (!el) return;
    if (el.select) { el.focus(); el.select(); return; }
    const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  };
  try {
    navigator.clipboard.writeText(txt).then(() => toast(t('copied')), fallback);
  } catch (e) { fallback(); }
}

/* ================= runner ================= */
const SPEEDS = [800, 400, 150, 30, 0];
const MAXSTEPS = 2000000;
let R = null;
let speed = Math.min(4, Math.max(0, parseInt(store.get('speed') ?? '2', 10) || 0));
$('#speed').value = speed;
$('#speed').oninput = e => { speed = +e.target.value; store.set('speed', speed); };
const con = $('#con');
function clearConsole() { openLine = null; con.innerHTML = `<span class="idle">${esc(t('consoleIdle'))}</span>`; con.dataset.idle = '1'; renderVars(); }
let openLine = null;
function conOut(text, ln) {
  if (con.dataset.idle) { con.innerHTML = ''; delete con.dataset.idle; }
  if (!openLine) { openLine = document.createElement('div'); con.appendChild(openLine); }
  openLine.appendChild(document.createTextNode(text));
  if (ln) openLine = null;
  con.scrollTop = con.scrollHeight;
}
function conLine(text, cls) {
  if (con.dataset.idle) { con.innerHTML = ''; delete con.dataset.idle; }
  openLine = null;
  const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = text; con.appendChild(d);
  while (con.childNodes.length > 3000) con.removeChild(con.firstChild);
  con.scrollTop = con.scrollHeight;
}
let lastVals = {};
function renderVars() {
  const box = $('#varsBox');
  const env = R && R.env, T = (R && R.io && R.io.types) || {};
  const keys = env ? [...new Set([...Object.keys(T), ...Object.keys(env)])] : [];
  if (!keys.length) { box.innerHTML = `<p class="empty" style="margin:0">${esc(t('noVars'))}</p>`; lastVals = {}; return; }
  const rows = keys.map(k => {
    const has = Object.prototype.hasOwnProperty.call(env, k);
    const v = has ? FL.fmt(env[k]) : '—'; const chg = lastVals[k] !== undefined && lastVals[k] !== v || lastVals[k] === undefined;
    const ty = T[k] ? (T[k].arr ? `${t('vecOf')} ${t('tyk')[T[k].k]}` : t('tyk')[T[k].k]) : t('ty')[FL.typeOf(env[k])];
    return `<tr class="${chg && R.mode === 'step' ? 'chg' : ''}"><td>${esc(k)}</td><td>${esc(v)}</td><td class="ty">${esc(ty)}</td></tr>`;
  });
  box.innerHTML = `<table class="vars"><thead><tr><th>${esc(t('thName'))}</th><th>${esc(t('thVal'))}</th><th>${esc(t('thType'))}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
  lastVals = {}; for (const k of keys) lastVals[k] = Object.prototype.hasOwnProperty.call(env, k) ? FL.fmt(env[k]) : '—';
}
function syncTrace() { const c = $('#traceChk'); if (c) c.checked = opts.trace; con.classList.toggle('notrace', !opts.trace); }
$('#traceChk').addEventListener('change', e => { opts.trace = e.target.checked; saveOpts(); syncTrace(); });
function setRunUI() {
  const active = R && R.state !== 'done';
  $('#bStop').disabled = !active;
  const latched = !!(active && R.mode === 'run');
  $('#bRun').classList.toggle('latched', latched);
  $('#bRun').setAttribute('aria-pressed', String(latched));
}
function markCur() {
  $$('.blk.cur').forEach(e => e.classList.remove('cur'));
  if (R && R.cur && R.state !== 'done') {
    const el = $(`.blk[data-b="${R.cur}"]`);
    if (el) {
      el.classList.add('cur');
      if (R.mode === 'step' || SPEEDS[speed] >= 150) scrollToEl(el);
    }
  }
}
function scrollToEl(el) {
  const c = $('#canvas'), r = el.getBoundingClientRect(), cr = c.getBoundingClientRect();
  if (r.top < cr.top + 20 || r.bottom > cr.bottom - 20) c.scrollTop += (r.top - cr.top) - cr.height / 2 + r.height / 2;
  if (r.left < cr.left || r.right > cr.right) c.scrollLeft += (r.left - cr.left) - cr.width / 2 + r.width / 2;
}
function refresh() { markCur(); renderVars(); setRunUI(); }
function showErrBox(b, msg) {
  const box = $('#errBox');
  box.innerHTML = `<div><b>${esc(t('errAt'))}${b ? ' · ' + esc(fullLabel(b)) : ''}</b><span>${esc(msg)}</span></div><button class="x" aria-label="${esc(t('close'))}">×</button>`;
  box.hidden = false;
  box.querySelector('.x').onclick = () => { box.hidden = true; };
}
function startRun(mode) {
  $('#errBox').hidden = true;
  const pre = FL.firstError(prog.main);
  if (pre) {
    stopRun(true); sel = pre.b.id; renderDiagram(); renderPanel(); updBlkErr(); switchTab('block');
    showErrBox(pre.b, emsg(pre.e));
    const el = $(`.blk[data-b="${pre.b.id}"]`); if (el) scrollToEl(el);
    return;
  }
  stopRun(true); closePop();
  con.innerHTML = ''; delete con.dataset.idle; lastVals = {}; openLine = null;
  const env = Object.create(null);
  R = { env, mode, state: 'run', steps: 0, cur: null, errId: null, timer: 0 };
  R.io = { out: (s, ln) => conOut(s, ln), trace: traceFn };
  R.gen = FL.exec(prog.main, env, R.io);
  FL.setBoolNames(t('FALSE'), t('TRUE'));
  renderDiagram();
  switchTab('run');
  if (mode === 'run') tick(); else { pump(); refresh(); }
}
function pump(val) {
  let res;
  try { res = R.gen.next(val); } catch (e) { fail(e); return 'end'; }
  if (res.done) { finish(); return 'end'; }
  const y = res.value; R.cur = y.b.id;
  if (y.t === 'at') { if (++R.steps > MAXSTEPS) { fail(new FL.FErr('loop')); return 'end'; } return 'at'; }
  R.state = 'input'; R.askName = y.name; askInput(y.name); return 'input';
}
function tick() {
  if (!R || R.state !== 'run' || R.mode !== 'run') return;
  const d = SPEEDS[speed], n = d === 0 ? 4000 : 1;
  for (let k = 0; k < n; k++) { if (pump() !== 'at') { refresh(); return; } }
  refresh();
  R.timer = setTimeout(tick, d);
}
function runClick() {
  if (R && R.state !== 'done') {
    R.mode = 'run'; setRunUI();
    if (R.state === 'run') { clearTimeout(R.timer); tick(); } else $('#inVal').focus();
    return;
  }
  startRun('run');
}
function stepClick() {
  if (!R || R.state === 'done') { startRun('step'); return; }
  clearTimeout(R.timer); R.mode = 'step';
  if (R.state === 'input') { $('#inVal').focus(); setRunUI(); return; }
  pump(); refresh();
}
function askInput(name) {
  switchTab('run');
  $('#inLbl').textContent = t('inputAsk', name);
  $('#inForm').hidden = false; $('#inVal').value = '';
  markCur(); renderVars(); setRunUI();
  setTimeout(() => $('#inVal').focus({ preventScroll: false }), 0);
}
$('#inForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!R || R.state !== 'input') return;
  const v = $('#inVal').value;
  if (!v.trim()) { toast(t('inEmpty')); $('#inVal').focus(); return; }
  if (openLine) { const sp = document.createElement('span'); sp.className = 'ln-in'; sp.textContent = v; openLine.appendChild(sp); openLine = null; }
  else conLine(v, 'ln-in');
  $('#inForm').hidden = true; R.state = 'run';
  const r = pump(v);
  if (r === 'at' && R.mode === 'run') tick(); else refresh();
});
function traceFn(kind, b, d) {
  let s;
  if (kind === 'in') s = `IN ${d.name} = ${FL.fmt(d.value)}`;
  else if (kind === 'out') s = `${kw(b)} ${b.e}`;
  else if (kind === 'as') s = `${b.inc ? b.v + b.inc : b.v + ' = ' + b.e}  \u2192  ${FL.fmt(d.value)}`;
  else if (kind === 'decl') s = `VAR ${label(b)}`;
  else if (kind === 'cond') s = `${kw(b)} ${b.c}  \u2192  ${FL.fmt(d.value)}`;
  else if (kind === 'for') s = `FOR ${b.v} = ${FL.fmt(d.value)}${d.go ? '' : '  \u2192  ' + t('loopEnd')}`;
  if (!s) return;
  if (con.dataset.idle) { con.innerHTML = ''; delete con.dataset.idle; }
  const el = document.createElement('div'); el.className = 'ln-tr'; el.textContent = '\u25B8 ' + s;
  if (openLine) con.insertBefore(el, openLine); else con.appendChild(el);
  con.scrollTop = con.scrollHeight;
}
function finish() { R.state = 'done'; R.cur = null; $('#inForm').hidden = true; conLine(t('done'), 'ln-sys'); refresh(); }
function fail(e) {
  R.state = 'done'; R.errId = R.cur; R.cur = null; $('#inForm').hidden = true;
  conLine(`${t('errAt')}: ${emsg(e)}`, 'ln-err');
  const fb = R.errId && find(R.errId); showErrBox(fb && fb.b, emsg(e));
  renderDiagram(); refresh();
  const el = $(`.blk[data-b="${R.errId}"]`); if (el) scrollToEl(el);
}
function stopRun(silent) {
  if (!R) return;
  clearTimeout(R.timer);
  const was = R.state !== 'done';
  if (was && !silent) conLine(t('stopped'), 'ln-sys');
  R.state = 'done'; R.cur = null; $('#inForm').hidden = true;
  if (R.errId) { R.errId = null; }
  markCur(); setRunUI();
  if (!silent) renderDiagram();
}
$('#bRun').onclick = runClick;
$('#bStep').onclick = stepClick;
$('#bStop').onclick = () => stopRun(false);

/* ================= dialogs ================= */
const dlg = $('#dlg');
function openDlg(html) {
  hideMenu(); hideCtx(); closePop();
  dlg.innerHTML = `<div class="dlg">${html}</div>`;
  if (!dlg.open) { dlg.showModal(); document.documentElement.classList.add('locked'); }
}
dlg.addEventListener('close', () => document.documentElement.classList.remove('locked'));
dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
function fileBase() { return (prog.name || t('untitled')).trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 60) || 'diagramma'; }
let dlNs;
const dlReady = (window.claude && typeof window.claude.use === 'function')
  ? window.claude.use('downloads').then(n => (dlNs = n), () => (dlNs = null)) : Promise.resolve(dlNs = null);
async function triggerDownload(href, name, data) {
  await dlReady;
  if (dlNs && data) {
    try { await dlNs.save({ filename: name.replace(/\.flusso$/i, '.json'), data }); } catch (e) {}
    return;
  }
  const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

function cmdSave() {
  const json = JSON.stringify({ format: 'flussolab', version: 1, name: prog.name, main: prog.main }, replacer, 2);
  openDlg(`<h2>${esc(t('saveTitle'))}</h2>
    <div class="field" style="margin:0"><label for="saveName">${esc(t('fileName'))}</label><input type="text" id="saveName" value="${esc(fileBase())}"></div>
    <p>${esc(t('saveNote'))}</p>
    <div class="foot"><button class="btn" data-close>${esc(t('cancel'))}</button><button class="btn primary" id="saveDl">${esc(t('download'))}</button></div>`);
  $('#saveName').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#saveDl').click(); } });
  $('#saveDl').onclick = () => {
    const name = ($('#saveName').value.trim() || fileBase()).replace(/\.flusso$/i, '') + '.flusso';
    const blob = new Blob([json], { type: 'application/json' }), url = URL.createObjectURL(blob);
    triggerDownload(url, name, blob); setTimeout(() => URL.revokeObjectURL(url), 30000);
    dlg.close();
    if (tabs[cur]) { tabs[cur].dirty = false; renderTabs(); persist(); }
  };
};

function cmdOpen() {
  openDlg(`<h2>${esc(t('openTitle'))}</h2>
    <div class="drop" id="drop"><input type="file" id="fileIn" accept=".flusso" hidden>
      <button class="btn primary" id="pick">${esc(t('pickFile'))}</button><span>${esc(t('dropHere'))}</span></div>
    <div><b style="display:block;margin-bottom:6px">${esc(t('examples'))}</b><div class="exlist">${EX.map((x, i) => `<button data-ex="${i}">${esc(x[lang][0])}<small>${esc(x[lang][1])}</small></button>`).join('')}</div></div>
    <div class="foot"><button class="btn" data-close>${esc(t('close'))}</button></div>`);
  const fin = $('#fileIn'), drop = $('#drop');
  $('#pick').onclick = () => fin.click();
  const readFile = file => { if (!file) return; const r = new FileReader(); r.onload = () => tryLoad(String(r.result)); r.readAsText(file); };
  fin.onchange = () => readFile(fin.files[0]);
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); readFile(e.dataTransfer.files[0]); };
  $$('[data-ex]', dlg).forEach(b => b.onclick = () => {
    const x = EX[+b.dataset.ex];
    dlg.close(); if (openDoc({ name: x[lang][0], main: JSON.parse(JSON.stringify(x.main)) })) toast(t('loadedOk'));
  });
};
function tryLoad(text) {
  let o; try { o = JSON.parse(text); } catch (e) { toast(t('badFile')); return; }
  try { if (dlg.open) dlg.close(); if (openDoc(o)) toast(t('loadedOk')); }
  catch (e) { toast(t('badFile')); }
}

function cmdNew() { if (isBlank() && !tabs[cur].dirty) return; addTab({ name: '', main: [] }, false); }

// Renders a diagram (the current one or any other tab's) to a PNG blob.
function diagramPng(doc, author) {
  const saved = prog, savedSel = sel;
  let W, H, inner;
  try {
    if (doc) { prog = { name: doc.name || '', main: JSON.parse(JSON.stringify(doc.main)) }; assignIds(prog.main); sel = null; }
    ({ W, H, inner } = buildSVG(PRINT, false));
  } finally { if (doc) { prog = saved; sel = savedSel; } }
  const name = doc ? doc.name : prog.name;
  const head = [name, author].filter(Boolean).join('  ·  ');
  const top = head ? 30 : 0;
  const W0 = W; W = Math.max(W, head ? head.length * 7.4 + 40 : 0); H += top;
  const title = head ? `<text x="16" y="22" style="fill:#56657a;font-family:${SVGFONT};font-size:12px">${esc(head)}</text>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#ffffff"/>${title}<g transform="translate(${(W - W0) / 2} ${top})">${inner}</g></svg>`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sc = 2, c = document.createElement('canvas'); c.width = Math.ceil(W * sc); c.height = Math.ceil(H * sc);
      const x = c.getContext('2d'); x.scale(sc, sc); x.drawImage(img, 0, 0);
      c.toBlob(bl => bl ? resolve({ blob: bl, W }) : reject(new Error('png')), 'image/png');
    };
    img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function cmdPng() {
  diagramPng(null, '').then(({ blob: bl, W }) => {
    const url = URL.createObjectURL(bl), name = fileBase() + '.png';
    openDlg(`<h2>${esc(t('pngTitle'))}</h2><div class="pngprev"><img src="${url}" width="${W}" alt="${esc(prog.name || t('untitled'))}"></div>
      <p>${esc(t('pngNote'))}</p>
      <div class="foot"><button class="btn" data-close>${esc(t('close'))}</button><button class="btn primary" id="pngDl">${esc(t('pngDl'))}</button></div>`);
    $('#pngDl').onclick = () => triggerDownload(url, name, bl);
  });
}

/* ---------- ZIP (stored, no compression: PNGs are already compressed) ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) { // files: [{ name, data: Uint8Array }]
  const enc = new TextEncoder(), parts = [], central = [];
  const d = new Date(), dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), nm, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true); ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true);
    ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + sz;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
const safeName = s => String(s || '').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 60);

function cmdExportZip() {
  tabSnapshot();
  const docs = tabs.map((T, i) => ({ i, doc: JSON.parse(T.data) }));
  const student = store.get('student') || '';
  openDlg(`<h2>${esc(t('zipTitle'))}</h2>
    <p>${esc(t('zipNote'))}</p>
    <div class="field" style="margin:0"><label for="zipWho">${esc(t('zipWho'))}</label><input type="text" id="zipWho" value="${esc(student)}" placeholder="${esc(t('zipWhoPh'))}" autocomplete="off"></div>
    <div><b style="display:block;margin-bottom:6px">${esc(t('zipWhich'))}</b>
      <div class="ziplist">${docs.map(({ i, doc }) => `<label class="check"><input type="checkbox" data-zt="${i}" ${doc.main.length ? 'checked' : ''}> <span>${esc(doc.name || t('untitled'))}${doc.main.length ? '' : ` <small style="color:var(--muted)">(${esc(t('zipEmpty'))})</small>`}</span></label>`).join('')}</div></div>
    <div class="grp"><label class="check" style="margin:0"><input type="checkbox" id="zipF" checked> ${esc(t('zipFlusso'))}</label><label class="check" style="margin:0 0 0 14px"><input type="checkbox" id="zipP" checked> ${esc(t('zipPng'))}</label></div>
    <div class="foot"><button class="btn" data-close>${esc(t('cancel'))}</button><button class="btn primary" id="zipGo">${esc(t('zipGo'))}</button></div>`);
  $('#zipGo').onclick = async () => {
    const who = $('#zipWho').value.trim(); store.set('student', who);
    const pick = $$('[data-zt]', dlg).filter(c => c.checked).map(c => +c.dataset.zt);
    const wantF = $('#zipF').checked, wantP = $('#zipP').checked;
    if (!pick.length || (!wantF && !wantP)) { toast(t('zipNone')); return; }
    const btn = $('#zipGo'); btn.disabled = true; btn.textContent = t('zipWorking');
    try {
      const enc = new TextEncoder(), files = [], used = new Set();
      for (const [n, i] of pick.entries()) {
        const doc = docs.find(d => d.i === i).doc;
        let base = String(n + 1).padStart(2, '0') + '_' + (safeName(doc.name) || t('untitled').replace(/\s+/g, '_'));
        while (used.has(base)) base += '_';
        used.add(base);
        if (wantF) {
          const json = JSON.stringify({ format: 'flussolab', version: 1, name: doc.name || '', author: who, main: doc.main }, replacer, 2);
          files.push({ name: base + '.flusso', data: enc.encode(json) });
        }
        if (wantP) {
          const { blob } = await diagramPng(doc, who);
          files.push({ name: base + '.png', data: new Uint8Array(await blob.arrayBuffer()) });
        }
      }
      const zip = makeZip(files), url = URL.createObjectURL(zip);
      const zname = (safeName(who) ? safeName(who) + '_' : '') + 'FlussoLab.zip';
      await triggerDownload(url, zname, zip); setTimeout(() => URL.revokeObjectURL(url), 30000);
      if (wantF) { pick.forEach(i => { tabs[i].dirty = false; }); renderTabs(); persist(); }
      dlg.close(); toast(t('zipDone', files.length));
    } catch (e) { console.error(e); btn.disabled = false; btn.textContent = t('zipGo'); toast(t('zipFail')); }
  };
}

const GUIDE = {
  it: `<h3>Come si usa</h3><ul>
    <li>Tocca un <b>+</b> su una linea per inserire un blocco in quel punto. <b>OUT</b> scrive e resta sulla riga, <b>OUTLN</b> scrive e va a capo.</li>
    <li><b>Spiegazione</b> mostra accanto a ogni blocco cosa fa. In <b>Opzioni</b> trovi i simboli ≥ ≤ ≠ e il tema chiaro o scuro.</li>
    <li>Tocca un blocco per modificarlo nel pannello <b>Blocco</b>. I blocchi con un errore hanno il bordo rosso tratteggiato.</li>
    <li><b>Esegui</b> avvia il programma. <b>Passo</b> esegue un blocco alla volta e mostra le variabili.</li>
    <li><b>Salva</b> crea un file <code>.flusso</code> da consegnare. <b>File → Esporta consegna (ZIP)</b> mette in un unico file tutti i diagrammi aperti, come <code>.flusso</code> e come immagine. <b>Apri</b> lo ricarica. <b>Immagine</b> esporta il diagramma in PNG.</li>
    <li>Il lavoro resta salvato in questo browser anche se chiudi la pagina.</li></ul>
    <h3>Espressioni</h3><table>
    <tr><td>+ − *</td><td>operazioni; con un testo, + unisce: <code>"Ciao " + nome</code></td></tr>
    <tr><td>/</td><td>divisione, come in C: tra due <code>int</code> il risultato è un <code>int</code> (<code>7 / 2</code> → 3); se uno dei due è <code>float</code> il risultato è <code>float</code> (<code>7.0 / 2</code> → 3.5)</td></tr>
    <tr><td>(float) (int)</td><td>conversione di tipo: <code>(float) s / n</code> → divisione con i decimali; <code>(int) 3.9</code> → 3</td></tr>
    <tr><td>mod  %</td><td>resto della divisione: <code>7 mod 3</code> e <code>7 % 3</code> sono uguali</td></tr>
    <tr><td>^</td><td>potenza</td></tr>
    <tr><td>== !=</td><td>uguale, diverso. Il singolo <code>=</code> serve solo per assegnare</td></tr>
    <tr><td>&lt; &lt;= &gt; &gt;=</td><td>confronti</td></tr>
    <tr><td>AND OR NOT</td><td>anche && || !</td></tr>
    <tr><td>true, false</td><td>valori logici (vanno bene anche vero, falso)</td></tr>
    <tr><td>v[i]</td><td>elemento di un vettore; si crea assegnando <code>v[0] = 5</code> o leggendo <code>v[i]</code></td></tr>
    <tr><td>i++  i--</td><td>nel blocco assegnazione: aumenta o diminuisce di 1 una variabile intera</td></tr></table>
    <h3>Tipi delle variabili</h3><p>Di base il tipo è automatico: lo decide il valore. Puoi dichiararlo dove la variabile nasce, ad esempio <code>IN int n</code>, <code>float media = (float) s / n</code> o <code>FOR int i = 1 TO 10</code>, oppure con il blocco <b>VAR</b>. I tipi sono <code>int</code> (numeri interi), <code>float</code> (numeri con la virgola, va bene anche <code>double</code>), <code>string</code> (testo) e <code>bool</code> (vero o falso). Per un vettore scrivi <code>v[]</code>. Le parole dei tipi non si possono usare come nomi di variabile. FlussoLab segnala se metti un valore del tipo sbagliato; con IN, una variabile <code>string</code> tiene il testo così com'è, anche se sono cifre.</p>
    <h3>Funzioni</h3><p><code>sqrt abs int float round floor ceil pow min max sin cos tan random() randint(a,b) len str num</code></p>
    <h3>Scorciatoie</h3><p><kbd>Canc</kbd> elimina il blocco selezionato · <kbd>Ctrl</kbd>+<kbd>Z</kbd> annulla · <kbd>Ctrl</kbd>+<kbd>C</kbd>/<kbd>V</kbd> copia e incolla dopo il blocco selezionato</p>
    <h3>Il progetto</h3><p>FlussoLab è gratuito e il suo codice è aperto a tutti, ma non può essere usato per guadagnarci. Funziona interamente nel browser: niente da installare, anche su Chromebook e tablet.</p>`,
  en: `<h3>How to use it</h3><ul>
    <li>Tap a <b>+</b> on a line to insert a block there. <b>OUT</b> writes and stays on the line, <b>OUTLN</b> writes and starts a new line.</li>
    <li><b>Explain</b> shows next to each block what it does. <b>Options</b> has the ≥ ≤ ≠ symbols and light or dark theme.</li>
    <li>Tap a block to edit it in the <b>Block</b> panel. Blocks with an error have a dashed red border.</li>
    <li><b>Run</b> starts the program. <b>Step</b> runs one block at a time and shows the variables.</li>
    <li><b>Save</b> creates a <code>.flusso</code> file to hand in. <b>File → Export submission (ZIP)</b> puts all open diagrams in one file, as <code>.flusso</code> and as images. <b>Open</b> loads it back. <b>Image</b> exports the diagram as PNG.</li>
    <li>Your work stays saved in this browser even if you close the page.</li></ul>
    <h3>Expressions</h3><table>
    <tr><td>+ − *</td><td>arithmetic; with text, + joins: <code>"Hi " + name</code></td></tr>
    <tr><td>/</td><td>division, as in C: between two <code>int</code> the result is an <code>int</code> (<code>7 / 2</code> → 3); if one is <code>float</code> the result is <code>float</code> (<code>7.0 / 2</code> → 3.5)</td></tr>
    <tr><td>(float) (int)</td><td>type cast: <code>(float) s / n</code> → division with decimals; <code>(int) 3.9</code> → 3</td></tr>
    <tr><td>mod  %</td><td>remainder: <code>7 mod 3</code> and <code>7 % 3</code> are the same</td></tr>
    <tr><td>^</td><td>power</td></tr>
    <tr><td>== !=</td><td>equal, not equal. A single <code>=</code> is only for assignment</td></tr>
    <tr><td>&lt; &lt;= &gt; &gt;=</td><td>comparisons</td></tr>
    <tr><td>AND OR NOT</td><td>also && || !</td></tr>
    <tr><td>true, false</td><td>boolean values</td></tr>
    <tr><td>v[i]</td><td>array element; created by assigning <code>v[0] = 5</code> or reading <code>v[i]</code></td></tr>
    <tr><td>i++  i--</td><td>in the assignment block: adds or subtracts 1 from an integer variable</td></tr></table>
    <h3>Variable types</h3><p>By default the type is automatic: the value decides it. You can declare it where the variable is born, for example <code>IN int n</code>, <code>float avg = (float) s / n</code> or <code>FOR int i = 1 TO 10</code>, or with the <b>VAR</b> block. The types are <code>int</code> (whole numbers), <code>float</code> (numbers with decimals, <code>double</code> works too), <code>string</code> (text) and <code>bool</code> (true or false). For an array write <code>v[]</code>. Type words cannot be used as variable names. FlussoLab reports a value of the wrong type; with IN, a <code>string</code> variable keeps the text as typed, even if it is digits.</p>
    <h3>Functions</h3><p><code>sqrt abs int float round floor ceil pow min max sin cos tan random() randint(a,b) len str num</code></p>
    <h3>Shortcuts</h3><p><kbd>Del</kbd> deletes the selected block · <kbd>Ctrl</kbd>+<kbd>Z</kbd> undo · <kbd>Ctrl</kbd>+<kbd>C</kbd>/<kbd>V</kbd> copy and paste after the selected block</p>
    <h3>The project</h3><p>FlussoLab is free and its code is open to everyone, but it cannot be used to make money. It runs entirely in the browser: nothing to install, Chromebooks and tablets included.</p>`,
};
function cmdAbout() {
  const a = CONFIG.author ? (CONFIG.github ? `<a href="${esc(CONFIG.github)}" target="_blank" rel="noopener">${esc(CONFIG.author)}</a>` : esc(CONFIG.author)) : '—';
  openDlg(`<div class="about">
      <svg width="44" height="44" viewBox="0 0 26 26" aria-hidden="true"><rect x="7" y="1.5" width="12" height="6" rx="3" style="fill:var(--tm-f);stroke:var(--tm-s)" stroke-width="1.3"/><path d="M13 7.5v3" style="stroke:var(--wire)" stroke-width="1.3"/><path d="M13 10.5l6 4.5-6 4.5-6-4.5z" style="fill:var(--if-f);stroke:var(--if-s)" stroke-width="1.3"/><path d="M13 19.5v3.5" style="stroke:var(--wire)" stroke-width="1.3"/></svg>
      <div><h2>FlussoLab</h2><p>${esc(t('version'))} ${esc(CONFIG.version)}</p></div></div>
    <p>${esc(t('aboutText'))}</p>
    <dl class="kv"><dt>${esc(t('devBy'))}</dt><dd>${a}</dd><dt>${esc(t('license'))}</dt><dd><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a> · ${esc(t('freeOpen'))}</dd>
    ${CONFIG.repo ? `<dt>${esc(t('source'))}</dt><dd><a href="${esc(CONFIG.repo)}" target="_blank" rel="noopener">${esc(CONFIG.repo.replace(/^https?:\/\//, ''))}</a></dd>` : ''}</dl>
    ${CONFIG.donate ? `<div class="support"><p>${esc(t('supportText'))}</p><a class="btn primary" href="${esc(CONFIG.donate)}" target="_blank" rel="noopener">♥ ${esc(t('support'))}</a></div>` : ''}
    <div class="foot"><button class="btn" data-close>${esc(t('close'))}</button></div>`);
}
function cmdHelp() { openDlg(`<h2>${esc(t('helpT'))}</h2><div class="guide">${GUIDE[lang]}</div><div class="foot"><button class="btn primary" data-close>${esc(t('close'))}</button></div>`); }
function loadExample(i) { const x = EX[i]; if (openDoc({ name: x[lang][0], main: JSON.parse(JSON.stringify(x.main)) })) toast(t('loadedOk')); }
function pasteBlock() {
  if (!clip) return; stopRun(); snap();
  const f = sel && find(sel); const nb = JSON.parse(clip); assignIds([nb]);
  if (f) f.arr.splice(f.idx + 1, 0, nb); else prog.main.push(nb);
  sel = nb.id; afterChange(true);
}

/* ================= menu bar ================= */
const MENUS = {
  file: () => [
    ['new', t('new'), ''], ['open', t('open') + '…', 'Ctrl+O'], ['save', t('save') + '…', 'Ctrl+S'], ['png', t('png') + '…', ''], ['zip', t('zipM'), ''], '-',
    ['install', t('installM'), ''], '-',
    { head: t('examples') }, ...EX.map((x, i) => ['ex:' + i, x[lang][0], '']),
  ],
  edit: () => {
    const f = sel && find(sel);
    return [['undo', t('undoM'), 'Ctrl+Z', !hist.length], ['redo', t('redoM'), 'Ctrl+Y', !fut.length], '-',
      ['copy', t('copy'), 'Ctrl+C', !f], ['paste', t('pasteHere'), 'Ctrl+V', !clip], ['dup', t('dup'), '', !f], ['del', t('del'), 'Canc', !f]];
  },
  view: () => [
    ['explain', t('optExplain'), '', false, opts.explain], ['sym', t('optSymShort'), '', false, opts.sym], ['trace', t('trace'), '', false, opts.trace], '-',
    ['link', t('codeLink'), '', false, opts.link], ['py', t('showPy'), '', false, opts.py], '-',
    { head: t('optTheme') }, ['theme:auto', t('thAuto'), '', false, opts.theme === 'auto', true], ['theme:light', t('thLight'), '', false, opts.theme === 'light', true], ['theme:dark', t('thDark'), '', false, opts.theme === 'dark', true], '-',
    ['zin', t('zoomIn'), '+'], ['zout', t('zoomOut'), '−'], ['z100', t('zoom100'), ''],
  ],
  help: () => [
    ['help', t('helpT'), 'F1'], ['about', t('aboutM'), ''], '-', { head: t('language') },
    ['lang:it', 'Italiano', '', false, lang === 'it', true], ['lang:en', 'English', '', false, lang === 'en', true],
  ],
};
let openMenu = null;
function renderMenu(name) {
  const el = $('#m-' + name);
  el.innerHTML = MENUS[name]().map(it => {
    if (it === '-') return '<div class="msep" role="separator"></div>';
    if (it.head) return `<div class="mhead">${esc(it.head)}</div>`;
    const [cmd, lab, key, dis, check, radio] = it;
    const mark = check === undefined ? '' : (check ? (radio ? '●' : '✓') : '');
    return `<button class="mi" role="menuitem" data-cmd="${cmd}" ${dis ? 'disabled' : ''}><span class="mk">${mark}</span><span>${esc(lab)}</span><kbd class="ks">${esc(key)}</kbd></button>`;
  }).join('');
}
function showMenu(name) {
  if (openMenu === name) return;
  hideMenu();
  openMenu = name; renderMenu(name);
  const m = $('#m-' + name);
  m.style.top = ''; m.style.left = ''; m.style.right = '';
  m.hidden = false;
  $(`.mbtn[data-menu="${name}"]`).setAttribute('aria-expanded', 'true');
  if (innerWidth <= 640) {
    m.style.top = ($('.bar').getBoundingClientRect().bottom + 4) + 'px';
  } else {
    const r = m.getBoundingClientRect(), pr = m.parentElement.getBoundingClientRect();
    if (r.right > innerWidth - 8) { m.style.left = (innerWidth - 8 - r.width - pr.left) + 'px'; m.style.right = 'auto'; }
  }
}
function hideMenu() {
  if (!openMenu) return;
  $('#m-' + openMenu).hidden = true;
  $(`.mbtn[data-menu="${openMenu}"]`).setAttribute('aria-expanded', 'false');
  openMenu = null;
}
$$('.mbtn').forEach(b => {
  b.addEventListener('click', e => { e.stopPropagation(); openMenu === b.dataset.menu ? hideMenu() : showMenu(b.dataset.menu); });
  b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && openMenu && openMenu !== b.dataset.menu) showMenu(b.dataset.menu); });
  b.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); showMenu(b.dataset.menu); const f = $(`#m-${b.dataset.menu} .mi:not([disabled])`); if (f) f.focus(); } });
});
$$('.menubar .menu').forEach(m => {
  m.addEventListener('click', e => { const it = e.target.closest('.mi'); if (!it || it.disabled) return; hideMenu(); runCmd(it.dataset.cmd); });
  m.addEventListener('keydown', e => {
    const items = $$('.mi:not([disabled])', m), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
  });
});
let swallowClick = false;
document.addEventListener('pointerdown', e => {
  swallowClick = false;
  if (openMenu && !e.target.closest('.mwrap')) { hideMenu(); swallowClick = true; }
}, true);
document.addEventListener('click', e => { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
addEventListener('scroll', () => { if (openMenu) hideMenu(); }, true);
addEventListener('resize', () => { hideMenu(); hideCtx(); });
function runCmd(c) {
  const f = sel && find(sel);
  if (c === 'new') return cmdNew();
  if (c === 'open') return cmdOpen();
  if (c === 'save') return cmdSave();
  if (c === 'png') return cmdPng();
  if (c === 'zip') return cmdExportZip();
  if (c === 'install') return cmdInstall();
  if (c.startsWith('ex:')) return loadExample(+c.slice(3));
  if (c === 'undo') return undo();
  if (c === 'redo') return redo();
  if (c === 'copy' && f) { clip = JSON.stringify(f.b, replacer); toast(t('copiedBlk')); return; }
  if (c === 'paste') return pasteBlock();
  if (c === 'dup' && f) { stopRun(); snap(); const cp = JSON.parse(JSON.stringify(f.b, replacer)); assignIds([cp]); f.arr.splice(f.idx + 1, 0, cp); sel = cp.id; return afterChange(true); }
  if (c === 'del' && f) { stopRun(); snap(); return deleteSel(f); }
  if (c === 'explain') { opts.explain = !opts.explain; saveOpts(); tip.hidden = true; return; }
  if (c === 'sym') { opts.sym = !opts.sym; saveOpts(); renderDiagram(); return; }
  if (c === 'trace') { opts.trace = !opts.trace; saveOpts(); syncTrace(); return; }
  if (c === 'link') { opts.link = !opts.link; saveOpts(); hoverLink(null, false); return; }
  if (c === 'py') { opts.py = !opts.py; saveOpts(); renderCode(); return; }
  if (c === 'cut' && f) { clip = JSON.stringify(f.b, replacer); stopRun(); snap(); return deleteSel(f); }
  if (c === 'up' || c === 'down') { const btn = document.createElement('button'); btn.dataset.act = c; return blockAct(c); }
  if ((c === 'inv' || c === 'swap') && f) return blockAct(c);
  if (c.startsWith('ins:')) { const sl = ctxSlot; if (sl) { popSlot = sl; insertType(c.slice(4)); } return; }
  if (c === 'pasteSlot' && ctxSlot && clip) { popSlot = ctxSlot; insertType('__paste'); return; }
  if (c.startsWith('theme:')) { opts.theme = c.slice(6); saveOpts(); applyTheme(); return; }
  if (c === 'zin') return setZoom(zoom + 0.1);
  if (c === 'zout') return setZoom(zoom - 0.1);
  if (c === 'z100') return setZoom(1);
  if (c === 'help') return cmdHelp();
  if (c === 'about') return cmdAbout();
  if (c.startsWith('lang:')) { lang = c.slice(5); store.set('lang', lang); applyLang(); }
}

/* ================= language ================= */
function applyLang() {
  document.documentElement.lang = lang;
  FL.setBoolNames(t('FALSE'), t('TRUE'));
  $$('[data-i18n]').forEach(el => { const k = el.dataset.i18n; if (k) el.textContent = t(k); });
  $$('[data-i18n-ph]').forEach(el => el.placeholder = t(el.dataset.i18nPh));
  $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); el.setAttribute('aria-label', t(el.dataset.i18nTitle)); });
  setRunUI(); syncTrace(); renderDiagram(); renderPanel(); renderCode();
  if (con.dataset.idle) clearConsole(); else renderVars();
}

/* ================= misc ================= */
$('#pname').addEventListener('focus', () => { editSnapDone = false; });
$('#pname').addEventListener('input', e => { if (!editSnapDone) { snap(); editSnapDone = true; } prog.name = e.target.value; renderTabs(); persist(); });
let toastT = 0;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 1800); }
let persistT = 0;
function persist() { clearTimeout(persistT); persistT = setTimeout(persistNow, 300); }
function persistNow() {
  tabSnapshot();
  store.set('tabs', JSON.stringify({ cur, tabs: tabs.map(T => ({ data: T.data, dirty: T.dirty })) }));
}
addEventListener('pagehide', persistNow);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePop(); hideMenu(); hideCtx(); return; }
  if ((e.ctrlKey || e.metaKey) && !dlg.open && ['s', 'o'].includes(e.key.toLowerCase())) { e.preventDefault(); e.key.toLowerCase() === 's' ? cmdSave() : cmdOpen(); return; }
  if (e.key === 'F1') { e.preventDefault(); cmdHelp(); return; }
  const typing = e.target.closest('input,textarea,[contenteditable]') || dlg.open;
  const mod = e.ctrlKey || e.metaKey;
  if (typing) return;
  if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
  const f = sel && find(sel);
  if ((e.key === 'Delete' || e.key === 'Backspace') && f) { e.preventDefault(); stopRun(); snap(); deleteSel(f); return; }
  if (mod && e.key.toLowerCase() === 'c' && f) { clip = JSON.stringify(f.b, replacer); toast(t('copiedBlk')); return; }
  if (mod && e.key.toLowerCase() === 'v' && clip) { e.preventDefault(); pasteBlock(); }
});

/* ================= web app: offline, install, open files ================= */
const net = $('#netPill');
function syncNet() { if (net) net.hidden = navigator.onLine; }
addEventListener('online', syncNet); addEventListener('offline', syncNet);
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const hasManifest = !!document.querySelector('link[rel="manifest"]');
function installDismissed() { const v = +store.get('installNo') || 0; return Date.now() - v < 14 * 864e5; }
function showInstallBar() {
  if (!hasManifest || isStandalone() || installDismissed()) return;
  if (!installEvt && !isIOS) return;
  $('#installMsg').textContent = t('installAsk');
  $('#installYes').textContent = installEvt ? t('installBtn') : t('installHowBtn');
  $('#installBar').hidden = false;
}
function hideInstallBar() { $('#installBar').hidden = true; }
$('#installYes').onclick = () => { hideInstallBar(); cmdInstall(); };
$('#installNo').onclick = () => { store.set('installNo', String(Date.now())); hideInstallBar(); };
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; showInstallBar(); });
addEventListener('appinstalled', () => { installEvt = null; hideInstallBar(); toast(t('installed')); });
if (isIOS) setTimeout(showInstallBar, 1500);
async function cmdInstall() {
  if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; return; }
  openDlg(`<h2>${esc(t('installT'))}</h2><div class="guide">${t('installHow')}</div><div class="foot"><button class="btn primary" data-close>${esc(t('close'))}</button></div>`);
}
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async params => {
    const h = params.files && params.files[0]; if (!h) return;
    try { const f = await h.getFile(); tryLoad(await f.text()); } catch (e) { toast(t('badFile')); }
  });
}
window.flussoUpdate = (apply) => {
  const el = $('#updBar');
  el.querySelector('span').textContent = t('updAvail');
  const btn = el.querySelector('button'); btn.textContent = t('updNow');
  btn.onclick = () => { btn.disabled = true; apply(); };
  el.hidden = false;
};

/* ================= boot ================= */
(function boot() {
  try {
    const st = JSON.parse(store.get('tabs') || 'null');
    if (st && Array.isArray(st.tabs)) st.tabs.slice(0, MAXTABS).forEach(x => {
      const o = JSON.parse(x.data);
      if (o && Array.isArray(o.main) && o.main.every(validBlock)) tabs.push({ id: ++tabSeq, data: JSON.stringify(o), hist: [], fut: [], dirty: !!x.dirty, zoom: 1 });
    });
    if (tabs.length) cur = Math.min(Math.max(0, st.cur | 0), tabs.length - 1);
  } catch (e) { tabs = []; }
  if (!tabs.length) {
    let o = { name: '', main: [] };
    try { const old = JSON.parse(store.get('prog') || 'null'); if (old && Array.isArray(old.main) && old.main.every(validBlock)) o = old; } catch (e) {}
    tabs.push({ id: ++tabSeq, data: JSON.stringify(o), hist: [], fut: [], dirty: false, zoom: 1 }); cur = 0;
  }
  { const T = tabs[cur], o = JSON.parse(T.data); loadObj(o, false); }
  renderTabs();
  clearConsole(); applyLang(); syncNet();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => renderDiagram());
})();
})();
