(() => {
'use strict';
// Teacher's pages: create verifiche (text, locked IN/OUT blocks, tests), share the link and the codes, see the results.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IT = !/^en/i.test(navigator.language || '') || /^it/i.test(navigator.language || '');
const T = IT ? {
  setupT: 'Crea l\'account del docente', setupP: 'È il primo avvio: scegli email e password per entrare. Ci sarà solo questo account.',
  loginT: 'Accesso del docente', email: 'Email', password: 'Password', password2: 'Ripeti la password', enter: 'Entra', create: 'Crea account',
  weak: 'La password deve avere almeno 8 caratteri', mismatch: 'Le due password non coincidono', badLogin: 'Email o password sbagliate', slow: 'Troppi tentativi: riprova tra qualche minuto',
  logout: 'Esci', changePw: 'Cambia password', oldPw: 'Password attuale', newPw: 'Nuova password', save: 'Salva', cancel: 'Annulla', close: 'Chiudi', saved: 'Salvato',
  list: 'Verifiche', newV: 'Nuova verifica', none: 'Ancora nessuna verifica. Creane una: gli studenti la apriranno dal solito FlussoLab con un link e il loro codice.',
  title: 'Titolo', opens: 'Apertura', closes: 'Chiusura', openNow: 'vuoto = subito', noClose: 'vuoto = finché non la chiudi',
  st: { open: 'Aperta', soon: 'Non ancora aperta', closed: 'Chiusa' }, submitted: 'Consegne', codes: 'Codici', variants: 'Varianti',
  ncodes: 'Quanti codici studente', addCodes: 'Aggiungi codici', variant: 'Variante', addVariant: '+ Aggiungi variante', delVariant: 'Togli variante',
  text: 'Consegna', textPh: 'Cosa deve fare il programma', blocks: 'Blocchi fissi', blocksHint: 'Gli studenti li trovano già nel diagramma: possono spostarli e aggiungere blocchi in mezzo, ma non cancellarli. Gli IN ricevono gli input delle prove; si controlla solo quello che scrivono gli OUT.',
  addBlock: '+ Blocco fisso', varName: 'variabile', tests: 'Prove', testsHint: 'Input: un valore per riga, nell\'ordine in cui il programma li legge. Output atteso: un valore per riga, uno per ogni volta che un OUT fisso scrive.',
  addTest: '+ Prova', input: 'Input', output: 'Output atteso', hidden: 'Nascosta', del: 'Elimina', back: '← Verifiche',
  edit: 'Modifica', closeNow: 'Chiudi ora', closeQ: 'Chiudere subito la verifica? Gli studenti non potranno più consegnare.', delQ: 'Eliminare la verifica, i codici e tutte le consegne? Non si può annullare.',
  link: 'Link per la classe', copy: 'Copia', copied: 'Copiato', printCodes: 'Codici da stampare', zip: 'Scarica tutto (ZIP)',
  results: 'Consegne', noSubs: 'Nessuna consegna per ora. La pagina si aggiorna da sola.', code: 'Codice', when: 'Ultima consegna', score: 'Prove', count: 'N.', device: 'Dispositivo', flags: 'Segnalazioni',
  flagT: { struttura: 'Blocchi fissi cambiati', alterato: 'File modificato fuori da FlussoLab', altriDispositivi: 'Modificato anche su altri dispositivi', stessoDispositivo: 'Stesso dispositivo di altri codici', stessoIp: 'Stessa rete di altri codici' },
  flagD: { struttura: 'Lo studente ha tolto o cambiato i blocchi fissi: le prove risultano tutte non superate.', alterato: 'Il diagramma arriva da un file modificato a mano.', altriDispositivi: 'Il diagramma è stato modificato anche su un dispositivo diverso da quello che ha consegnato (es. casa e scuola, oppure un file passato).', stessoDispositivo: 'Dallo stesso dispositivo sono arrivate consegne con codici diversi.', stessoIp: 'Stesso indirizzo di rete di altri codici: normale se il server è su internet (tutta la scuola esce con lo stesso indirizzo).' },
  detail: 'Consegna', history: 'Consegne di questo codice', openApp: 'Apri in FlussoLab', dlFile: 'Scarica .flusso', ok: 'superata', ko: 'non superata', hiddenT: 'nascosta',
  testN: n => `Prova ${n}`, codesFor: v => `Codici · ${v}`, nameCol: 'Studente', printBtn: 'Stampa', needTitle: 'Scrivi un titolo', needTest: n => `La variante ${n} non ha prove`,
  errs: { struttura: 'blocchi fissi cambiati', loop: 'non termina', moreinput: 'chiede troppi input', crash: 'errore' },
} : {
  setupT: 'Create the teacher account', setupP: 'First start: choose an email and a password to log in. This will be the only account.',
  loginT: 'Teacher login', email: 'Email', password: 'Password', password2: 'Repeat the password', enter: 'Log in', create: 'Create account',
  weak: 'The password needs at least 8 characters', mismatch: 'The two passwords differ', badLogin: 'Wrong email or password', slow: 'Too many attempts: try again in a few minutes',
  logout: 'Log out', changePw: 'Change password', oldPw: 'Current password', newPw: 'New password', save: 'Save', cancel: 'Cancel', close: 'Close', saved: 'Saved',
  list: 'Verifications', newV: 'New verification', none: 'No verification yet. Create one: students open it in the usual FlussoLab with a link and their code.',
  title: 'Title', opens: 'Opens', closes: 'Closes', openNow: 'empty = now', noClose: 'empty = until you close it',
  st: { open: 'Open', soon: 'Not open yet', closed: 'Closed' }, submitted: 'Submissions', codes: 'Codes', variants: 'Variants',
  ncodes: 'How many student codes', addCodes: 'Add codes', variant: 'Variant', addVariant: '+ Add variant', delVariant: 'Remove variant',
  text: 'Task', textPh: 'What the program must do', blocks: 'Locked blocks', blocksHint: 'Students find them in the diagram: they can move them and add blocks in between, not delete them. INs receive the test inputs; only what the OUTs write is checked.',
  addBlock: '+ Locked block', varName: 'variable', tests: 'Tests', testsHint: 'Input: one value per line, in the order the program reads them. Expected output: one value per line, one for each time a locked OUT writes.',
  addTest: '+ Test', input: 'Input', output: 'Expected output', hidden: 'Hidden', del: 'Delete', back: '← Verifications',
  edit: 'Edit', closeNow: 'Close now', closeQ: 'Close the verification now? Students will not be able to hand in any more.', delQ: 'Delete the verification, its codes and all submissions? This cannot be undone.',
  link: 'Link for the class', copy: 'Copy', copied: 'Copied', printCodes: 'Codes to print', zip: 'Download all (ZIP)',
  results: 'Submissions', noSubs: 'No submissions yet. The page updates by itself.', code: 'Code', when: 'Last submission', score: 'Tests', count: 'No.', device: 'Device', flags: 'Warnings',
  flagT: { struttura: 'Locked blocks changed', alterato: 'File edited outside FlussoLab', altriDispositivi: 'Also edited on other devices', stessoDispositivo: 'Same device as other codes', stessoIp: 'Same network as other codes' },
  flagD: { struttura: 'The student removed or changed the locked blocks: all tests count as failed.', alterato: 'The diagram comes from a hand-edited file.', altriDispositivi: 'The diagram was also edited on a device other than the one that handed it in (e.g. home and school, or a file passed on).', stessoDispositivo: 'Submissions with different codes came from the same device.', stessoIp: 'Same network address as other codes: normal if the server is on the internet (the whole school shares one address).' },
  detail: 'Submission', history: 'Submissions of this code', openApp: 'Open in FlussoLab', dlFile: 'Download .flusso', ok: 'passed', ko: 'failed', hiddenT: 'hidden',
  testN: n => `Test ${n}`, codesFor: v => `Codes · ${v}`, nameCol: 'Student', printBtn: 'Print', needTitle: 'Write a title', needTest: n => `Variant ${n} has no tests`,
  errs: { struttura: 'locked blocks changed', loop: 'does not end', moreinput: 'asks for too many inputs', crash: 'error' },
};
document.documentElement.lang = IT ? 'it' : 'en';
let ME = null, timer = 0;

async function api(path, opts = {}) {
  const r = await fetch('/api/admin/' + path, { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json', 'X-FL': '1' }, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: 'same-origin' });
  if (opts.raw) return r;
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !opts.allow401) { ME = null; location.hash = '#/'; render(); throw new Error('login'); }
  return { status: r.status, ...j, _list: Array.isArray(j) ? j : null };
}
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 1800); }
const fmtDate = s => s ? new Date(s).toLocaleString(IT ? 'it-IT' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const toLocal = s => { if (!s) return ''; const d = new Date(s); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const linkFor = id => `${ME.appUrl}#v=${location.host}/${id}`;
async function copy(text) { try { await navigator.clipboard.writeText(text); } catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); } toast(T.copied); }

/* ---------- login ---------- */
function viewAuth(setup) {
  $('#view').innerHTML = `<div class="card narrow"><h1>${esc(setup ? T.setupT : T.loginT)}</h1>${setup ? `<p class="muted">${esc(T.setupP)}</p>` : ''}
    <form id="f"><label class="f">${esc(T.email)}<input type="email" id="em" required autocomplete="username"></label>
    <label class="f">${esc(T.password)}<input type="password" id="pw" required autocomplete="${setup ? 'new-password' : 'current-password'}"></label>
    ${setup ? `<label class="f">${esc(T.password2)}<input type="password" id="pw2" required autocomplete="new-password"></label>` : ''}
    <p class="err" id="err"></p><button class="btn primary" type="submit">${esc(setup ? T.create : T.enter)}</button></form></div>`;
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const em = $('#em').value, pw = $('#pw').value;
    if (setup && pw.length < 8) return $('#err').textContent = T.weak;
    if (setup && pw !== $('#pw2').value) return $('#err').textContent = T.mismatch;
    const r = await api(setup ? 'setup' : 'login', { method: 'POST', body: { email: em, password: pw }, allow401: true });
    if (r.ok) { location.hash = '#/'; boot(); } else $('#err').textContent = r.status === 429 ? T.slow : r.error === 'weak' ? T.weak : T.badLogin;
  };
}

