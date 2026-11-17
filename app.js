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
/* Observações fixas de refeições (aparecem no card em Hoje e se editam em Plano) */
const NOTE_LANCHE = 'Este lanche já é o pré-treino: coma 1 a 2 horas antes de treinar e não coma mais nada até o treino. O iogurte fica no café da manhã, longe do treino.';
const NOTE_CEIA = 'Depois da janta, só uma fruta leve: 1/2 mamão papaia, 1 kiwi, 10 morangos ou 1 maçã (35 a 70 kcal). Escolha uma, não precisa somar.';
const RULE_FRUTA = 'Depois da janta, se bater fome, só uma fruta leve: 1/2 mamão papaia, 1 kiwi, 10 morangos ou 1 maçã (35 a 70 kcal).';
const NOTE_POS_JANTA = 'Depois da janta, se bater fome: uma fruta leve. 1/2 mamão papaia, 1 kiwi, 10 morangos ou 1 maçã (35 a 70 kcal). Se comer, registre em "+ Anotar" › Comi a mais.';
/* Opções do lanche da tarde (pré-treino): ~290 a 330 kcal, 23 a 28 g de proteína, carbo de digestão fácil e pouca gordura */
const LANCHE_OPTS = () => [
  { name: 'Sanduíche', tip: '', items: [it('Pão integral', '2 fatias', 125, 5, 22, 2), it('Queijo mussarela', '1 fatia', 60, 4, 0, 5), it('Peito de peru ou frango desfiado', '60 g', 65, 12, 1, 1), it('Banana', '1 unidade', 90, 1, 23, 0)] },
  { name: 'Wrap de frango', tip: 'Dá para deixar o frango desfiado pronto na geladeira para a semana.', items: [it('Rap10 integral', '1 unidade', 115, 3, 19, 3), it('Frango desfiado', '60 g', 98, 19, 0, 2), it('Requeijão light', '1 col. sopa · 15 g', 28, 2, 1, 2), it('Banana', '1 unidade', 90, 1, 23, 0)] },
  { name: 'Crepioca de frango', tip: 'Tapioca e ovo batidos, recheio de frango desfiado. Opção do plano da nutricionista.', items: [it('Tapioca', '2 col. sopa · 30 g', 100, 0, 25, 0), it('Ovo', '1 unidade', 72, 6, 0, 5), it('Frango desfiado', '50 g', 82, 16, 0, 2), it('Fruta', '1 unidade', 70, 1, 18, 0)] },
  { name: 'Shake pré-treino', tip: 'Para dias corridos. Whey batido com água, não com leite: digere mais rápido antes do treino.', items: [it('Whey protein', '1 dose', 120, 24, 3, 2), it('Banana', '1 unidade', 90, 1, 23, 0), it('Aveia em flocos', '2 col. sopa · 20 g', 79, 3, 13, 2)] }
];
function defaultPlan() {
  return [
    { id: 'cafe', name: 'Café da manhã', time: '07:00', opts: [
      { name: 'Shake', tip: 'Bata tudo junto, com o iogurte. Fruta: banana, maçã, 8 morangos ou 1/2 manga.', items: [it('Whey protein', '1 dose', 120, 24, 3, 2), it('Leite desnatado', '300 ml', 105, 10, 15, 1), it('Iogurte natural', '1 pote · 170 g', 105, 7, 9, 6), it('Fruta', '1 unidade', 90, 1, 23, 0)] },
      { name: 'Panqueca de banana', tip: 'Amasse a banana, misture os ovos e o farelo e doure em fogo baixo.', items: [it('Banana', '1 unidade', 90, 1, 23, 0), it('Ovos', '2 unidades', 145, 13, 1, 10), it('Farelo de aveia', '3 col. sopa · 33 g', 85, 6, 18, 2)] },
      { name: 'Crepioca', tip: '', items: [it('Tapioca', '3 col. sopa · 45 g', 155, 0, 38, 0), it('Ovos', '2 unidades', 145, 13, 1, 10), it('Requeijão light', '1 col. sopa · 20 g', 40, 2, 1, 2)] },
      { name: 'Ovos mexidos', tip: 'Frigideira antiaderente, sem óleo ou com um fio de azeite. A proteína fica abaixo do shake (23 g contra 42 g); para compensar, junte 2 claras.', items: [it('Ovos mexidos', '3 unidades', 215, 19, 2, 15), it('Tomate picado', '1/2 unidade', 10, 0, 2, 0), it('Cebola picada', '1 col. sopa', 5, 0, 1, 0), it('Pão integral', '1 fatia', 63, 3, 11, 1), it('Fruta', '1 unidade', 70, 1, 18, 0)] }
    ] },
    { id: 'almoco', name: 'Almoço', time: '12:00', opts: opcoesAlmoco() },
    { id: 'pre', name: 'Lanche da tarde', time: '16:00', opts: LANCHE_OPTS() },
    { id: 'jantar', name: 'Jantar', time: '21:00', opts: opcoesAlmoco() },
    { id: 'ceia', name: 'Ceia', time: '22:30', opts: [
      { name: 'Mamão', tip: '', items: [it('Mamão papaia', '1/2 unidade', 60, 1, 15, 0)] },
      { name: 'Kiwi', tip: '', items: [it('Kiwi', '1 unidade', 45, 1, 11, 0)] },
      { name: 'Morangos', tip: '', items: [it('Morangos', '10 unidades', 35, 1, 8, 0)] },
      { name: 'Maçã', tip: '', items: [it('Maçã', '1 unidade', 70, 0, 19, 0)] }
    ] }
  ];
}
/* Observações do plano (vieram do plano da nutricionista). A refeição livre semanal é fixa e aparece à parte. */
const DEFAULT_RULES = ['Não pular refeições, mesmo que atrase um pouco.', 'Evitar ultraprocessados.', 'Quando der, preferir alimentos integrais, com mais fibra.', RULE_FRUTA];
const DEFAULT_GOALS = { kcal: 1860, prot: 175, carb: 205, fat: 40, agua: 2700, peso: 81, meta: '' };
const DRINKS = {
  cerveja: { label: 'Cerveja', k: 0.43, ml: 350, step: 50 },
  vinho: { label: 'Vinho', k: 0.85, ml: 150, step: 25 },
  destilado: { label: 'Destilado', k: 2.3, ml: 50, step: 25 },
  drink: { label: 'Drink', k: 0.8, ml: 300, step: 50 }
};

/* Lista de compras: modo auto (pelas opções comidas nas últimas 2 semanas) ou manual; dia da semana das compras (0 = domingo, -1 = sem dia) */
const DEFAULT_SHOP = { mode: 'auto', day: 6, days: 7, opt: {} };
function defaultState() {
  return { v: 2, updatedAt: 0, plan: defaultPlan(), rules: DEFAULT_RULES.slice(), goals: { ...DEFAULT_GOALS }, days: {}, free: {}, freeU: {}, drinks: [], checkins: [], tomb: {}, deals: {}, planU: 0, rulesU: 0, goalsU: 0, shop: { ...DEFAULT_SHOP }, shopU: 0 };
}
function normalizeState(x) {
  const d = defaultState();
  if (!x || typeof x !== 'object') return d;
  return {
    ...d, ...x,
    goals: (({ data, ...rest }) => rest)({ ...d.goals, ...(x.goals || {}) }),
    plan: Array.isArray(x.plan) ? x.plan : d.plan,
    rules: Array.isArray(x.rules) ? x.rules : d.rules,
    shop: { ...d.shop, ...(x.shop || {}) },
    mig: x.mig || {},
    days: x.days || {}, free: x.free || {}, freeU: x.freeU || {}, tomb: x.tomb || {}, deals: x.deals || {},
    drinks: Array.isArray(x.drinks) ? x.drinks : [],
    checkins: Array.isArray(x.checkins) ? x.checkins : []
  };
}
function loadLocal() {
  try { return normalizeState(JSON.parse(localStorage.getItem(LS_KEY))); } catch (e) { return defaultState(); }
}

/* Migrações do plano salvo. O plano padrão (defaultPlan) só vale para quem começa do zero;
   opções novas que entram nele são levadas uma vez para o plano de quem já usa o app.
   Se a pessoa apagar a opção depois, ela não volta (fica marcado em S.mig). */
function migratePlan() {
  S.mig = S.mig || {};
  let changed = false;
  if (!S.mig.ovos) {
    S.mig.ovos = 1;
    const cafe = S.plan.find((m) => m.id === 'cafe') || S.plan.find((m) => /caf[eé] da manh/i.test(m.name));
    const ref = defaultPlan()[0].opts.find((o) => o.name === 'Ovos mexidos');
    if (cafe && ref && !cafe.opts.some((o) => /ovo/i.test(o.name))) { cafe.opts.push(JSON.parse(JSON.stringify(ref))); changed = true; }
    /* Carimbo só um pouco maior: se outro aparelho editou o plano depois, a edição dele vence e a migração roda de novo sobre ela */
    S.planU = (S.planU || 0) + 1;
  }
  /* Tarde com uma refeição só. Funciona sobre o plano antigo (Pré-treino 15:30 + Lanche 17:00 com iogurte)
     e sobre o plano que já passou pela primeira versão desta migração (mig.lanche). */
  if (!S.mig.lanche2) {
    S.mig.lanche2 = 1;
    const ref = defaultPlan();
    const hasIog = (o) => o.items.some((i) => /iogurte/i.test(i.food));
    /* 1. A refeição de antes do treino vira o Lanche da tarde, às 16h, com a nota */
    const lanche = S.plan.find((m) => /lanche da tarde/i.test(m.name)) || S.plan.find((m) => /pr[eé].?treino/i.test(m.name)) || S.plan.find((m) => m.id === 'pre');
    if (lanche) {
      if (lanche.name !== 'Lanche da tarde') { lanche.name = 'Lanche da tarde'; changed = true; }
      if (lanche.time !== '16:00') { lanche.time = '16:00'; changed = true; }
      if (!lanche.note) { lanche.note = NOTE_LANCHE; changed = true; }
      /* 2. Sai o lanche extra da tarde que só tem iogurte (o iogurte volta para o shake) */
      const extra = S.plan.filter((m) => m !== lanche && /lanche/i.test(m.name) && m.opts.length && m.opts.every(hasIog));
      if (extra.length) { S.plan = S.plan.filter((m) => !extra.includes(m)); changed = true; }
    }
    /* 3. Iogurte no shake do café */
    const cafe = S.plan.find((m) => m.id === 'cafe') || S.plan.find((m) => /caf[eé] da manh/i.test(m.name));
    const shake = cafe && cafe.opts.find((o) => /shake/i.test(o.name));
    if (shake && !hasIog(shake)) {
      const iog = ref[0].opts[0].items.find((i) => /iogurte/i.test(i.food));
      const at = shake.items.findIndex((i) => /leite/i.test(i.food));
      shake.items.splice(at >= 0 ? at + 1 : shake.items.length, 0, { ...iog });
      if (!/iogurte/i.test(shake.tip || '')) shake.tip = ref[0].opts[0].tip;
      changed = true;
    }
    /* 4. Frutas de depois da janta: na Ceia, se existir; se não, como nota no Jantar */
    const ceia = S.plan.find((m) => m.id === 'ceia') || S.plan.find((m) => /ceia/i.test(m.name));
    const jantar = S.plan.find((m) => m.id === 'jantar') || S.plan.find((m) => /jantar|janta/i.test(m.name));
    if (ceia && !ceia.note) {
      ceia.note = NOTE_CEIA;
      ceia.opts.forEach((o) => { if (/troque à vontade entre as opções/i.test(o.tip || '')) o.tip = ''; });
      changed = true;
    } else if (!ceia && jantar && !jantar.note) { jantar.note = NOTE_POS_JANTA; changed = true; }
    S.planU = (S.planU || 0) + 1;
  }
  /* Lanche da tarde: o pão com doce sai (pouca proteína) e entram opções equivalentes ao sanduíche.
     A troca acontece na mesma posição, porque a opção escolhida em cada dia é guardada pela posição. */
  if (!S.mig.lanche3) {
    S.mig.lanche3 = 1;
    const lanche = S.plan.find((m) => /lanche da tarde/i.test(m.name)) || S.plan.find((m) => m.id === 'pre');
    if (lanche) {
      const novas = LANCHE_OPTS().slice(1);
      const doce = lanche.opts.findIndex((o) => /doce de leite|geleia/i.test(o.name));
      if (doce >= 0) { lanche.opts[doce] = novas[0]; changed = true; }
      novas.forEach((o) => { if (!lanche.opts.some((x) => x.name === o.name)) { lanche.opts.push(o); changed = true; } });
    }
    S.planU = (S.planU || 0) + 1;
  }
  /* Observações das refeições saem do card: a do pré-treino some e a da fruta depois da janta vira regra do plano */
  if (!S.mig.notas) {
    S.mig.notas = 1;
    const old = [NOTE_LANCHE, NOTE_CEIA, NOTE_POS_JANTA];
    S.plan.forEach((m) => { if (m.note && old.includes(m.note)) { delete m.note; changed = true; } });
    if (!S.rules.some((r) => /fruta leve/i.test(r))) { S.rules.push(RULE_FRUTA); S.rulesU = (S.rulesU || 0) + 1; changed = true; }
    S.planU = (S.planU || 0) + 1;
  }
  return changed;
}

/* ---------- Preferências deste aparelho (não sincronizam) ---------- */
const THEME_KEY = 'personalnutri_tema';
const REMIND_KEY = 'personalnutri_lembretes';
const SHOP_KEY = 'personalnutri_compras';
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch (e) { return fb; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento bloqueado */ } };
/* Treinos lidos do TreinoHoje (mesma conta, mesmo Supabase). Só leitura: o PersonalNutri nunca grava lá. */
const TREINO_KEY = 'personalnutri_treinos';
const TREINO_TABLE = 'treinohoje';
let TREINOS = lsGet(TREINO_KEY, null);
const treinosDe = (k) => (TREINOS && TREINOS.days && TREINOS.days[k]) || [];
async function fetchTreinos(force) {
  if (!sb || !UI.auth.user) return;
  if (!force && TREINOS && TREINOS.uid === UI.auth.user.id && Date.now() - (TREINOS.at || 0) < 10 * 60000) return;
  try {
    const { data, error } = await sb.from(TREINO_TABLE).select('dados').eq('user_id', UI.auth.user.id).maybeSingle();
    if (error) throw error;
    const days = data ? Core.treinosPorDia(data.dados) : {};
    TREINOS = { uid: UI.auth.user.id, at: Date.now(), found: !!data, days };
  } catch (e) {
    TREINOS = { ...(TREINOS || {}), uid: UI.auth.user.id, at: Date.now(), err: (e && e.message) || 'erro' };
  }
  lsSet(TREINO_KEY, TREINOS);
}

/* ---------- Estado ---------- */
let S = loadLocal();
const PREF = {
  theme: lsGet(THEME_KEY, null) || S.theme || 'auto',
  remind: { on: false, before: 0, water: 0, ...(lsGet(REMIND_KEY, {}) || {}) },
  shop: { got: {}, ...(lsGet(SHOP_KEY, {}) || {}) }
};
if (PREF.shop.days && !S.shopU) { S.shop.days = PREF.shop.days; S.shop.opt = PREF.shop.opt || {}; }
delete PREF.shop.days; delete PREF.shop.opt;
if (migratePlan()) { S.updatedAt = Date.now(); try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
if (lsGet(THEME_KEY, null) === null) lsSet(THEME_KEY, PREF.theme);
delete S.theme;
const UI = {
  plano: { meal: 0, opt: {} },
  planTab: 'refeicoes',
  metasOpen: false,
  shopEdit: null,
  shopAdd: false,
  drink: { type: 'cerveja', cups: 1, ml: DRINKS.cerveja.ml },
  auth: { user: null, ready: false, msg: '', info: '', busy: false, recovery: false, f: {} },
  sync: '',
  note: null,
  pick: null,
  day: null,
  wk: 0,
  prog: 'corpo',
  pw: 4,
  pday: null,
  pcell: null,
  dealEdit: false,
  review: null,
  pt: null,
  flash: null,
  photos: {},
  lastRoute: ''
};
const MAX_BACK = 60;
/* Dia que as telas Hoje, Refeição e Macros mostram e editam (hoje, por padrão) */
function curDay() {
  const t = todayKey();
  if (!UI.day || UI.day > t || UI.day < addDays(t, -MAX_BACK)) UI.day = t;
  return UI.day;
}
function dayTitle(k) {
  const t = todayKey();
  if (k === t) return 'Hoje';
  if (k === addDays(t, -1)) return 'Ontem';
  return DIAS[parseKey(k).getDay()];
}
function dayNav(k) {
  const t = todayKey();
  const canBack = k > addDays(t, -MAX_BACK);
  const isToday = k === t;
  return `<span class="daynav"><button type="button" class="daynav-btn" data-act="day" data-v="-1" aria-label="Dia anterior" ${canBack ? '' : 'disabled'}>${svg('<path d="M15 5l-7 7 7 7"/>', 18)}</button><span>${esc(longDate(k))}</span><button type="button" class="daynav-btn" data-act="day" data-v="1" aria-label="Próximo dia" ${isToday ? 'disabled' : ''}>${svg('<path d="M9 5l7 7-7 7"/>', 18)}</button>${isToday ? '' : '<button type="button" class="daynav-today" data-act="day" data-v="0">Ir para hoje</button>'}</span>`;
}
function changeDay(v) {
  const t = todayKey();
  const next = v === 0 ? t : addDays(curDay(), v);
  if (next > t || next < addDays(t, -MAX_BACK)) return;
  UI.day = next;
  UI.note = null; UI.pick = null; UI.review = null;
  render();
}

/* touch: quais partes mudaram ('plan', 'rules', 'goals'), para a sincronização saber qual versão vale */
function save(opts) {
  const o = opts || {};
  const now = Date.now();
  S.updatedAt = now;
  [].concat(o.touch || []).forEach((t) => { S[t + 'U'] = now; });
  Core.pruneTombs(S, now);
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* armazenamento cheio ou bloqueado */ }
  if (UI.auth.user) schedulePush();
  if (o.render !== false) render();
}
const bury = (key) => { S.tomb[key] = Date.now(); };
const unbury = (key) => { delete S.tomb[key]; };

