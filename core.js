/* Lógica pura do PersonalNutri: datas, somas do dia, junção da sincronização, resumos e lista de compras.
   Não toca no DOM. Funciona no navegador (window.Core) e no Node (require), para os testes. */
(function (root) {
  'use strict';

  /* ---------- Números e datas ---------- */
  const num = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(x) ? x : 0; };
  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseKey = (k) => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const todayKey = () => keyOf(new Date());
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
  const weekStart = (k = todayKey()) => { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return keyOf(d); };
  const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
  const ZERO = () => ({ k: 0, p: 0, c: 0, g: 0 });
  const add = (a, b) => ({ k: a.k + num(b.k), p: a.p + num(b.p), c: a.c + num(b.c), g: a.g + num(b.g) });
  const sum = (items) => (items || []).reduce(add, ZERO());
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  /* ---------- Um dia ---------- */
  const FORA = '_fora';
  const REPL = (n) => n.type === 'troca' || n.type === 'livre';
  const notesOf = (s, k, mid) => (s.days[k] && s.days[k].notes && s.days[k].notes[mid]) || [];
  function optIndex(s, meal, k) {
    const i = s.days[k] && s.days[k].sel ? s.days[k].sel[meal.id] : 0;
    return Math.min(Math.max(0, i || 0), Math.max(0, (meal.opts || []).length - 1));
  }
  const isDone = (s, meal, k) => !!(s.days[k] && s.days[k].done && s.days[k].done[meal.id]);
  const sortedPlan = (s) => s.plan.slice().sort((a, b) => String(a.time).localeCompare(String(b.time)));
  function planned(s, m, k) {
    const sn = s.days[k] && s.days[k].snap && s.days[k].snap[m.id];
    if (sn && isDone(s, m, k)) return { name: sn.name, k: sn.k, p: sn.p, c: sn.c, g: sn.g };
    const o = (m.opts || [])[optIndex(s, m, k)];
    return o ? { name: o.name, ...sum(o.items) } : { name: sn ? sn.name : '', ...ZERO() };
  }
  /* Refeições de um dia: as do plano e as que já saíram do plano mas têm registro nesse dia */
  function mealsOfDay(s, k) {
    const list = sortedPlan(s);
    const d = s.days[k];
    if (!d) return list;
    const ids = new Set(list.map((m) => m.id));
    const extra = new Set([...Object.keys(d.snap || {}), ...Object.keys(d.notes || {}), ...Object.keys(d.done || {}).filter((x) => d.done[x])]);
    extra.forEach((id) => {
      if (ids.has(id) || id === FORA) return;
      const sn = (d.snap || {})[id] || {};
      list.push({ id, name: sn.meal || 'Refeição removida do plano', time: sn.time || '', opts: [], orphan: true });
    });
    return list;
  }
  /* O que entrou de uma refeição: o plano (se feita) ou a troca anotada, mais o que foi comido a mais.
     Anotações guardam kcal e, quando vêm do banco de alimentos ou são digitadas, proteína, carbo e gordura. */
  function mealIntake(s, m, k) {
    const ns = notesOf(s, k, m.id);
    const repl = ns.filter(REPL);
    const extra = ns.filter((n) => n.type === 'extra');
    const asMacros = (n) => ({ k: n.kcal, p: n.p, c: n.c, g: n.g });
    const base = repl.length ? sum(repl.map(asMacros)) : isDone(s, m, k) ? planned(s, m, k) : ZERO();
    const tot = add(add(ZERO(), base), sum(extra.map(asMacros)));
    return { ...tot, replaced: repl.length > 0 };
  }
  const dayDrinks = (s, k) => (s.drinks || []).filter((d) => d.date === k);
  /* Tudo o que entrou no dia, inclusive beliscos e bebida alcoólica (só kcal) */
  function consumed(s, k) {
    let tot = mealsOfDay(s, k).reduce((a, m) => add(a, mealIntake(s, m, k)), ZERO());
    tot = add(tot, sum(notesOf(s, k, FORA).map((n) => ({ k: n.kcal, p: n.p, c: n.c, g: n.g }))));
    const drink = dayDrinks(s, k).reduce((a, d) => a + num(d.kcal), 0);
    tot.k += drink;
    tot.drink = drink;
    return tot;
  }
  const doneCount = (s, k) => s.plan.filter((m) => isDone(s, m, k)).length;
  const water = (s, k) => num(s.days[k] && s.days[k].water);
  /* Dia com algum registro (para médias não contarem dias esquecidos) */
  function hasLog(s, k) {
    const d = s.days[k];
    if (dayDrinks(s, k).length) return true;
    if (!d) return false;
    return Object.values(d.done || {}).some(Boolean) || Object.values(d.notes || {}).some((a) => a && a.length) || num(d.water) > 0;
  }

  /* ---------- Sincronização ----------
     Cada parte tem seu carimbo de tempo: planU (plano), rulesU, goalsU, dias (u em cada dia),
     itens (u em cada bebida e check-in). Apagar deixa uma lápide em tomb, para o item não voltar
     quando o outro aparelho ainda tem a cópia antiga. */
  function mergeStates(local, remote) {
    const out = { ...remote };
    [['plan', 'planU'], ['rules', 'rulesU'], ['goals', 'goalsU'], ['shop', 'shopU']].forEach(([key, uk]) => {
      if ((local[uk] || 0) > (remote[uk] || 0)) { out[key] = local[key]; out[uk] = local[uk]; }
    });
    out.days = { ...(remote.days || {}) };
    Object.keys(local.days || {}).forEach((k) => {
      const l = local.days[k], r = out.days[k];
      if (!r || (l.u || 0) > (r.u || 0)) out.days[k] = l;
    });
    const tomb = { ...(remote.tomb || {}) };
    Object.entries(local.tomb || {}).forEach(([k, v]) => { if (v > (tomb[k] || 0)) tomb[k] = v; });
    out.tomb = tomb;
    const alive = (key, u) => !(tomb[key] && tomb[key] >= (u || 0));

    const byId = new Map();
    (remote.drinks || []).concat(local.drinks || []).forEach((x) => { const o = byId.get(x.id); if (!o || (x.u || 0) >= (o.u || 0)) byId.set(x.id, x); });
    out.drinks = [...byId.values()].filter((x) => alive('d:' + x.id, x.u)).sort((x, y) => x.date.localeCompare(y.date));

    const byDate = new Map();
    (remote.checkins || []).concat(local.checkins || []).forEach((c) => {
      const o = byDate.get(c.date);
      if (!o) { byDate.set(c.date, c); return; }
      const [older, newer] = (c.u || 0) >= (o.u || 0) ? [o, c] : [c, o];
      byDate.set(c.date, { ...older, ...newer, u: Math.max(o.u || 0, c.u || 0) });
    });
    out.checkins = [...byDate.values()].filter((c) => alive('c:' + c.date, c.u)).sort((x, y) => x.date.localeCompare(y.date));

    out.deals = mergeDeals(local.deals, remote.deals);
    const byPause = new Map();
    (remote.pauses || []).concat(local.pauses || []).forEach((x) => { const o = byPause.get(x.id); if (!o || (x.u || 0) >= (o.u || 0)) byPause.set(x.id, x); });
    out.pauses = [...byPause.values()].filter((x) => alive('p:' + x.id, x.u)).sort((x, y) => x.from.localeCompare(y.from));
    out.free = {}; out.freeU = {};
    const lf = local.free || {}, rf = remote.free || {}, lu = local.freeU || {}, ru = remote.freeU || {};
    new Set([...Object.keys(lf), ...Object.keys(rf)]).forEach((ws) => {
      const useLocal = ws in lf && (!(ws in rf) || (lu[ws] || 0) > (ru[ws] || 0));
      const v = useLocal ? lf[ws] : rf[ws];
      const u = useLocal ? (lu[ws] || 0) : (ru[ws] || 0);
      if (!alive('f:' + ws, u)) return;
      out.free[ws] = v; out.freeU[ws] = u;
    });
    return out;
  }
  /* Lápides com mais de 1 ano já não fazem diferença */
  function pruneTombs(s, now = Date.now()) {
    const lim = now - 365 * 86400000;
    Object.keys(s.tomb || {}).forEach((k) => { if (s.tomb[k] < lim) delete s.tomb[k]; });
  }

  /* ---------- Resumo da semana ---------- */
  /* ---------- Pausas (férias, viagem, festa): dias que ficam fora das análises ---------- */
  const pauseOf = (s, k) => (s.pauses || []).find((x) => x.from <= k && k <= x.to) || null;
  function weekStats(s, ws, today = todayKey()) {
    const g = s.goals || {};
    let days = 0, logged = 0, done = 0, possible = 0, k = 0, p = 0, w = 0, drinkMl = 0, protOk = 0, paused = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      if (d > today) break;
      if (pauseOf(s, d)) { paused++; continue; }
      days++;
      possible += s.plan.length;
      done += doneCount(s, d);
      drinkMl += dayDrinks(s, d).reduce((a, x) => a + num(x.cups) * num(x.ml), 0);
      if (!hasLog(s, d)) continue;
      logged++;
      const c = consumed(s, d);
      k += c.k; p += c.p; w += water(s, d);
      if (num(g.prot) && c.p >= num(g.prot) * 0.9) protOk++;
    }
    const end = addDays(ws, 7);
    const wi = (s.checkins || []).filter((c) => num(c.peso));
    const inWeek = wi.filter((c) => c.date >= ws && c.date < end);
    const before = wi.filter((c) => c.date < ws);
    const ref = before.length ? before[before.length - 1] : null;
    const last = inWeek.length ? inWeek[inWeek.length - 1] : null;
    return {
      ws, days, logged, done, possible,
      adherence: possible ? done / possible : 0,
      avgK: logged ? k / logged : 0, avgP: logged ? p / logged : 0, avgWater: logged ? w / logged : 0,
      protOk, drinkMl, paused, free: !!(s.free || {})[ws],
      weight: last ? num(last.peso) : null,
      weightDelta: last && ref ? Math.round((num(last.peso) - num(ref.peso)) * 10) / 10 : null
    };
  }

  /* ---------- Sequências ----------
     Dias seguidos cumprindo algo. O dia de hoje só conta se já cumpriu; se não, a sequência vem até ontem. */
  const TESTS = {
    prot: (s, k) => num(s.goals.prot) > 0 && consumed(s, k).p >= num(s.goals.prot) * 0.9,
    agua: (s, k) => num(s.goals.agua) > 0 && water(s, k) >= num(s.goals.agua),
    plano: (s, k) => s.plan.length > 0 && doneCount(s, k) >= s.plan.length && !s.plan.some((m) => notesOf(s, k, m.id).some(REPL))
  };
  function streak(s, kind, today = todayKey()) {
    const t = TESTS[kind];
    let k = t(s, today) ? today : addDays(today, -1);
    let n = 0;
    while (n < 366 && t(s, k)) { n++; k = addDays(k, -1); }
    return n;
  }

  /* ---------- Sugestão de meta ----------
     Com 3 pesagens em pelo menos 14 dias (últimos 35), compara o ritmo com a adesão ao plano. */
  function goalHint(s, today = todayKey()) {
    const from = addDays(today, -35);
    const w = (s.checkins || []).filter((c) => num(c.peso) && c.date >= from && c.date <= today);
    if (w.length < 3) return null;
    const span = daysBetween(w[0].date, w[w.length - 1].date);
    if (span < 14) return null;
    const rate = (num(w[w.length - 1].peso) - num(w[0].peso)) / span * 7;
    let done = 0, possible = 0;
    for (let k = w[0].date; k <= w[w.length - 1].date; k = addDays(k, 1)) { done += doneCount(s, k); possible += s.plan.length; }
    const adherence = possible ? done / possible : 0;
    const r = Math.round(rate * 100) / 100;
    if (adherence >= 0.8 && rate > -0.2) return { kind: 'down', rate: r, adherence, delta: -150 };
    if (rate < -1) return { kind: 'up', rate: r, adherence, delta: 150 };
    if (adherence < 0.8 && rate > -0.2) return { kind: 'adesao', rate: r, adherence, delta: 0 };
    return null;
  }

  /* ---------- Gráficos ---------- */
  /* Média móvel das últimas n pesagens */
  function movingAvg(vals, n = 3) {
    return vals.map((_, i) => { const a = vals.slice(Math.max(0, i - n + 1), i + 1); return a.reduce((x, y) => x + y, 0) / a.length; });
  }

  /* ---------- Lista de compras ---------- */
  const UNITS = [
    [/^(g|gr|gramas?)$/, 'g'], [/^kg$/, 'kg'], [/^ml$/, 'ml'], [/^(l|litros?)$/, 'L'],
    [/^(unidades?|un|und)$/, 'un'], [/^fatias?$/, 'fatia'], [/^doses?$/, 'dose'], [/^conchas?$/, 'concha'],
    [/^potes?$/, 'pote'], [/^(col\.?|colher(es)?)\s*(de\s*)?sopa$/, 'col. sopa'], [/^(col\.?|colher(es)?)\s*(de\s*)?ch[aá]$/, 'col. chá'],
    [/^xic(ara)?s?\.?$/, 'xícara']
  ];
  /* "1 concha · 86 g" vira 86 g; "1/2 unidade" vira 0,5 un; "à vontade" não tem número */
  function parseQty(qty) {
    const parts = String(qty || '').split('·').map((x) => x.trim()).filter(Boolean);
    const tryPart = (t) => {
      const m = t.match(/^(\d+\/\d+|\d+(?:[.,]\d+)?)\s*(.*)$/);
      if (!m) return null;
      const n = m[1].includes('/') ? m[1].split('/').reduce((a, b) => a / b) : num(m[1]);
      const raw = norm(m[2]).replace(/\.$/, '');
      const u = UNITS.find(([re]) => re.test(raw));
      return { n, unit: u ? u[1] : (raw || 'un') };
    };
    const metric = parts.map(tryPart).filter(Boolean).find((x) => ['g', 'kg', 'ml', 'L'].includes(x.unit));
    const r = metric || (parts.length ? tryPart(parts[0]) : null);
    if (!r) return null;
    if (r.unit === 'kg') return { n: r.n * 1000, unit: 'g' };
    if (r.unit === 'L') return { n: r.n * 1000, unit: 'ml' };
    return r;
  }
  /* Proporção de cada opção de uma refeição nos dias em que ela foi feita (últimos `back` dias, sem contar hoje).
     Sem histórico, tudo na 1ª opção. Ex.: almoço com feijão em 7 de 10 dias e massa em 3 -> [0.7, 0, 0.3, 0, 0]. */
  function optionMix(s, meal, today = todayKey(), back = 14) {
    const n = (meal.opts || []).length;
    const count = new Array(n).fill(0);
    let total = 0;
    for (let i = 1; i <= back; i++) {
      const k = addDays(today, -i);
      if (!isDone(s, meal, k) || notesOf(s, k, meal.id).some(REPL)) continue;
      count[optIndex(s, meal, k)]++;
      total++;
    }
    if (!total) return count.map((_, i) => (i === 0 ? 1 : 0));
    return count.map((c) => c / total);
  }
  /* days: quantos dias de compra. pick: id da refeição -> índice da opção (escolha manual).
     mix: id da refeição -> proporções das opções (modo automático); quando existe, vale no lugar de pick. */
  function shoppingList(s, days, pick = {}, mix = null) {
    const map = new Map();
    s.plan.forEach((m) => {
      const opts = m.opts || [];
      if (!opts.length) return;
      const w = mix && mix[m.id] ? mix[m.id] : opts.map((_, i) => (i === Math.min(pick[m.id] || 0, opts.length - 1) ? 1 : 0));
      opts.forEach((o, oi) => {
        if (!w[oi]) return;
        o.items.forEach((i) => {
          const name = String(i.food || '').trim();
          if (!name) return;
          const q = parseQty(i.qty);
          const key = norm(name) + '|' + (q ? q.unit : '');
          const cur = map.get(key) || { food: name, unit: q ? q.unit : '', n: 0, meals: [] };
          if (q) cur.n += q.n * days * w[oi];
          if (!cur.meals.includes(m.name)) cur.meals.push(m.name);
          map.set(key, cur);
        });
      });
    });
    /* Unidades inteiras (ovo, fatia, dose) arredondam para cima: não dá para comprar 4,2 ovos */
    map.forEach((x) => { if (x.unit && x.unit !== 'g' && x.unit !== 'ml') x.n = Math.ceil(x.n - 1e-9); else x.n = Math.round(x.n); });
    return [...map.values()].sort((a, b) => a.food.localeCompare(b.food, 'pt-BR'));
  }

  /* ---------- Padrões: como foi cada dia em relação à meta ----------
     Refeição do plano não marcada conta como não feita. Dentro de ±tol da meta é "ok";
     dia com anotação de refeição livre é "livre" (previsto no plano). A causa principal é a que
     mais pesou: categorias das anotações de "comi a mais", trocas, bebida alcoólica ou refeições não feitas. */
  const CAUSES = {
    doce: 'Doce', bebida: 'Bebida', salgado: 'Salgado ou fast food', porcao: 'Porção maior', outro: 'Comeu além do plano',
    troca: 'Trocou por algo mais calórico', pulou: 'Refeição não feita', menos: 'Comeu menos que o plano', livre: 'Refeição livre', plano: 'Plano acima da meta', semkcal: 'Troca sem calorias anotadas', livreextra: 'Refeição livre além do limite da semana', semreg: 'Sem registro'
  };
  /* Refeições livres por semana (Metas). Vazio = 1, o padrão do plano */
  const livresPorSemana = (s) => { const v = (s.goals || {}).livres; return v === '' || v === undefined || v === null ? 1 : Math.max(0, Math.round(num(v))); };
  /* Quantas anotações de refeição livre o dia tem */
  const livresDoDia = (s, k) => { const d = s.days && s.days[k]; return d && d.notes ? Object.values(d.notes).reduce((a, arr) => a + (arr || []).filter((n) => n.type === 'livre').length, 0) : 0; };
  /* As livres da semana até o fim deste dia (inclusive) */
  function livresNaSemana(s, k) { let t = 0; for (let d = weekStart(k); d <= k; d = addDays(d, 1)) t += livresDoDia(s, d); return t; }
  /* As livres deste dia ainda cabem no limite da semana? */
  const livreNoLimite = (s, k) => livresNaSemana(s, k) <= livresPorSemana(s);
  function dayReview(s, k, tol = 0.1) {
    const meta = num((s.goals || {}).kcal);
    const tot = consumed(s, k);
    const kcal = Math.round(tot.k);
    const diff = meta ? kcal - meta : 0;
    const pz = pauseOf(s, k);
    if (pz) return { k, kcal, meta, diff, st: 'pausa', cause: null, pause: pz, missed: [], cells: [], over: {}, under: {} };
    /* Nada marcado, nenhuma anotação e nenhuma bebida: não dá para saber o que foi comido.
       Conta como dia fora do plano, mas fica fora das médias de calorias (a água sozinha não conta como registro) */
    const d = (s.days || {})[k] || {};
    const marcou = Object.values(d.done || {}).some(Boolean) || Object.values(d.notes || {}).some((a) => a && a.length) || dayDrinks(s, k).length;
    if (!marcou) return { k, kcal, meta, diff, st: 'semreg', cause: 'semreg', missed: [], cells: [], over: {}, under: {} };
    const cells = [];
    const over = {}, under = {};
    const put = (o, c, v) => { o[c] = (o[c] || 0) + v; };
    const missed = [];
    let livre = false;
    mealsOfDay(s, k).forEach((m) => {
      if (m.orphan && !isDone(s, m, k) && !notesOf(s, k, m.id).length) return;
      const ns = notesOf(s, k, m.id);
      const repl = ns.filter(REPL);
      if (ns.some((n) => n.type === 'livre')) { livre = true; cells.push({ meal: m.id, kind: 'livre' }); }
      const pl = planned(s, m, k);
      if (!repl.length && !isDone(s, m, k)) { missed.push(m.name); put(under, 'pulou', pl.k); cells.push({ meal: m.id, kind: 'under' }); }
      else if (repl.length && !ns.some((n) => n.type === 'livre')) {
        const d = repl.reduce((a, n) => a + num(n.kcal), 0) - pl.k;
        if (!repl.some((n) => num(n.kcal))) { put(under, 'semkcal', pl.k); cells.push({ meal: m.id, kind: 'under' }); }
        else if (d > 0) { put(over, 'troca', d); cells.push({ meal: m.id, kind: 'over' }); }
        else if (d < -50) { put(under, 'menos', -d); cells.push({ meal: m.id, kind: 'under' }); }
      }
      ns.filter((n) => n.type === 'extra').forEach((n) => { put(over, n.cat || 'outro', num(n.kcal)); cells.push({ meal: m.id, kind: 'over' }); });
    });
    notesOf(s, k, FORA).forEach((n) => {
      if (n.type === 'livre') { livre = true; cells.push({ meal: FORA, kind: 'livre' }); return; }
      put(over, n.cat || 'outro', num(n.kcal)); cells.push({ meal: FORA, kind: 'over' });
    });
    if (tot.drink) { put(over, 'bebida', tot.drink); cells.push({ meal: FORA, kind: 'over' }); }
    let st = 'ok';
    /* Passou do limite de refeições livres da semana: conta como dia normal, e a livre vira a causa do excesso */
    if (livre && !livreNoLimite(s, k)) {
      livre = false;
      cells.forEach((c) => { if (c.kind === 'livre') { c.kind = 'over'; put(over, 'livreextra', meta || 1); } });
    }
    if (livre) st = 'livre';
    else if (meta && kcal > meta * (1 + tol)) st = 'over';
    else if (meta && kcal < meta * (1 - tol)) st = 'under';
    const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
    let cause = null;
    if (st === 'livre') cause = 'livre';
    else if (st === 'over') cause = (top(over) || ['plano'])[0];
    else if (st === 'under') cause = (top(under) || ['menos'])[0];
    const keep = st === 'ok' ? [] : cells.filter((c) => st === 'livre' ? c.kind !== 'under' : c.kind === (st === 'over' ? 'over' : 'under'));
    return { k, kcal, meta, diff, st, cause, missed, cells: keep, over, under };
  }
  /* Combinado da semana (revisão semanal): o mais novo vence, por semana */
  function mergeDeals(local, remote) {
    const out = { ...(remote || {}) };
    Object.entries(local || {}).forEach(([ws, v]) => { if (!out[ws] || (v.u || 0) > (out[ws].u || 0)) out[ws] = v; });
    return out;
  }

  /* ---------- Banco de alimentos ---------- */
  function searchFoods(list, q, max = 8) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return list
      .map((f, i) => ({ f, i, n: norm(f[0]) }))
      .filter((x) => words.every((w) => x.n.includes(w)))
      .sort((a, b) => (a.n.startsWith(words[0]) ? 0 : 1) - (b.n.startsWith(words[0]) ? 0 : 1) || a.n.length - b.n.length)
      .slice(0, max);
  }
  /* f = [nome, kcal, prot, carbo, gord (por 100 g ou 100 ml), porção?, gramas da porção?] */
  const foodMacros = (f, grams) => {
    const r = num(grams) / 100;
    return { k: Math.round(f[1] * r), p: Math.round(f[2] * r * 10) / 10, c: Math.round(f[3] * r * 10) / 10, g: Math.round(f[4] * r * 10) / 10 };
  };

  const api = {
    num, pad, keyOf, parseKey, todayKey, addDays, weekStart, daysBetween, ZERO, sum, norm,
    FORA, notesOf, optIndex, isDone, sortedPlan, planned, mealsOfDay, mealIntake, dayDrinks, consumed, doneCount, water, hasLog,
    mergeStates, pruneTombs, weekStats, streak, goalHint, movingAvg, parseQty, optionMix, shoppingList, searchFoods, foodMacros,
    CAUSES, dayReview, mergeDeals, pauseOf, livresPorSemana, livreNoLimite, livresNaSemana
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Core = api;
})(typeof self !== 'undefined' ? self : this);