/* ---------- list ---------- */
async function viewList() {
  const r = await api('verifiche'), list = r._list || [];
  $('#view').innerHTML = `<div class="row"><h1>${esc(T.list)}</h1><span class="sp"></span><a class="btn primary" href="#/new">${esc(T.newV)}</a></div>
    ${list.length ? `<div class="card" style="padding:4px 8px;margin-top:14px"><table><thead><tr><th>${esc(T.title)}</th><th></th><th class="hide-s">${esc(T.opens)}</th><th class="hide-s">${esc(T.closes)}</th><th>${esc(T.submitted)}</th></tr></thead><tbody>
      ${list.map(v => `<tr class="click" data-id="${esc(v.id)}"><td><b>${esc(v.title)}</b>${v.variants > 1 ? ` <span class="muted">· ${v.variants} ${esc(T.variants.toLowerCase())}</span>` : ''}</td>
        <td><span class="badge ${v.status}">${esc(T.st[v.status])}</span></td><td class="hide-s">${esc(fmtDate(v.opens))}</td><td class="hide-s">${esc(fmtDate(v.closes))}</td><td>${v.submitted} / ${v.codes}</td></tr>`).join('')}
    </tbody></table></div>` : `<p class="muted card" style="margin-top:14px">${esc(T.none)}</p>`}`;
  $$('tr[data-id]').forEach(tr => tr.onclick = () => location.hash = '#/v/' + tr.dataset.id);
}