/* ---------- Utilidades ---------- */
const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const { num, pad, keyOf, parseKey, todayKey, addDays, weekStart, daysBetween, sum, ZERO, FORA } = Core;
const nf = (n, d = 0) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const longDate = (k) => { const d = parseKey(k); return DIAS[d.getDay()] + ', ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
const ddmm = (k) => { const d = parseKey(k); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = (x) => JSON.parse(JSON.stringify(x));

/* Aviso rápido. Com action, mostra um botão (ex.: Desfazer) e fica mais tempo na tela. */
function toast(msg, opts) {
  const o = opts || {};
  const el = document.getElementById('toast');
  el.innerHTML = `<span>${esc(msg)}</span>${o.action ? `<button type="button" class="toast-btn">${esc(o.action)}</button>` : ''}`;
  el.classList.toggle('has-action', !!o.action);
  if (o.action) el.querySelector('button').addEventListener('click', () => { el.classList.remove('show'); clearTimeout(toast.t); o.fn(); });
  el.classList.add('show');
  clearTimeout(toast.t);
  if (!o.sticky) toast.t = setTimeout(() => el.classList.remove('show'), o.action ? 6000 : 2600);
}
const undoable = (msg, fn) => toast(msg, { action: 'Desfazer', fn });

/* Caixa de confirmação no lugar do confirm() do navegador */
function ask(msg, opts) {
  const o = opts || {};
  return new Promise((resolve) => {
    const box = document.getElementById('modal');
    const prev = document.activeElement;
    box.innerHTML = `<div class="modal-bg" data-x="0"><div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="modal-t">
      ${o.title ? `<div class="meal-name">${esc(o.title)}</div>` : ''}<div id="modal-t" class="modal-msg">${esc(msg)}</div>
      <div class="toolbar end"><button type="button" class="btn small ghost" data-x="0">Cancelar</button><button type="button" class="btn small ${o.danger ? 'danger-solid' : ''}" data-x="1">${esc(o.ok || 'Confirmar')}</button></div></div></div>`;
    const close = (v) => { box.innerHTML = ''; document.removeEventListener('keydown', key, true); if (prev && prev.focus) prev.focus(); resolve(v); };
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Tab') { const b = [...box.querySelectorAll('button')]; const i = b.indexOf(document.activeElement); e.preventDefault(); b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus(); }
    };
    document.addEventListener('keydown', key, true);
    box.querySelector('.modal-bg').addEventListener('click', (e) => { const x = e.target.dataset.x; if (x !== undefined) close(x === '1'); });
    box.querySelector('[data-x="1"]').focus();
  });
}

function dayRec(k) {
  if (!S.days[k]) S.days[k] = {};
  const d = S.days[k];
  d.sel = d.sel || {}; d.done = d.done || {}; d.snap = d.snap || {}; d.notes = d.notes || {}; d.byNote = d.byNote || {};
  d.u = Date.now();
  return d;
}
function dropReplacements(k, mid) {
  const d = dayRec(k);
  const had = (d.notes[mid] || []).some((n) => n.type === 'livre');
  d.notes[mid] = (d.notes[mid] || []).filter((n) => n.type !== 'troca' && n.type !== 'livre');
  if (!d.notes[mid].length) delete d.notes[mid];
  if (had) releaseFree(k);
}
function setFree(ws, k) { S.free[ws] = k; S.freeU[ws] = Date.now(); unbury('f:' + ws); }
function clearFree(ws) { delete S.free[ws]; delete S.freeU[ws]; bury('f:' + ws); }
/* Libera a refeição livre da semana se nenhuma outra anotação de livre continuar nessa semana */
function releaseFree(k) {
  const ws = weekStart(k);
  for (let i = 0; i < 7; i++) {
    const day = S.days[addDays(ws, i)];
    if (day && day.notes && Object.values(day.notes).some((arr) => arr.some((n) => n.type === 'livre'))) return;
  }
  if (S.free[ws]) clearFree(ws);
}
const NOTE_TYPES = { troca: 'Comi outra coisa', extra: 'Comi a mais', livre: 'Refeição livre' };
const NOTE_SHORT = { troca: 'Troca', extra: 'A mais', livre: 'Refeição livre' };
/* Categoria obrigatória de "comi a mais": é ela que mostra o padrão em Progresso › Alimentação */
const NOTE_CATS = { doce: 'Doce', bebida: 'Bebida', salgado: 'Salgado ou fast food', porcao: 'Porção maior' };
const catTxt = (n) => (n.type === 'extra' && NOTE_CATS[n.cat] ? ' (' + NOTE_CATS[n.cat].toLowerCase() + ')' : '');
/* Versões das funções do core.js presas ao estado atual */
const notesOf = (k, mid) => Core.notesOf(S, k, mid);
const optIndex = (meal, k = todayKey()) => Core.optIndex(S, meal, k);
const isDone = (meal, k = todayKey()) => Core.isDone(S, meal, k);
const sortedPlan = () => Core.sortedPlan(S);
const planned = (m, k = todayKey()) => Core.planned(S, m, k);
const mealsOfDay = (k) => Core.mealsOfDay(S, k);
const mealIntake = (m, k) => Core.mealIntake(S, m, k);
const consumed = (k = todayKey()) => Core.consumed(S, k);
const doneCount = (k = todayKey()) => Core.doneCount(S, k);
function snapshot(m, k) {
  const o = m.opts[optIndex(m, k)];
  if (!o) return null;
  const x = sum(o.items);
  return { name: o.name, k: x.k, p: x.p, c: x.c, g: x.g, meal: m.name, time: m.time };
}
function planDefaultTotals() {
  return S.plan.reduce((a, m) => { const x = m.opts.length ? sum(m.opts[0].items) : ZERO(); return { k: a.k + x.k, p: a.p + x.p, c: a.c + x.c, g: a.g + x.g }; }, ZERO());
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
  compras: svg('<path d="M3 4h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>'),
  fogo: svg('<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.6.3 1.6 1.2 2.6 2.2 2.6-.6-2.8-.2-5.6.8-8z"/>', 14),
  camera: svg('<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', 18),
  busca: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 16),
  copiar: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', 16),
  back: svg('<path d="M15 5l-7 7 7 7"/>', 18),
  check: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>', 16),
  chev: svg('<path d="M9 6l6 6-6 6"/>', 18),
  lapis: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', 16),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 18),
  brand: svg('<path d="M3 3v4.5a1.5 1.5 0 0 0 3 0V3M4.5 9v12"/><path d="M21 3c-1.6 1-2.2 3-2.2 6.5H21V21"/><circle cx="12" cy="12" r="5"/><path d="M9.6 13.2h4.8M10.2 13.2a1.8 1.8 0 0 1 3.6 0"/>', 20),
  brandBig: svg('<path d="M3 3v4.5a1.5 1.5 0 0 0 3 0V3M4.5 9v12"/><path d="M21 3c-1.6 1-2.2 3-2.2 6.5H21V21"/><circle cx="12" cy="12" r="5"/><path d="M9.6 13.2h4.8M10.2 13.2a1.8 1.8 0 0 1 3.6 0"/>', 30)
};

/* ---------- Estrutura ---------- */
const TABS = [['hoje', 'Hoje'], ['progresso', 'Progresso'], ['plano', 'Plano']];
const SIDE = [['hoje', 'Hoje'], ['macros', 'Macros'], ['progresso', 'Progresso'], ['plano', 'Plano']];
function route() {
  const h = (location.hash || '#hoje').slice(1).split('/');
  return { name: h[0] || 'hoje', arg: h[1] ? decodeURIComponent(h[1]) : '' };
}
function navKey(r) { return r.name === 'refeicao' ? 'hoje' : r.name === 'macros' ? (matchMedia('(min-width: 900px)').matches ? 'macros' : 'hoje') : r.name; }

