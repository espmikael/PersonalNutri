// Testes da lógica pura (core.js). Rodar com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');
const FOODS = require('../foods.js');

const meal = (id, time, items) => ({ id, name: id, time, opts: [{ name: 'A', items }] });
const item = (k, p = 0, c = 0, g = 0) => ({ food: 'x', qty: '100 g', k, p, c, g });
const base = (extra = {}) => ({
  plan: [meal('cafe', '07:00', [item(300, 30)]), meal('almoco', '12:00', [item(600, 50, 60, 10)])],
  goals: { kcal: 2000, prot: 150, agua: 2000 },
  rules: [], days: {}, free: {}, freeU: {}, drinks: [], checkins: [], tomb: {}, ...extra
});
const D = '2026-11-10'; // terça

test('consumed soma refeições feitas, anotações com macros e bebida alcoólica', () => {
  const s = base({
    days: { [D]: { done: { cafe: true }, notes: { _fora: [{ type: 'extra', kcal: 200, p: 10 }] }, water: 500 } },
    drinks: [{ id: 'b1', date: D, cups: 1, ml: 350, kcal: 150 }]
  });
  const c = C.consumed(s, D);
  assert.equal(c.k, 300 + 200 + 150);
  assert.equal(c.p, 30 + 10);
  assert.equal(c.drink, 150);
});

test('troca usa as calorias e a proteína da anotação no lugar do plano', () => {
  const s = base({ days: { [D]: { done: { almoco: true }, notes: { almoco: [{ type: 'troca', kcal: 800, p: 35 }] } } } });
  const x = C.mealIntake(s, s.plan[1], D);
  assert.equal(x.k, 800);
  assert.equal(x.p, 35);
  assert.equal(x.replaced, true);
});

test('merge: bebida apagada num aparelho não volta com a cópia antiga do outro', () => {
  const drink = { id: 'b1', date: D, cups: 1, ml: 350, kcal: 150, u: 100 };
  const local = base({ drinks: [], tomb: { 'd:b1': 200 } });
  const remote = base({ drinks: [drink] });
  assert.equal(C.mergeStates(local, remote).drinks.length, 0);
  assert.equal(C.mergeStates(remote, local).drinks.length, 0);
});

test('merge: check-in refeito depois de apagado continua', () => {
  const local = base({ checkins: [{ date: D, peso: 80, u: 300 }] });
  const remote = base({ checkins: [], tomb: { ['c:' + D]: 200 } });
  const out = C.mergeStates(local, remote);
  assert.equal(out.checkins.length, 1);
  assert.equal(out.checkins[0].peso, 80);
});

test('merge: check-ins do mesmo dia juntam os campos, o mais novo vence', () => {
  const local = base({ checkins: [{ date: D, peso: 80, u: 300 }] });
  const remote = base({ checkins: [{ date: D, peso: 81, cintura: 90, u: 200 }] });
  const c = C.mergeStates(local, remote).checkins[0];
  assert.equal(c.peso, 80);
  assert.equal(c.cintura, 90);
});

test('merge: plano editado no aparelho local é mantido quando é mais novo', () => {
  const local = base({ planU: 500 });
  local.plan = [meal('novo', '08:00', [])];
  const remote = base({ planU: 100, goalsU: 900, goals: { kcal: 1800 } });
  const out = C.mergeStates(local, remote);
  assert.equal(out.plan[0].id, 'novo');
  assert.equal(out.goals.kcal, 1800);
});

test('merge: desfazer a refeição livre vale nos dois aparelhos', () => {
  const ws = C.weekStart(D);
  const local = base({ free: {}, tomb: { ['f:' + ws]: 500 } });
  const remote = base({ free: { [ws]: D }, freeU: { [ws]: 100 } });
  assert.deepEqual(C.mergeStates(local, remote).free, {});
});

test('merge: dias mantêm a versão mais nova de cada um', () => {
  const local = base({ days: { [D]: { u: 5, water: 1000 }, '2026-11-11': { u: 1, water: 1 } } });
  const remote = base({ days: { [D]: { u: 3, water: 200 }, '2026-11-11': { u: 9, water: 9 } } });
  const out = C.mergeStates(local, remote);
  assert.equal(out.days[D].water, 1000);
  assert.equal(out.days['2026-11-11'].water, 9);
});

test('parseQty entende gramas, frações, conchas com peso e "à vontade"', () => {
  assert.deepEqual(C.parseQty('120 g'), { n: 120, unit: 'g' });
  assert.deepEqual(C.parseQty('1 concha · 86 g'), { n: 86, unit: 'g' });
  assert.deepEqual(C.parseQty('1/2 unidade'), { n: 0.5, unit: 'un' });
  assert.deepEqual(C.parseQty('300 ml'), { n: 300, unit: 'ml' });
  assert.deepEqual(C.parseQty('1,5 kg'), { n: 1500, unit: 'g' });
  assert.deepEqual(C.parseQty('3 col. sopa · 33 g'), { n: 33, unit: 'g' });
  assert.equal(C.parseQty('à vontade'), null);
});