/* ---------- create / edit ---------- */
const emptyVariant = n => ({ name: String.fromCharCode(65 + n), text: '', blocks: [{ t: 'input', v: '' }, { t: 'output', v: '' }], tests: [{ in: [], out: '', hidden: false }] });
async function viewEdit(id) {
  let v = { title: '', opens: '', closes: '', variants: [emptyVariant(0)] }, nc = id ? 0 : 30;
  if (id) { const r = await api('verifiche/' + id); if (r.error) return location.hash = '#/'; v = r; }
  const draw = () => {
    $('#view').innerHTML = `<a href="${id ? '#/v/' + id : '#/'}">${esc(T.back)}</a><h1 style="margin-top:8px">${esc(id ? T.edit : T.newV)}</h1>
      <div class="card"><label class="f">${esc(T.title)}<input id="ti" value="${esc(v.title)}" maxlength="120"></label>
      <div class="grid3"><label class="f">${esc(T.opens)} <span class="muted" style="font-weight:400">(${esc(T.openNow)})</span><input type="datetime-local" id="op" value="${toLocal(v.opens)}"></label>
      <label class="f">${esc(T.closes)} <span class="muted" style="font-weight:400">(${esc(T.noClose)})</span><input type="datetime-local" id="cl" value="${toLocal(v.closes)}"></label>
      <label class="f">${esc(id ? T.addCodes : T.ncodes)}<input type="number" id="nc" min="${id ? 0 : 1}" max="500" value="${nc}"></label></div></div>
      ${v.variants.map((x, i) => `<section class="variant" data-v="${i}">
        <div class="row"><h2 style="margin:0">${esc(T.variant)}</h2><input class="in" style="width:120px" data-k="name" value="${esc(x.name)}" maxlength="60"><span class="sp"></span>
          ${v.variants.length > 1 ? `<button class="btn danger" data-delv="${i}">${esc(T.delVariant)}</button>` : ''}</div>
        <label class="f" style="margin-top:10px">${esc(T.text)}<textarea data-k="text" rows="3" placeholder="${esc(T.textPh)}">${esc(x.text)}</textarea></label>
        <h2>${esc(T.blocks)}</h2><p class="hint">${esc(T.blocksHint)}</p>
        <div class="blocks">${x.blocks.map((b, j) => `<div class="brow" data-b="${j}"><select class="in" data-k="t"><option value="input"${b.t === 'input' ? ' selected' : ''}>IN</option><option value="output"${b.t === 'output' ? ' selected' : ''}>OUT</option></select>
          <input class="in mono" data-k="v" value="${esc(b.v)}" placeholder="${esc(T.varName)}" spellcheck="false"><button class="btn danger" data-delb="${j}" aria-label="${esc(T.del)}">×</button></div>`).join('')}</div>
        <button class="btn" data-addb="${i}">${esc(T.addBlock)}</button>
        <h2 style="margin-top:16px">${esc(T.tests)}</h2><p class="hint">${esc(T.testsHint)}</p>
        <div class="tests">${x.tests.map((t, j) => `<div class="trow" data-t="${j}"><label><span class="lbl">${esc(T.input)}</span><textarea data-k="in" spellcheck="false">${esc(t.in.join('\n'))}</textarea></label>
          <label><span class="lbl">${esc(T.output)}</span><textarea data-k="out" spellcheck="false">${esc(t.out)}</textarea></label>
          <label class="chk"><input type="checkbox" data-k="hidden"${t.hidden ? ' checked' : ''}> ${esc(T.hidden)}</label>
          <button class="btn danger" style="margin-top:18px" data-delt="${j}" aria-label="${esc(T.del)}">×</button></div>`).join('')}</div>
        <button class="btn" data-addt="${i}">${esc(T.addTest)}</button></section>`).join('')}
      <div class="row noprint"><button class="btn" id="addV">${esc(T.addVariant)}</button><span class="sp"></span><p class="err" id="err" style="margin:0"></p>
        <a class="btn" href="${id ? '#/v/' + id : '#/'}">${esc(T.cancel)}</a><button class="btn primary" id="saveV">${esc(T.save)}</button></div>`;
    $('#addV').onclick = () => { read(); v.variants.push(emptyVariant(v.variants.length)); draw(); };
    $$('[data-delv]').forEach(b => b.onclick = () => { read(); v.variants.splice(+b.dataset.delv, 1); draw(); });
    $$('[data-addb]').forEach(b => b.onclick = () => { read(); v.variants[+b.dataset.addb].blocks.push({ t: 'output', v: '' }); draw(); });
    $$('[data-addt]').forEach(b => b.onclick = () => { read(); v.variants[+b.dataset.addt].tests.push({ in: [], out: '', hidden: false }); draw(); });
    $$('[data-delb]').forEach(b => b.onclick = () => { read(); v.variants[+b.closest('[data-v]').dataset.v].blocks.splice(+b.dataset.delb, 1); draw(); });
    $$('[data-delt]').forEach(b => b.onclick = () => { read(); v.variants[+b.closest('[data-v]').dataset.v].tests.splice(+b.dataset.delt, 1); draw(); });
    $('#saveV').onclick = save;
  };
  const read = () => {
    v.title = $('#ti').value; nc = +$('#nc').value || 0;
    v.opens = $('#op').value ? new Date($('#op').value).toISOString() : '';
    v.closes = $('#cl').value ? new Date($('#cl').value).toISOString() : '';
    v.variants = $$('[data-v]').map(sec => ({
      name: $('[data-k=name]', sec).value, text: $('[data-k=text]', sec).value,
      blocks: $$('.brow', sec).map(r => ({ t: $('[data-k=t]', r).value, v: $('[data-k=v]', r).value.trim() })),
      tests: $$('.trow', sec).map(r => ({ in: $('[data-k=in]', r).value.split('\n').map(s => s.trim()).filter(Boolean), out: $('[data-k=out]', r).value, hidden: $('[data-k=hidden]', r).checked })),
    }));
  };
  const save = async () => {
    read();
    if (!v.title.trim()) return $('#err').textContent = T.needTitle;
    v.variants.forEach(x => { x.blocks = x.blocks.filter(b => b.v); x.tests = x.tests.filter(t => t.in.length || t.out.trim()); });
    const bad = v.variants.find(x => !x.tests.length); if (bad) return $('#err').textContent = T.needTest(bad.name);
    const body = { title: v.title, opens: v.opens, closes: v.closes, variants: v.variants, ncodes: nc };
    if (id && body.ncodes) { const cur = await api('verifiche/' + id); body.ncodes += cur.codes.length; }
    const r = await api(id ? 'verifiche/' + id : 'verifiche', { method: id ? 'PUT' : 'POST', body });
    if (r.status === 200) { toast(T.saved); location.hash = '#/v/' + (id || r.id); } else $('#err').textContent = r.error || 'error';
  };
  draw();
}