/* Tema: automático (segue o sistema), claro ou escuro. Fica só neste aparelho. */
const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : { matches: false, addEventListener() {} };
const resolvedTheme = () => (PREF.theme === 'auto' ? (darkMQ.matches ? 'dark' : 'light') : PREF.theme);
function applyTheme() {
  const t = resolvedTheme();
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'dark' ? '#1B1E24' : '#F2F4F7');
}
darkMQ.addEventListener && darkMQ.addEventListener('change', () => { if (PREF.theme === 'auto') applyTheme(); });
function themePill() {
  const opts = [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']];
  return `<div class="pill" role="group" aria-label="Tema">${opts.map(([v, l]) => `<button type="button" data-act="theme" data-v="${v}" aria-pressed="${PREF.theme === v}">${l}</button>`).join('')}</div>`;
}
function header(title, sub, back) {
  return `<header class="top"><div class="top-left">${back ? `<a class="back" href="${back[0]}">${I.back}${esc(back[1])}</a>` : ''}${sub ? `<div class="sub">${sub}</div>` : ''}<h1>${esc(title)}</h1></div>
  <div class="top-actions"><a class="icon-btn only-mobile" href="#conta" aria-label="Conta, tema e lembretes">${I.conta}</a></div></header>`;
}
function sidebar(r) {
  const k = navKey(r);
  return `<aside class="sidebar"><div class="brand"><div class="brand-mark">${I.brand}</div><span class="brand-name">${esc(APP_NAME)}</span></div>
  <nav class="side-nav" aria-label="Principal">${SIDE.map(([id, label]) => `<a class="side-link ${k === id ? 'on' : ''}" href="#${id}" ${k === id ? 'aria-current="page"' : ''}>${I[id]}${label}</a>`).join('')}</nav>
  <div class="side-bottom"><a class="side-link ${k === 'conta' ? 'on' : ''}" href="#conta">${I.conta}Conta e ajustes</a><div class="small muted" style="padding: 0 12px" data-sync>${esc(UI.sync)}</div></div></aside>`;
}
function tabbar(r) {
  const k = navKey(r);
  return `<nav class="tabbar" aria-label="Principal">${TABS.map(([id, label]) => `<a class="tab ${k === id ? 'on' : ''}" href="#${id}" ${k === id ? 'aria-current="page"' : ''}>${I[id]}${label}</a>`).join('')}</nav>`;
}

const AUTH_ROUTES = ['entrar', 'criar-conta', 'recuperar'];
const skipAuth = () => { try { return localStorage.getItem(SKIP_KEY) === '1'; } catch (e) { return false; } };
function render() {
  const r = route();
  applyTheme();
  document.title = APP_NAME;
  if (sb && !UI.auth.ready) { $app.innerHTML = `<div class="splash">${authBrand()}</div>`; return; }
  if (UI.auth.recovery) { $app.innerHTML = authView('nova-senha'); return; }
  if (UI.auth.user && AUTH_ROUTES.includes(r.name)) { location.replace('#hoje'); return; }
  if (AUTH_ROUTES.includes(r.name)) { $app.innerHTML = authView(r.name); return; }
  const offlineSession = !navigator.onLine && hasStoredSession();
  if (sb && !UI.auth.user && !offlineSession && !skipAuth()) { $app.innerHTML = authView('entrar'); return; }
  /* Endereços antigos: Compras virou parte de Plano e Extras foi para "Fora das refeições", em Hoje */
  if (r.name === 'compras') { UI.planTab = 'compras'; location.replace('#plano'); return; }
  if (r.name === 'extras') { location.replace('#hoje'); return; }
  const views = { hoje: viewHoje, refeicao: viewRefeicao, macros: viewMacros, progresso: viewProgresso, plano: viewPlano, conta: viewConta };
  const fn = views[r.name] || viewHoje;
  const narrow = ['refeicao', 'conta'].includes(r.name) || (r.name === 'plano' && UI.planTab === 'compras') ? ' narrow' : '';
  const key = r.name + '/' + r.arg;
  const enter = key !== UI.lastRoute ? ' enter' : '';
  UI.lastRoute = key;
  $app.innerHTML = `<div class="shell">${sidebar(r)}<main class="main"><div class="content${narrow}${enter}">${fn(r.arg)}</div></main>${tabbar(r)}</div>`;
  UI.flash = null;
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
function weekGrid(ws = weekStart()) {
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
function ring(pct, size = 124, stroke = 11) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, h = size / 2;
  const over = pct > 1.05;
  const off = c * (1 - Math.min(1, Math.max(0, pct)));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="var(--row)" stroke-width="${stroke}"/><circle class="ring-val" cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${over ? 'var(--o)' : 'var(--pri)'}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" style="--c:${c.toFixed(1)}" transform="rotate(-90 ${h} ${h})"/></svg>`;
}
/* Sequências de dias cumprindo a proteína, a água e o plano inteiro */
function streakPills(k) {
  if (k !== todayKey()) return '';
  const list = [['prot', 'batendo proteína'], ['agua', 'batendo a água'], ['plano', 'seguindo o plano']]
    .map(([id, l]) => [Core.streak(S, id, k), l]).filter(([n]) => n >= 2);
  return list.length ? `<div class="streaks">${list.map(([n, l]) => `<span class="streak">${I.fogo}${n} dias ${l}</span>`).join('')}</div>` : '';
}
/* Cartão principal do dia: anel das calorias e os três macros */
function heroCard(k) {
  const c = consumed(k);
  const g = S.goals;
  const goal = num(g.kcal);
  const rest = Math.round(goal - c.k);
  const mini = (label, v, gv, color) => { const pct = num(gv) ? Math.min(100, Math.round(v / num(gv) * 100)) : 0; return `<div class="mini-macro"><div class="between"><span>${label}</span><span class="muted"><strong class="num">${nf(v)}</strong> / ${num(gv) ? nf(gv) : '—'} g</span></div><div class="bar thin"><div style="width:${pct}%;background:${color}"></div></div></div>`; };
  return `<section class="card hero" aria-label="Resumo do dia">
    <a class="hero-ring" href="#macros" aria-label="${nf(c.k)} de ${nf(goal)} kcal. Ver macros">${ring(goal ? c.k / goal : 0)}<span class="ring-in"><span class="num">${nf(c.k)}</span><span class="small muted">de ${nf(goal)} kcal</span></span></a>
    <div class="hero-side">
      <div class="hero-rest ${rest < 0 ? 'over' : ''}">${goal ? (rest >= 0 ? `Faltam <strong>${nf(rest)}</strong> kcal` : `<strong>${nf(-rest)}</strong> kcal acima da meta`) : 'Defina a meta de calorias em Macros'}</div>
      ${mini('Proteína', c.p, g.prot, 'var(--mp)')}${mini('Carbo', c.c, g.carb, 'var(--mc)')}${mini('Gordura', c.g, g.fat, 'var(--mg)')}
      ${c.drink ? `<div class="small muted">Inclui ≈ ${nf(c.drink)} kcal de bebida alcoólica</div>` : ''}
    </div>
    ${streakPills(k)}
    <div class="hero-foot"><span>${doneCount(k)} de ${S.plan.length} refeições</span><a href="#macros">Ver macros</a></div>
  </section>`;
}
function weekSummary(ws, compact) {
  const w = Core.weekStats(S, ws);
  const g = S.goals;
  const L = (v) => (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const tile = (v, l, sub) => `<div class="tile sum"><span class="num">${v}</span><span>${l}</span>${sub ? `<span class="tile-sub">${sub}</span>` : ''}</div>`;
  if (!w.days) return '<div class="small muted">A semana ainda não começou.</div>';
  const wd = w.weightDelta;
  return `<div class="grid4 sum-grid">
      ${tile(Math.round(w.adherence * 100) + '%', 'do plano', `${w.done} de ${w.possible} refeições`)}
      ${tile(w.logged ? nf(w.avgK) : '—', 'kcal/dia', num(g.kcal) ? 'meta ' + nf(g.kcal) : '')}
      ${tile(w.logged ? nf(w.avgP) + ' g' : '—', 'proteína/dia', w.logged ? `${w.protOk} de ${w.logged} dias na meta` : '')}
      ${tile(w.logged ? L(w.avgWater) + ' L' : '—', 'água/dia', num(g.agua) ? 'meta ' + L(num(g.agua)) + ' L' : '')}
    </div>
    ${compact ? '' : `<div class="sum-line small"><span>Peso: <strong>${w.weight ? nf(w.weight, 1) + ' kg' : 'sem pesagem'}</strong>${wd !== null ? ` (${wd > 0 ? '+' : ''}${nf(wd, 1)} kg)` : ''}</span><span>Bebida: <strong>${nf(w.drinkMl)} ml</strong></span><span>Refeição livre: <strong>${w.free ? 'usada' : 'não usada'}</strong></span></div>`}
    ${w.logged < w.days ? `<div class="small muted">Médias dos ${w.logged} ${w.logged === 1 ? 'dia' : 'dias'} com registro, de ${w.days}.</div>` : ''}`;
}
/* Medidas com fita: cintura toda semana; as outras a cada 2 a 4 semanas */
const MEDIDAS = [
  { id: 'cintura', label: 'Cintura', how: 'Na altura do umbigo, com a barriga relaxada, no fim de uma expiração normal. Não encolha a barriga.' },
  { id: 'peito', label: 'Peito', how: 'Na linha dos mamilos, com os braços soltos ao lado do corpo, no fim da expiração. Confira no espelho se a fita está reta nas costas.' },
  { id: 'braco', label: 'Braço', how: 'Braço direito contraído: cotovelo dobrado a 90°, punho fechado, bíceps apertado. Meça na parte mais alta do bíceps.' },
  { id: 'coxa', label: 'Coxa', how: 'Coxa direita, em pé com o peso nas duas pernas e o músculo relaxado. Meça no ponto mais grosso, logo abaixo do glúteo.' },
  { id: 'quadril', label: 'Quadril', how: 'No ponto mais largo do bumbum, com os pés juntos e a fita paralela ao chão.' }
];
const weighIns = () => S.checkins.filter((c) => num(c.peso));
function lastCheckin() { const w = weighIns(); return w.length ? w[w.length - 1] : null; }
function lastMeasure(id) { for (let i = S.checkins.length - 1; i >= 0; i--) if (num(S.checkins[i][id])) return S.checkins[i]; return null; }

/* ---------- Banco de alimentos (busca) ---------- */
const FOOD_LIST = window.FOODS || [];
const foodUnit = (f) => (FOOD_LIST.isLiquid && FOOD_LIST.isLiquid(f[0]) ? 'ml' : 'g');
function foodResultsHtml() {
  const P = UI.pick;
  if (!P || !P.q.trim()) return '<div class="small muted">Digite pelo menos uma palavra. Ex.: arroz, frango, pizza.</div>';
  const res = Core.searchFoods(FOOD_LIST, P.q);
  if (!res.length) return '<div class="small muted">Nada encontrado. Escreva à mão e estime as calorias.</div>';
  return res.map(({ f, i }) => `<button type="button" class="food-res" data-act="pickfood" data-i="${i}"><span>${esc(f[0])}</span><span class="muted small">${nf(f[1])} kcal · P ${nf(f[2], 1)} em 100 ${foodUnit(f)}</span></button>`).join('');
}
function foodPreview() {
  const P = UI.pick; const f = FOOD_LIST[P.sel];
  const x = Core.foodMacros(f, P.grams);
  return `${nf(x.k)} kcal · P ${nf(x.p, 1)} · C ${nf(x.c, 1)} · G ${nf(x.g, 1)}`;
}
function foodPicker() {
  const P = UI.pick;
  if (!P) return '';
  if (P.sel !== null && FOOD_LIST[P.sel]) {
    const f = FOOD_LIST[P.sel];
    const u = foodUnit(f);
    const portions = [[100, '100 ' + u]].concat(f[5] ? [[f[6], f[5].includes(' ml') ? f[5] : `${f[5]} (${f[6]} ${u})`]].concat(f[7] || [[f[6] * 2, `2 × ${f[5]}`]]) : []);
    return `<div class="picker" role="group" aria-label="Quantidade do alimento">
      <div class="between"><strong>${esc(f[0])}</strong><button type="button" class="link-btn" data-act="pickback">Trocar</button></div>
      <div class="chips">${portions.map(([gr, l]) => `<button type="button" class="chip small-chip ${num(P.grams) === gr ? 'on' : ''}" data-act="pickgrams" data-v="${gr}">${esc(l)}</button>`).join('')}</div>
      <label class="field">Quantidade (g ou ml)<input class="input strong" id="pick-grams" type="number" inputmode="decimal" data-in="pickgrams" value="${esc(P.grams)}"></label>
      <div class="opt-total"><span>Fica</span><span id="pick-prev">${foodPreview()}</span></div>
      <div class="toolbar"><button type="button" class="btn small" data-act="foodadd">Adicionar</button><button type="button" class="btn small ghost" data-act="pickclose">Cancelar</button></div>
    </div>`;
  }
  return `<div class="picker" role="search">
    <label class="field">Buscar no banco de alimentos<span class="search">${I.busca}<input class="input" id="pick-q" type="search" autocomplete="off" data-in="pickq" value="${esc(P.q)}" placeholder="ex.: arroz, pão de queijo"></span></label>
    <div class="food-results" id="pick-res">${foodResultsHtml()}</div>
    <div class="row" style="justify-content:space-between"><span class="small muted">Valores aproximados (TACO e rótulos).</span><button type="button" class="link-btn" data-act="pickclose">Fechar</button></div>
  </div>`;
}

/* ---------- Hoje ---------- */
/* Próxima refeição: a primeira não feita que ainda não passou de 1h30; se todas passaram, a primeira não feita */
function nextMealId(k) {
  if (k !== todayKey()) return null;
  const now = new Date(); const mins = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
  const open = sortedPlan().filter((m) => !isDone(m, k));
  const m = open.find((x) => toMin(x.time) >= mins - 90) || open[0];
  return m ? m.id : null;
}
function mealCard(m, k, next) {
  const oi = optIndex(m, k);
  const o = m.opts[oi] || { name: '', items: [] };
  const x = sum(o.items);
  const done = isDone(m, k);
  const editing = UI.note && UI.note.meal === m.id;
  const repl = notesOf(k, m.id).some((n) => n.type === 'troca' || n.type === 'livre');
  const check = `<button type="button" class="check ${done ? 'on' : ''} ${UI.flash === m.id ? 'pop' : ''}" data-act="done" data-meal="${esc(m.id)}" aria-pressed="${done}" aria-label="${done ? 'Desmarcar' : 'Marcar'} ${esc(m.name)}">${done ? I.check : ''}</button>`;
  if (done && !editing) {
    const it = mealIntake(m, k);
    return `<article class="card meal is-done">
      <div class="meal-main">
        <div class="meal-head"><span class="time">${esc(m.time)}</span><span class="meal-name">${esc(m.name)}</span><span class="meal-macro">${nf(it.k)} kcal</span></div>
        <div class="meal-items">${repl ? 'Trocada pela anotação' : esc(planned(m, k).name || 'Feita')}${m.opts.length ? ` · <a class="tap-link" href="#refeicao/${encodeURIComponent(m.id)}">detalhes</a>` : ''}</div>
        ${notesList(k, m.id)}
        <div><button type="button" class="note-btn" data-act="noteopen" data-meal="${esc(m.id)}" aria-label="Anotar o que comeu em ${esc(m.name)}">+ Anotar</button></div>
      </div>${check}</article>`;
  }
  const chips = m.opts.length > 1 ? `<div class="chips only-desktop">${m.opts.map((op, i) => `<button type="button" class="chip ${i === oi ? 'on' : ''}" aria-pressed="${i === oi}" data-act="pickopt" data-meal="${esc(m.id)}" data-i="${i}">${esc(op.name)}</button>`).join('')}</div>` : '';
  return `<article class="card meal ${next ? 'is-next' : ''}">
    <div class="meal-main">
      <div class="meal-head"><span class="time">${esc(m.time)}</span><span class="meal-name">${esc(m.name)}</span>${next ? '<span class="next-pill">Próxima</span>' : ''}<span class="meal-macro only-desktop">${nf(x.k)} kcal · P ${nf(x.p)} · C ${nf(x.c)} · G ${nf(x.g)}</span></div>
      ${chips}
      <div class="meal-items">${m.opts.length > 1 ? `<strong style="font-weight:600">${esc(o.name)}:</strong> ` : ''}${esc(o.items.map((i) => i.food + ' ' + i.qty).join(' · '))}</div>
      ${notesList(k, m.id)}
      <div class="row" style="gap:8px;flex-wrap:wrap">${m.opts.length ? `<a class="opt-link${m.opts.length > 1 ? ' only-mobile' : ''}" href="#refeicao/${encodeURIComponent(m.id)}">${m.opts.length > 1 ? m.opts.length + ' opções' : 'Detalhes'}</a>` : ''}${editing ? '' : `<button type="button" class="note-btn" data-act="noteopen" data-meal="${esc(m.id)}" aria-label="Anotar o que comeu em ${esc(m.name)}">+ Anotar</button>`}</div>
      ${editing ? noteEditor(true) : ''}
    </div>
    ${check}
  </article>`;
}
function notesList(k, mid) {
  const ns = notesOf(k, mid);
  if (!ns.length) return '';
  return `<ul class="notes">${ns.map((n) => `<li class="note ${n.type}"><span><strong>${NOTE_SHORT[n.type] || 'Anotação'}${esc(catTxt(n))}:</strong> ${esc(n.text || 'sem descrição')}${num(n.kcal) ? ` · ≈ ${nf(n.kcal)} kcal` : ''}${num(n.p) ? ` · P ${nf(n.p)} g` : ''}</span><button type="button" class="del-btn" data-act="notedel" data-meal="${esc(mid)}" data-id="${esc(n.id)}" aria-label="Apagar anotação">${I.x}</button></li>`).join('')}</ul>`;
}
function noteEditor(withTypes) {
  const N = UI.note;
  const picking = UI.pick && UI.pick.ctx === 'note';
  if (N.type === 'bebida') return `<div class="note-editor" role="group" aria-label="Anotar bebida alcoólica"><div class="chips">${Object.keys(FORA_TYPES).map((t) => `<button type="button" class="chip small-chip ${N.type === t ? 'on' : ''}" aria-pressed="${N.type === t}" data-act="notetype" data-v="${t}">${FORA_TYPES[t]}</button>`).join('')}</div>${drinkForm()}</div>`;
  return `<div class="note-editor" role="group" aria-label="Anotar refeição">
    ${withTypes ? (() => { const T = N.meal === FORA ? FORA_TYPES : NOTE_TYPES; return `<div class="chips">${Object.keys(T).map((t) => `<button type="button" class="chip small-chip ${N.type === t ? 'on' : ''}" aria-pressed="${N.type === t}" data-act="notetype" data-v="${t}">${T[t]}</button>`).join('')}</div>`; })() : ''}

    ${N.type === 'extra' ? `<div class="stack" style="gap:6px"><span class="field">O que foi</span><div class="chips" role="group" aria-label="Categoria">${Object.keys(NOTE_CATS).map((c) => `<button type="button" class="chip small-chip ${N.cat === c ? 'on' : ''}" aria-pressed="${N.cat === c}" data-act="notecat" data-v="${c}">${NOTE_CATS[c]}</button>`).join('')}</div></div>` : ''}
    <label class="field">O que você comeu<textarea class="input" id="note-text" data-in="note" data-f="text" rows="2" placeholder="${N.type === 'extra' ? 'ex.: 2 bombons' : 'ex.: 2 fatias de pizza de calabresa'}">${esc(N.text)}</textarea></label>
    ${picking ? foodPicker() : `<button type="button" class="btn dashed" data-act="pickopen" data-v="note">${I.busca} Buscar no banco de alimentos</button>`}
    ${N.items && N.items.length ? `<div class="small muted">Do banco: ${esc(N.items.map((i) => i.food + ' ' + i.qty).join(' · '))}</div>` : ''}
    <div class="grid2"><label class="field">Calorias estimadas<input class="input" id="note-kcal" type="number" inputmode="numeric" data-in="note" data-f="kcal" value="${esc(N.kcal)}" placeholder="ex.: 600"></label>
    <label class="field">Proteína (g)<input class="input" id="note-p" type="number" inputmode="decimal" data-in="note" data-f="p" value="${esc(N.p)}" placeholder="opcional"></label></div>
    ${N.type === 'livre' ? '<div class="small muted">Também marca a refeição livre desta semana.</div>' : ''}
    ${N.type === 'troca' || N.type === 'livre' ? '<div class="small muted">Substitui a refeição do plano. Sem calorias, ela fica registrada, mas não entra na soma do dia.</div>' : ''}
    <div class="toolbar"><button type="button" class="btn small" data-act="notesave">Salvar</button><button type="button" class="btn small ghost" data-act="notecancel">Cancelar</button></div>
  </div>`;
}
function foraDrinks(k) {
  const ds = S.drinks.filter((d) => d.date === k);
  if (!ds.length) return '';
  return `<ul class="notes">${ds.map((d) => `<li class="note extra"><span><strong>Bebida alcoólica:</strong> ${d.cups} × ${d.ml} ml de ${esc(((DRINKS[d.type] || {}).label || d.type).toLowerCase())} · ≈ ${nf(d.kcal)} kcal</span><button type="button" class="del-btn" data-act="deldrink" data-id="${esc(d.id)}" aria-label="Apagar bebida">${I.x}</button></li>`).join('')}</ul>`;
}
const FORA_TYPES = { extra: 'Comi a mais', bebida: 'Bebida alcoólica', livre: 'Refeição livre' };
function drinkForm() {
  const D = UI.drink;
  return `<div class="grid4">${Object.keys(DRINKS).map((id) => `<button type="button" class="chip o small-chip ${id === D.type ? 'on' : ''}" style="padding:0 4px;border-radius:12px" aria-pressed="${id === D.type}" data-act="drinktype" data-v="${id}">${DRINKS[id].label}</button>`).join('')}</div>
    <div class="grid2">
      <div class="field">Copos<div class="stepper"><button type="button" data-act="cups" data-v="-1" aria-label="Menos copos">−</button><span class="num">${D.cups}</span><button type="button" data-act="cups" data-v="1" aria-label="Mais copos">+</button></div></div>
      <div class="field">ml por copo<div class="stepper"><button type="button" data-act="ml" data-v="-1" aria-label="Menos ml">−</button><span class="num">${D.ml}</span><button type="button" data-act="ml" data-v="1" aria-label="Mais ml">+</button></div></div>
    </div>
    <div class="drink-total"><span>${D.cups} × ${D.ml} ml = ${nf(D.cups * D.ml)} ml</span><span class="num">≈ ${nf(drinkKcal(D.type, D.cups, D.ml))} kcal</span></div>
    <div class="toolbar"><button type="button" class="btn small orange" data-act="adddrink">Anotar ${DRINKS[D.type].label.toLowerCase()}</button><button type="button" class="btn small ghost" data-act="notecancel">Cancelar</button></div>`;
}
function foraCard(k) {
  const open = UI.note && UI.note.meal === FORA;
  return `<article class="card meal" style="align-items:flex-start"><div class="meal-main">
    <div class="meal-head"><span class="meal-name">Fora das refeições</span></div>
    <div class="meal-items">Beliscos, bebida alcoólica e refeição livre.</div>
    ${notesList(k, FORA)}
    ${foraDrinks(k)}
    ${open ? noteEditor(true) : `<div><button type="button" class="note-btn" data-act="noteopen" data-meal="${FORA}">+ Anotar</button></div>`}
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
function freeStatus(ws = weekStart()) {
  const used = S.free[ws];
  return used ? { on: false, text: 'Usada ' + (used === todayKey() ? 'hoje' : DIAS[parseKey(used).getDay()].toLowerCase()) } : { on: true, text: 'Disponível' };
}
function rulesCard(ws) {
  const f = freeStatus(ws);
  return `<section class="card stack rules" aria-label="Regras do plano">
    <div class="between"><h2 class="label">Regras do plano</h2><a class="small" style="font-weight:600;text-decoration:none" href="#plano">Editar</a></div>
    <div class="rule-free"><span><strong>1 refeição livre por semana</strong><span class="small muted" style="display:block">Registre no “+ Anotar” da refeição ou em Fora das refeições.</span></span><span class="free-pill ${f.on ? 'on' : ''}">${esc(f.text)}</span></div>
    ${S.rules.length ? `<ul class="rule-list">${S.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
  </section>`;
}
/* Refeições feitas no dia anterior que dá para repetir no dia aberto */
function repeatable(k) {
  const prev = addDays(k, -1);
  if (doneCount(k) > 0) return [];
  return S.plan.filter((m) => isDone(m, prev) && !notesOf(prev, m.id).some((n) => n.type === 'troca' || n.type === 'livre'));
}
/* Faixa da revisão em sequência dos dias fora da meta (aberta pelo card em Progresso › Alimentação) */
function reviewBanner(k) {
  const R = UI.review;
  if (!R || R.list[R.at] !== k) return '';
  const last = R.at === R.list.length - 1;
  return `<div class="rev-bar" role="region" aria-label="Revisando dias fora da meta"><div class="rev-txt"><span>Revisando dias fora da meta</span><strong>${R.at + 1} de ${R.list.length}</strong></div>
    <button type="button" class="rev-btn ghost" data-act="revgo" data-v="-1" aria-label="Dia anterior da revisão" ${R.at ? '' : 'disabled'}>‹</button>
    <button type="button" class="rev-btn" data-act="revgo" data-v="1">${last ? 'Concluir' : 'Próximo ›'}</button>
    <button type="button" class="rev-btn ghost" data-act="revstop" aria-label="Parar a revisão">${I.x}</button></div>`;
}
function viewHoje() {
  const k = curDay();
  const ws = weekStart(k);
  const isToday = k === todayKey();
  const lc = lastCheckin();
  const wd = weekDrinks(ws);
  const rep = repeatable(k);
  const repBtn = rep.length ? `<button type="button" class="btn small ghost block" data-act="repeat">${I.copiar} Repetir ${dayTitle(addDays(k, -1)).toLowerCase()} (${rep.length} ${rep.length === 1 ? 'refeição' : 'refeições'})</button>` : '';
  const monday = parseKey(k).getDay() === 1;
  const lastWeek = monday ? `<section class="card stack" aria-label="Resumo da semana passada"><div class="between"><h2 class="label">Semana passada</h2><a class="small" style="font-weight:600;text-decoration:none" href="#progresso">Ver mais</a></div>${weekSummary(addDays(ws, -7), true)}</section>` : '';
  const wg = weekGrid(ws);
  const side = `<div class="col only-desktop">
    ${shopTodayCard(k)}
    ${heroCard(k)}
    ${repBtn}
    ${waterCard(k)}
    ${lastWeek}
    ${rulesCard(ws)}
    <section class="card stack" aria-label="Progresso"><h2 class="label">Progresso</h2>
      <div class="grid2"><div><div class="small muted" style="font-weight:600">Peso</div><div class="num big">${lc ? nf(lc.peso, 1) + ' kg' : '—'}</div></div><div><div class="small muted" style="font-weight:600">Cintura</div><div class="num big">${lastMeasure('cintura') ? nf(lastMeasure('cintura').cintura, 1) + ' cm' : '—'}</div></div></div>
      ${wg.html}<a class="small" style="font-weight:600;text-decoration:none" href="#progresso">Fazer check-in</a></section>
    <section class="card" aria-label="Bebida alcoólica"><div class="small muted" style="font-weight:600">Bebida alcoólica na semana de ${ddmm(ws)}</div><div class="num" style="font-size:22px;color:var(--o-text)">${nf(wd.reduce((a, d) => a + d.cups * d.ml, 0))} ml</div></section>
  </div>`;
  const nextId = nextMealId(k);
  const meals = sortedPlan().map((m) => mealCard(m, k, m.id === nextId)).join('') + mealsOfDay(k).filter((m) => m.orphan).map((m) => mealCard(m, k, false)).join('') + (S.plan.length ? foraCard(k) : '');
  return reviewBanner(k) + header(dayTitle(k), dayNav(k)) + (UI.review || isToday ? '' : `<div class="tip">${I.info}<div>Você está editando ${ddmm(k)}. As marcações, anotações e água vão para esse dia.</div></div>`) +
    `<div class="split"><div class="col"><div class="only-mobile col">${shopTodayCard(k)}${heroCard(k)}${repBtn}${waterCard(k)}</div>${meals || '<div class="card muted">Nenhuma refeição no plano. <a href="#plano">Montar o plano</a></div>'}<div class="only-mobile col">${lastWeek}${rulesCard(ws)}</div></div>${side}</div>`;
}

/* ---------- Refeição ---------- */
function viewRefeicao(id) {
  const m = S.plan.find((x) => x.id === id);
  if (!m) return viewHoje();
  const k = curDay();
  const oi = optIndex(m, k);
  const o = m.opts[oi] || { name: '', items: [], tip: '' };
  const x = sum(o.items);
  const done = isDone(m, k);
  return header(m.name, esc(m.time) + (k === todayKey() ? '' : ' · ' + esc(longDate(k))), ['#hoje', dayTitle(k)]) +
    (m.opts.length > 1 ? `<div class="stack"><h2 class="label">Opção</h2><div class="chips">${m.opts.map((op, i) => `<button type="button" class="chip ${i === oi ? 'on' : ''}" aria-pressed="${i === oi}" data-act="pickopt" data-meal="${esc(m.id)}" data-i="${i}">${esc(op.name)}</button>`).join('')}</div></div>` : '') +
    `<div class="card list-rows" style="padding:4px 18px">${o.items.map((i) => `<div><span style="font-weight:500">${esc(i.food)}</span><span class="qty">${esc(i.qty)}</span></div>`).join('') || '<div class="muted">Sem alimentos nesta opção.</div>'}</div>
    <div class="grid4"><div class="tile"><span class="num">${nf(x.k)}</span><span>kcal</span></div><div class="tile"><span class="num">${nf(x.p)} g</span><span>proteína</span></div><div class="tile"><span class="num">${nf(x.c)} g</span><span>carbo</span></div><div class="tile"><span class="num">${nf(x.g)} g</span><span>gordura</span></div></div>
    ${o.tip ? `<div class="tip">${I.info}<div>${esc(o.tip)}</div></div>` : ''}
    <button type="button" class="btn block ${done ? 'ghost' : ''}" data-act="done" data-meal="${esc(m.id)}">${done ? 'Feito · desfazer' : 'Marcar como feito'}</button>`;
}

/* ---------- Macros ---------- */
function viewMacros() {
  const k = curDay();
  const g = S.goals;
  const rows = sortedPlan().map((m) => { const x = planned(m, k); return { name: m.name + (m.opts.length > 1 && x.name ? ` · ${x.name}` : ''), k: x.k, p: x.p, c: x.c, g: x.g }; });
  const tot = rows.reduce((a, r) => ({ k: a.k + r.k, p: a.p + r.p, c: a.c + r.c, g: a.g + r.g }), { k: 0, p: 0, c: 0, g: 0 });
  return header('Macros', dayNav(k), matchMedia('(min-width: 900px)').matches ? null : ['#hoje', 'Hoje']) + `<div class="split"><div class="col">
    <section class="card stack" aria-label="Consumido"><h2 class="label">${k === todayKey() ? 'Consumido hoje' : 'Consumido em ' + ddmm(k)}</h2>${macroBars(consumed(k), g)}</section>
    <section class="card" aria-label="Plano do dia"><div class="between" style="align-items:center;margin-bottom:6px"><h2 class="label">Plano do dia</h2><a class="small" style="font-weight:600;text-decoration:none;min-height:44px;display:inline-flex;align-items:center" href="#plano">Editar plano</a></div>
      <table class="table"><thead><tr><th>Refeição</th><th>kcal</th><th>P</th><th>C</th><th>G</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${nf(r.k)}</td><td>${nf(r.p)}</td><td>${nf(r.c)}</td><td>${nf(r.g)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td>${nf(tot.k)}</td><td>${nf(tot.p)}</td><td>${nf(tot.c)}</td><td>${nf(tot.g)}</td></tr></tfoot></table>
      <div class="small muted" style="margin-top:8px">Com as opções escolhidas para ${k === todayKey() ? 'hoje' : ddmm(k)}.</div></section>
  </div><div class="col">
    <section class="card stack" aria-label="Metas"><div class="between" style="align-items:center"><h2 class="label">Metas</h2><a class="small" style="font-weight:600;text-decoration:none;min-height:44px;display:inline-flex;align-items:center" href="#plano">Editar metas</a></div>
      <div class="small muted">${nf(g.kcal)} kcal · ${nf(g.prot)} g de proteína · ${nf(g.carb)} g de carbo · ${nf(g.fat)} g de gordura · ${nf(num(g.agua) / 1000, 1)} L de água</div></section>
  </div></div>`;
}
function goalsCard() {
  const g = S.goals;
  const lc = lastCheckin();
  const pesoAtual = lc ? lc.peso : num(g.peso);
  const falta = num(g.meta) && pesoAtual ? Math.round((pesoAtual - num(g.meta)) * 10) / 10 : null;
  const field = (label, key, ph, step) => `<label class="field">${label}<input class="input strong" type="number" inputmode="decimal" step="${step}" data-in="goal" data-k="${key}" value="${esc(g[key])}" placeholder="${esc(ph)}"></label>`;
  return `<section class="card stack" aria-label="Metas"><h2 class="label">Metas</h2>
      <div class="grid2 goals-grid">${field('Calorias/dia', 'kcal', '1860', '1')}${field('Proteína (g)', 'prot', '175', '1')}${field('Carboidrato (g)', 'carb', '205', '1')}${field('Gordura (g)', 'fat', '40', '1')}${field('Água/dia (ml)', 'agua', '2700', '50')}${field('Peso de referência (kg)', 'meta', 'ex.: 76', '0.1')}</div>
      <div class="small muted">${falta !== null ? (falta > 0 ? `Faltam ${nf(falta, 1)} kg para o peso de referência.` : 'Peso de referência alcançado.') : 'O peso meta é só referência. A cintura e as medidas, em Progresso, mostram melhor a perda de gordura.'}</div></section>`;
}

/* ---------- Extras ---------- */

/* ---------- Progresso ---------- */
/* Gráfico de linha com média móvel, linha de referência e pontos que mostram o valor ao tocar */
function lineChart(id, pts, opt) {
  const o = opt || {};
  if (!pts.length) return `<div class="small muted">${o.empty || 'Sem dados ainda.'}</div>`;
  const start = pts[0].date;
  let end = addDays(pts[pts.length - 1].date, o.ahead ?? 14);
  if (end < addDays(start, o.minSpan ?? 28)) end = addDays(start, o.minSpan ?? 28);
  const span = Math.max(7, daysBetween(start, end));
  const vals = pts.map((x) => x.v);
  const avg = Core.movingAvg(vals, 3);
  const planEnd = o.rate ? vals[0] + o.rate * span / 7 : null;
  const all = vals.concat(planEnd !== null ? [planEnd] : [], o.ref ? [o.ref] : []);
  let lo = Math.floor(Math.min(...all) - 0.5), hi = Math.ceil(Math.max(...all) + 0.5);
  if (hi - lo < 4) { lo -= 1; hi += 1; }
  const wide = window.matchMedia && matchMedia('(min-width: 900px)').matches;
  const W = wide ? 640 : 320, H = wide ? 240 : 190, L = 30, R = 12, T = 22, B = 26;
  const dot = pts.length > 10 ? 3 : 4.5;
  const X = (k) => L + (daysBetween(start, k) / span) * (W - L - R);
  const Y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  const mid = Math.round((hi + lo) / 2);
  const grid = [hi, mid, lo].map((v) => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--row)"/><text x="0" y="${Y(v) + 4}" font-size="10" fill="var(--muted)">${v}</text>`).join('');
  const midDate = addDays(start, Math.round(span / 2));
  const xl = [[start, 'start'], [midDate, 'middle'], [end, 'end']].map(([k, a]) => `<text x="${X(k).toFixed(1)}" y="${H - 6}" font-size="10" fill="var(--muted)" text-anchor="${a}">${ddmm(k)}</text>`).join('');
  const line = (arr) => pts.map((x, i) => (i ? 'L' : 'M') + X(x.date).toFixed(1) + ' ' + Y(arr[i]).toFixed(1)).join(' ');
  const ref = o.ref ? `<line x1="${L}" x2="${W - R}" y1="${Y(o.ref)}" y2="${Y(o.ref)}" stroke="var(--mg)" stroke-width="1.5" stroke-dasharray="2 4"/>` : '';
  const plan = planEnd !== null ? `<path d="M${X(start)} ${Y(vals[0])} L${X(end)} ${Y(planEnd)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 4" fill="none"/>` : '';
  const sel = UI.pt && UI.pt.c === id ? UI.pt.i : -1;
  const label = sel >= 0 && pts[sel] ? (() => { const x = X(pts[sel].date), y = Y(pts[sel].v); const txt = `${ddmm(pts[sel].date)} · ${nf(pts[sel].v, 1)} ${o.unit}`; const w = txt.length * 5.6 + 14; const lx = Math.min(W - R - w, Math.max(L, x - w / 2)); return `<g class="pt-label"><rect x="${lx.toFixed(1)}" y="${Math.max(0, y - 30).toFixed(1)}" width="${w.toFixed(1)}" height="20" rx="6" fill="var(--ink)"/><text x="${(lx + w / 2).toFixed(1)}" y="${Math.max(0, y - 30) + 14}" font-size="11" font-weight="600" fill="var(--bg)" text-anchor="middle">${txt}</text></g>`; })() : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${grid}${ref}${plan}
    ${pts.length > 2 ? `<path d="${line(avg)}" stroke="var(--mp)" stroke-width="1.5" stroke-opacity=".5" fill="none" stroke-linecap="round"/>` : ''}
    <path d="${line(vals)}" stroke="var(--pri)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map((x, i) => `<circle cx="${X(x.date).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="${i === sel ? 6 : dot}" fill="var(--pri)" stroke="var(--card)" stroke-width="${dot < 4 ? 1.5 : 2}"/><circle class="hit" cx="${X(x.date).toFixed(1)}" cy="${Y(x.v).toFixed(1)}" r="14" fill="transparent" data-act="pt" data-c="${id}" data-i="${i}" role="button" tabindex="0" aria-label="${ddmm(x.date)}: ${nf(x.v, 1)} ${o.unit}"/>`).join('')}
    ${xl}${label}</svg>`;
}
function hintCard() {
  const h = Core.goalHint(S);
  if (!h) return '';
  const rate = `${h.rate > 0 ? '+' : ''}${nf(h.rate, 2)} kg/semana`;
  const adh = Math.round(h.adherence * 100) + '%';
  const msg = h.kind === 'down' ? `O peso está parado (${rate}) mesmo com ${adh} das refeições feitas. Pode ser hora de baixar ${nf(-h.delta)} kcal da meta, de preferência tirando carboidrato.`
    : h.kind === 'up' ? `Você está perdendo rápido (${rate}). Acima de 1 kg por semana costuma levar músculo junto. Pense em subir ${nf(h.delta)} kcal.`
    : `O peso está parado (${rate}), mas só ${adh} das refeições foram marcadas. Antes de mudar a meta, vale seguir o plano por mais 2 semanas.`;
  return `<section class="card stack hint" aria-label="Sugestão de meta"><div class="meal-name">Sugestão</div><div class="small">${msg}</div>
    ${h.delta ? `<div class="toolbar"><button type="button" class="btn small" data-act="applyhint" data-v="${h.delta}">Ajustar a meta para ${nf(num(S.goals.kcal) + h.delta)} kcal</button></div>` : ''}
    <div class="small muted">Sugestão automática com base nas suas pesagens. Converse com a sua nutricionista antes de mudar.</div></section>`;
}
function photosCard() {
  const withPh = S.checkins.filter((c) => c.fotos && c.fotos.length);
  const can = !!(sb && UI.auth.user);
  if (!withPh.length) return `<section class="card stack" aria-label="Fotos"><h2 class="label">Fotos de progresso</h2><div class="small muted">${can ? 'Adicione uma foto no check-in. Elas ficam guardadas na sua conta, visíveis só para você.' : 'Entre na sua conta para guardar fotos de progresso.'}</div></section>`;
  const first = withPh[0], last = withPh[withPh.length - 1];
  const img = (path, cap) => { const u = UI.photos[path]; return `<figure class="photo">${u ? `<img src="${esc(u)}" alt="Foto de ${esc(cap)}" loading="lazy">` : `<div class="photo-ph">${path in UI.photos ? 'Indisponível' : 'Carregando…'}</div>`}<figcaption>${esc(cap)}</figcaption></figure>`; };
  loadPhotoUrls(withPh.flatMap((c) => c.fotos));
  return `<section class="card stack" aria-label="Fotos"><h2 class="label">Fotos de progresso</h2>
    ${withPh.length > 1 ? `<div class="grid2">${img(first.fotos[0], 'Primeira · ' + ddmm(first.date))}${img(last.fotos[last.fotos.length - 1], 'Última · ' + ddmm(last.date))}</div>` : ''}
    <details class="more"><summary>Todas as fotos <span class="muted">· ${withPh.reduce((a, c) => a + c.fotos.length, 0)}</span></summary>
      <div class="photo-grid">${withPh.slice().reverse().flatMap((c) => c.fotos.map((f) => `<div class="photo-item">${img(f, ddmm(c.date))}<button type="button" class="del-btn" data-act="delphoto" data-date="${c.date}" data-path="${esc(f)}" aria-label="Apagar foto de ${ddmm(c.date)}">${I.x}</button></div>`)).join('')}</div></details></section>`;
}
/* ---------- Progresso › Alimentação: dias fora da meta e padrões ----------
   Só julga dias passados, a partir do primeiro dia com registro. Refeição não marcada conta como não feita. */
const PD_TXT = { ok: 'Na meta', over: 'Acima', livre: 'Refeição livre', under: 'Abaixo' };
const PD_GLYPH = { ok: '', over: '▲', livre: 'L', under: '▼' };
const WD_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const sgnK = (n) => (n > 0 ? '+' : n < 0 ? '−' : '±') + nf(Math.abs(n));
function setDeal(t) {
  S.deals = S.deals || {};
  S.deals[weekStart()] = { t: String(t).slice(0, 80), u: Date.now() };
  UI.dealEdit = false;
  save(); toast('Combinado salvo');
}
function firstLogDay() {
  const ks = Object.keys(S.days).filter((k) => Core.hasLog(S, k)).concat(S.drinks.map((d) => d.date)).sort();
  return ks[0] || null;
}
function reviewRange(weeks) {
  const t = todayKey();
  const start = addDays(weekStart(t), -7 * (weeks - 1));
  const first = firstLogDay();
  const out = [];
  for (let i = 0; i < weeks * 7; i++) {
    const k = addDays(start, i);
    out.push({ k, i, r: first && k >= first && k < t ? Core.dayReview(S, k) : null, today: k === t });
  }
  return out;
}
const causeTxt = (c) => (Core.CAUSES[c] || 'Fora da meta');
/* O que aconteceu no dia, em linhas curtas, a partir das anotações, bebidas e refeições não feitas */
function dayLines(k, r) {
  const out = [];
  mealsOfDay(k).forEach((m) => notesOf(k, m.id).forEach((n) => out.push(m.name + ' · ' + (NOTE_SHORT[n.type] || 'Anotação') + catTxt(n) + ': ' + (n.text || 'sem descrição') + (num(n.kcal) ? ' (≈ ' + nf(n.kcal) + ' kcal)' : ''))));
  notesOf(k, FORA).forEach((n) => out.push('Fora das refeições · ' + (NOTE_SHORT[n.type] || 'Anotação') + catTxt(n) + ': ' + (n.text || 'sem descrição') + (num(n.kcal) ? ' (≈ ' + nf(n.kcal) + ' kcal)' : '')));
  S.drinks.filter((d) => d.date === k).forEach((d) => out.push('Bebida alcoólica · ' + ((DRINKS[d.type] || {}).label || d.type) + ' ' + nf(d.cups * d.ml) + ' ml (≈ ' + nf(d.kcal) + ' kcal)'));
  if (r && r.missed.length) out.push('Não feito: ' + r.missed.join(', '));
  return out;
}
/* Fila de dias fora da meta (acima ou abaixo; refeição livre não entra), do mais recente para o mais antigo */
const offQueue = (cells) => cells.filter((c) => c.r && (c.r.st === 'over' || c.r.st === 'under')).map((c) => c.k).reverse();
function pdDayCard(cells) {
  const q = offQueue(cells);
  /* Sem escolha do usuário, mostra sempre o dia fora da meta mais recente */
  const pick = cells.find((c) => c.k === UI.pday && c.r) || cells.find((c) => c.k === q[0]) || cells.slice().reverse().find((c) => c.r);
  if (!pick) return '';
  const r = pick.r;
  const lines = dayLines(pick.k, r);
  const pos = q.indexOf(pick.k);
  const newer = pos > 0 ? q[pos - 1] : pos === -1 ? q.slice().reverse().find((k) => k > pick.k) : null;
  const older = pos >= 0 ? q[pos + 1] : q.find((k) => k < pick.k);
  const arrow = (k, lbl, ch) => `<button type="button" class="pd-arrow" data-act="pday" data-k="${k || ''}" aria-label="${lbl}" ${k ? '' : 'disabled'}>${ch}</button>`;
  return `<section class="card stack pd-sel" aria-label="Dia selecionado" aria-live="polite">
    <div class="pd-selhead">${arrow(newer, 'Dia fora da meta mais recente', '‹')}<div class="pd-seltitle"><span class="meal-name">${WD_SHORT[pick.i % 7]}, ${ddmm(pick.k)}</span><span class="small muted" style="font-weight:600">${pos >= 0 ? `${pos + 1} de ${q.length} ${q.length === 1 ? 'dia fora' : 'dias fora'} da meta` : q.length ? `${q.length} ${q.length === 1 ? 'dia fora' : 'dias fora'} da meta` : 'Nenhum dia fora da meta'}</span></div>${arrow(older, 'Dia fora da meta mais antigo', '›')}</div>
    <div class="between" style="align-items:baseline"><span><span class="num" style="font-size:28px">${nf(r.kcal)}</span> <span class="muted">kcal${r.meta ? ` · <strong class="pd-t-${r.st}">${sgnK(r.diff)}</strong> da meta` : ''}</span></span><span class="pd-pill pd-${r.st}">${PD_TXT[r.st]}</span></div>
    ${r.st !== 'ok' ? `<div style="font-weight:600">${esc(causeTxt(r.cause))}</div>` : ''}
    ${lines.length ? `<ul class="pd-lines">${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : `<div class="small muted">${r.st === 'ok' ? 'Seguiu o plano.' : 'Sem anotações neste dia.'}</div>`}
    ${pick.k >= addDays(todayKey(), -MAX_BACK) ? `<button type="button" class="btn small" style="align-self:flex-start" data-act="openday" data-k="${pick.k}">Abrir o dia</button>` : ''}
  </section>`;
}
function pdMap(cells) {
  const rows = sortedPlan().map((m) => ({ id: m.id, name: m.name })).concat([{ id: FORA, name: 'Fora das refeições' }]);
  const hit = {};
  cells.forEach((c) => {
    if (!c.r) return;
    const seen = new Set();
    c.r.cells.forEach((x) => {
      const key = x.meal + '|' + (c.i % 7);
      if (seen.has(key + x.kind)) return; seen.add(key + x.kind);
      const h = hit[key] = hit[key] || { over: [], under: [], livre: [] };
      if (!h[x.kind].includes(c)) h[x.kind].push(c);
    });
  });
  const sel = UI.pcell && hit[UI.pcell] ? UI.pcell : null;
  const grid = rows.map((row) => `<div class="pd-maprow"><span class="pd-mapname">${esc(row.name)}</span>${WD_SHORT.map((w, j) => {
    const key = row.id + '|' + j;
    const h = hit[key];
    const ov = h ? h.over.length : 0, un = h ? h.under.length : 0, lv = h ? h.livre.length : 0;
    const n = new Set(h ? h.over.concat(h.under) : []).size;
    const cls = ov && un ? 'mix' : ov ? 'over' : un ? 'under' : lv ? 'livre' : 'none';
    const txt = n ? String(n) : lv ? 'L' : '';
    const aria = n ? n + (n === 1 ? ' falha' : ' falhas') + (lv ? ' e refeição livre' : '') : lv ? 'refeição livre' : 'sem falhas';
    return `<button type="button" class="pd-cell pd-${cls} ${sel === key ? 'on' : ''}" data-act="pcell" data-v="${esc(key)}" aria-label="${esc(row.name)}, ${w}: ${aria}" ${n || lv ? '' : 'disabled'}>${txt}</button>`;
  }).join('')}</div>`).join('');
  let detail = '<div class="small muted">Toque numa casa colorida para ver os dias.</div>';
  if (sel) {
    const [mid, j] = sel.split('|');
    const row = rows.find((x) => x.id === mid);
    const ds = [...new Set(hit[sel].over.concat(hit[sel].under, hit[sel].livre))].sort((a, b) => b.k.localeCompare(a.k));
    detail = `<div class="pd-detail"><div style="font-weight:600">${esc(row ? row.name : '')} · ${WD_SHORT[+j]}</div>${ds.map((c) => `<button type="button" class="pd-row" data-act="pday" data-k="${c.k}"><span><strong>${ddmm(c.k)}</strong> <span class="muted">· ${esc(causeTxt(c.r.cause))}</span></span><span class="num pd-t-${c.r.st}">${sgnK(c.r.diff)}</span></button>`).join('')}</div>`;
  }
  return `<section class="card stack" aria-label="Mapa das falhas"><div class="between"><h2 class="label">Mapa das falhas</h2><span class="small muted">refeição × dia da semana</span></div>
    <div class="pd-map"><div class="pd-maprow pd-maphead"><span></span>${WD_SHORT.map((w) => `<span>${w.slice(0, 1)}</span>`).join('')}</div>${grid}</div>
    <ul class="legend pd-legend"><li><span class="lg pd-over"></span>Comeu a mais</li><li><span class="lg pd-under"></span>Não fez ou fez menos</li><li><span class="lg pd-livre"></span>Refeição livre</li></ul>
    ${detail}</section>`;
}
const DEAL_SUG = { doce: 'Sem doce em casa', bebida: 'Bebida alcoólica em 1 dia só', salgado: 'Jantar pronto antes de sair', porcao: 'Servir o prato uma vez só', outro: 'Anotar antes de comer fora do plano', troca: 'Seguir a opção do plano, sem trocar', menos: 'Comer a porção inteira do plano', semkcal: 'Anotar as calorias das trocas' };
function pdWeekCard() {
  const ws = addDays(weekStart(), -7);
  const first = firstLogDay();
  if (!first || addDays(ws, 6) < first) return '';
  const rev = (w) => { const out = []; for (let i = 0; i < 7; i++) { const k = addDays(w, i); if (k >= first && k < todayKey()) out.push(Core.dayReview(S, k)); } return out; };
  const last = rev(ws), before = rev(addDays(ws, -7));
  const off = (rs) => rs.filter((r) => r.st === 'over' || r.st === 'under');
  const cnt = {};
  off(last).forEach((r) => { cnt[r.cause] = (cnt[r.cause] || 0) + 1; });
  const causes = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
  const missed = {};
  last.forEach((r) => r.missed.forEach((m) => { missed[m] = (missed[m] || 0) + 1; }));
  const topMiss = Object.entries(missed).sort((a, b) => b[1] - a[1])[0];
  const sug = [];
  causes.forEach(([c]) => { const t = c === 'pulou' && topMiss ? 'Deixar ' + topMiss[0].toLowerCase() + ' pronto de manhã' : DEAL_SUG[c]; if (t && !sug.includes(t)) sug.push(t); });
  ['Fruta se bater vontade à noite'].forEach((t) => { if (sug.length < 3 && !sug.includes(t)) sug.push(t); });
  const prev = S.deals && S.deals[ws];
  const now = S.deals && S.deals[weekStart()];
  const n = off(last).length, nb = off(before).length;
  const pat = causes.length ? causes.slice(0, 2).map(([c, v]) => `<strong>${esc(causeTxt(c).toLowerCase())}</strong> em ${v} ${v === 1 ? 'dia' : 'dias'}`).join(' e ') : '';
  return `<section class="card stack" aria-label="Revisão da semana"><div class="between"><h2 class="label">Revisão da semana</h2><span class="small muted">${ddmm(ws)} a ${ddmm(addDays(ws, 6))}</span></div>
    <div><div class="meal-name">${n ? n + (n === 1 ? ' dia fora da meta' : ' dias fora da meta') : 'Nenhum dia fora da meta'}</div>
    <div class="small muted">${pat ? 'Padrão da semana: ' + pat + '.' : ''}${before.length ? ` Semana anterior: ${nb} ${nb === 1 ? 'dia' : 'dias'}.` : ''}</div></div>
    ${prev ? `<div class="pd-deal"><span class="small" style="font-weight:600">Combinado da semana passada</span><span style="font-weight:600">${esc(prev.t)}</span></div>` : ''}
    <div class="stack" style="gap:8px"><span style="font-weight:600">Combinado para esta semana</span>
      ${now && !UI.dealEdit ? `<div class="between" style="align-items:center"><span class="pd-deal-now">${esc(now.t)}</span><button type="button" class="link-btn pri" data-act="dealedit">Trocar</button></div>` : `
      <div class="chips">${sug.map((t) => `<button type="button" class="chip small-chip" data-act="deal" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="row" style="gap:8px"><input class="input" id="deal-text" type="text" maxlength="80" placeholder="Ou escreva o seu" aria-label="Combinado para esta semana" style="flex:1"><button type="button" class="btn small" data-act="dealtext">Salvar</button></div>`}
      <div class="small muted">Vai junto na exportação do histórico.</div></div>
  </section>`;
}
function viewAlimentacao() {
  const weeks = UI.pw || 4;
  const cells = reviewRange(weeks);
  const rs = cells.filter((c) => c.r).map((c) => c.r);
  const ws = addDays(weekStart(), UI.wk * 7);
  const week = `<section class="card stack" aria-label="Resumo da semana"><div class="between" style="align-items:center"><h2 class="label">Semana de ${ddmm(ws)}</h2>
      <div class="pill small-pill" role="group" aria-label="Qual semana"><button type="button" data-act="wk" data-v="-1" aria-pressed="${UI.wk === -1}">Passada</button><button type="button" data-act="wk" data-v="0" aria-pressed="${UI.wk === 0}">Esta</button></div></div>
      ${weekSummary(ws)}${weekGrid(ws).html}</section>`;
  if (!rs.length) return `<div class="col">${week}<section class="card small muted">Os dias fora da meta aparecem aqui a partir de amanhã. Hoje não entra porque ainda não terminou.</section></div>`;
  const c = (st) => rs.filter((r) => r.st === st).length;
  const avg = rs.reduce((a, r) => a + r.kcal, 0) / rs.length;
  const meta = num(S.goals.kcal);
  const miss = rs.reduce((a, r) => a + r.missed.length, 0);
  const lo = Math.round(meta * 0.9), hi = Math.round(meta * 1.1);
  const cal = [];
  for (let w = 0; w < weeks; w++) {
    const row = cells.slice(w * 7, w * 7 + 7);
    const wr = row.filter((x) => x.r).map((x) => x.r);
    const a = wr.length ? wr.reduce((s2, r) => s2 + r.kcal, 0) / wr.length : null;
    const acls = a === null ? '' : a > hi ? 'pd-t-over' : a < lo ? 'pd-t-under' : '';
    cal.push(`<div class="pd-calrow">${row.map((x) => x.r
      ? `<button type="button" class="pd-day pd-${x.r.st} ${UI.pday === x.k ? 'on' : ''}" data-act="pday" data-k="${x.k}" aria-label="${WD_SHORT[x.i % 7]} ${ddmm(x.k)}: ${nf(x.r.kcal)} kcal, ${PD_TXT[x.r.st].toLowerCase()}"><span>${parseKey(x.k).getDate()}</span><span class="pd-g">${PD_GLYPH[x.r.st]}</span></button>`
      : `<span class="pd-day pd-none ${x.today ? 'today' : ''}"><span>${parseKey(x.k).getDate()}</span><span class="pd-g"></span></span>`).join('')}<span class="pd-avg num ${acls}">${a === null ? '' : nf(a)}</span></div>`);
  }
  const summary = `<section class="card stack" aria-label="Dias fora da meta"><div class="between" style="align-items:center"><h2 class="label">Calorias</h2>
      <div class="pill small-pill" role="group" aria-label="Período"><button type="button" data-act="pw" data-v="4" aria-pressed="${weeks === 4}">4 semanas</button><button type="button" data-act="pw" data-v="8" aria-pressed="${weeks === 8}">8 semanas</button></div></div>
    <div class="pd-tiles">
      <div class="pd-tile pd-ok"><span class="num">${c('ok')}</span><span>na meta</span></div>
      <div class="pd-tile pd-over"><span class="num">▲ ${c('over')}</span><span>acima${c('livre') ? ` <span style="font-weight:500">· +${c('livre')} livre</span>` : ''}</span></div>
      <div class="pd-tile pd-under"><span class="num">▼ ${c('under')}</span><span>abaixo</span></div>
      <div class="pd-tile"><span class="num">${miss}</span><span>refeições não feitas</span></div>
    </div>
    <div class="between small" style="border-top:1px solid var(--line);padding-top:10px"><span class="muted">Média por dia${meta ? ` · meta ${nf(meta)}` : ''}</span><span><strong class="num">${nf(avg)} kcal</strong>${meta ? ` <span class="muted">(${sgnK(Math.round(avg - meta))})</span>` : ''}</span></div>
    <div class="pd-cal"><div class="pd-calrow pd-calhead">${WD_SHORT.map((w) => `<span>${w.slice(0, 1)}</span>`).join('')}<span class="pd-avg">média</span></div>${cal.join('')}</div>
    <ul class="legend pd-legend"><li><span class="lg pd-ok"></span>Na meta</li><li><span class="lg pd-over"></span>Acima</li><li><span class="lg pd-livre"></span>Refeição livre</li><li><span class="lg pd-under"></span>Abaixo</li></ul>
  </section>`;
  const dayCard = pdDayCard(cells);
  return `<div class="split"><div class="col">${summary}<div class="only-mobile col">${dayCard}</div>${pdMap(cells)}</div><div class="col"><div class="only-desktop col">${dayCard}</div>${pdWeekCard()}${week}</div></div>`;
}
function viewProgresso() {
  const g = S.goals;
  const k = todayKey();
  const e = S.checkins;
  const w = weighIns();
  const lc = lastCheckin();
  const diff = w.length > 1 ? Math.round((lc.peso - w[0].peso) * 10) / 10 : null;
  const waist = e.filter((x) => num(x.cintura));
  const wDiff = waist.length > 1 ? Math.round((waist[waist.length - 1].cintura - waist[0].cintura) * 10) / 10 : null;
  const ws = addDays(weekStart(), UI.wk * 7);
  const mIn = (m) => `<label class="field">${m.label} (cm)<input class="input strong" id="ck-${m.id}" type="number" inputmode="decimal" step="0.5" placeholder="${lastMeasure(m.id) ? nf(lastMeasure(m.id)[m.id], 1) : '—'}"></label>`;
  const evol = MEDIDAS.map((m) => {
    const vals = e.filter((x) => num(x[m.id]));
    if (!vals.length) return null;
    const f = vals[0], l = vals[vals.length - 1];
    const d = Math.round((l[m.id] - f[m.id]) * 10) / 10;
    return `<tr><td>${m.label}</td><td>${nf(f[m.id], 1)}</td><td><strong>${nf(l[m.id], 1)}</strong></td><td>${vals.length > 1 ? (d > 0 ? '+' : '') + nf(d, 1) : '—'}</td></tr>`;
  }).filter(Boolean);
  const canPhoto = !!(sb && UI.auth.user);
  const comida = UI.prog === 'comida';
  const tabs = `<div class="pill prog-tabs" role="group" aria-label="O que ver"><button type="button" data-act="prog" data-v="corpo" aria-pressed="${!comida}">Corpo</button><button type="button" data-act="prog" data-v="comida" aria-pressed="${comida}">Alimentação</button></div>`;
  if (comida) return header('Progresso', 'Dias fora da meta e os padrões') + tabs + viewAlimentacao();
  return header('Progresso', 'Check-in uma vez por semana, em jejum') + tabs + `<div class="split"><div class="col">
    ${hintCard()}
    <section class="card stack" aria-label="Check-in semanal"><div class="meal-name">Check-in semanal</div>
      <div class="grid2"><label class="field">Peso (kg)<input class="input strong" id="ck-peso" type="number" inputmode="decimal" step="0.1" placeholder="${lc ? nf(lc.peso, 1) : '81,0'}"></label>${mIn(MEDIDAS[0])}</div>
      <details class="more"><summary>Outras medidas <span class="muted">· a cada 2 a 4 semanas</span></summary>
        <div class="grid2" style="margin-top:12px">${MEDIDAS.slice(1).map(mIn).join('')}</div>
      </details>
      <details class="more"><summary>Como medir</summary>
        <div class="small muted" style="margin-bottom:4px">De manhã, em jejum e antes de treinar. Fita rente à pele, sem apertar, paralela ao chão. Sempre o mesmo lado. Meça duas vezes e anote a média.</div>
        ${MEDIDAS.map((m) => `<details class="how"><summary>${m.label}</summary><div class="small">${m.how}</div></details>`).join('')}
      </details>
      ${canPhoto ? `<label class="field">Foto (opcional)<span class="file-btn">${I.camera}<span id="ck-foto-name">Escolher foto</span><input id="ck-foto" type="file" accept="image/*" data-in="photo"></span></label>` : ''}
      <label class="field">Data<input class="input" id="ck-data" type="date" value="${k}" max="${k}"></label>
      <button type="button" class="btn block" data-act="checkin">Registrar check-in</button></section>
    <section class="card stack chart" aria-label="Gráfico do peso"><div class="between"><h2 class="label">Peso</h2><span class="muted small">${lc ? `<span class="num" style="font-size:22px;color:var(--ink)">${nf(lc.peso, 1)}</span> kg${diff !== null ? ' · ' + (diff > 0 ? '+' : '') + nf(diff, 1) + ' kg' : ''}` : ''}</span></div>
      ${lineChart('peso', w.map((x) => ({ date: x.date, v: num(x.peso) })), { unit: 'kg', rate: -0.5, ref: num(g.meta), ahead: 28, minSpan: 56, empty: 'Faça o primeiro check-in para ver o gráfico.', aria: 'Peso por check-in, com o ritmo planejado de meio quilo por semana' })}
      ${w.length ? `<ul class="legend" aria-label="Legenda"><li><span class="lg lg-real"></span>Pesagens</li>${w.length > 2 ? '<li><span class="lg lg-avg"></span>Média de 3 pesagens</li>' : ''}<li><span class="lg lg-plan"></span>Ritmo de 0,5 kg/semana</li>${num(g.meta) ? '<li><span class="lg lg-ref"></span>Peso de referência</li>' : ''}</ul>
      <div class="small muted">Toque num ponto para ver o valor.</div>` : ''}</section>
    ${waist.length ? `<section class="card stack chart" aria-label="Gráfico da cintura"><div class="between"><h2 class="label">Cintura</h2><span class="muted small"><span class="num" style="font-size:22px;color:var(--ink)">${nf(waist[waist.length - 1].cintura, 1)}</span> cm${wDiff !== null ? ' · ' + (wDiff > 0 ? '+' : '') + nf(wDiff, 1) + ' cm' : ''}</span></div>
      ${lineChart('cintura', waist.map((x) => ({ date: x.date, v: num(x.cintura) })), { unit: 'cm', aria: 'Cintura por check-in' })}</section>` : ''}
  </div><div class="col">
    ${photosCard()}
    ${evol.length ? `<section class="card" aria-label="Medidas"><h2 class="label" style="margin-bottom:6px">Medidas (cm)</h2>
      <table class="table"><thead><tr><th>Medida</th><th>Primeira</th><th>Última</th><th>Variação</th></tr></thead><tbody>${evol.join('')}</tbody></table>
      <div class="small muted" style="margin-top:8px">Cintura caindo com peito, braço e coxa mantidos ou subindo é perda de gordura com ganho de massa.</div></section>` : ''}
    <section class="card" aria-label="Histórico"><h2 class="label" style="margin-bottom:6px">Histórico</h2>
      ${e.length ? `<table class="table"><thead><tr><th>Data</th><th>Peso</th><th>Cintura</th><th class="del"><span class="sr-only">Apagar</span></th></tr></thead><tbody>${(UI.histAll ? e.slice().reverse() : e.slice(-5).reverse()).map((x) => `<tr><td>${ddmm(x.date)}${MEDIDAS.slice(1).some((m) => num(x[m.id])) ? ' <span class="tag">+ medidas</span>' : ''}${x.fotos && x.fotos.length ? ' <span class="tag">foto</span>' : ''}</td><td><strong>${num(x.peso) ? nf(x.peso, 1) + ' kg' : '—'}</strong></td><td>${x.cintura ? nf(x.cintura, 1) + ' cm' : '—'}</td><td class="del"><button type="button" class="del-btn" data-act="delcheckin" data-date="${x.date}" aria-label="Apagar check-in de ${ddmm(x.date)}">${I.x}</button></td></tr>`).join('')}</tbody></table>${e.length > 5 ? `<button type="button" class="btn small ghost block" style="margin-top:12px" data-act="histall">${UI.histAll ? 'Mostrar só os 5 últimos' : 'Ver todos os ' + e.length + ' check-ins'}</button>` : ''}` : '<div class="small muted">Sem check-ins ainda.</div>'}</section>
  </div></div>`;
}

/* ---------- Plano ---------- */
function viewPlano() {
  if (UI.planTab === 'compras') return viewCompras();
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
        ${UI.pick && UI.pick.ctx === 'plan' ? foodPicker() : `<div class="grid2"><button type="button" class="btn dashed" data-act="additem">+ Adicionar alimento</button><button type="button" class="btn dashed" data-act="pickopen" data-v="plan">${I.busca} Do banco de alimentos</button></div>`}
      </div>
      <div class="opt-total"><span>Total da opção</span><span id="opt-total">${nf(ot.k)} kcal · P ${nf(ot.p)} · C ${nf(ot.c)} · G ${nf(ot.g)}</span></div>` : '<div class="muted small">Esta refeição não tem opções.</div>'}
      <div class="toolbar">${o ? '<button type="button" class="btn small ghost" data-act="dupopt">Duplicar opção</button>' : ''}${o && m.opts.length > 1 ? '<button type="button" class="btn danger" data-act="delopt">Apagar opção</button>' : ''}<button type="button" class="btn danger" data-act="delmeal">Apagar refeição</button></div>
    </section>`;
  }
  const metas = UI.metasOpen
    ? `<section class="card stack" aria-label="Regras do plano"><div class="between"><h2 class="label">Metas e regras</h2><button type="button" class="link-btn pri" data-act="metas">Fechar</button></div>
      <div class="small muted">A refeição livre (1 por semana) é fixa. Escreva aqui as outras regras, uma por linha. Elas aparecem em Hoje.</div>
      <textarea class="input" rows="4" data-in="rules" aria-label="Regras do plano, uma por linha">${esc(S.rules.join('\n'))}</textarea></section>
    ${goalsCard()}`
    : `<section class="card stack" aria-label="Metas e regras" style="gap:4px"><div class="between"><h2 class="label">Metas e regras</h2><button type="button" class="link-btn pri" data-act="metas">Editar</button></div>
      <div class="small muted">${nf(g.kcal)} kcal · ${nf(g.prot)} g de proteína · ${(num(g.agua) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L de água · ${S.rules.length + 1} ${S.rules.length ? 'regras' : 'regra'}</div></section>`;
  return header('Plano', 'Totais com a 1ª opção de cada refeição') + planSeg() + `
    <div class="grid4 plan-tiles" style="gap:10px">${tile('Calorias', t.k, g.kcal, '', 'tot-k')}${tile('Proteína', t.p, g.prot, ' g', 'tot-p')}${tile('Carbo', t.c, g.carb, ' g', 'tot-c')}${tile('Gordura', t.g, g.fat, ' g', 'tot-g')}</div>
    <div class="split plano"><nav class="meal-tabs" aria-label="Refeições">${tabs}</nav>${editor}</div>
    ${metas}`;
}
const planSeg = () => `<div class="pill prog-tabs" role="group" aria-label="O que ver"><button type="button" data-act="plantab" data-v="refeicoes" aria-pressed="${UI.planTab !== 'compras'}">Refeições</button><button type="button" data-act="plantab" data-v="compras" aria-pressed="${UI.planTab === 'compras'}">Compras</button></div>`;
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

/* ---------- Lista de compras ---------- */
function fmtQty(n, unit) {
  if (!unit) return 'à vontade';
  const r = (v, d) => nf(Math.round(v * 10 ** d) / 10 ** d, d);
  if (unit === 'g') return n >= 1000 ? r(n / 1000, 2) + ' kg' : r(n, 0) + ' g';
  if (unit === 'ml') return n >= 1000 ? r(n / 1000, 2) + ' L' : r(n, 0) + ' ml';
  const plural = n > 1 && ['fatia', 'dose', 'concha', 'pote', 'xícara'].includes(unit) ? unit + 's' : unit;
  return r(n, n % 1 ? 1 : 0) + ' ' + plural;
}
function shopMix() {
  const mix = {};
  S.plan.forEach((m) => { mix[m.id] = Core.optionMix(S, m, todayKey()); });
  return mix;
}
function shopItems() {
  const C = S.shop;
  return Core.shoppingList(S, C.days, C.opt, C.mode === 'auto' ? shopMix() : null);
}
/* Ajustes da lista só valem para a semana atual: tirar um item, mudar a quantidade, acrescentar algo */
const shopKey = (x) => Core.norm(x.food) + '|' + x.unit;
function shopEdits() {
  const ws = weekStart();
  const E = S.shop.edit;
  return E && E.wk === ws ? E : { wk: ws, rm: {}, qty: {}, add: [] };
}
function setShopEdits(fn) {
  const E = shopEdits();
  fn(E);
  S.shop.edit = E;
  save({ touch: 'shop' });
}
function shopFinal() {
  const E = shopEdits();
  const base = shopItems().map((x) => { const key = shopKey(x); return { key, food: x.food, meals: x.meals.join(', '), qty: E.qty[key] || fmtQty(x.n, x.unit), edited: !!E.qty[key], removed: !!E.rm[key] }; });
  const added = (E.add || []).map((a) => ({ key: 'add|' + a.id, id: a.id, food: a.food, meals: 'Acrescentado nesta semana', qty: a.qty || '', custom: true }));
  return { list: base.filter((x) => !x.removed).concat(added), removed: base.filter((x) => x.removed) };
}
function shopText() {
  return shopFinal().list.map((x) => `- ${x.food}${x.qty ? ': ' + x.qty : ''}`).join('\n');
}
const DIA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
/* Dia das compras: ajuste em Conta e card em Hoje */
function shopDayText() {
  const d = S.shop.day;
  if (d < 0) return 'sem dia definido';
  return d === 0 || d === 6 ? 'todo ' + DIAS[d].toLowerCase() : 'toda ' + DIAS[d].toLowerCase() + '-feira';
}
function shopTodayCard(k) {
  if (k !== todayKey() || S.shop.day < 0 || parseKey(k).getDay() !== S.shop.day || PREF.shop.seen === k || !S.plan.length) return '';
  const n = shopFinal().list.length;
  return `<section class="card shop-card" aria-label="Lista de compras"><span class="shop-ico">${I.compras}</span><a href="#plano" data-act="plantab" data-v="compras" class="shop-card-main"><span class="meal-name">Dia de compras</span><span class="small muted">Lista da semana pronta: ${n} itens para ${S.shop.days} dias${S.shop.mode === 'auto' ? ', pelo que você tem comido' : ''}.</span></a><button type="button" class="del-btn" data-act="shopseen" aria-label="Esconder até a próxima semana">${I.x}</button></section>`;
}
function viewCompras() {
  const C = S.shop;
  const P = PREF.shop;
  const auto = C.mode === 'auto';
  const F = shopFinal();
  const list = F.list;
  const got = list.filter((x) => P.got[x.key]).length;
  const multi = S.plan.filter((m) => m.opts.length > 1);
  const mix = auto ? shopMix() : null;
  const optInfo = multi.map((m) => {
    if (auto) {
      const parts = m.opts.map((o, i) => [o.name, mix[m.id][i]]).filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]);
      return `<div class="mix-row"><span class="field">${esc(m.name)}</span><span class="small">${parts.map(([n, w]) => `${esc(n)} <strong>${Math.round(w * 100)}%</strong>`).join(' · ')}</span></div>`;
    }
    return `<div class="stack" style="gap:6px"><span class="field">${esc(m.name)}</span><div class="chips">${m.opts.map((o, i) => `<button type="button" class="chip small-chip ${(C.opt[m.id] || 0) === i ? 'on' : ''}" aria-pressed="${(C.opt[m.id] || 0) === i}" data-act="shopopt" data-meal="${esc(m.id)}" data-i="${i}">${esc(o.name)}</button>`).join('')}</div></div>`;
  }).join('');
  return header('Plano', C.day >= 0 ? 'Compras ' + shopDayText() : 'Lista de compras a partir do plano') + planSeg() + `
    <section class="card stack" aria-label="Como montar a lista">
      <div class="pill" role="group" aria-label="Como escolher as opções" style="align-self:flex-start"><button type="button" data-act="shopmode" data-v="auto" aria-pressed="${auto}">Pelo que você come</button><button type="button" data-act="shopmode" data-v="manual" aria-pressed="${!auto}">Escolher opções</button></div>
      <div class="small muted">${auto ? 'Soma as opções de cada refeição na proporção em que você escolheu cada uma nas últimas 2 semanas. Sem histórico, usa a 1ª opção.' : 'Escolha uma opção por refeição.'}</div>
      ${optInfo ? `<details class="more" ${auto ? '' : 'open'}><summary>${auto ? 'Proporção de cada opção' : 'Qual opção comprar'} <span class="muted">· ${multi.length} ${multi.length === 1 ? 'refeição' : 'refeições'}</span></summary><div class="stack" style="margin-top:8px">${optInfo}</div></details>` : ''}
      <div class="between" style="align-items:center"><span class="meal-name">Para quantos dias</span>
      <div class="stepper" style="min-width:160px"><button type="button" data-act="shopdays" data-v="-1" aria-label="Menos dias">−</button><span class="num">${C.days}</span><button type="button" data-act="shopdays" data-v="1" aria-label="Mais dias">+</button></div></div>
      <div class="small muted">Pesos de alimentos cozidos: compre um pouco mais do cru. O dia das compras se ajusta em <a href="#conta">Conta e ajustes</a>.</div></section>
    <section class="card" aria-label="Lista"><div class="between" style="margin-bottom:6px"><h2 class="label">Lista · ${got} de ${list.length}</h2>${got ? '<button type="button" class="link-btn" data-act="shopclear">Desmarcar tudo</button>' : ''}</div>
      ${list.length ? `<ul class="shop">${list.map((x) => {
        const on = !!P.got[x.key];
        if (UI.shopEdit === x.key) return `<li class="shop-edit"><div class="shop-name" style="font-weight:600">${esc(x.food)}<span class="small muted">${esc(x.meals)}</span></div>
          <label class="field">Quantidade desta semana<input class="input" id="shop-qty" type="text" value="${esc(x.qty)}" maxlength="30"></label>
          <div class="toolbar"><button type="button" class="btn small" data-act="shopqty" data-k="${esc(x.key)}">Salvar</button><button type="button" class="btn small ghost" data-act="shoprm" data-k="${esc(x.key)}">${x.custom ? 'Apagar item' : 'Não comprar esta semana'}</button><button type="button" class="link-btn" data-act="shopeditx">Cancelar</button></div></li>`;
        return `<li class="shop-li"><button type="button" class="shop-item ${on ? 'on' : ''}" data-act="shopgot" data-k="${esc(x.key)}" aria-pressed="${on}"><span class="check small ${on ? 'on' : ''}" aria-hidden="true">${on ? I.check : ''}</span><span class="shop-name">${esc(x.food)}<span class="small muted">${esc(x.meals)}</span></span><strong class="num">${esc(x.qty)}${x.edited ? ' <span class="tag">ajustado</span>' : ''}</strong></button><button type="button" class="shop-pen" data-act="shopedit" data-k="${esc(x.key)}" aria-label="Ajustar ${esc(x.food)}">${I.lapis}</button></li>`;
      }).join('')}</ul>` : '<div class="small muted">A lista está vazia.</div>'}
      ${UI.shopAdd ? `<div class="shop-edit" style="margin-top:8px"><div class="grid2"><label class="field">Item<input class="input" id="shop-add-food" type="text" maxlength="40" placeholder="ex.: Café"></label><label class="field">Quantidade<input class="input" id="shop-add-qty" type="text" maxlength="30" placeholder="ex.: 500 g"></label></div>
        <div class="toolbar"><button type="button" class="btn small" data-act="shopaddok">Acrescentar</button><button type="button" class="link-btn" data-act="shopaddx">Cancelar</button></div></div>` : `<button type="button" class="btn small dashed block" style="margin-top:10px" data-act="shopadd">+ Acrescentar item</button>`}
      ${F.removed.length ? `<details class="more" style="margin-top:8px"><summary>Fora da lista desta semana <span class="muted">· ${F.removed.length}</span></summary><ul class="shop-out">${F.removed.map((x) => `<li><span>${esc(x.food)}</span><button type="button" class="link-btn" data-act="shopback" data-k="${esc(x.key)}">Devolver</button></li>`).join('')}</ul></details>` : ''}
      <div class="small muted" style="margin-top:8px">Os ajustes valem só para esta semana. Na segunda-feira a lista volta a seguir o plano.</div>
    </section>
    <div class="toolbar"><button type="button" class="btn small" data-act="shopshare">${I.copiar} ${navigator.share ? 'Compartilhar' : 'Copiar'} lista</button></div>`;
}

/* ---------- Conta ---------- */
function prefsCards() {
  const R = PREF.remind;
  const supported = 'Notification' in window;
  const perm = supported ? Notification.permission : 'unsupported';
  const sel = (act, cur, opts) => `<div class="chips">${opts.map(([v, l]) => `<button type="button" class="chip small-chip ${cur === v ? 'on' : ''}" aria-pressed="${cur === v}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const shopDays = [[-1, 'Nenhum']].concat([1, 2, 3, 4, 5, 6, 0].map((d) => [d, DIA_CURTO[d]]));
  return `<section class="card stack" aria-label="Lista de compras"><div class="between" style="align-items:center"><span class="meal-name">Lista de compras semanal</span><a class="small" style="font-weight:600;text-decoration:none" href="#plano" data-act="plantab" data-v="compras">Ver lista</a></div>
    <span class="field">Dia das compras</span>${sel('shopday', S.shop.day, shopDays)}
    <div class="small muted">No dia das compras, a lista da semana aparece em Hoje${PREF.remind.on ? ' e chega um lembrete às 10h' : ' (e chega um lembrete às 10h, se os lembretes estiverem ligados)'}. Ela usa o plano atual, então muda sozinha quando a dieta muda.</div></section>
  <section class="card stack" aria-label="Tema"><div class="meal-name">Tema</div>${themePill()}<div class="small muted">Automático segue o modo claro ou escuro do aparelho.</div></section>
  <section class="card stack" aria-label="Lembretes"><div class="between" style="align-items:center"><span class="meal-name">Lembretes</span>
    ${supported && perm !== 'denied' ? `<button type="button" class="btn small ${R.on ? 'ghost' : ''}" data-act="remindtoggle">${R.on ? 'Desligar' : 'Ligar'}</button>` : ''}</div>
    ${!supported ? '<div class="small muted">Este navegador não mostra notificações. No iPhone, instale o app na tela de início (Compartilhar › Adicionar à Tela de Início) e abra por lá.</div>'
      : perm === 'denied' ? '<div class="auth-msg err">As notificações estão bloqueadas para este site. Libere nas configurações do navegador.</div>'
      : R.on ? `<span class="field">Aviso da refeição</span>${sel('remindbefore', R.before, [[0, 'Na hora'], [15, '15 min antes'], [30, '30 min antes']])}
        <span class="field">Lembrete de água</span>${sel('remindwater', R.water, [[0, 'Desligado'], [2, 'A cada 2 h'], [3, 'A cada 3 h']])}
        <div class="small muted">Só avisa refeições que ainda não foram marcadas, e água se estiver abaixo do esperado para a hora (entre 8h e 22h).</div>` : '<div class="small muted">Avisa na hora de cada refeição e, se quiser, para beber água.</div>'}
    <div class="small muted">Os avisos funcionam com o app aberto ou em segundo plano há pouco tempo. Com o app fechado por completo, o navegador não deixa um site avisar sem um servidor de notificações.</div></section>`;
}
function dadosCard() {
  return `<section class="card stack" aria-label="Dados"><div class="meal-name">Dados</div>
    <div class="list-btns">
      <button type="button" class="row-btn" data-act="exporthist"><span><strong>Exportar histórico</strong><span class="small muted">Planilha com cada dia, refeições, anotações, treinos, check-ins e combinados</span></span>${I.chev}</button>
      <button type="button" class="row-btn" data-act="export"><span><strong>Exportar plano</strong><span class="small muted">Planilha do plano atual</span></span>${I.chev}</button>
      <button type="button" class="row-btn" data-act="import"><span><strong>Importar plano</strong><span class="small muted">Substitui o plano atual pela planilha</span></span>${I.chev}</button>
      <button type="button" class="row-btn" data-act="reset"><span><strong>Restaurar plano padrão</strong></span>${I.chev}</button>
    </div>
    <details class="more"><summary>Formato da planilha do plano</summary><div class="small muted" style="padding-bottom:8px">Use a planilha exportada como modelo: colunas Refeição, Horário, Opção, Alimento, Quantidade, kcal, Proteína (g), Carbo (g), Gordura (g) e Dica.</div></details></section>`;
}
function viewConta() {
  const head = header('Conta', '', ['#hoje', 'Hoje']);
  if (!sb) {
    return head + `<div class="card stack"><div class="meal-name">Sincronização desligada</div><div class="small muted">Os dados ficam salvos só neste aparelho. Para ver no celular e no PC, preencha a URL e a chave anon do Supabase no arquivo config.js.</div></div>` + prefsCards() + dadosCard();
  }
  const u = UI.auth.user;
  if (u) {
    return head + `<div class="card stack"><div class="small muted" style="font-weight:600">Conectado como</div><div class="meal-name" style="word-break:break-all">${esc(u.email)}</div>
      <div class="small muted" data-sync>${esc(UI.sync || 'Os dados sincronizam sozinhos entre o celular e o PC.')}</div>
      <div class="toolbar"><button type="button" class="btn small" data-act="syncnow">Sincronizar agora</button><button type="button" class="btn small ghost" data-act="logout">Sair</button></div></div>` + prefsCards() + dadosCard();
  }
  return head + `<div class="card stack"><div class="meal-name">Usando sem conta</div><div class="small muted">Os dados ficam só neste aparelho. Com uma conta, o plano, as metas, o progresso e as fotos ficam iguais no celular e no PC.</div>
    <div class="toolbar"><a class="btn small" href="#entrar">Entrar</a><a class="btn small ghost" href="#criar-conta">Criar conta</a></div></div>` + prefsCards() + dadosCard();
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
const TABLE = 'dieta_estado';
const PHOTO_BUCKET = 'fotos-progresso';
const SYNC_KEY = 'personalnutri_sincronizado_em';
const REMOTE_KEY = 'personalnutri_remoto_em';
/* syncedAt: o updatedAt local que já foi enviado. remoteSeen: o updated_at do servidor da última vez que lemos ou gravamos.
   Comparar o updated_at do servidor por igualdade não depende do relógio de nenhum aparelho. */
const syncedAt = () => { try { return Number(localStorage.getItem(SYNC_KEY)) || 0; } catch (e) { return 0; } };
const markSynced = (t) => { try { localStorage.setItem(SYNC_KEY, String(t || 0)); } catch (e) { /* ignore */ } };
const remoteSeen = () => { try { return localStorage.getItem(REMOTE_KEY) || ''; } catch (e) { return ''; } };
const markRemote = (t) => { try { if (t) localStorage.setItem(REMOTE_KEY, t); else localStorage.removeItem(REMOTE_KEY); } catch (e) { /* ignore */ } };
const pending = () => (S.updatedAt || 0) > syncedAt();
function setSync(msg) { UI.sync = msg; document.querySelectorAll('[data-sync]').forEach((el) => { el.textContent = msg; }); }
const syncOk = () => setSync('Sincronizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(push, 900); }
let pushing = false, pushAgain = false;
/* Grava só se o servidor ainda estiver na versão que conhecemos; se outro aparelho gravou antes, junta primeiro */
async function push(depth = 0) {
  if (!sb || !UI.auth.user) return;
  if (pushing) { pushAgain = true; return; }
  pushing = true;
  try {
    const sentAt = S.updatedAt;
    const seen = remoteSeen();
    const row = { data: S, updated_at: new Date().toISOString() };
    const q = seen
      ? sb.from(TABLE).update(row).eq('user_id', UI.auth.user.id).eq('updated_at', seen).select('updated_at')
      : sb.from(TABLE).upsert({ user_id: UI.auth.user.id, ...row }).select('updated_at');
    const { data, error } = await q;
    if (error) { setSync('Erro ao sincronizar: ' + error.message); return; }
    if (!data || !data.length) {
      /* Outro aparelho gravou no meio do caminho */
      pushing = false;
      if (depth < 3) await pull(depth + 1);
      return;
    }
    markRemote(data[0].updated_at);
    markSynced(sentAt);
    syncOk();
  } finally {
    pushing = false;
    if (pushAgain) { pushAgain = false; schedulePush(); }
  }
}
async function pull(depth = 0) {
  if (!sb || !UI.auth.user) return;
  const { data, error } = await sb.from(TABLE).select('data, updated_at').eq('user_id', UI.auth.user.id).maybeSingle();
  if (error) { setSync('Erro ao sincronizar: ' + error.message); return; }
  if (!data || !data.data) { markRemote(''); if (S.updatedAt) await push(depth); return; }
  if (data.updated_at === remoteSeen()) {
    if (pending()) await push(depth); else syncOk();
    return;
  }
  const remote = normalizeState(data.data);
  markRemote(data.updated_at);
  if (pending()) {
    /* Os dois aparelhos mudaram: junta parte por parte e envia o resultado */
    S = Core.mergeStates(S, remote);
    migratePlan();
    S.updatedAt = Date.now();
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
    render();
    await push(depth);
    return;
  }
  S = remote;
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  markSynced(S.updatedAt);
  setSync('Dados trazidos da nuvem');
  if (migratePlan()) save({ render: false });
  render();
  scheduleReminders();
}

/* ---------- Fotos de progresso (Supabase Storage) ---------- */
/* Reduz a foto para no máximo 1280 px e JPEG, para subir rápido e ocupar pouco */
function shrinkImage(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('Não consegui ler a foto.'))), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não consegui ler a foto.')); };
    img.src = url;
  });
}
async function uploadPhoto(file, date) {
  const blob = await shrinkImage(file);
  const path = `${UI.auth.user.id}/${date}-${uid()}.jpg`;
  const { error } = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw new Error(/bucket|not found/i.test(error.message) ? 'O armazenamento de fotos não está configurado. Rode a parte de fotos do supabase.sql.' : 'Erro ao enviar a foto: ' + error.message);
  return path;
}
let photoLoading = false;
async function loadPhotoUrls(paths) {
  const missing = [...new Set(paths)].filter((p) => !(p in UI.photos));
  if (!missing.length || photoLoading || !sb || !UI.auth.user) return;
  photoLoading = true;
  try {
    const { data, error } = await sb.storage.from(PHOTO_BUCKET).createSignedUrls(missing, 3600);
    if (error) missing.forEach((p) => { UI.photos[p] = ''; });
    else (data || []).forEach((d) => { UI.photos[d.path] = d.signedUrl || ''; });
  } finally { photoLoading = false; }
  if (route().name === 'progresso') render();
}

async function initAuth() {
  if (!sb) return;
  setTimeout(() => { if (!UI.auth.ready) { UI.auth.ready = true; render(); } }, 4000);
  sb.auth.onAuthStateChange((event, session) => {
    const before = UI.auth.user && UI.auth.user.id;
    UI.auth.ready = true;
    if (event === 'PASSWORD_RECOVERY') UI.auth.recovery = true;
    UI.auth.user = session ? session.user : null;
    if (UI.auth.user && UI.auth.user.id !== before) setTimeout(() => pull(), 0);
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
    const rs = wb.Sheets['Regras'];
    const rules = rs ? XLSX.utils.sheet_to_json(rs, { header: 1, defval: '' }).slice(1).map((r) => String(r[0] || '').trim()).filter((r) => r && !/refei[cç][aã]o livre por semana/i.test(r)) : null;
    if (!plan.length) { toast('Não encontrei as colunas Refeição e Alimento. Use a planilha exportada como modelo.'); return; }
    const opts = plan.reduce((a, m) => a + m.opts.length, 0);
    const kcal = plan.reduce((a, m) => a + sum(m.opts[0].items).k, 0);
    if (!(await ask(`Substituir o plano atual por ${plan.length} refeições e ${opts} opções (≈ ${nf(kcal)} kcal com a primeira opção de cada)?`, { ok: 'Substituir', title: 'Importar plano' }))) return;
    const byName = Object.fromEntries(S.plan.map((m) => [m.name, m.id]));
    plan.forEach((m) => { if (byName[m.name]) m.id = byName[m.name]; });
    S.plan = plan;
    if (rules) S.rules = rules;
    UI.plano = { meal: 0, opt: {} };
    save({ touch: rules ? ['plan', 'rules'] : 'plan' });
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
    const wr = XLSX.utils.json_to_sheet([{ 'Regra': '1 refeição livre por semana (fixa no app)' }].concat(S.rules.map((r) => ({ 'Regra': r }))));
    wr['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wr, 'Regras');
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
  await fetchTreinos(true); /* treinos do TreinoHoje só entram na planilha */
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
      mealsOfDay(k).forEach((m) => {
        const done = isDone(m, k);
        const pl = planned(m, k);
        const ns = notesOf(k, m.id);
        const intake = mealIntake(m, k);
        if (done) feitas++;
        if (done && !intake.replaced) kPlano += pl.k;
        p += intake.p; c += intake.c; gg += intake.g;
        kAnot += intake.k - (done && !intake.replaced ? pl.k : 0);
        refeicoes.push({
          'Data': k, 'Dia': dn, 'Refeição': m.name, 'Horário': m.time, 'Opção do plano': pl.name,
          'Feita': sim(done), 'Seguiu o plano': done ? sim(!intake.replaced) : '',
          'kcal do plano': done && !intake.replaced ? pl.k : '', 'Proteína (g)': done && !intake.replaced ? pl.p : '',
          'Carbo (g)': done && !intake.replaced ? pl.c : '', 'Gordura (g)': done && !intake.replaced ? pl.g : '',
          'Anotações': ns.map((n) => (NOTE_SHORT[n.type] || '') + ': ' + (n.text || '') + (num(n.kcal) ? ' (' + n.kcal + ' kcal' + (num(n.p) ? ', ' + n.p + ' g prot.' : '') + ')' : '')).join(' | ')
        });
        ns.forEach((n) => { textos.push(m.name + ' – ' + (NOTE_SHORT[n.type] || '') + ': ' + (n.text || '')); anotacoes.push({ 'Data': k, 'Refeição': m.name, 'Tipo': NOTE_TYPES[n.type] || n.type, 'Categoria': NOTE_CATS[n.cat] || '', 'O que comeu': n.text || '', 'kcal estimadas': num(n.kcal) || '', 'Proteína (g)': num(n.p) || '', 'Carbo (g)': num(n.c) || '', 'Gordura (g)': num(n.g) || '' }); });
      });
      notesOf(k, FORA).forEach((n) => { kAnot += num(n.kcal); p += num(n.p); c += num(n.c); gg += num(n.g); textos.push('Fora das refeições: ' + (n.text || '')); anotacoes.push({ 'Data': k, 'Refeição': 'Fora das refeições', 'Tipo': NOTE_TYPES[n.type] || n.type, 'Categoria': NOTE_CATS[n.cat] || '', 'O que comeu': n.text || '', 'kcal estimadas': num(n.kcal) || '', 'Proteína (g)': num(n.p) || '', 'Carbo (g)': num(n.c) || '', 'Gordura (g)': num(n.g) || '' }); });
      const bebidas = S.drinks.filter((x) => x.date === k);
      const kBeb = bebidas.reduce((a, x) => a + num(x.kcal), 0);
      const ck = S.checkins.find((x) => x.date === k);
      const livre = notesOf(k, FORA).concat(...mealsOfDay(k).map((m) => notesOf(k, m.id))).some((n) => n.type === 'livre') || S.free[weekStart(k)] === k;
      const total = kPlano + kAnot + kBeb;
      const rv = k < todayKey() ? Core.dayReview(S, k) : null;
      resumo.push({
        'Data': k, 'Dia': dn, 'Refeições feitas': feitas, 'Refeições no plano': S.plan.length,
        'kcal do plano': Math.round(kPlano), 'kcal anotadas': Math.round(kAnot), 'kcal de bebida alcoólica': Math.round(kBeb), 'kcal total': Math.round(total),
        'Meta kcal': num(g.kcal) || '', 'Diferença da meta': num(g.kcal) ? Math.round(total - num(g.kcal)) : '',
        'Situação': rv ? PD_TXT[rv.st] : '', 'Causa principal': rv && rv.cause ? causeTxt(rv.cause) : '', 'Refeições não feitas': rv ? rv.missed.join(', ') : '',
        'Treino (TreinoHoje)': treinosDe(k).map(Core.treinoTxt).join(' + '),
        'Proteína (g)': Math.round(p), 'Carbo (g)': Math.round(c), 'Gordura (g)': Math.round(gg),
        'Refeição livre': sim(livre), 'Bebida alcoólica (ml)': bebidas.reduce((a, x) => a + x.cups * x.ml, 0),
        'Água (ml)': num(S.days[k] && S.days[k].water), 'Meta de água (ml)': num(g.agua) || '',
        'Peso (kg)': ck && num(ck.peso) ? ck.peso : '', 'Cintura (cm)': ck && ck.cintura ? ck.cintura : '', 'Anotações': textos.join(' | ')
      });
    });
    const leia = [
      { 'Leia-me': 'Exportado do PersonalNutri em ' + new Date().toLocaleString('pt-BR') + '.' },
      { 'Leia-me': 'Resumo diário: uma linha por dia, inclusive dias sem nenhum registro (refeições feitas = 0).' },
      { 'Leia-me': 'kcal do plano: soma das refeições marcadas como feitas, pela opção do plano escolhida no dia.' },
      { 'Leia-me': 'kcal anotadas: estimativas para trocas, comida a mais, refeição livre e beliscos, digitadas ou vindas do banco de alimentos do app (valores aproximados da TACO). Anotação sem kcal fica registrada, mas não soma.' },
      { 'Leia-me': 'Proteína, carbo e gordura: do plano e das anotações que têm esses valores (as do banco de alimentos têm os três; as digitadas, só a proteína, se informada).' },
      { 'Leia-me': 'Refeição sem marcação (Feita = não) conta como não feita.' },
      { 'Leia-me': 'Situação: na meta (kcal total dentro de ±10% da meta), acima, abaixo ou refeição livre (prevista no plano, 1 por semana). Hoje fica em branco porque o dia não terminou.' },
      { 'Leia-me': 'Causa principal: o que mais pesou no dia fora da meta. Acima: categoria da anotação de "comi a mais" (doce, bebida, salgado ou fast food, porção maior), troca mais calórica ou bebida alcoólica. Abaixo: refeição não feita ou porção menor.' },
      { 'Leia-me': 'Combinados: o que o usuário combinou consigo mesmo para cada semana, na revisão semanal do app.' },
      { 'Leia-me': 'Treino (TreinoHoje): treinos registrados no app TreinoHoje na mesma conta (A, B, C... ou corrida com km). Vazio = sem treino registrado, ou conta não conectada.' },
      { 'Leia-me': 'Água: soma dos registros do dia em ml. Dia sem registro de água aparece como 0, o que pode ser só falta de registro.' },
      { 'Leia-me': 'kcal de bebida alcoólica: estimativa por tipo (cerveja 0,43 kcal/ml, vinho 0,85, destilado 2,3, drink 0,8).' },
      { 'Leia-me': 'Peso medido em jejum. Medidas com fita, sempre do lado direito: cintura no umbigo (semanal); peito na linha dos mamilos, braço contraído no pico do bíceps, coxa logo abaixo do glúteo e quadril no ponto mais largo (a cada 2 a 4 semanas).' }
    ];
    const metas = [
      { 'Meta': 'Calorias/dia', 'Valor': g.kcal }, { 'Meta': 'Proteína (g)', 'Valor': g.prot }, { 'Meta': 'Carboidrato (g)', 'Valor': g.carb },
      { 'Meta': 'Gordura (g)', 'Valor': g.fat }, { 'Meta': 'Água (ml/dia)', 'Valor': g.agua }, { 'Meta': 'Peso de referência (kg)', 'Valor': g.meta }
    ];
    const plano = [];
    S.plan.forEach((m) => m.opts.forEach((o) => o.items.forEach((i) => plano.push({ 'Refeição': m.name, 'Horário': m.time, 'Opção': o.name, 'Alimento': i.food, 'Quantidade': i.qty, 'kcal': num(i.k), 'Proteína (g)': num(i.p), 'Carbo (g)': num(i.c), 'Gordura (g)': num(i.g) }))));
    const wb = XLSX.utils.book_new();
    const add = (rows, name, cols) => { const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ '': 'Sem registros' }]); if (cols) ws['!cols'] = cols.map((w) => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, name); };
    add(leia, 'Leia-me', [110]);
    add(resumo, 'Resumo diário', [11, 9, 9, 9, 9, 9, 9, 9, 9, 9, 14, 26, 30, 28, 10, 10, 10, 9, 9, 9, 9, 9, 9, 80]);
    add(refeicoes, 'Refeições', [11, 9, 16, 8, 26, 6, 9, 9, 9, 9, 9, 60]);
    add(anotacoes, 'Anotações', [11, 18, 16, 18, 50, 10, 10, 10, 10]);
    add(S.drinks.map((x) => ({ 'Data': x.date, 'Tipo': (DRINKS[x.type] || {}).label || x.type, 'Copos': x.cups, 'ml por copo': x.ml, 'Total (ml)': x.cups * x.ml, 'kcal estimadas': x.kcal })), 'Bebidas alcoólicas');
    add(S.checkins.map((x) => ({ 'Data': x.date, 'Peso (kg)': num(x.peso) || '', 'Cintura (cm)': num(x.cintura) || '', 'Peito (cm)': num(x.peito) || '', 'Braço contraído (cm)': num(x.braco) || '', 'Coxa (cm)': num(x.coxa) || '', 'Quadril (cm)': num(x.quadril) || '', 'Fotos': (x.fotos || []).length || '' })), 'Check-ins e medidas');
    add(Object.entries(S.deals || {}).sort((a, b) => a[0].localeCompare(b[0])).map(([w, v]) => ({ 'Semana (segunda)': w, 'Combinado': v.t })), 'Combinados', [16, 60]);
    add(metas, 'Metas', [20, 12]);
    add(plano, 'Plano atual', [16, 8, 28, 32, 18, 6, 12, 10, 12]);
    XLSX.writeFile(wb, 'personalnutri-historico-' + todayKey() + '.xlsx');
  } catch (e) {
    toast(e.message || 'Não consegui gerar o histórico.');
  }
}