test('lista de compras soma o mesmo alimento em refeições diferentes', () => {
  const s = base();
  s.plan = [
    { id: 'a', name: 'Almoço', time: '12:00', opts: [{ name: 'A', items: [{ food: 'Frango', qty: '150 g' }, { food: 'Salada', qty: 'à vontade' }] }] },
    { id: 'j', name: 'Jantar', time: '20:00', opts: [{ name: 'A', items: [{ food: 'frango', qty: '150 g' }] }, { name: 'B', items: [{ food: 'Ovos', qty: '2 unidades' }] }] }
  ];
  const l = C.shoppingList(s, 7, { j: 0 });
  const frango = l.find((x) => C.norm(x.food) === 'frango');
  assert.equal(frango.n, 2100);
  assert.deepEqual(frango.meals, ['Almoço', 'Jantar']);
  assert.ok(l.find((x) => x.food === 'Salada' && x.unit === ''));
  const comOvos = C.shoppingList(s, 2, { j: 1 });
  assert.equal(comOvos.find((x) => x.food === 'Ovos').n, 4);
});

test('sequência conta dias seguidos; hoje só entra se já cumpriu', () => {
  const s = base({ days: {} });
  for (let i = 1; i <= 3; i++) s.days[C.addDays(D, -i)] = { water: 2500 };
  assert.equal(C.streak(s, 'agua', D), 3);
  s.days[D] = { water: 2100 };
  assert.equal(C.streak(s, 'agua', D), 4);
  s.days[C.addDays(D, -2)].water = 100;
  assert.equal(C.streak(s, 'agua', D), 2);
});

test('resumo da semana calcula adesão e médias só dos dias com registro', () => {
  const ws = C.weekStart(D); // segunda 09/11
  const s = base({ days: { [ws]: { done: { cafe: true, almoco: true }, water: 2000 } } });
  const w = C.weekStats(s, ws, D); // seg e ter
  assert.equal(w.days, 2);
  assert.equal(w.logged, 1);
  assert.equal(w.done, 2);
  assert.equal(w.possible, 4);
  assert.equal(w.avgK, 900);
  assert.equal(w.avgWater, 2000);
});

test('sugestão de meta: peso parado com boa adesão sugere baixar calorias', () => {
  const s = base();
  const start = '2026-10-20';
  for (let i = 0; i <= 21; i++) s.days[C.addDays(start, i)] = { done: { cafe: true, almoco: true } };
  s.checkins = [{ date: start, peso: 80 }, { date: C.addDays(start, 7), peso: 80.1 }, { date: C.addDays(start, 21), peso: 79.9 }];
  const h = C.goalHint(s, C.addDays(start, 21));
  assert.equal(h.kind, 'down');
  assert.equal(h.delta, -150);
});

test('banco de alimentos: busca sem acento e calcula pela quantidade', () => {
  const r = C.searchFoods(FOODS, 'feijao');
  assert.ok(r.length >= 2);
  assert.match(r[0].f[0], /Feijão/);
  const arroz = FOODS.find((f) => f[0] === 'Arroz branco cozido');
  assert.deepEqual(C.foodMacros(arroz, 200), { k: 256, p: 5, c: 56.2, g: 0.4 });
  FOODS.forEach((f) => { assert.equal(typeof f[0], 'string'); [1, 2, 3, 4].forEach((i) => assert.ok(f[i] >= 0, f[0])); });
});

test('média móvel das últimas 3', () => {
  assert.deepEqual(C.movingAvg([3, 6, 9, 12]), [3, 4.5, 6, 9]);
});

test('lista automática segue a proporção das opções comidas nas últimas 2 semanas', () => {
  const s = base();
  s.plan = [{ id: 'a', name: 'Almoço', time: '12:00', opts: [
    { name: 'Feijão', items: [{ food: 'Arroz', qty: '100 g' }, { food: 'Feijão', qty: '80 g' }] },
    { name: 'Massa', items: [{ food: 'Macarrão', qty: '140 g' }, { food: 'Ovos', qty: '1 unidade' }] }
  ] }];
  // 3 dias com feijão, 1 com massa, 1 trocado por anotação (não conta)
  [[1, 0], [2, 0], [3, 0], [4, 1]].forEach(([d, o]) => { s.days[C.addDays(D, -d)] = { done: { a: true }, sel: { a: o } }; });
  s.days[C.addDays(D, -5)] = { done: { a: true }, sel: { a: 1 }, notes: { a: [{ type: 'troca', kcal: 900 }] } };
  const mix = C.optionMix(s, s.plan[0], D);
  assert.deepEqual(mix, [0.75, 0.25]);
  const l = C.shoppingList(s, 7, {}, { a: mix });
  assert.equal(l.find((x) => x.food === 'Arroz').n, 525);
  assert.equal(l.find((x) => x.food === 'Macarrão').n, 245);
  assert.equal(l.find((x) => x.food === 'Ovos').n, 2); // 1,75 arredonda para cima
  // Sem histórico, tudo na 1ª opção
  assert.deepEqual(C.optionMix(base({ plan: s.plan }), s.plan[0], D), [1, 0]);
});

test('banco de alimentos: novos itens e unidade (g ou ml)', () => {
  ['sorvete napolitano', 'barra chocolate', 'acai tradicional', 'pacoca'].forEach((q) => assert.ok(C.searchFoods(FOODS, q).length, q));
  assert.ok(FOODS.isLiquid('Açaí tradicional (com xarope de guaraná)'));
  assert.ok(FOODS.isLiquid('Leite desnatado'));
  assert.ok(!FOODS.isLiquid('Leite condensado'));
  assert.ok(!FOODS.isLiquid('Leite em pó integral'));
  assert.ok(!FOODS.isLiquid('Açaí polpa sem açúcar'));
});