/* ---------- one verifica: link, codes, results ---------- */
async function viewDetail(id) {
  const v = await api('verifiche/' + id); if (v.error) return location.hash = '#/';
  const link = linkFor(id);
  $('#view').innerHTML = `<a href="#/">${esc(T.back)}</a>
    <div class="row" style="margin-top:8px"><h1 style="margin:0">${esc(v.title)}</h1><span class="badge ${v.status}">${esc(T.st[v.status])}</span></div>
    <p class="muted">${esc(T.opens)}: ${esc(fmtDate(v.opens) === '—' ? fmtDate(v.created) : fmtDate(v.opens))} · ${esc(T.closes)}: ${esc(fmtDate(v.closes))}${v.variants.length > 1 ? ` · ${v.variants.length} ${esc(T.variants.toLowerCase())}` : ''}</p>
    <div class="card"><h2>${esc(T.link)}</h2><div class="link"><input class="in" readonly value="${esc(link)}" id="lk"><button class="btn primary" id="cp">${esc(T.copy)}</button></div>
      <div class="row" style="margin-top:12px"><a class="btn" href="#/v/${id}/codes">${esc(T.printCodes)} (${v.codes.length})</a><a class="btn" href="/api/admin/verifiche/${id}/zip">${esc(T.zip)}</a>
      <span class="sp"></span><a class="btn" href="#/v/${id}/edit">${esc(T.edit)}</a>${v.status !== 'closed' ? `<button class="btn" id="cn">${esc(T.closeNow)}</button>` : ''}<button class="btn danger" id="dl">${esc(T.del)}</button></div></div>
    <div class="card"><h2>${esc(T.results)}</h2><div id="subs"></div></div>`;
  $('#cp').onclick = () => copy(link); $('#lk').onfocus = e => e.target.select();
  if ($('#cn')) $('#cn').onclick = async () => { if (confirm(T.closeQ)) { await api(`verifiche/${id}/close`, { method: 'POST' }); viewDetail(id); } };
  $('#dl').onclick = async () => { if (confirm(T.delQ)) { await api('verifiche/' + id, { method: 'DELETE' }); location.hash = '#/'; } };
  const load = async () => {
    if (!$('#subs')) return;
    const r = await api(`verifiche/${id}/submissions`), subs = r._list || [];
    $('#subs').innerHTML = subs.length ? `<table><thead><tr><th>${esc(T.code)}</th>${v.variants.length > 1 ? `<th>${esc(T.variant)}</th>` : ''}<th>${esc(T.score)}</th><th class="hide-s">${esc(T.when)}</th><th class="hide-s">${esc(T.count)}</th><th class="hide-s">${esc(T.device)}</th><th>${esc(T.flags)}</th></tr></thead><tbody>
      ${subs.map(s => `<tr class="click" data-s="${s.id}"><td class="code">${esc(s.code)}</td>${v.variants.length > 1 ? `<td>${esc(v.variants[s.variant] ? v.variants[s.variant].name : '')}</td>` : ''}
        <td><span class="score${s.passed === s.total ? ' full' : ''}">${s.passed}/${s.total}</span> <span class="dots">${s.visible.map(o => `<span class="${o ? 'ok' : ''}"></span>`).join('')}${s.hidden.map(o => `<span class="h${o ? ' ok' : ''}"></span>`).join('')}</span></td>
        <td class="hide-s">${esc(fmtDate(s.at))}</td><td class="hide-s">${s.count}</td><td class="hide-s mono">${esc(s.device || '—')}</td>
        <td>${s.flags.map(f => `<span class="badge ${f === 'stessoIp' ? '' : 'warn'}" title="${esc(T.flagD[f] || '')}">${esc(T.flagT[f] || f)}</span>`).join(' ')}</td></tr>`).join('')}</tbody></table>` : `<p class="muted">${esc(T.noSubs)}</p>`;
    $$('tr[data-s]').forEach(tr => tr.onclick = () => showSub(+tr.dataset.s, v, subs.find(s => s.id === +tr.dataset.s)));
  };
  await load();
  clearInterval(timer); timer = setInterval(() => { if (location.hash === '#/v/' + id && !$('#dlg').open) load(); }, 10000);
}
async function showSub(sid, v, row) {
  const s = await api('submissions/' + sid);
  const vr = v.variants[s.variant] || v.variants[0];
  const file = { format: 'flussolab', version: 1, name: `${v.title} · ${s.code}`, main: s.doc.main, dev: s.doc.dev };
  let appLink = '';
  try { appLink = ME.appUrl + '#' + FL.shareEncode({ name: file.name, main: s.doc.main }); } catch (e) {}
  const d = $('#dlg');
  d.innerHTML = `<div class="row"><h2 style="margin:0">${esc(T.detail)} · <span class="code">${esc(s.code)}</span></h2><span class="sp"></span><button class="btn ghost" id="x">${esc(T.close)}</button></div>
    <p class="muted">${esc(fmtDate(s.at))}${v.variants.length > 1 ? ` · ${esc(T.variant)} ${esc(vr.name)}` : ''} · ${esc(T.device)} <span class="mono">${esc(s.device || '—')}</span>${s.ip ? ` · IP <span class="mono">${esc(s.ip)}</span>` : ''}</p>
    <ul class="res">${s.results.results.map((r, i) => `<li><span class="${r.ok ? 'ok' : 'ko'}">${r.ok ? '✓' : '✗'}</span><span>${esc(T.testN(i + 1))}${r.hidden ? ` (${esc(T.hiddenT)})` : ''}: ${esc(r.ok ? T.ok : T.ko)}${!r.ok && r.err ? ` — ${esc(T.errs[r.err] || r.err)}` : ''}${!r.ok && r.got ? ` <span class="mono muted">→ ${esc(r.got)}</span>` : ''}</span></li>`).join('')}</ul>
    ${s.flags.length || (row && row.flags.length) ? `<ul class="flags">${[...new Set([...(row ? row.flags : []), ...s.flags])].map(f => `<li><b>${esc(T.flagT[f] || f)}</b>: ${esc(T.flagD[f] || '')}</li>`).join('')}</ul>` : ''}
    ${s.doc.dev && s.doc.dev.length ? `<p class="muted">${esc(T.device)}: ${s.doc.dev.map(x => `<span class="mono">${esc(x.d)}</span>`).join(' → ')}</p>` : ''}
    ${row && row.history.length > 1 ? `<p class="muted">${esc(T.history)}: ${row.history.map(h => esc(fmtDate(h.at))).join(', ')}</p>` : ''}
    <div class="row" style="margin-top:12px">${appLink ? `<a class="btn primary" href="${esc(appLink)}" target="_blank" rel="noopener">${esc(T.openApp)}</a>` : ''}<button class="btn" id="dlf">${esc(T.dlFile)}</button></div>`;
  d.showModal();
  $('#x', d).onclick = () => d.close();
  $('#dlf', d).onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })); a.download = s.code + '.flusso'; a.click(); };
}
async function viewCodes(id) {
  const v = await api('verifiche/' + id); if (v.error) return location.hash = '#/';
  $('#view').innerHTML = `<div class="row noprint"><a href="#/v/${id}">← ${esc(v.title)}</a><span class="sp"></span><button class="btn primary" id="pr">${esc(T.printBtn)}</button></div>
    <h1 style="margin-top:10px">${esc(T.codesFor(v.title))}</h1>
    <div class="codes">${v.codes.map(c => `<div><div class="code">${esc(c.code)}</div>${v.variants.length > 1 ? `<div class="muted">${esc(T.variant)} ${esc(v.variants[c.variant].name)}</div>` : ''}<div class="muted" style="margin-top:14px;border-top:1px solid var(--rule)">${esc(T.nameCol)}</div></div>`).join('')}</div>`;
  $('#pr').onclick = () => print();
}

