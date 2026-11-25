// Preparação comum: app sem conta (nada vai para o Supabase) e 30 dias fictícios com acertos e falhas.
const { test: base, expect } = require('@playwright/test');

const SEED = () => {
  const t = Core.todayKey();
  const plan = S.plan.slice().sort((a, b) => a.time.localeCompare(b.time));
  const id = (re) => (plan.find((m) => re.test(m.name)) || plan[0]).id;
  const L = id(/lanche/i), J = id(/jant/i), A = id(/almo/i), C = id(/ceia/i);
  const ev = {
    25: { extra: [[A, 'doce', 'Brigadeiro', 200]] }, 24: { skip: [L] }, 22: { livre: [J, 'Pizza', 2400] }, 19: { drink: 3 },
    18: { extra: [[A, 'porcao', 'Churrasco', 600]] }, 15: { skip: [J, C] }, 12: { skip: [L] }, 8: { livre: [J, 'Hambúrguer', 2200] },
    5: { skip: [A, L, J] }, 3: { extra: [[A, 'doce', 'Brigadeiro', 200]] }, 2: { empty: true }, 1: { extra: [[C, 'doce', 'Sorvete', 520]] }
  };
  S.days = {}; S.drinks = []; S.free = {}; S.freeU = {};
  for (let i = 30; i >= 1; i--) {
    const k = Core.addDays(t, -i);
    const d = S.days[k] = { sel: {}, done: {}, snap: {}, notes: {}, byNote: {}, water: 2500, u: Date.now() };
    const e = ev[i] || {};
    if (e.empty) continue;
    plan.forEach((m) => { if (!(e.skip || []).includes(m.id)) d.done[m.id] = true; });
    (e.extra || []).forEach(([mid, cat, text, kcal]) => { (d.notes[mid] = d.notes[mid] || []).push({ id: 'n' + i + mid, type: 'extra', cat, text, kcal }); });
    if (e.livre) d.notes[e.livre[0]] = [{ id: 'l' + i, type: 'livre', text: e.livre[1], kcal: e.livre[2] }];
    if (e.drink) S.drinks.push({ id: 'b' + i, date: k, type: 'cerveja', cups: e.drink, ml: 350, kcal: Math.round(e.drink * 350 * 0.43), u: 1 });
  }
  localStorage.setItem('dieta_app_v1', JSON.stringify(S));
};

const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route(/supabase\.co/, (r) => r.abort());
    await page.addInitScript(() => localStorage.setItem('personalnutri_sem_conta', '1'));
    await page.goto('/#hoje');
    await page.waitForFunction(() => typeof S !== 'undefined' && window.Core && document.querySelector('.shell'));
    await page.evaluate(SEED);
    await page.reload();
    await page.waitForFunction(() => typeof S !== 'undefined' && window.Core && document.querySelector('.shell'));
    await use(page);
    expect(errors, 'erros de JavaScript na página').toEqual([]);
  }
});

const go = async (page, route, js) => {
  await page.goto('/#' + route);
  if (js) await page.evaluate(js);
  await page.waitForTimeout(150);
};

module.exports = { test, expect, go };