/* ---------- Lembretes ---------- */
let remindTimers = [];
async function notify(title, body, tag) {
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    const o = { body, tag, icon: 'icon-192.png', badge: 'icon-192.png' };
    if (reg) reg.showNotification(title, o); else new Notification(title, o);
  } catch (e) { /* sem permissão ou sem suporte */ }
}
function scheduleReminders() {
  remindTimers.forEach(clearTimeout); remindTimers = [];
  const R = PREF.remind;
  if (!R.on || !('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  const k = todayKey();
  const at = (hhmm, minus = 0) => { const [h, m] = String(hhmm).split(':').map(Number); const d = new Date(now); d.setHours(h || 0, (m || 0) - minus, 0, 0); return d; };
  sortedPlan().forEach((m) => {
    const t = at(m.time, R.before);
    const ms = t - now;
    if (ms <= 0 || ms > 24 * 3600000) return;
    remindTimers.push(setTimeout(() => {
      if (todayKey() !== k || isDone(m, k)) return;
      const o = m.opts[optIndex(m, k)];
      notify(`${m.name} · ${m.time}`, o ? `${o.name}: ${o.items.map((i) => i.food).join(', ')}` : 'Hora da refeição', 'meal-' + m.id);
    }, ms));
  });
  if (R.water) {
    const goal = num(S.goals.agua);
    for (let h = 10; h <= 22; h += R.water) {
      const t = at(pad(h) + ':00');
      const ms = t - now;
      if (ms <= 0 || !goal) continue;
      remindTimers.push(setTimeout(() => {
        const ml = num(S.days[k] && S.days[k].water);
        const expected = goal * Math.min(1, (h - 8) / 14);
        if (todayKey() === k && ml < expected - 200) notify('Água', `Você está em ${nf(ml / 1000, 1)} L de ${nf(goal / 1000, 1)} L. Bora um copo?`, 'agua');
      }, ms));
    }
  }
  if (S.shop.day >= 0 && now.getDay() === S.shop.day && S.plan.length) {
    const ms = at('10:00') - now;
    if (ms > 0) remindTimers.push(setTimeout(() => notify('Dia de compras', `Lista da semana pronta: ${shopFinal().list.length} itens. Toque para abrir.`, 'compras'), ms));
  }
  /* Na virada do dia, agenda de novo */
  const midnight = new Date(now); midnight.setHours(24, 0, 5, 0);
  remindTimers.push(setTimeout(scheduleReminders, midnight - now));
}
const saveRemind = () => { lsSet(REMIND_KEY, PREF.remind); scheduleReminders(); render(); };

/* ---------- Ações ---------- */
function curPlanOpt() { const m = S.plan[UI.plano.meal]; return m ? { m, o: m.opts[Math.min(UI.plano.opt[m.id] || 0, m.opts.length - 1)] } : {}; }
function sumNoteItems() {
  const N = UI.note;
  const t = sum(N.items);
  N.kcal = Math.round(t.k); N.p = Math.round(t.p); N.c = Math.round(t.c * 10) / 10; N.g = Math.round(t.g * 10) / 10;
}
const ACT = {
  theme: (el) => { PREF.theme = el.dataset.v; lsSet(THEME_KEY, PREF.theme); render(); },
  done: async (el) => {
    const k = curDay(); const id = el.dataset.meal; const m = S.plan.find((x) => x.id === id);
    const cur = S.days[k] || {};
    const repl = ((cur.notes || {})[id] || []).filter((n) => n.type === 'troca' || n.type === 'livre');
    if (cur.done && cur.done[id] && repl.length) {
      if (!(await ask('Esta refeição tem uma anotação de ' + (repl.some((n) => n.type === 'livre') ? 'refeição livre' : 'troca') + '. Desmarcar também apaga essa anotação.', { ok: 'Desmarcar', danger: true }))) return;
      dropReplacements(k, id);
    }
    const d = dayRec(k);
    d.done[id] = !d.done[id];
    delete d.byNote[id];
    if (d.done[id] && m) d.snap[id] = snapshot(m, k); else delete d.snap[id];
    if (d.done[id]) { UI.flash = id; if (navigator.vibrate) navigator.vibrate(12); }
    save();
  },
  pickopt: (el) => {
    const k = curDay(); const d = dayRec(k); const id = el.dataset.meal; const m = S.plan.find((x) => x.id === id);
    d.sel[id] = +el.dataset.i;
    if (d.done[id] && m) d.snap[id] = snapshot(m, k);
    save();
  },
  repeat: () => {
    const k = curDay(); const prev = addDays(k, -1);
    const list = repeatable(k);
    if (!list.length) return;
    const d = dayRec(k); const pd = S.days[prev] || {};
    list.forEach((m) => { d.sel[m.id] = (pd.sel || {})[m.id] || 0; d.done[m.id] = true; d.snap[m.id] = snapshot(m, k); });
    save();
    undoable(`${list.length} ${list.length === 1 ? 'refeição copiada' : 'refeições copiadas'} de ${dayTitle(prev).toLowerCase()}`, () => {
      const dd = dayRec(k); list.forEach((m) => { delete dd.done[m.id]; delete dd.snap[m.id]; }); save();
    });
  },
  noteopen: (el) => { UI.note = { meal: el.dataset.meal, type: el.dataset.meal === FORA ? 'extra' : 'troca', text: '', kcal: '', p: '', c: '', g: '', items: [] }; UI.pick = null; render(); const t = document.getElementById('note-text'); if (t) t.focus(); },
  notetype: (el) => { UI.note.type = el.dataset.v; render(); },
  notecat: (el) => { UI.note.cat = el.dataset.v; render(); },
  notecancel: () => { UI.note = null; UI.pick = null; render(); },
  notesave: () => {
    const N = UI.note; if (!N) return;
    if (!String(N.text).trim() && !num(N.kcal)) { toast('Escreva o que comeu ou as calorias'); return; }
    if (N.type === 'extra' && !NOTE_CATS[N.cat]) { toast('Escolha o que foi: doce, bebida, salgado ou porção maior'); return; }
    const k = curDay(); const d = dayRec(k);
    const note = { id: uid(), type: N.type, text: String(N.text).trim(), kcal: num(N.kcal) || '', at: new Date().toISOString() };
    if (N.type === 'extra') note.cat = N.cat;
    if (num(N.p)) note.p = num(N.p);
    if (N.items && N.items.length) { if (num(N.c)) note.c = num(N.c); if (num(N.g)) note.g = num(N.g); }
    (d.notes[N.meal] = d.notes[N.meal] || []).push(note);
    if (N.meal !== FORA && (N.type === 'troca' || N.type === 'livre')) {
      if (!d.done[N.meal]) d.byNote[N.meal] = true;
      d.done[N.meal] = true; delete d.snap[N.meal];
    }
    if (N.type === 'livre') setFree(weekStart(k), k);
    UI.note = null; UI.pick = null;
    save(); toast('Anotado');
  },
  notedel: (el) => {
    const k = curDay(); const ws = weekStart(k);
    const before = { day: clone(S.days[k] || {}), free: S.free[ws] };
    const d = dayRec(k); const mid = el.dataset.meal;
    const gone = (d.notes[mid] || []).find((n) => n.id === el.dataset.id);
    d.notes[mid] = (d.notes[mid] || []).filter((n) => n.id !== el.dataset.id);
    const stillRepl = d.notes[mid].some((n) => n.type === 'troca' || n.type === 'livre');
    if (!d.notes[mid].length) delete d.notes[mid];
    if (gone && gone.type === 'livre') releaseFree(k);
    /* A refeição foi marcada só por causa da anotação: sem ela, volta a não feita */
    if (gone && (gone.type === 'troca' || gone.type === 'livre') && !stillRepl && d.byNote[mid]) { d.done[mid] = false; delete d.byNote[mid]; delete d.snap[mid]; }
    save();
    undoable('Anotação apagada', () => { S.days[k] = { ...before.day, u: Date.now() }; if (before.free) setFree(ws, before.free); save(); });
  },
  /* Banco de alimentos */
  pickopen: (el) => { UI.pick = { ctx: el.dataset.v, q: '', sel: null, grams: 100 }; render(); const q = document.getElementById('pick-q'); if (q) q.focus(); },
  pickclose: () => { UI.pick = null; render(); },
  pickback: () => { UI.pick.sel = null; render(); const q = document.getElementById('pick-q'); if (q) { q.focus(); q.select(); } },
  pickfood: (el) => { const f = FOOD_LIST[+el.dataset.i]; UI.pick.sel = +el.dataset.i; UI.pick.grams = f[6] || 100; render(); },
  pickgrams: (el) => { UI.pick.grams = +el.dataset.v; render(); },
  foodadd: () => {
    const P = UI.pick; const f = FOOD_LIST[P.sel];
    if (!f || !num(P.grams)) { toast('Informe a quantidade'); return; }
    const x = Core.foodMacros(f, P.grams);
    const qty = nf(num(P.grams)) + ' ' + foodUnit(f);
    if (P.ctx === 'note' && UI.note) {
      const N = UI.note;
      N.items.push({ food: f[0], qty, ...x });
      sumNoteItems();
      N.text = (String(N.text).trim() ? String(N.text).trim() + ', ' : '') + f[0].toLowerCase() + ' ' + qty;
      UI.pick = null; render();
      return;
    }
    const { o } = curPlanOpt();
    if (!o) return;
    o.items.push(it(f[0], qty, x.k, x.p, x.c, x.g));
    UI.pick = null;
    save({ touch: 'plan' });
  },
  exporthist: () => exportHistory(),
  histall: () => { UI.histAll = !UI.histAll; render(); },
  plantab: (el) => { UI.planTab = el.dataset.v; UI.shopEdit = null; UI.shopAdd = false; if (route().name !== 'plano') location.hash = '#plano'; else { render(); window.scrollTo(0, 0); } },
  metas: () => { UI.metasOpen = !UI.metasOpen; render(); },
  prog: (el) => { UI.prog = el.dataset.v; render(); },
  pw: (el) => { UI.pw = +el.dataset.v; render(); },
  pday: (el) => { UI.pday = el.dataset.k; render(); if (!matchMedia('(min-width: 900px)').matches) { const c = document.querySelector('.only-mobile .pd-sel'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
  pcell: (el) => { UI.pcell = UI.pcell === el.dataset.v ? null : el.dataset.v; render(); },
  openday: (el) => {
    const q = offQueue(reviewRange(UI.pw || 4)).filter((k) => k >= addDays(todayKey(), -MAX_BACK));
    const at = q.indexOf(el.dataset.k);
    UI.review = at >= 0 && q.length > 1 ? { list: q, at } : null;
    UI.day = el.dataset.k; location.hash = '#hoje';
  },
  revgo: (el) => {
    const R = UI.review; if (!R) return;
    const at = R.at + +el.dataset.v;
    if (at >= R.list.length) { UI.review = null; UI.pday = null; location.hash = '#progresso'; return; }
    if (at < 0) return;
    R.at = at; UI.day = R.list[at]; UI.note = null; UI.pick = null; render(); window.scrollTo(0, 0);
  },
  revstop: () => { UI.review = null; render(); },
  deal: (el) => setDeal(el.dataset.v),
  dealtext: () => { const i = document.getElementById('deal-text'); const t = i ? i.value.trim() : ''; if (!t) { toast('Escreva o combinado'); return; } setDeal(t); },
  dealedit: () => { UI.dealEdit = true; render(); },
  day: (el) => changeDay(+el.dataset.v),
  water: (el) => { const d = dayRec(curDay()); d.water = Math.max(0, num(d.water) + (+el.dataset.v)); save(); },
  free: () => {
    const ws = weekStart();
    if (S.free[ws]) {
      for (let i = 0; i < 7; i++) {
        const day = addDays(ws, i);
        const dd = S.days[day];
        if (dd && dd.notes && Object.values(dd.notes).some((arr) => arr.some((n) => n.type === 'livre'))) { toast('A livre está anotada em ' + ddmm(day) + '. Apague a anotação em Hoje.'); return; }
      }
      clearFree(ws);
    } else setFree(ws, todayKey());
    save();
  },
  drinktype: (el) => { UI.drink.type = el.dataset.v; UI.drink.ml = DRINKS[el.dataset.v].ml; render(); },
  cups: (el) => { UI.drink.cups = Math.max(1, UI.drink.cups + (+el.dataset.v)); render(); },
  ml: (el) => { const st = DRINKS[UI.drink.type].step; UI.drink.ml = Math.max(st, UI.drink.ml + st * (+el.dataset.v)); render(); },
  adddrink: () => {
    const D = UI.drink;
    const date = curDay();
    S.drinks.push({ id: uid(), date, type: D.type, cups: D.cups, ml: D.ml, kcal: drinkKcal(D.type, D.cups, D.ml), u: Date.now() });
    S.drinks.sort((a, b) => a.date.localeCompare(b.date));
    UI.drink.cups = 1; UI.note = null;
    save(); toast('Bebida alcoólica anotada');
  },
  deldrink: (el) => {
    const x = S.drinks.find((d) => d.id === el.dataset.id); if (!x) return;
    S.drinks = S.drinks.filter((d) => d.id !== x.id); bury('d:' + x.id); save();
    undoable('Registro apagado', () => { unbury('d:' + x.id); S.drinks.push({ ...x, u: Date.now() }); S.drinks.sort((a, b) => a.date.localeCompare(b.date)); save(); });
  },
  checkin: async (el) => {
    let date = document.getElementById('ck-data').value || todayKey();
    if (date > todayKey()) date = todayKey();
    const vals = { peso: num(document.getElementById('ck-peso').value) };
    MEDIDAS.forEach((m) => { vals[m.id] = num((document.getElementById('ck-' + m.id) || {}).value); });
    const fEl = document.getElementById('ck-foto');
    const file = fEl && fEl.files && fEl.files[0];
    if (!Object.values(vals).some(Boolean) && !file) { toast('Informe o peso, alguma medida ou uma foto'); return; }
    let photo = null;
    if (file) {
      el.disabled = true; el.textContent = 'Enviando foto…';
      try { photo = await uploadPhoto(file, date); } catch (e) { el.disabled = false; el.textContent = 'Registrar check-in'; toast(e.message); return; }
    }
    /* Mesmo dia: completa o registro existente em vez de apagar o que já tinha */
    const old = S.checkins.find((c) => c.date === date) || { date };
    const rec = { ...old, u: Date.now() };
    Object.keys(vals).forEach((key) => { if (vals[key]) rec[key] = vals[key]; });
    if (photo) rec.fotos = (rec.fotos || []).concat(photo);
    unbury('c:' + date);
    S.checkins = S.checkins.filter((c) => c.date !== date).concat([rec]).sort((a, b) => a.date.localeCompare(b.date));
    save(); toast('Check-in registrado');
  },
  delcheckin: (el) => {
    const x = S.checkins.find((c) => c.date === el.dataset.date); if (!x) return;
    S.checkins = S.checkins.filter((c) => c.date !== x.date); bury('c:' + x.date); save();
    undoable('Check-in de ' + ddmm(x.date) + ' apagado', () => { unbury('c:' + x.date); S.checkins = S.checkins.concat([{ ...x, u: Date.now() }]).sort((a, b) => a.date.localeCompare(b.date)); save(); });
  },
  delphoto: async (el) => {
    if (!(await ask('Apagar esta foto? Não dá para desfazer.', { ok: 'Apagar', danger: true }))) return;
    const path = el.dataset.path;
    const { error } = await sb.storage.from(PHOTO_BUCKET).remove([path]);
    if (error) { toast('Erro ao apagar: ' + error.message); return; }
    const c = S.checkins.find((x) => x.date === el.dataset.date);
    if (c) { c.fotos = (c.fotos || []).filter((f) => f !== path); c.u = Date.now(); }
    delete UI.photos[path];
    save(); toast('Foto apagada');
  },
  pt: (el) => { const c = el.dataset.c, i = +el.dataset.i; UI.pt = UI.pt && UI.pt.c === c && UI.pt.i === i ? null : { c, i }; render(); },
  wk: (el) => { UI.wk = +el.dataset.v; render(); },
  applyhint: async (el) => {
    const delta = +el.dataset.v; const g = S.goals;
    const kcal = num(g.kcal) + delta;
    if (!(await ask(`Mudar a meta de ${nf(g.kcal)} para ${nf(kcal)} kcal? O carboidrato ${delta < 0 ? 'cai' : 'sobe'} ${nf(Math.abs(delta) / 4)} g. O plano não muda sozinho: ajuste as porções em Plano.`, { ok: 'Mudar meta' }))) return;
    g.kcal = kcal; if (num(g.carb)) g.carb = Math.max(0, Math.round(num(g.carb) + delta / 4));
    save({ touch: 'goals' }); toast('Meta atualizada');
  },
  /* Plano */
  editmeal: (el) => { UI.plano.meal = +el.dataset.i; UI.pick = null; render(); },
  editopt: (el) => { const m = S.plan[UI.plano.meal]; UI.plano.opt[m.id] = +el.dataset.i; UI.pick = null; render(); },
  addmeal: () => { S.plan.push({ id: uid(), name: 'Nova refeição', time: '10:00', opts: [{ name: 'Opção 1', tip: '', items: [] }] }); UI.plano.meal = S.plan.length - 1; save({ touch: 'plan' }); },
  delmeal: async () => { const m = S.plan[UI.plano.meal]; if (!m || !(await ask(`Apagar a refeição "${m.name}" e todas as opções dela?`, { ok: 'Apagar', danger: true }))) return; S.plan.splice(UI.plano.meal, 1); UI.plano.meal = 0; save({ touch: 'plan' }); },
  addopt: () => { const m = S.plan[UI.plano.meal]; m.opts.push({ name: 'Opção ' + (m.opts.length + 1), tip: '', items: [] }); UI.plano.opt[m.id] = m.opts.length - 1; save({ touch: 'plan' }); },
  dupopt: () => { const { m, o } = curPlanOpt(); if (!o) return; const oi = m.opts.indexOf(o); m.opts.splice(oi + 1, 0, { ...clone(o), name: o.name + ' (cópia)' }); UI.plano.opt[m.id] = oi + 1; save({ touch: 'plan' }); toast('Opção duplicada'); },
  delopt: async () => { const m = S.plan[UI.plano.meal]; const oi = UI.plano.opt[m.id] || 0; if (!(await ask(`Apagar a opção "${m.opts[oi].name}"?`, { ok: 'Apagar', danger: true }))) return; m.opts.splice(oi, 1); UI.plano.opt[m.id] = 0; save({ touch: 'plan' }); },
  additem: () => { const { o } = curPlanOpt(); if (!o) return; o.items.push(it('', '', '', '', '', '')); save({ touch: 'plan' }); const rows = document.querySelectorAll('.item-row input[data-f="food"]'); if (rows.length) rows[rows.length - 1].focus(); },
  delitem: (el) => {
    const { m, o } = curPlanOpt(); if (!o) return;
    const i = +el.dataset.i; const gone = o.items[i];
    o.items.splice(i, 1); save({ touch: 'plan' });
    undoable(`${gone.food || 'Alimento'} removido`, () => { const mm = S.plan.find((x) => x.id === m.id); const oo = mm && mm.opts[mm.opts.indexOf(o)]; if (oo) { oo.items.splice(i, 0, gone); save({ touch: 'plan' }); } });
  },
  import: () => document.getElementById('file-import').click(),
  export: () => exportPlan(),
  reset: async () => { if (!(await ask('Trocar o plano atual pelo plano padrão?', { ok: 'Restaurar', danger: true }))) return; S.plan = defaultPlan(); S.rules = DEFAULT_RULES.slice(); UI.plano = { meal: 0, opt: {} }; save({ touch: ['plan', 'rules'] }); toast('Plano padrão restaurado'); },
  /* Compras */
  shopdays: (el) => { S.shop.days = Math.min(31, Math.max(1, S.shop.days + (+el.dataset.v))); save({ touch: 'shop' }); },
  shopopt: (el) => { S.shop.opt = { ...S.shop.opt, [el.dataset.meal]: +el.dataset.i }; save({ touch: 'shop' }); },
  shopmode: (el) => { S.shop.mode = el.dataset.v; save({ touch: 'shop' }); },
  shopday: (el) => { S.shop.day = +el.dataset.v; save({ touch: 'shop' }); scheduleReminders(); },
  shopseen: () => { PREF.shop.seen = todayKey(); lsSet(SHOP_KEY, PREF.shop); render(); },
  shopgot: (el) => { const k = el.dataset.k; if (PREF.shop.got[k]) delete PREF.shop.got[k]; else PREF.shop.got[k] = 1; lsSet(SHOP_KEY, PREF.shop); render(); },
  shopclear: () => { PREF.shop.got = {}; lsSet(SHOP_KEY, PREF.shop); render(); },
  shopedit: (el) => { UI.shopEdit = el.dataset.k; UI.shopAdd = false; render(); const i = document.getElementById('shop-qty'); if (i) i.focus(); },
  shopeditx: () => { UI.shopEdit = null; render(); },
  shopqty: (el) => {
    const k = el.dataset.k; const v = (document.getElementById('shop-qty') || {}).value || '';
    UI.shopEdit = null;
    setShopEdits((E) => {
      if (k.startsWith('add|')) { const a = E.add.find((x) => 'add|' + x.id === k); if (a) a.qty = v.trim(); return; }
      if (v.trim()) E.qty[k] = v.trim(); else delete E.qty[k];
    });
  },
  shoprm: (el) => {
    const k = el.dataset.k; UI.shopEdit = null;
    setShopEdits((E) => { if (k.startsWith('add|')) E.add = E.add.filter((x) => 'add|' + x.id !== k); else { E.rm[k] = 1; delete E.qty[k]; } });
    toast(k.startsWith('add|') ? 'Item apagado' : 'Fora da lista desta semana');
  },
  shopback: (el) => setShopEdits((E) => { delete E.rm[el.dataset.k]; }),
  shopadd: () => { UI.shopAdd = true; UI.shopEdit = null; render(); const i = document.getElementById('shop-add-food'); if (i) i.focus(); },
  shopaddx: () => { UI.shopAdd = false; render(); },
  shopaddok: () => {
    const f = ((document.getElementById('shop-add-food') || {}).value || '').trim();
    const q = ((document.getElementById('shop-add-qty') || {}).value || '').trim();
    if (!f) { toast('Escreva o item'); return; }
    UI.shopAdd = false;
    setShopEdits((E) => { E.add = (E.add || []).concat([{ id: uid(), food: f, qty: q }]); });
  },
  shopshare: async () => {
    const text = 'Lista de compras (' + S.shop.days + ' dias)\n' + shopText();
    try {
      if (navigator.share) await navigator.share({ title: 'Lista de compras', text });
      else { await navigator.clipboard.writeText(text); toast('Lista copiada'); }
    } catch (e) { if (e && e.name !== 'AbortError') toast('Não consegui compartilhar'); }
  },
  /* Lembretes */
  remindtoggle: async () => {
    const R = PREF.remind;
    if (R.on) { R.on = false; saveRemind(); return; }
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') { toast('Sem permissão para notificações'); render(); return; }
    R.on = true; saveRemind(); toast('Lembretes ligados');
  },
  remindbefore: (el) => { PREF.remind.before = +el.dataset.v; saveRemind(); },
  remindwater: (el) => { PREF.remind.water = +el.dataset.v; saveRemind(); },
  /* Conta */
  skipauth: () => { try { localStorage.setItem(SKIP_KEY, '1'); } catch (e) { /* ignore */ } UI.auth.msg = ''; UI.auth.info = ''; location.hash = '#hoje'; render(); },
  logout: async () => { try { localStorage.removeItem(SKIP_KEY); } catch (e) { /* ignore */ } markSynced(0); markRemote(''); UI.photos = {}; await sb.auth.signOut(); location.hash = '#entrar'; toast('Você saiu. Os dados continuam neste aparelho.'); },
  syncnow: async () => { await pull(); toast(UI.sync || 'Sincronizado'); },
  update: () => { if (swWaiting) { swReload = true; swWaiting.postMessage('skip'); } }
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || !ACT[el.dataset.act]) return;
  e.preventDefault();
  ACT[el.dataset.act](el, e);
});
/* Pontos do gráfico e itens com role=button respondem ao Enter e ao espaço */
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-act][role="button"]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
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
  const kind = el.dataset && el.dataset.in;
  if (kind === 'note') { if (UI.note) UI.note[el.dataset.f] = el.value; return; }
  if (kind === 'pickq') { UI.pick.q = el.value; const r = document.getElementById('pick-res'); if (r) r.innerHTML = foodResultsHtml(); return; }
  if (kind === 'pickgrams') { UI.pick.grams = el.value; const pv = document.getElementById('pick-prev'); if (pv) pv.textContent = foodPreview(); return; }
  if (kind === 'photo') { const n = document.getElementById('ck-foto-name'); if (n) n.textContent = el.files && el.files[0] ? el.files[0].name : 'Escolher foto'; return; }
  if (kind === 'rules') { S.rules = el.value.split('\n').map((x) => x.trim()).filter(Boolean); save({ render: false, touch: 'rules' }); return; }
  if (!kind) return;
  if (kind === 'goal') {
    S.goals[el.dataset.k] = el.type === 'number' ? (el.value === '' ? '' : num(el.value)) : el.value;
    save({ render: false, touch: 'goals' });
    return;
  }
  const m = S.plan[UI.plano.meal];
  if (!m) return;
  if (kind === 'meal') { m[el.dataset.f] = el.value; save({ render: false, touch: 'plan' }); return; }
  const o = m.opts[UI.plano.opt[m.id] || 0];
  if (!o) return;
  if (kind === 'opt') { o[el.dataset.f] = el.value; save({ render: false, touch: 'plan' }); return; }
  if (kind === 'item') {
    const f = el.dataset.f;
    o.items[+el.dataset.i][f] = ['k', 'p', 'c', 'g'].includes(f) ? (el.value === '' ? '' : num(el.value)) : el.value;
    save({ render: false, touch: 'plan' });
    refreshTotals();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.dataset && e.target.dataset.in === 'photo') { const n = document.getElementById('ck-foto-name'); if (n) n.textContent = e.target.files && e.target.files[0] ? e.target.files[0].name : 'Escolher foto'; return; }
  if (!(e.target.dataset && e.target.dataset.in === 'goal')) return;
  setTimeout(() => { const a = document.activeElement; if (!(a && a.dataset && a.dataset.in === 'goal')) render(); }, 0);
});
document.getElementById('file-import').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (f) importFile(f);
});
window.addEventListener('hashchange', () => {
  const n = route().name;
  if (n !== 'refeicao' && n !== 'hoje' && n !== 'macros') { UI.day = null; UI.review = null; }
  if (n === 'progresso') UI.pday = null;
  UI.note = null; UI.pick = null; UI.pt = null;
  render(); window.scrollTo(0, 0);
});

