'use strict';

/* ---------- Configuração ---------- */
const CFG = window.APP_CONFIG || {};
const APP_NAME = CFG.name || 'PersonalNutri';
const SKIP_KEY = 'personalnutri_sem_conta';
const LS_KEY = 'dieta_app_v1';
const XLSX_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';

/* ---------- Plano padrão ---------- */
const it = (food, qty, k, p, c, g) => ({ food, qty, k, p, c, g });
const salada = () => it('Salada com tempero', 'à vontade', 60, 0, 0, 5);
const proteina = () => it('Frango ou carne magra', '150 g', 240, 48, 0, 5);
const opcoesAlmoco = () => [
  { name: 'Com feijão', tip: 'Pesos do alimento cozido. Legumes como cenoura e abobrinha são livres, mesmo cozidos com a carne: pese só a carne.', items: [it('Arroz', '120 g', 155, 3, 34, 0), it('Feijão', '1 concha · 86 g', 65, 4, 12, 0), proteina(), salada()] },
  { name: 'Sem feijão', tip: 'Sem feijão, o arroz sobe para 150 g. A carne continua em 150 g.', items: [it('Arroz', '150 g', 195, 4, 42, 0), proteina(), salada()] },
  { name: 'Massa', tip: 'Peso da massa cozida. Molho de tomate simples, sem creme.', items: [it('Espaguete ou macarrão', '140 g', 220, 7, 43, 1), it('Molho de tomate', '2 col. sopa · 40 g', 15, 0, 3, 0), it('Frango ou carne moída', '150 g', 240, 48, 0, 5), salada()] },
  { name: 'Batata', tip: 'Batata substitui o arroz: 100 g de arroz ≈ 250 g de batata inglesa.', items: [it('Batata inglesa', '300 g', 155, 5, 40, 0), proteina(), salada()] },
  { name: 'Batata-doce', tip: 'Batata-doce substitui o arroz: 100 g de arroz ≈ 170 g de batata-doce.', items: [it('Batata-doce', '200 g', 155, 2, 40, 0), proteina(), salada()] }
];
function defaultPlan() {
  return [
    { id: 'cafe', name: 'Café da manhã', time: '07:00', opts: [
      { name: 'Shake', tip: 'Bata tudo junto, com o iogurte. Fruta: banana, maçã, 8 morangos ou 1/2 manga.', items: [it('Whey protein', '1 dose', 120, 24, 3, 2), it('Leite desnatado', '300 ml', 105, 10, 15, 1), it('Iogurte natural', '1 pote · 170 g', 105, 7, 9, 6), it('Fruta', '1 unidade', 90, 1, 23, 0)] },
      { name: 'Panqueca de banana', tip: 'Amasse a banana, misture os ovos e o farelo e doure em fogo baixo.', items: [it('Banana', '1 unidade', 90, 1, 23, 0), it('Ovos', '2 unidades', 145, 13, 1, 10), it('Farelo de aveia', '3 col. sopa · 33 g', 85, 6, 18, 2)] },
      { name: 'Crepioca', tip: '', items: [it('Tapioca', '3 col. sopa · 45 g', 155, 0, 38, 0), it('Ovos', '2 unidades', 145, 13, 1, 10), it('Requeijão light', '1 col. sopa · 20 g', 40, 2, 1, 2)] }
    ] },
    { id: 'almoco', name: 'Almoço', time: '12:00', opts: opcoesAlmoco() },
    { id: 'pre', name: 'Pré-treino', time: '16:00', opts: [
      { name: 'Sanduíche', tip: '', items: [it('Pão integral', '2 fatias', 125, 5, 22, 2), it('Queijo mussarela', '1 fatia', 60, 4, 0, 5), it('Peito de peru ou frango desfiado', '60 g', 65, 12, 1, 1), it('Banana', '1 unidade', 90, 1, 23, 0)] }
    ] },
    { id: 'jantar', name: 'Jantar', time: '21:00', opts: opcoesAlmoco() },
    { id: 'ceia', name: 'Ceia', time: '22:30', opts: [
      { name: 'Mamão', tip: 'Fruta leve e com fibra, boa depois da janta. Troque à vontade entre as opções.', items: [it('Mamão papaia', '1/2 unidade', 60, 1, 15, 0)] },
      { name: 'Kiwi', tip: '', items: [it('Kiwi', '1 unidade', 45, 1, 11, 0)] },
      { name: 'Morangos', tip: '', items: [it('Morangos', '10 unidades', 35, 1, 8, 0)] },
      { name: 'Maçã', tip: '', items: [it('Maçã', '1 unidade', 70, 0, 19, 0)] }
    ] }
  ];
}
const DEFAULT_GOALS = { kcal: 1860, prot: 175, carb: 205, fat: 40, agua: 2700, peso: 81, meta: '' };
const DRINKS = {
  cerveja: { label: 'Cerveja', k: 0.43, ml: 350, step: 50 },
  vinho: { label: 'Vinho', k: 0.85, ml: 150, step: 25 },
  destilado: { label: 'Destilado', k: 2.3, ml: 50, step: 25 },
  drink: { label: 'Drink', k: 0.8, ml: 300, step: 50 }
};

function defaultState() {
  return { v: 1, updatedAt: 0, theme: 'light', plan: defaultPlan(), goals: { ...DEFAULT_GOALS }, days: {}, free: {}, drinks: [], checkins: [] };
}
function normalizeState(x) {
  const d = defaultState();
  if (!x || typeof x !== 'object') return d;
  return {
    ...d, ...x,
    goals: (({ data, ...rest }) => rest)({ ...d.goals, ...(x.goals || {}) }),
    plan: Array.isArray(x.plan) && x.plan.length ? x.plan : d.plan,
    days: x.days || {}, free: x.free || {},
    drinks: Array.isArray(x.drinks) ? x.drinks : [],
    checkins: Array.isArray(x.checkins) ? x.checkins : []
  };
}
function loadLocal() {
  try { return normalizeState(JSON.parse(localStorage.getItem(LS_KEY))); } catch (e) { return defaultState(); }
}

/* ---------- Estado ---------- */
let S = loadLocal();
const UI = {
  plano: { meal: 0, opt: {} },
  drink: { type: 'cerveja', cups: 1, ml: DRINKS.cerveja.ml },
  auth: { user: null, ready: false, msg: '', info: '', busy: false, recovery: false, f: {} },
  sync: '',
  note: null
};

function save(opts) {
  S.updatedAt = Date.now();
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* armazenamento cheio ou bloqueado */ }
  if (UI.auth.user) schedulePush();
  if (!opts || opts.render !== false) render();
}