/* ---------- account ---------- */
function changePw() {
  const d = $('#dlg');
  d.innerHTML = `<h2>${esc(T.changePw)}</h2><form id="pf"><label class="f">${esc(T.oldPw)}<input type="password" id="op1" required autocomplete="current-password"></label>
    <label class="f">${esc(T.newPw)}<input type="password" id="np1" required autocomplete="new-password"></label><label class="f">${esc(T.password2)}<input type="password" id="np2" required autocomplete="new-password"></label>
    <p class="err" id="perr"></p><div class="row"><span class="sp"></span><button class="btn" type="button" id="pc">${esc(T.cancel)}</button><button class="btn primary">${esc(T.save)}</button></div></form>`;
  d.showModal(); $('#pc').onclick = () => d.close();
  $('#pf').onsubmit = async e => {
    e.preventDefault();
    if ($('#np1').value.length < 8) return $('#perr').textContent = T.weak;
    if ($('#np1').value !== $('#np2').value) return $('#perr').textContent = T.mismatch;
    const r = await api('password', { method: 'POST', body: { old: $('#op1').value, password: $('#np1').value }, allow401: true });
    if (r.ok) { d.close(); boot(); } else $('#perr').textContent = T.badLogin;
  };
}

/* ---------- router ---------- */
async function render() {
  clearInterval(timer);
  $('#nav').hidden = !ME;
  if (!ME) return;
  const h = location.hash || '#/';
  let m;
  if (h === '#/new') return viewEdit();
  if ((m = /^#\/v\/([A-Z0-9]{8})\/edit$/.exec(h))) return viewEdit(m[1]);
  if ((m = /^#\/v\/([A-Z0-9]{8})\/codes$/.exec(h))) return viewCodes(m[1]);
  if ((m = /^#\/v\/([A-Z0-9]{8})$/.exec(h))) return viewDetail(m[1]);
  return viewList();
}
async function boot() {
  const r = await api('me', { allow401: true });
  $('#ver').textContent = r.version ? 'server ' + r.version : '';
  if (r.status === 401) { ME = null; $('#nav').hidden = true; return viewAuth(r.setup); }
  ME = r; $('#who').textContent = r.email;
  render();
}
$('#pwBtn').textContent = T.changePw; $('#outBtn').textContent = T.logout;
$('#pwBtn').onclick = changePw;
$('#outBtn').onclick = async () => { await api('logout', { method: 'POST' }); ME = null; boot(); };
addEventListener('hashchange', render);
boot();
})();