/* Arrastar para o lado troca o dia em Hoje e Macros */
let swipe = null;
document.addEventListener('touchstart', (e) => {
  const n = route().name;
  swipe = null;
  if (!['hoje', 'macros'].includes(n) || e.touches.length !== 1 || document.getElementById('modal').innerHTML) return;
  if (e.target.closest('input, textarea, .chips, .note-editor, .picker, .table, button')) return;
  swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
}, { passive: true });
document.addEventListener('touchend', (e) => {
  if (!swipe) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - swipe.x, dy = t.clientY - swipe.y, dt = Date.now() - swipe.t;
  swipe = null;
  if (Math.abs(dx) > 70 && Math.abs(dy) < 45 && dt < 600) changeDay(dx > 0 ? -1 : 1);
}, { passive: true });

/* Recarrega quando volta para o app em outro dia ou depois de editar em outro aparelho */
let lastDay = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (UI.auth.user) pull();
  if (swReg) swReg.update().catch(() => {});
  if (todayKey() !== lastDay) { lastDay = todayKey(); UI.day = null; render(); }
  scheduleReminders();
});

const hasStoredSession = () => { try { return Object.keys(localStorage).some((x) => /^sb-.*-auth-token$/.test(x)); } catch (e) { return false; } };
if (sb && !navigator.onLine && hasStoredSession()) UI.auth.ready = true;
window.addEventListener('online', () => { if (UI.auth.user) pull(); });

/* Atualização do app: quando há versão nova do service worker esperando, oferece recarregar */
let swReg = null, swWaiting = null, swReload = false;
function offerUpdate(w) { swWaiting = w; toast('Nova versão do app disponível', { action: 'Atualizar', fn: ACT.update, sticky: true }); }
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    swReg = reg;
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w); });
    });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (swReload) { swReload = false; location.reload(); } });
}

render();
initAuth();
scheduleReminders();