/* ---------- Utilidades ---------- */
const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(x) ? x : 0; };
const nf = (n, d = 0) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseKey = (k) => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const todayKey = () => keyOf(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
const weekStart = (k = todayKey()) => { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return keyOf(d); };
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const longDate = (k) => { const d = parseKey(k); return DIAS[d.getDay()] + ', ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
const ddmm = (k) => { const d = parseKey(k); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
const sum = (items) => (items || []).reduce((a, i) => ({ k: a.k + num(i.k), p: a.p + num(i.p), c: a.c + num(i.c), g: a.g + num(i.g) }), { k: 0, p: 0, c: 0, g: 0 });
const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2600);
}

function dayRec(k) {
  if (!S.days[k]) S.days[k] = {};
  const d = S.days[k];
  d.sel = d.sel || {}; d.done = d.done || {}; d.snap = d.snap || {}; d.notes = d.notes || {};
  return d;
}
const FORA = '_fora';
const NOTE_TYPES = { troca: 'Comi outra coisa', extra: 'Comi a mais', livre: 'Refeição livre' };
const NOTE_SHORT = { troca: 'Troca', extra: 'A mais', livre: 'Refeição livre' };
const notesOf = (k, mid) => (S.days[k] && S.days[k].notes && S.days[k].notes[mid]) || [];
const ZERO = () => ({ k: 0, p: 0, c: 0, g: 0 });
function optIndex(meal, k = todayKey()) {
  const i = S.days[k] && S.days[k].sel ? S.days[k].sel[meal.id] : 0;
  return Math.min(Math.max(0, i || 0), Math.max(0, meal.opts.length - 1));
}
const isDone = (meal, k = todayKey()) => !!(S.days[k] && S.days[k].done && S.days[k].done[meal.id]);
const sortedPlan = () => S.plan.slice().sort((a, b) => String(a.time).localeCompare(String(b.time)));
function planned(m, k = todayKey()) {
  const sn = S.days[k] && S.days[k].snap && S.days[k].snap[m.id];
  if (sn && isDone(m, k)) return { name: sn.name, k: sn.k, p: sn.p, c: sn.c, g: sn.g };
  const o = m.opts[optIndex(m, k)];
  return o ? { name: o.name, ...sum(o.items) } : { name: '', ...ZERO() };
}
function snapshot(m, k) {
  const o = m.opts[optIndex(m, k)];
  if (!o) return null;
  const x = sum(o.items);
  return { name: o.name, k: x.k, p: x.p, c: x.c, g: x.g };
}
/* O que entrou de uma refeição: o plano (se feita) ou a troca anotada, mais o que foi comido a mais */
function mealIntake(m, k) {
  const ns = notesOf(k, m.id);
  const repl = ns.filter((n) => n.type === 'troca' || n.type === 'livre');
  const extra = ns.filter((n) => n.type === 'extra');
  const base = repl.length ? { k: repl.reduce((a, n) => a + num(n.kcal), 0), p: 0, c: 0, g: 0 } : isDone(m, k) ? planned(m, k) : ZERO();
  return { k: base.k + extra.reduce((a, n) => a + num(n.kcal), 0), p: base.p, c: base.c, g: base.g, replaced: repl.length > 0 };
}
function consumed(k = todayKey()) {
  const tot = S.plan.reduce((a, m) => { const x = mealIntake(m, k); return { k: a.k + x.k, p: a.p + x.p, c: a.c + x.c, g: a.g + x.g }; }, ZERO());
  tot.k += notesOf(k, FORA).reduce((a, n) => a + num(n.kcal), 0);
  return tot;
}
const doneCount = (k = todayKey()) => S.plan.filter((m) => isDone(m, k)).length;
function planDefaultTotals() {
  return S.plan.reduce((a, m) => { const x = m.opts.length ? sum(m.opts[0].items) : { k: 0, p: 0, c: 0, g: 0 }; return { k: a.k + x.k, p: a.p + x.p, c: a.c + x.c, g: a.g + x.g }; }, { k: 0, p: 0, c: 0, g: 0 });
}
const drinkKcal = (type, cups, ml) => Math.round(cups * ml * (DRINKS[type] ? DRINKS[type].k : 0.8) / 10) * 10;
function weekDrinks(ws = weekStart()) { const end = addDays(ws, 7); return S.drinks.filter((d) => d.date >= ws && d.date < end); }

/* ---------- Ícones ---------- */
const svg = (p, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  hoje: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>'),
  macros: svg('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
  extras: svg('<path d="M7 4h10l-1.5 16h-7z"/><path d="M7.5 9h9"/>'),
  progresso: svg('<path d="M4 19h16"/><path d="M5 15l4-4 3 3 7-7"/>'),
  plano: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M9 11h6M9 15h6"/>'),
  conta: svg('<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>', 18),
  check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>', 16),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 18),
  brand: svg('<path d="M3 3v4.5a1.5 1.5 0 0 0 3 0V3M4.5 9v12"/><path d="M21 3c-1.6 1-2.2 3-2.2 6.5H21V21"/><circle cx="12" cy="12" r="5"/><path d="M9.6 13.2h4.8M10.2 13.2a1.8 1.8 0 0 1 3.6 0"/>', 20),
  brandBig: svg('<path d="M3 3v4.5a1.5 1.5 0 0 0 3 0V3M4.5 9v12"/><path d="M21 3c-1.6 1-2.2 3-2.2 6.5H21V21"/><circle cx="12" cy="12" r="5"/><path d="M9.6 13.2h4.8M10.2 13.2a1.8 1.8 0 0 1 3.6 0"/>', 30)
};

/* ---------- Estrutura ---------- */
const TABS = [['hoje', 'Hoje'], ['macros', 'Macros'], ['extras', 'Extras'], ['progresso', 'Progresso']];
const SIDE = [['hoje', 'Hoje'], ['macros', 'Macros'], ['progresso', 'Progresso'], ['extras', 'Extras'], ['plano', 'Plano']];
function route() {
  const h = (location.hash || '#hoje').slice(1).split('/');
  return { name: h[0] || 'hoje', arg: h[1] ? decodeURIComponent(h[1]) : '' };
}
function navKey(r) { return r.name === 'refeicao' ? 'hoje' : r.name; }

function themePill() {
  const dark = S.theme === 'dark';
  return `<div class="pill" role="group" aria-label="Tema"><button type="button" data-act="theme" data-v="light" aria-pressed="${!dark}">Claro</button><button type="button" data-act="theme" data-v="dark" aria-pressed="${dark}">Escuro</button></div>`;
}
function header(title, sub, back) {
  return `<header class="top"><div class="top-left">${back ? `<a class="back" href="${back[0]}">${I.back}${esc(back[1])}</a>` : ''}${sub ? `<div class="sub">${sub}</div>` : ''}<h1>${esc(title)}</h1></div>
  <div class="top-actions">${themePill()}<a class="icon-btn only-mobile" href="#conta" aria-label="Conta e sincronização">${I.conta}</a></div></header>`;
}
function sidebar(r) {
  const k = navKey(r);
  return `<aside class="sidebar"><div class="brand"><div class="brand-mark">${I.brand}</div><span class="brand-name">${esc(APP_NAME)}</span></div>
  <nav class="side-nav" aria-label="Principal">${SIDE.map(([id, label]) => `<a class="side-link ${k === id ? 'on' : ''}" href="#${id}" ${k === id ? 'aria-current="page"' : ''}>${I[id]}${label}</a>`).join('')}</nav>
  <div class="side-bottom"><a class="side-link ${k === 'conta' ? 'on' : ''}" href="${UI.auth.user ? '#conta' : '#entrar'}">${I.conta}${UI.auth.user ? 'Conta' : 'Entrar'}</a><div class="small muted" style="padding: 0 12px" data-sync>${esc(UI.sync)}</div></div></aside>`;
}
function tabbar(r) {
  const k = navKey(r);
  return `<nav class="tabbar" aria-label="Principal">${TABS.map(([id, label]) => `<a class="tab ${k === id ? 'on' : ''}" href="#${id}" ${k === id ? 'aria-current="page"' : ''}>${I[id]}${label}</a>`).join('')}</nav>`;
}

const AUTH_ROUTES = ['entrar', 'criar-conta', 'recuperar'];
const skipAuth = () => { try { return localStorage.getItem(SKIP_KEY) === '1'; } catch (e) { return false; } };
function render() {
  const r = route();
  document.documentElement.dataset.theme = S.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', S.theme === 'dark' ? '#1B1E24' : '#F2F4F7');
  document.title = APP_NAME;
  if (sb && !UI.auth.ready) { $app.innerHTML = `<div class="splash">${authBrand()}</div>`; return; }
  if (UI.auth.recovery) { $app.innerHTML = authView('nova-senha'); return; }
  if (UI.auth.user && AUTH_ROUTES.includes(r.name)) { location.replace('#hoje'); return; }
  if (AUTH_ROUTES.includes(r.name)) { $app.innerHTML = authView(r.name); return; }
  if (sb && !UI.auth.user && (!skipAuth() || r.name === 'conta')) { $app.innerHTML = authView('entrar'); return; }
  const views = { hoje: viewHoje, refeicao: viewRefeicao, macros: viewMacros, extras: viewExtras, progresso: viewProgresso, plano: viewPlano, conta: viewConta };
  const fn = views[r.name] || viewHoje;
  const narrow = ['refeicao', 'extras', 'conta'].includes(r.name) ? ' narrow' : '';
  $app.innerHTML = `<div class="shell">${sidebar(r)}<main class="main"><div class="content${narrow}">${fn(r.arg)}</div></main>${tabbar(r)}</div>`;
}

/* ---------- Blocos reutilizados ---------- */
function macroBars(c, g) {
  const defs = [['Calorias', 'k', 'kcal', '', 'var(--mk)'], ['Proteína', 'p', 'prot', ' g', 'var(--mp)'], ['Carboidrato', 'c', 'carb', ' g', 'var(--mc)'], ['Gordura', 'g', 'fat', ' g', 'var(--mg)']];
  return defs.map(([name, ck, gk, unit, color]) => {
    const goal = num(g[gk]);
    const pct = goal ? Math.min(100, Math.round(c[ck] / goal * 100)) : 0;
    return `<div class="macro-row"><div class="between"><span style="font-weight:600">${name}</span><span class="muted"><span class="num" style="font-size:20px;color:var(--ink)">${nf(c[ck])}${unit}</span> / ${goal ? nf(goal) + unit : 'sem meta'}</span></div>
    <div class="bar" role="progressbar" aria-label="${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div style="width:${pct}%;background:${color}"></div></div></div>`;
  }).join('');
}
function weekGrid() {
  const ws = weekStart();
  const t = todayKey();
  const total = S.plan.length || 1;
  const labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  let done = 0, possible = 0;
  const cells = labels.map((l, i) => {
    const k = addDays(ws, i);
    const n = doneCount(k);
    if (k <= t) { done += n; possible += total; }
    const cls = k > t ? '' : n >= total ? 'full' : n > 0 ? 'part' : '';
    return `<div class="${k === t ? 'today' : ''}"><span>${l}</span><span class="wbox ${cls}" aria-label="${DIAS[parseKey(k).getDay()]}: ${n} de ${total}">${k > t ? '' : n}</span></div>`;
  }).join('');
  return { html: `<div class="week">${cells}</div>`, done, possible };
}
function lastCheckin() { return S.checkins.length ? S.checkins[S.checkins.length - 1] : null; }

/* ---------- Hoje ---------- */
function mealCard(m, k) {
  const oi = optIndex(m, k);
  const o = m.opts[oi] || { name: '', items: [] };
  const x = sum(o.items);
  const done = isDone(m, k);
  const chips = m.opts.length > 1 ? `<div class="chips only-desktop">${m.opts.map((op, i) => `<button type="button" class="chip ${i === oi ? 'on' : ''}" aria-pressed="${i === oi}" data-act="pickopt" data-meal="${esc(m.id)}" data-i="${i}">${esc(op.name)}</button>`).join('')}</div>` : '';
  return `<article class="card meal">
    <div class="meal-main">
      <div class="meal-head"><span class="time">${esc(m.time)}</span><span class="meal-name">${esc(m.name)}</span><span class="meal-macro only-desktop">${nf(x.k)} kcal · P ${nf(x.p)} · C ${nf(x.c)} · G ${nf(x.g)}</span></div>
      ${chips}
      <div class="meal-items">${m.opts.length > 1 ? `<strong style="font-weight:600">${esc(o.name)}:</strong> ` : ''}${esc(o.items.map((i) => i.food + ' ' + i.qty).join(' · '))}</div>
      ${notesList(k, m.id)}
      <div class="row" style="gap:8px;flex-wrap:wrap"><a class="opt-link${m.opts.length > 1 ? ' only-mobile' : ''}" href="#refeicao/${encodeURIComponent(m.id)}">${m.opts.length > 1 ? m.opts.length + ' opções' : 'Detalhes'}</a>${UI.note && UI.note.meal === m.id ? '' : `<button type="button" class="note-btn" data-act="noteopen" data-meal="${esc(m.id)}" aria-label="Anotar o que comeu em ${esc(m.name)}">+ Anotar</button>`}</div>
      ${UI.note && UI.note.meal === m.id ? noteEditor(true) : ''}
    </div>
    <button type="button" class="check ${done ? 'on' : ''}" data-act="done" data-meal="${esc(m.id)}" aria-pressed="${done}" aria-label="${done ? 'Desmarcar' : 'Marcar'} ${esc(m.name)}">${done ? I.check : ''}</button>
  </article>`;
}
function notesList(k, mid) {
  const ns = notesOf(k, mid);
  if (!ns.length) return '';
  return `<ul class="notes">${ns.map((n) => `<li class="note ${n.type}"><span><strong>${NOTE_SHORT[n.type] || 'Anotação'}:</strong> ${esc(n.text || 'sem descrição')}${num(n.kcal) ? ` · ≈ ${nf(n.kcal)} kcal` : ''}</span><button type="button" class="del-btn" data-act="notedel" data-meal="${esc(mid)}" data-id="${esc(n.id)}" aria-label="Apagar anotação">${I.x}</button></li>`).join('')}</ul>`;
}
function noteEditor(withTypes) {
  const N = UI.note;
  return `<div class="note-editor" role="group" aria-label="Anotar refeição">
    ${withTypes ? `<div class="chips">${Object.keys(NOTE_TYPES).map((t) => `<button type="button" class="chip small-chip ${N.type === t ? 'on' : ''}" aria-pressed="${N.type === t}" data-act="notetype" data-v="${t}">${NOTE_TYPES[t]}</button>`).join('')}</div>` : ''}
    <label class="field">O que você comeu<textarea class="input" id="note-text" data-in="note" data-f="text" rows="2" placeholder="${N.type === 'extra' ? 'ex.: 2 bombons' : 'ex.: 2 fatias de pizza de calabresa'}">${esc(N.text)}</textarea></label>
    <label class="field">Calorias estimadas (opcional)<input class="input" type="number" inputmode="numeric" data-in="note" data-f="kcal" value="${esc(N.kcal)}" placeholder="ex.: 600"></label>
    ${N.type === 'livre' ? '<div class="small muted">Também marca a refeição livre desta semana.</div>' : ''}
    ${N.type === 'troca' || N.type === 'livre' ? '<div class="small muted">Substitui a refeição do plano. Sem calorias, ela fica registrada, mas não entra na soma do dia.</div>' : ''}
    <div class="toolbar"><button type="button" class="btn small" data-act="notesave">Salvar</button><button type="button" class="btn small ghost" data-act="notecancel">Cancelar</button></div>
  </div>`;
}
function foraCard(k) {
  const open = UI.note && UI.note.meal === FORA;
  return `<article class="card meal" style="align-items:flex-start"><div class="meal-main">
    <div class="meal-head"><span class="meal-name">Fora das refeições</span></div>
    <div class="meal-items">Beliscos e qualquer coisa que não estava no plano.</div>
    ${notesList(k, FORA)}
    ${open ? noteEditor(false) : `<div><button type="button" class="note-btn" data-act="noteopen" data-meal="${FORA}">+ Anotar</button></div>`}
  </div></article>`;
}
function waterCard(k) {
  const ml = num(S.days[k] && S.days[k].water);
  const goal = num(S.goals.agua);
  const pct = goal ? Math.min(100, Math.round(ml / goal * 100)) : 0;
  const L = (v) => (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  return `<section class="card stack" aria-label="Água">
    <div class="between"><span class="meal-name">Água</span><span class="muted"><span class="num" style="font-size:22px;color:var(--ink)">${L(ml)} L</span>${goal ? ' / ' + L(goal) + ' L' : ''}</span></div>
    <div class="bar" role="progressbar" aria-label="Água" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div style="width:${pct}%;background:var(--mp)"></div></div>
    <div class="water-btns"><button type="button" class="btn small ghost" data-act="water" data-v="-250" aria-label="Tirar 250 ml">− 250 ml</button><button type="button" class="btn small" data-act="water" data-v="250">+ 250 ml</button><button type="button" class="btn small" data-act="water" data-v="500">+ 500 ml</button></div>
  </section>`;
}
function viewHoje() {
  const k = todayKey();
  const c = consumed(k);
  const g = S.goals;
  const pct = num(g.kcal) ? Math.min(100, Math.round(c.k / num(g.kcal) * 100)) : 0;
  const lc = lastCheckin();
  const wd = weekDrinks();
  const free = !!S.free[weekStart()];
  const summary = `<a class="card stack" href="#macros" style="text-decoration:none;color:var(--ink)">
    <div class="grid2">
      <div><div class="small muted" style="font-weight:500">Calorias</div><div class="num big">${nf(c.k)} <span class="small muted" style="font-weight:500">/ ${nf(g.kcal)}</span></div></div>
      <div><div class="small muted" style="font-weight:500">Proteína</div><div class="num big">${nf(c.p)} g <span class="small muted" style="font-weight:500">/ ${nf(g.prot)}</span></div></div>
    </div>
    <div class="bar" style="height:8px"><div style="width:${pct}%;background:var(--pri)"></div></div>
    <div class="between small" style="font-weight:600;color:var(--pri-text)"><span>${doneCount(k)} de ${S.plan.length} refeições</span><span>Ver macros</span></div>
  </a>`;
  const side = `<div class="col only-desktop">
    <section class="card stack" aria-label="Macros"><div class="between"><h2 class="label">Consumido hoje</h2><a class="small" style="font-weight:600;text-decoration:none" href="#plano">Editar plano</a></div>${macroBars(c, g)}</section>
    ${waterCard(k)}
    <section class="card stack" aria-label="Progresso"><h2 class="label">Progresso</h2>
      <div class="grid2"><div><div class="small muted" style="font-weight:600">Peso</div><div class="num big">${lc ? nf(lc.peso, 1) + ' kg' : '—'}</div></div><div><div class="small muted" style="font-weight:600">Cintura</div><div class="num big">${lc && lc.cintura ? nf(lc.cintura, 1) + ' cm' : '—'}</div></div></div>
      ${weekGrid().html}<a class="small" style="font-weight:600;text-decoration:none" href="#progresso">Fazer check-in</a></section>
    <section class="card grid2" aria-label="Extras"><div><div class="small muted" style="font-weight:600">Refeição livre</div><div class="num" style="font-size:22px">${free ? 1 : 0} de 1</div></div><div><div class="small muted" style="font-weight:600">Bebida alcoólica na semana</div><div class="num" style="font-size:22px;color:var(--o-text)">${nf(wd.reduce((a, d) => a + d.cups * d.ml, 0))} ml</div></div></section>
  </div>`;
  const meals = sortedPlan().map((m) => mealCard(m, k)).join('') + (S.plan.length ? foraCard(k) : '');
  return header('Hoje', esc(longDate(k))) +
    `<div class="split"><div class="col"><div class="only-mobile">${summary}</div><div class="only-mobile">${waterCard(k)}</div>${meals || '<div class="card muted">Nenhuma refeição no plano. <a href="#plano">Montar o plano</a></div>'}</div>${side}</div>`;
}

/* ---------- Refeição ---------- */
function viewRefeicao(id) {
  const m = S.plan.find((x) => x.id === id);
  if (!m) return viewHoje();
  const k = todayKey();
  const oi = optIndex(m, k);
  const o = m.opts[oi] || { name: '', items: [], tip: '' };
  const x = sum(o.items);
  const done = isDone(m, k);
  return header(m.name, esc(m.time), ['#hoje', 'Hoje']) +
    (m.opts.length > 1 ? `<div class="stack"><h2 class="label">Opção</h2><div class="chips">${m.opts.map((op, i) => `<button type="button" class="chip ${i === oi ? 'on' : ''}" aria-pressed="${i === oi}" data-act="pickopt" data-meal="${esc(m.id)}" data-i="${i}">${esc(op.name)}</button>`).join('')}</div></div>` : '') +
    `<div class="card list-rows" style="padding:4px 18px">${o.items.map((i) => `<div><span style="font-weight:500">${esc(i.food)}</span><span class="qty">${esc(i.qty)}</span></div>`).join('') || '<div class="muted">Sem alimentos nesta opção.</div>'}</div>
    <div class="grid4"><div class="tile"><span class="num">${nf(x.k)}</span><span>kcal</span></div><div class="tile"><span class="num">${nf(x.p)} g</span><span>proteína</span></div><div class="tile"><span class="num">${nf(x.c)} g</span><span>carbo</span></div><div class="tile"><span class="num">${nf(x.g)} g</span><span>gordura</span></div></div>
    ${o.tip ? `<div class="tip">${I.info}<div>${esc(o.tip)}</div></div>` : ''}
    <button type="button" class="btn block ${done ? 'ghost' : ''}" data-act="done" data-meal="${esc(m.id)}">${done ? 'Feito · desfazer' : 'Marcar como feito'}</button>`;
}

/* ---------- Macros ---------- */
function viewMacros() {
  const k = todayKey();
  const g = S.goals;
  const rows = sortedPlan().map((m) => { const o = m.opts[optIndex(m, k)]; const x = sum(o ? o.items : []); return { name: m.name + (m.opts.length > 1 && o ? ` · ${o.name}` : ''), ...x }; });
  const tot = rows.reduce((a, r) => ({ k: a.k + r.k, p: a.p + r.p, c: a.c + r.c, g: a.g + r.g }), { k: 0, p: 0, c: 0, g: 0 });
  const lc = lastCheckin();
  const pesoAtual = lc ? lc.peso : num(g.peso);
  const falta = num(g.meta) && pesoAtual ? Math.round((pesoAtual - num(g.meta)) * 10) / 10 : null;
  const field = (label, key, type = 'number', ph = '', step = 'any') => `<label class="field">${label}<input class="input strong" type="${type}" ${type === 'number' ? `inputmode="decimal" step="${step}"` : ''} data-in="goal" data-k="${key}" value="${esc(g[key])}" placeholder="${esc(ph)}"></label>`;
  return header('Macros', esc(longDate(k))) + `<div class="split"><div class="col">
    <section class="card stack" aria-label="Consumido hoje"><h2 class="label">Consumido hoje</h2>${macroBars(consumed(k), g)}</section>
    <section class="card" aria-label="Plano do dia"><div class="between" style="align-items:center;margin-bottom:6px"><h2 class="label">Plano do dia</h2><a class="small" style="font-weight:600;text-decoration:none;min-height:44px;display:inline-flex;align-items:center" href="#plano">Editar plano</a></div>
      <table class="table"><thead><tr><th>Refeição</th><th>kcal</th><th>P</th><th>C</th><th>G</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${nf(r.k)}</td><td>${nf(r.p)}</td><td>${nf(r.c)}</td><td>${nf(r.g)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td>${nf(tot.k)}</td><td>${nf(tot.p)}</td><td>${nf(tot.c)}</td><td>${nf(tot.g)}</td></tr></tfoot></table>
      <div class="small muted" style="margin-top:8px">Com as opções escolhidas para hoje.</div></section>
  </div><div class="col">
    <section class="card stack" aria-label="Metas"><div class="between"><h2 class="label">Metas</h2></div>
      <div class="grid2">${field('Calorias/dia', 'kcal', 'number', '1860', '1')}${field('Proteína (g)', 'prot', 'number', '175', '1')}${field('Carboidrato (g)', 'carb', 'number', '205', '1')}${field('Gordura (g)', 'fat', 'number', '40', '1')}${field('Água/dia (ml)', 'agua', 'number', '2700', '50')}${field('Peso inicial (kg)', 'peso', 'number', '81', '0.1')}${field('Peso meta (kg)', 'meta', 'number', 'ex.: 76', '0.1')}</div>
      <div class="small muted">${falta !== null ? (falta > 0 ? `Faltam ${nf(falta, 1)} kg para o peso meta.` : 'Peso meta alcançado.') : 'Defina o peso meta para ver quanto falta.'}</div></section>
  </div></div>`;
}

/* ---------- Extras ---------- */
function viewExtras() {
  const ws = weekStart();
  const free = !!S.free[ws];
  const D = UI.drink;
  const cur = DRINKS[D.type];
  const total = D.cups * D.ml;
  const kcal = drinkKcal(D.type, D.cups, D.ml);
  const list = weekDrinks(ws);
  const wMl = list.reduce((a, d) => a + d.cups * d.ml, 0);
  const wK = list.reduce((a, d) => a + d.kcal, 0);
  return header('Extras', 'Semana de ' + ddmm(ws) + ' a ' + ddmm(addDays(ws, 6))) + `
  <section class="card row" style="padding:16px 18px" aria-label="Refeição livre"><div style="flex:1"><div class="meal-name">Refeição livre</div><div class="small muted">${free ? 'Usada nesta semana · 1 de 1' : 'Disponível · 0 de 1 nesta semana'}</div></div>
    <button type="button" class="btn small ${free ? 'ghost' : ''}" style="border-radius:99px" data-act="free">${free ? 'Desfazer' : 'Registrar'}</button></section>
  <section class="card stack" aria-label="Bebida alcoólica"><div class="meal-name">Bebida alcoólica</div>
    <div class="grid4">${Object.keys(DRINKS).map((id) => `<button type="button" class="chip o ${id === D.type ? 'on' : ''}" style="padding:0 4px;border-radius:12px;font-size:13px" aria-pressed="${id === D.type}" data-act="drinktype" data-v="${id}">${DRINKS[id].label}</button>`).join('')}</div>
    <div class="grid2">
      <div class="field">Copos<div class="stepper"><button type="button" data-act="cups" data-v="-1" aria-label="Menos copos">−</button><span class="num">${D.cups}</span><button type="button" data-act="cups" data-v="1" aria-label="Mais copos">+</button></div></div>
      <div class="field">ml por copo<div class="stepper"><button type="button" data-act="ml" data-v="-1" aria-label="Menos ml">−</button><span class="num">${D.ml}</span><button type="button" data-act="ml" data-v="1" aria-label="Mais ml">+</button></div></div>
    </div>
    <div class="drink-total"><span>${D.cups} × ${D.ml} ml = ${nf(total)} ml</span><span class="num">≈ ${nf(kcal)} kcal</span></div>
    <button type="button" class="btn block orange" data-act="adddrink">Registrar ${cur.label.toLowerCase()}</button>
  </section>
  <div class="stack" style="gap:8px"><div class="between label"><span>Nesta semana</span><span>${list.length ? nf(wMl) + ' ml · ≈ ' + nf(wK) + ' kcal' : ''}</span></div>
    ${list.length ? list.map((d) => `<div class="log-item"><span>${ddmm(d.date)} · ${d.cups} × ${d.ml} ml de ${esc((DRINKS[d.type] || {}).label || d.type).toLowerCase()}</span><span class="row" style="gap:4px"><strong>≈ ${nf(d.kcal)} kcal</strong><button type="button" class="del-btn" data-act="deldrink" data-id="${esc(d.id)}" aria-label="Apagar registro">${I.x}</button></span></div>`).join('') : '<div class="log-item muted" style="padding:14px 16px">Nenhuma bebida alcoólica registrada</div>'}
  </div>`;
}

/* ---------- Progresso ---------- */
function chart() {
  const e = S.checkins;
  if (!e.length) return '<div class="small muted">Faça o primeiro check-in para ver o gráfico.</div>';
  const g = S.goals;
  const start = e[0].date;
  const lastDate = e[e.length - 1].date;
  let end = addDays(lastDate, 28);
  if (end < addDays(start, 56)) end = addDays(start, 56);
  const span = Math.max(7, daysBetween(start, end));
  const planEnd = e[0].peso - 0.5 * span / 7;
  const vals = e.map((x) => x.peso).concat([planEnd]);
  if (num(g.meta)) vals.push(num(g.meta));
  let lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.5);
  if (hi - lo < 4) { lo -= 1; hi += 1; }
  const W = 320, H = 180, L = 30, R = 10, T = 12, B = 26;
  const X = (k) => L + (daysBetween(start, k) / span) * (W - L - R);
  const Y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  const mid = Math.round((hi + lo) / 2);
  const grid = [hi, mid, lo].map((v) => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--row)"/><text x="0" y="${Y(v) + 4}" font-size="10" fill="var(--muted)">${v}</text>`).join('');
  const path = e.map((x, i) => (i ? 'L' : 'M') + X(x.date).toFixed(1) + ' ' + Y(x.peso).toFixed(1)).join(' ');
  const meta = num(g.meta) ? `<line x1="${L}" x2="${W - R}" y1="${Y(num(g.meta))}" y2="${Y(num(g.meta))}" stroke="var(--mg)" stroke-width="1.5" stroke-dasharray="2 4"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Peso por check-in, com o ritmo planejado de meio quilo por semana">${grid}${meta}
    <path d="M${X(start)} ${Y(e[0].peso)} L${X(end)} ${Y(planEnd)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 4" fill="none"/>
    <path d="${path}" stroke="var(--pri)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${e.map((x) => `<circle cx="${X(x.date).toFixed(1)}" cy="${Y(x.peso).toFixed(1)}" r="4.5" fill="var(--pri)" stroke="var(--card)" stroke-width="2"/>`).join('')}
    <text x="${L}" y="${H - 6}" font-size="10" fill="var(--muted)">${ddmm(start)}</text><text x="${W - R}" y="${H - 6}" font-size="10" fill="var(--muted)" text-anchor="end">${ddmm(end)}</text></svg>`;
}
function viewProgresso() {
  const g = S.goals;
  const k = todayKey();
  const e = S.checkins;
  const lc = lastCheckin();
  const diff = e.length > 1 ? Math.round((lc.peso - e[0].peso) * 10) / 10 : null;
  const wg = weekGrid();
  return header('Progresso', 'Check-in uma vez por semana, em jejum') + `<div class="split"><div class="col">
    <section class="card stack" aria-label="Check-in semanal"><div class="meal-name">Check-in semanal</div>
      <div class="grid2"><label class="field">Peso (kg)<input class="input strong" id="ck-peso" type="number" inputmode="decimal" step="0.1" placeholder="${lc ? nf(lc.peso, 1) : '81,0'}"></label><label class="field">Cintura no umbigo (cm)<input class="input strong" id="ck-cintura" type="number" inputmode="decimal" step="0.5" placeholder="ex.: 88"></label></div>
      <label class="field">Data<input class="input" id="ck-data" type="date" value="${k}"></label>
      <button type="button" class="btn block" data-act="checkin">Registrar check-in</button></section>
    <section class="card stack chart" aria-label="Gráfico do peso"><div class="between"><h2 class="label">Peso</h2><span class="muted small">${lc ? `<span class="num" style="font-size:22px;color:var(--ink)">${nf(lc.peso, 1)}</span> kg${diff !== null ? ' · ' + (diff > 0 ? '+' : '') + nf(diff, 1) + ' kg' : ''}` : ''}</span></div>${chart()}
      <div class="small muted">Tracejado cinza: ritmo de 0,5 kg por semana${num(g.meta) ? '. Pontilhado verde: peso meta' : ''}.</div></section>
  </div><div class="col">
    <section class="card" aria-label="Histórico"><h2 class="label" style="margin-bottom:6px">Histórico</h2>
      ${e.length ? `<table class="table"><thead><tr><th>Data</th><th>Peso</th><th>Cintura</th><th class="del"><span class="sr-only">Apagar</span></th></tr></thead><tbody>${e.slice().reverse().map((x) => `<tr><td>${ddmm(x.date)}</td><td><strong>${nf(x.peso, 1)} kg</strong></td><td>${x.cintura ? nf(x.cintura, 1) + ' cm' : '—'}</td><td class="del"><button type="button" class="del-btn" data-act="delcheckin" data-date="${x.date}" aria-label="Apagar check-in de ${ddmm(x.date)}">${I.x}</button></td></tr>`).join('')}</tbody></table>` : '<div class="small muted">Sem check-ins ainda.</div>'}</section>
    <section class="card stack" aria-label="Esta semana"><div class="between label"><span>Esta semana</span><span>${wg.done} de ${wg.possible} refeições</span></div>${wg.html}</section>
    <section class="card stack" aria-label="Exportar histórico"><div class="meal-name">Histórico completo</div>
      <div class="small muted">Planilha com o resumo de cada dia, as refeições feitas, as anotações, a água, as bebidas alcoólicas, os check-ins e as metas. Dá para mandar para uma IA analisar.</div>
      <button type="button" class="btn small" data-act="exporthist">Exportar histórico</button></section>
  </div></div>`;
}

/* ---------- Plano ---------- */
function viewPlano() {
  const P = UI.plano;
  if (P.meal >= S.plan.length) P.meal = Math.max(0, S.plan.length - 1);
  const m = S.plan[P.meal];
  const t = planDefaultTotals();
  const g = S.goals;
  const tile = (label, v, goal, unit, id) => `<div class="tile" style="align-items:flex-start;padding:14px 16px"><span class="small muted" style="font-weight:600">${label}</span><span class="muted small"><span class="num" style="font-size:22px;color:var(--ink)" id="${id}">${nf(v)}${unit}</span> / ${nf(goal)}${unit}</span></div>`;
  const tabs = S.plan.map((mm, i) => { const x = mm.opts.length ? sum(mm.opts[0].items) : { k: 0 }; return `<button type="button" class="meal-tab ${i === P.meal ? 'on' : ''}" aria-pressed="${i === P.meal}" data-act="editmeal" data-i="${i}"><span class="nm"><span class="time" style="color:inherit;opacity:.8">${esc(mm.time)}</span><span>${esc(mm.name)}</span></span><span class="info">${mm.opts.length} ${mm.opts.length === 1 ? 'opção' : 'opções'} · ${nf(x.k)} kcal</span></button>`; }).join('') + `<button type="button" class="chip add" data-act="addmeal">+ Refeição</button>`;
  let editor = '<div class="card muted">Adicione uma refeição para começar.</div>';
  if (m) {
    const oi = Math.min(P.opt[m.id] || 0, Math.max(0, m.opts.length - 1));
    const o = m.opts[oi];
    const ot = o ? sum(o.items) : { k: 0, p: 0, c: 0, g: 0 };
    const inp = (i, f, val, type, cls, label) => `<label class="${cls}"><span class="mini">${label}</span><input class="input" type="${type}" ${type === 'number' ? 'inputmode="decimal" step="any"' : ''} aria-label="${label}" data-in="item" data-i="${i}" data-f="${f}" value="${esc(val)}"></label>`;
    editor = `<section class="card stack" aria-label="Editar refeição" style="gap:16px">
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 130px;gap:10px"><label class="field">Refeição<input class="input" type="text" data-in="meal" data-f="name" value="${esc(m.name)}"></label><label class="field">Horário<input class="input" type="time" data-in="meal" data-f="time" value="${esc(m.time)}"></label></div>
      <div class="stack" style="gap:8px"><span class="field">Opções</span><div class="chips">${m.opts.map((op, i) => `<button type="button" class="chip ${i === oi ? 'on' : ''}" aria-pressed="${i === oi}" data-act="editopt" data-i="${i}">${esc(op.name || 'Sem nome')}</button>`).join('')}<button type="button" class="chip add" data-act="addopt">+ Opção</button></div></div>
      ${o ? `<label class="field">Nome da opção<input class="input" type="text" data-in="opt" data-f="name" value="${esc(o.name)}"></label>
      <label class="field">Dica (opcional)<textarea class="input" data-in="opt" data-f="tip" rows="2">${esc(o.tip || '')}</textarea></label>
      <div class="stack" style="gap:8px">
        <div class="item-head"><span>Alimento</span><span>Quantidade</span><span>kcal</span><span>Prot.</span><span>Carbo</span><span>Gord.</span><span></span></div>
        ${o.items.map((itm, i) => `<div class="item-row">${inp(i, 'food', itm.food, 'text', 'f-food', 'Alimento')}${inp(i, 'qty', itm.qty, 'text', 'f-qty', 'Quantidade')}${inp(i, 'k', itm.k, 'number', 'f-k', 'kcal')}${inp(i, 'p', itm.p, 'number', 'f-p', 'Proteína')}${inp(i, 'c', itm.c, 'number', 'f-c', 'Carbo')}${inp(i, 'g', itm.g, 'number', 'f-g', 'Gordura')}<span class="f-del"><button type="button" class="del-btn" data-act="delitem" data-i="${i}" aria-label="Remover ${esc(itm.food || 'alimento')}">${I.x}</button></span></div>`).join('')}
        <button type="button" class="btn dashed" data-act="additem">+ Adicionar alimento</button>
      </div>
      <div class="opt-total"><span>Total da opção</span><span id="opt-total">${nf(ot.k)} kcal · P ${nf(ot.p)} · C ${nf(ot.c)} · G ${nf(ot.g)}</span></div>` : '<div class="muted small">Esta refeição não tem opções.</div>'}
      <div class="toolbar">${o && m.opts.length > 1 ? '<button type="button" class="btn danger" data-act="delopt">Apagar opção</button>' : ''}<button type="button" class="btn danger" data-act="delmeal">Apagar refeição</button></div>
    </section>`;
  }
  return header('Plano', 'Totais com a 1ª opção de cada refeição', ['#macros', 'Macros']) + `
    <div class="grid4 plan-tiles" style="gap:10px">${tile('Calorias', t.k, g.kcal, '', 'tot-k')}${tile('Proteína', t.p, g.prot, ' g', 'tot-p')}${tile('Carbo', t.c, g.carb, ' g', 'tot-c')}${tile('Gordura', t.g, g.fat, ' g', 'tot-g')}</div>
    <section class="card stack" aria-label="Planilha" style="gap:10px"><div class="toolbar"><button type="button" class="btn small" data-act="import">Importar planilha</button><button type="button" class="btn small ghost" data-act="export">Exportar planilha</button><button type="button" class="btn small ghost" data-act="reset">Restaurar plano padrão</button></div>
      <div class="small muted">Use a planilha exportada como modelo: colunas Refeição, Horário, Opção, Alimento, Quantidade, kcal, Proteína (g), Carbo (g), Gordura (g) e Dica. Importar substitui o plano atual.</div></section>
    <div class="split plano"><nav class="meal-tabs" aria-label="Refeições">${tabs}</nav>${editor}</div>`;
}
function refreshTotals() {
  const t = planDefaultTotals();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('tot-k', nf(t.k)); set('tot-p', nf(t.p) + ' g'); set('tot-c', nf(t.c) + ' g'); set('tot-g', nf(t.g) + ' g');
  const m = S.plan[UI.plano.meal];
  if (m) {
    const o = m.opts[Math.min(UI.plano.opt[m.id] || 0, m.opts.length - 1)];
    if (o) { const x = sum(o.items); set('opt-total', `${nf(x.k)} kcal · P ${nf(x.p)} · C ${nf(x.c)} · G ${nf(x.g)}`); }
  }
}

/* ---------- Conta ---------- */
function viewConta() {
  if (!sb) {
    return header('Conta', '', ['#hoje', 'Hoje']) + `<div class="card stack"><div class="meal-name">Sincronização desligada</div><div class="small muted">Os dados ficam salvos só neste aparelho. Para ver no celular e no PC, preencha a URL e a chave anon do Supabase no arquivo config.js.</div></div>`;
  }
  const u = UI.auth.user;
  if (u) {
    return header('Conta', '', ['#hoje', 'Hoje']) + `<div class="card stack"><div class="small muted" style="font-weight:600">Conectado como</div><div class="meal-name" style="word-break:break-all">${esc(u.email)}</div>
      <div class="small muted" data-sync>${esc(UI.sync || 'Os dados sincronizam sozinhos entre o celular e o PC.')}</div>
      <div class="toolbar"><button type="button" class="btn small" data-act="syncnow">Sincronizar agora</button><button type="button" class="btn small ghost" data-act="logout">Sair</button></div></div>`;
  }
  return authView('entrar');
}

/* ---------- Entrar / criar conta ---------- */
function authBrand() {
  return `<div class="auth-brand"><div class="brand-mark big">${I.brandBig}</div><span class="brand-name">${esc(APP_NAME)}</span></div>`;
}
function authView(mode) {
  const A = UI.auth;
  const off = !sb;
  const msg = A.msg ? `<div class="auth-msg err" role="alert">${esc(A.msg)}</div>` : '';
  const info = A.info ? `<div class="auth-msg ok" role="status">${esc(A.info)}</div>` : '';
  const cfg = off ? `<div class="auth-msg err">O Supabase ainda não está configurado. Preencha a URL e a chave anon no config.js para entrar e criar conta.</div>` : '';
  const dis = A.busy || off ? 'disabled' : '';
  const skip = `<button type="button" class="link-btn" data-act="skipauth">Usar sem conta neste aparelho</button>`;
  let body = '';
  if (mode === 'criar-conta') {
    body = `<h1>Criar conta</h1><p class="muted small" style="margin:0">Com uma conta, o plano, as metas e o progresso ficam iguais no celular e no PC.</p>
    <form class="stack" data-form="signup" novalidate>
      <label class="field">E-mail<input class="input" id="auth-email" value="${esc(A.f['auth-email'] || '')}" type="email" autocomplete="email" inputmode="email" required></label>
      <label class="field">Senha<input class="input" id="auth-pass" value="${esc(A.f['auth-pass'] || '')}" type="password" autocomplete="new-password" minlength="6" required aria-describedby="pass-hint"></label>
      <label class="field">Confirmar senha<input class="input" id="auth-pass2" value="${esc(A.f['auth-pass2'] || '')}" type="password" autocomplete="new-password" minlength="6" required></label>
      <div class="small muted" id="pass-hint">Mínimo de 6 caracteres.</div>
      ${cfg}${msg}${info}
      <button type="submit" class="btn block" ${dis}>${A.busy ? 'Criando…' : 'Criar conta'}</button>
    </form>
    <div class="auth-links"><span class="muted small">Já tem conta?</span><a href="#entrar">Entrar</a></div>`;
  } else if (mode === 'recuperar') {
    body = `<h1>Recuperar senha</h1><p class="muted small" style="margin:0">Enviamos um link para você criar uma senha nova.</p>
    <form class="stack" data-form="recover" novalidate>
      <label class="field">E-mail<input class="input" id="auth-email" value="${esc(A.f['auth-email'] || '')}" type="email" autocomplete="email" inputmode="email" required></label>
      ${cfg}${msg}${info}
      <button type="submit" class="btn block" ${dis}>${A.busy ? 'Enviando…' : 'Enviar link'}</button>
    </form>
    <div class="auth-links"><a href="#entrar">Voltar para entrar</a></div>`;
  } else if (mode === 'nova-senha') {
    body = `<h1>Nova senha</h1>
    <form class="stack" data-form="newpass" novalidate>
      <label class="field">Nova senha<input class="input" id="auth-pass" value="${esc(A.f['auth-pass'] || '')}" type="password" autocomplete="new-password" minlength="6" required></label>
      <label class="field">Confirmar senha<input class="input" id="auth-pass2" value="${esc(A.f['auth-pass2'] || '')}" type="password" autocomplete="new-password" minlength="6" required></label>
      ${msg}
      <button type="submit" class="btn block" ${A.busy ? 'disabled' : ''}>Salvar senha</button>
    </form>`;
  } else {
    body = `<h1>Entrar</h1>
    <form class="stack" data-form="login" novalidate>
      <label class="field">E-mail<input class="input" id="auth-email" value="${esc(A.f['auth-email'] || '')}" type="email" autocomplete="email" inputmode="email" required></label>
      <label class="field">Senha<input class="input" id="auth-pass" value="${esc(A.f['auth-pass'] || '')}" type="password" autocomplete="current-password" required></label>
      <a class="small" href="#recuperar" style="align-self:flex-end;font-weight:600;text-decoration:none">Esqueci minha senha</a>
      ${cfg}${msg}${info}
      <button type="submit" class="btn block" ${dis}>${A.busy ? 'Entrando…' : 'Entrar'}</button>
    </form>
    <div class="auth-links"><span class="muted small">Não tem conta?</span><a href="#criar-conta">Criar conta</a></div>`;
  }
  return `<div class="auth">
    <aside class="auth-side"><div class="auth-side-in">${authBrand()}<p>Plano alimentar, macros e progresso, no celular e no computador.</p></div></aside>
    <main class="auth-main"><div class="auth-card">
      <div class="auth-top"><div class="only-mobile">${authBrand()}</div>${themePill()}</div>
      ${body}
      ${mode !== 'nova-senha' ? `<div class="auth-skip">${skip}</div>` : ''}
    </div></main></div>`;
}

/* ---------- Supabase ---------- */
let sb = null;
try { if (CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase) sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey); } catch (e) { sb = null; }
let pushTimer = null;
function setSync(msg) { UI.sync = msg; document.querySelectorAll('[data-sync]').forEach((el) => { el.textContent = msg; }); }
function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(push, 900); }
async function push() {
  if (!sb || !UI.auth.user) return;
  const { error } = await sb.from('dieta_estado').upsert({ user_id: UI.auth.user.id, data: S, updated_at: new Date().toISOString() });
  setSync(error ? 'Erro ao sincronizar: ' + error.message : 'Sincronizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
}
async function pull() {
  if (!sb || !UI.auth.user) return;
  const { data, error } = await sb.from('dieta_estado').select('data, updated_at').eq('user_id', UI.auth.user.id).maybeSingle();
  if (error) { setSync('Erro ao sincronizar: ' + error.message); return; }
  if (data && data.data && (data.data.updatedAt || 0) > (S.updatedAt || 0)) {
    S = normalizeState(data.data);
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
    setSync('Dados trazidos da nuvem');
    render();
  } else {
    await push();
  }
}
async function initAuth() {
  if (!sb) return;
  setTimeout(() => { if (!UI.auth.ready) { UI.auth.ready = true; render(); } }, 4000);
  sb.auth.onAuthStateChange((event, session) => {
    const before = UI.auth.user && UI.auth.user.id;
    UI.auth.ready = true;
    if (event === 'PASSWORD_RECOVERY') UI.auth.recovery = true;
    UI.auth.user = session ? session.user : null;
    if (UI.auth.user && UI.auth.user.id !== before) setTimeout(pull, 0);
    if (!UI.auth.user) setSync('');
    render();
  });
}
const val = (id) => ((document.getElementById(id) || {}).value || '').trim();
const redirectUrl = () => location.origin + location.pathname;
async function authCall(fn) {
  UI.auth.busy = true; UI.auth.msg = ''; UI.auth.info = ''; render();
  try { await fn(); } catch (e) { UI.auth.msg = traduzErro(e.message || String(e)); }
  UI.auth.busy = false; render();
}
function doLogin() {
  const email = val('auth-email'), password = val('auth-pass');
  if (!email || !password) { UI.auth.msg = 'Informe o e-mail e a senha.'; render(); return; }
  authCall(async () => {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    UI.auth.f = {};
    location.hash = '#hoje';
  });
}
function doSignup() {
  const email = val('auth-email'), password = val('auth-pass'), p2 = val('auth-pass2');
  if (!email) { UI.auth.msg = 'Informe o e-mail.'; render(); return; }
  if (password.length < 6) { UI.auth.msg = 'A senha precisa ter pelo menos 6 caracteres.'; render(); return; }
  if (password !== p2) { UI.auth.msg = 'As senhas não são iguais.'; render(); return; }
  authCall(async () => {
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } });
    if (error) throw error;
    UI.auth.f = { 'auth-email': email };
    if (data.session) { location.hash = '#hoje'; return; }
    UI.auth.info = `Conta criada. Enviamos um link de confirmação para ${email}. Depois de confirmar, é só entrar.`;
  });
}
function doRecover() {
  const email = val('auth-email');
  if (!email) { UI.auth.msg = 'Informe o e-mail.'; render(); return; }
  authCall(async () => {
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
    if (error) throw error;
    UI.auth.info = `Se houver uma conta com ${email}, o link chega em instantes.`;
  });
}
function doNewPass() {
  const password = val('auth-pass'), p2 = val('auth-pass2');
  if (password.length < 6) { UI.auth.msg = 'A senha precisa ter pelo menos 6 caracteres.'; render(); return; }
  if (password !== p2) { UI.auth.msg = 'As senhas não são iguais.'; render(); return; }
  authCall(async () => {
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
    UI.auth.recovery = false;
    toast('Senha atualizada');
    location.hash = '#hoje';
  });
}
function traduzErro(m) {
  if (/invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (/password should be/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/invalid.*email|email.*invalid/i.test(m)) return 'E-mail inválido.';
  if (/already registered/i.test(m)) return 'Esse e-mail já tem conta. Use Entrar.';
  if (/email not confirmed/i.test(m)) return 'Confirme o e-mail antes de entrar.';
  return m;
}

/* ---------- Planilha ---------- */
async function ensureXLSX() {
  if (window.XLSX) return;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = XLSX_URL; s.onload = res; s.onerror = () => rej(new Error('Não consegui carregar a biblioteca de planilhas. Confira a internet.'));
    document.head.appendChild(s);
  });
}
const HEAD = { refeicao: 'meal', horario: 'time', hora: 'time', opcao: 'opt', alimento: 'food', quantidade: 'qty', qtd: 'qty', porcao: 'qty', kcal: 'k', calorias: 'k', caloriaskcal: 'k', proteina: 'p', proteinag: 'p', proteinas: 'p', carbo: 'c', carbog: 'c', carboidrato: 'c', carboidratos: 'c', carboidratog: 'c', gordura: 'g', gorduras: 'g', gordurag: 'g', dica: 'tip', observacao: 'tip', obs: 'tip' };
const normHead = (h) => String(h).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
function toTime(v) {
  if (typeof v === 'number') { const mins = Math.round((v % 1) * 1440); return pad(Math.floor(mins / 60) % 24) + ':' + pad(mins % 60); }
  const s = String(v || '').trim();
  const mt = s.match(/^(\d{1,2})[:hH](\d{2})?/);
  return mt ? pad(Math.min(23, +mt[1])) + ':' + pad(mt[2] ? +mt[2] : 0) : '';
}
function parseRows(rows) {
  const meals = [];
  let lastMeal = '', lastOpt = '', lastTime = '';
  rows.forEach((raw) => {
    const r = {};
    Object.keys(raw).forEach((h) => { const k = HEAD[normHead(h)]; if (k) r[k] = raw[h]; });
    const mealName = String(r.meal ?? '').trim() || lastMeal;
    const food = String(r.food ?? '').trim();
    if (!mealName || !food) return;
    if (mealName !== lastMeal) { lastOpt = ''; lastTime = ''; }
    const optName = String(r.opt ?? '').trim() || lastOpt || 'Opção 1';
    const time = toTime(r.time) || lastTime;
    lastMeal = mealName; lastOpt = optName; lastTime = time;
    let meal = meals.find((m) => m.name === mealName);
    if (!meal) { meal = { id: uid(), name: mealName, time: time || '12:00', opts: [] }; meals.push(meal); }
    if (time && !meal.time) meal.time = time;
    let opt = meal.opts.find((o) => o.name === optName);
    if (!opt) { opt = { name: optName, tip: '', items: [] }; meal.opts.push(opt); }
    if (r.tip && !opt.tip) opt.tip = String(r.tip).trim();
    opt.items.push(it(food, String(r.qty ?? '').trim(), Math.round(num(r.k)), Math.round(num(r.p) * 10) / 10, Math.round(num(r.c) * 10) / 10, Math.round(num(r.g) * 10) / 10));
  });
  return meals;
}
async function importFile(file) {
  try {
    await ensureXLSX();
    const wb = /\.csv$/i.test(file.name) ? XLSX.read(await file.text(), { type: 'string' }) : XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const plan = parseRows(rows);
    if (!plan.length) { toast('Não encontrei as colunas Refeição e Alimento. Use a planilha exportada como modelo.'); return; }
    const opts = plan.reduce((a, m) => a + m.opts.length, 0);
    const kcal = plan.reduce((a, m) => a + sum(m.opts[0].items).k, 0);
    if (!confirm(`Substituir o plano atual por ${plan.length} refeições e ${opts} opções (≈ ${nf(kcal)} kcal com a primeira opção de cada)?`)) return;
    const byName = Object.fromEntries(S.plan.map((m) => [m.name, m.id]));
    plan.forEach((m) => { if (byName[m.name]) m.id = byName[m.name]; });
    S.plan = plan;
    UI.plano = { meal: 0, opt: {} };
    save();
    toast('Plano importado');
  } catch (e) {
    toast(e.message || 'Não consegui ler o arquivo.');
  }
}
async function exportPlan() {
  try {
    await ensureXLSX();
    const rows = [];
    S.plan.forEach((m) => m.opts.forEach((o) => o.items.forEach((i, idx) => rows.push({
      'Refeição': m.name, 'Horário': m.time, 'Opção': o.name, 'Alimento': i.food, 'Quantidade': i.qty,
      'kcal': num(i.k), 'Proteína (g)': num(i.p), 'Carbo (g)': num(i.c), 'Gordura (g)': num(i.g), 'Dica': idx === 0 ? (o.tip || '') : ''
    }))));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 16 }, { wch: 8 }, { wch: 28 }, { wch: 32 }, { wch: 18 }, { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plano');
    XLSX.writeFile(wb, 'plano-dieta.xlsx');
  } catch (e) {
    toast(e.message || 'Não consegui gerar a planilha.');
  }
}

function historyDays() {
  const keys = Object.keys(S.days).concat(S.drinks.map((d) => d.date), S.checkins.map((c) => c.date)).filter(Boolean).sort();
  if (!keys.length) return [];
  const out = [];
  const end = todayKey();
  for (let k = keys[0]; k <= end; k = addDays(k, 1)) out.push(k);
  return out;
}
async function exportHistory() {
  const days = historyDays();
  if (!days.length) { toast('Ainda não há histórico para exportar'); return; }
  try {
    await ensureXLSX();
    const g = S.goals;
    const sim = (b) => (b ? 'sim' : 'não');
    const resumo = [], refeicoes = [], anotacoes = [];
    days.forEach((k) => {
      const d = parseKey(k);
      const dn = DIAS[d.getDay()];
      let feitas = 0, kPlano = 0, kAnot = 0, p = 0, c = 0, gg = 0;
      const textos = [];
      sortedPlan().forEach((m) => {
        const done = isDone(m, k);
        const pl = planned(m, k);
        const ns = notesOf(k, m.id);
        const intake = mealIntake(m, k);
        if (done) feitas++;
        if (done && !intake.replaced) { kPlano += pl.k; p += pl.p; c += pl.c; gg += pl.g; }
        kAnot += intake.k - (done && !intake.replaced ? pl.k : 0);
        refeicoes.push({
          'Data': k, 'Dia': dn, 'Refeição': m.name, 'Horário': m.time, 'Opção do plano': pl.name,
          'Feita': sim(done), 'Seguiu o plano': done ? sim(!intake.replaced) : '',
          'kcal do plano': done && !intake.replaced ? pl.k : '', 'Proteína (g)': done && !intake.replaced ? pl.p : '',
          'Carbo (g)': done && !intake.replaced ? pl.c : '', 'Gordura (g)': done && !intake.replaced ? pl.g : '',
          'Anotações': ns.map((n) => (NOTE_SHORT[n.type] || '') + ': ' + (n.text || '') + (num(n.kcal) ? ' (' + n.kcal + ' kcal)' : '')).join(' | ')
        });
        ns.forEach((n) => { textos.push(m.name + ' – ' + (NOTE_SHORT[n.type] || '') + ': ' + (n.text || '')); anotacoes.push({ 'Data': k, 'Refeição': m.name, 'Tipo': NOTE_TYPES[n.type] || n.type, 'O que comeu': n.text || '', 'kcal estimadas': num(n.kcal) || '' }); });
      });
      notesOf(k, FORA).forEach((n) => { kAnot += num(n.kcal); textos.push('Fora das refeições: ' + (n.text || '')); anotacoes.push({ 'Data': k, 'Refeição': 'Fora das refeições', 'Tipo': NOTE_TYPES[n.type] || n.type, 'O que comeu': n.text || '', 'kcal estimadas': num(n.kcal) || '' }); });
      const bebidas = S.drinks.filter((x) => x.date === k);
      const kBeb = bebidas.reduce((a, x) => a + num(x.kcal), 0);
      const ck = S.checkins.find((x) => x.date === k);
      const livre = notesOf(k, FORA).concat(...S.plan.map((m) => notesOf(k, m.id))).some((n) => n.type === 'livre') || S.free[weekStart(k)] === k;
      const total = kPlano + kAnot + kBeb;
      resumo.push({
        'Data': k, 'Dia': dn, 'Refeições feitas': feitas, 'Refeições no plano': S.plan.length,
        'kcal do plano': Math.round(kPlano), 'kcal anotadas': Math.round(kAnot), 'kcal de bebida alcoólica': Math.round(kBeb), 'kcal total': Math.round(total),
        'Meta kcal': num(g.kcal) || '', 'Diferença da meta': num(g.kcal) ? Math.round(total - num(g.kcal)) : '',
        'Proteína do plano (g)': Math.round(p), 'Carbo do plano (g)': Math.round(c), 'Gordura do plano (g)': Math.round(gg),
        'Refeição livre': sim(livre), 'Bebida alcoólica (ml)': bebidas.reduce((a, x) => a + x.cups * x.ml, 0),
        'Água (ml)': num(S.days[k] && S.days[k].water), 'Meta de água (ml)': num(g.agua) || '',
        'Peso (kg)': ck ? ck.peso : '', 'Cintura (cm)': ck && ck.cintura ? ck.cintura : '', 'Anotações': textos.join(' | ')
      });
    });
    const leia = [
      { 'Leia-me': 'Exportado do PersonalNutri em ' + new Date().toLocaleString('pt-BR') + '.' },
      { 'Leia-me': 'Resumo diário: uma linha por dia, inclusive dias sem nenhum registro (refeições feitas = 0).' },
      { 'Leia-me': 'kcal do plano: soma das refeições marcadas como feitas, pela opção do plano escolhida no dia. Os macros (proteína, carbo, gordura) só existem para essas refeições.' },
      { 'Leia-me': 'kcal anotadas: estimativas digitadas à mão para trocas, comida a mais, refeição livre e beliscos. Anotação sem kcal fica registrada, mas não soma.' },
      { 'Leia-me': 'Refeição sem marcação (Feita = não) deve ser tratada como pulada: o usuário revisa o dia e marca o que comeu.' },
      { 'Leia-me': 'Água: soma dos registros do dia em ml. Dia sem registro de água aparece como 0, o que pode ser só falta de registro.' },
      { 'Leia-me': 'kcal de bebida alcoólica: estimativa por tipo (cerveja 0,43 kcal/ml, vinho 0,85, destilado 2,3, drink 0,8).' },
      { 'Leia-me': 'Peso medido em jejum; cintura na altura do umbigo.' }
    ];
    const metas = [
      { 'Meta': 'Calorias/dia', 'Valor': g.kcal }, { 'Meta': 'Proteína (g)', 'Valor': g.prot }, { 'Meta': 'Carboidrato (g)', 'Valor': g.carb },
      { 'Meta': 'Gordura (g)', 'Valor': g.fat }, { 'Meta': 'Água (ml/dia)', 'Valor': g.agua }, { 'Meta': 'Peso inicial (kg)', 'Valor': g.peso }, { 'Meta': 'Peso meta (kg)', 'Valor': g.meta }
    ];
    const plano = [];
    S.plan.forEach((m) => m.opts.forEach((o) => o.items.forEach((i) => plano.push({ 'Refeição': m.name, 'Horário': m.time, 'Opção': o.name, 'Alimento': i.food, 'Quantidade': i.qty, 'kcal': num(i.k), 'Proteína (g)': num(i.p), 'Carbo (g)': num(i.c), 'Gordura (g)': num(i.g) }))));
    const wb = XLSX.utils.book_new();
    const add = (rows, name, cols) => { const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ '': 'Sem registros' }]); if (cols) ws['!cols'] = cols.map((w) => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, name); };
    add(leia, 'Leia-me', [110]);
    add(resumo, 'Resumo diário', [11, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 9, 9, 9, 9, 80]);
    add(refeicoes, 'Refeições', [11, 9, 16, 8, 26, 6, 9, 9, 9, 9, 9, 60]);
    add(anotacoes, 'Anotações', [11, 18, 16, 50, 10]);
    add(S.drinks.map((x) => ({ 'Data': x.date, 'Tipo': (DRINKS[x.type] || {}).label || x.type, 'Copos': x.cups, 'ml por copo': x.ml, 'Total (ml)': x.cups * x.ml, 'kcal estimadas': x.kcal })), 'Bebidas alcoólicas');
    add(S.checkins.map((x) => ({ 'Data': x.date, 'Peso (kg)': x.peso, 'Cintura (cm)': x.cintura || '' })), 'Check-ins');
    add(metas, 'Metas', [20, 12]);
    add(plano, 'Plano atual', [16, 8, 28, 32, 18, 6, 12, 10, 12]);
    XLSX.writeFile(wb, 'personalnutri-historico-' + todayKey() + '.xlsx');
  } catch (e) {
    toast(e.message || 'Não consegui gerar o histórico.');
  }
}

/* ---------- Ações ---------- */
const ACT = {
  theme: (el) => { S.theme = el.dataset.v; save(); },
  done: (el) => {
    const k = todayKey(); const d = dayRec(k); const id = el.dataset.meal; const m = S.plan.find((x) => x.id === id);
    d.done[id] = !d.done[id];
    if (d.done[id] && m) d.snap[id] = snapshot(m, k); else delete d.snap[id];
    save();
  },
  pickopt: (el) => {
    const k = todayKey(); const d = dayRec(k); const id = el.dataset.meal; const m = S.plan.find((x) => x.id === id);
    d.sel[id] = +el.dataset.i;
    if (d.done[id] && m) d.snap[id] = snapshot(m, k);
    save();
  },
  noteopen: (el) => { UI.note = { meal: el.dataset.meal, type: el.dataset.meal === FORA ? 'extra' : 'troca', text: '', kcal: '' }; render(); const t = document.getElementById('note-text'); if (t) t.focus(); },
  notetype: (el) => { UI.note.type = el.dataset.v; render(); },
  notecancel: () => { UI.note = null; render(); },
  notesave: () => {
    const N = UI.note; if (!N) return;
    if (!String(N.text).trim() && !num(N.kcal)) { toast('Escreva o que comeu ou as calorias'); return; }
    const k = todayKey(); const d = dayRec(k);
    (d.notes[N.meal] = d.notes[N.meal] || []).push({ id: uid(), type: N.type, text: String(N.text).trim(), kcal: num(N.kcal) || '', at: new Date().toISOString() });
    if (N.meal !== FORA && (N.type === 'troca' || N.type === 'livre')) { d.done[N.meal] = true; delete d.snap[N.meal]; }
    if (N.type === 'livre') S.free[weekStart(k)] = k;
    UI.note = null;
    save(); toast('Anotado');
  },
  notedel: (el) => {
    const k = todayKey(); const d = dayRec(k); const mid = el.dataset.meal;
    d.notes[mid] = (d.notes[mid] || []).filter((n) => n.id !== el.dataset.id);
    if (!d.notes[mid].length) delete d.notes[mid];
    save();
  },
  exporthist: () => exportHistory(),
  water: (el) => { const d = dayRec(todayKey()); d.water = Math.max(0, num(d.water) + (+el.dataset.v)); save(); },
  free: () => { const ws = weekStart(); if (S.free[ws]) delete S.free[ws]; else S.free[ws] = todayKey(); save(); },
  drinktype: (el) => { UI.drink.type = el.dataset.v; UI.drink.ml = DRINKS[el.dataset.v].ml; render(); },
  cups: (el) => { UI.drink.cups = Math.max(1, UI.drink.cups + (+el.dataset.v)); render(); },
  ml: (el) => { const st = DRINKS[UI.drink.type].step; UI.drink.ml = Math.max(st, UI.drink.ml + st * (+el.dataset.v)); render(); },
  adddrink: () => {
    const D = UI.drink;
    S.drinks.push({ id: uid(), date: todayKey(), type: D.type, cups: D.cups, ml: D.ml, kcal: drinkKcal(D.type, D.cups, D.ml) });
    UI.drink.cups = 1;
    save(); toast('Bebida alcoólica registrada');
  },
  deldrink: (el) => { S.drinks = S.drinks.filter((d) => d.id !== el.dataset.id); save(); },
  checkin: () => {
    const peso = num(document.getElementById('ck-peso').value);
    const cintura = num(document.getElementById('ck-cintura').value) || null;
    const date = document.getElementById('ck-data').value || todayKey();
    if (!peso) { toast('Informe o peso'); return; }
    S.checkins = S.checkins.filter((c) => c.date !== date).concat([{ date, peso, cintura }]).sort((a, b) => a.date.localeCompare(b.date));
    save(); toast('Check-in registrado');
  },
  delcheckin: (el) => { if (!confirm('Apagar este check-in?')) return; S.checkins = S.checkins.filter((c) => c.date !== el.dataset.date); save(); },
  editmeal: (el) => { UI.plano.meal = +el.dataset.i; render(); },
  editopt: (el) => { const m = S.plan[UI.plano.meal]; UI.plano.opt[m.id] = +el.dataset.i; render(); },
  addmeal: () => { S.plan.push({ id: uid(), name: 'Nova refeição', time: '10:00', opts: [{ name: 'Opção 1', tip: '', items: [] }] }); UI.plano.meal = S.plan.length - 1; save(); },
  delmeal: () => { const m = S.plan[UI.plano.meal]; if (!m || !confirm(`Apagar a refeição "${m.name}" e todas as opções dela?`)) return; S.plan.splice(UI.plano.meal, 1); UI.plano.meal = 0; save(); },
  addopt: () => { const m = S.plan[UI.plano.meal]; m.opts.push({ name: 'Opção ' + (m.opts.length + 1), tip: '', items: [] }); UI.plano.opt[m.id] = m.opts.length - 1; save(); },
  delopt: () => { const m = S.plan[UI.plano.meal]; const oi = UI.plano.opt[m.id] || 0; if (!confirm(`Apagar a opção "${m.opts[oi].name}"?`)) return; m.opts.splice(oi, 1); UI.plano.opt[m.id] = 0; save(); },
  additem: () => { const m = S.plan[UI.plano.meal]; const o = m.opts[UI.plano.opt[m.id] || 0]; o.items.push(it('', '', '', '', '', '')); save(); const rows = document.querySelectorAll('.item-row input[data-f="food"]'); if (rows.length) rows[rows.length - 1].focus(); },
  delitem: (el) => { const m = S.plan[UI.plano.meal]; const o = m.opts[UI.plano.opt[m.id] || 0]; o.items.splice(+el.dataset.i, 1); save(); },
  import: () => document.getElementById('file-import').click(),
  export: () => exportPlan(),
  reset: () => { if (!confirm('Trocar o plano atual pelo plano padrão?')) return; S.plan = defaultPlan(); UI.plano = { meal: 0, opt: {} }; save(); toast('Plano padrão restaurado'); },
  skipauth: () => { try { localStorage.setItem(SKIP_KEY, '1'); } catch (e) { /* ignore */ } UI.auth.msg = ''; UI.auth.info = ''; location.hash = '#hoje'; render(); },
  logout: async () => { try { localStorage.removeItem(SKIP_KEY); } catch (e) { /* ignore */ } await sb.auth.signOut(); location.hash = '#entrar'; toast('Você saiu. Os dados continuam neste aparelho.'); },
  syncnow: async () => { await pull(); toast(UI.sync || 'Sincronizado'); }
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !ACT[el.dataset.act]) return;
  e.preventDefault();
  ACT[el.dataset.act](el, e);
});
const FORMS = { login: doLogin, signup: doSignup, recover: doRecover, newpass: doNewPass };
document.addEventListener('submit', (e) => {
  const f = e.target.dataset && FORMS[e.target.dataset.form];
  if (!f) return;
  e.preventDefault();
  if (sb) f();
});
window.addEventListener('hashchange', () => { if (AUTH_ROUTES.includes(route().name)) { UI.auth.msg = ''; UI.auth.info = ''; } }, true);
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.id && el.id.startsWith('auth-')) { UI.auth.f[el.id] = el.value; return; }
  if (el.dataset && el.dataset.in === 'note') { if (UI.note) UI.note[el.dataset.f] = el.value; return; }
  const kind = el.dataset && el.dataset.in;
  if (!kind) return;
  if (kind === 'goal') {
    S.goals[el.dataset.k] = el.type === 'number' ? (el.value === '' ? '' : num(el.value)) : el.value;
    save({ render: false });
    return;
  }
  const m = S.plan[UI.plano.meal];
  if (!m) return;
  if (kind === 'meal') { m[el.dataset.f] = el.value; save({ render: false }); return; }
  const o = m.opts[UI.plano.opt[m.id] || 0];
  if (!o) return;
  if (kind === 'opt') { o[el.dataset.f] = el.value; save({ render: false }); return; }
  if (kind === 'item') {
    const f = el.dataset.f;
    o.items[+el.dataset.i][f] = ['k', 'p', 'c', 'g'].includes(f) ? (el.value === '' ? '' : num(el.value)) : el.value;
    save({ render: false });
    refreshTotals();
  }
});
document.addEventListener('change', (e) => {
  if (!(e.target.dataset && e.target.dataset.in === 'goal')) return;
  setTimeout(() => { const a = document.activeElement; if (!(a && a.dataset && a.dataset.in === 'goal')) render(); }, 0);
});
document.getElementById('file-import').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (f) importFile(f);
});
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

/* Recarrega quando volta para o app em outro dia ou depois de editar em outro aparelho */
let lastDay = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (UI.auth.user) pull();
  if (todayKey() !== lastDay) { lastDay = todayKey(); render(); }
});

render();
initAuth();
