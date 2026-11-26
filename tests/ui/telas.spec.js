// Testes de tela. Cada um corresponde a algo que já quebrou ou que é central no uso diário.
const { test, expect, go } = require('./fixtures');

const TELAS = [
  ['hoje', '', 'Fora do cardápio'],
  ['progresso', "UI.prog='comida';render()", 'Calorias'],
  ['progresso', "UI.prog='corpo';render()", 'Check-in semanal'],
  ['plano', "UI.planTab='refeicoes';render()", 'Metas e regras'],
  ['plano', "UI.planTab='compras';render()", 'Dia das compras'],
  ['conta', '', 'Dados'],
  ['refeicao/almoco', '', 'Marcar como feito']
];

test.describe('todas as telas abrem sem erro', () => {
  for (const [route, js, text] of TELAS) {
    test(`#${route} ${js}`, async ({ page }) => {
      await go(page, route, js);
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    });
  }
});

test('endereços antigos levam para a tela nova', async ({ page }) => {
  await go(page, 'compras');
  await expect(page).toHaveURL(/#plano$/);
  expect(await page.evaluate(() => UI.planTab)).toBe('compras');
  await go(page, 'extras');
  await expect(page).toHaveURL(/#hoje$/);
});

test('barra de abas do celular divide a largura em partes iguais', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'só no celular');
  const boxes = await page.locator('.tabbar .tab').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.x, w: r.width })));
  expect(boxes).toHaveLength(3);
  const vw = page.viewportSize().width;
  boxes.forEach((b, i) => {
    expect(Math.abs(b.w - vw / 3)).toBeLessThan(12);
    expect(Math.abs(b.x - (vw / 3) * i)).toBeLessThan(12);
  });
});

test('no tema escuro o card "Próxima" mantém a borda azul', async ({ browser }, info) => {
  const ctx = await browser.newContext({ colorScheme: 'dark', viewport: info.project.use.viewport, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route(/supabase\.co/, (r) => r.abort());
  await page.addInitScript(() => localStorage.setItem('personalnutri_sem_conta', '1'));
  await page.goto('/#hoje');
  const card = page.locator('.meal.is-next').first();
  await expect(card).toBeVisible();
  const shadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(shadow).toContain('inset');
  await ctx.close();
});

test('anotar "comi a mais" exige a categoria e aceita "Outro"', async ({ page }) => {
  await go(page, 'hoje');
  await page.click('button[data-act="noteopen"][data-meal="_fora"]');
  await page.fill('#note-text', 'Mamão');
  await page.fill('#note-kcal', '62');
  await page.click('[data-act="notesave"]');
  await expect(page.locator('#toast')).toContainText('Escolha o que foi');
  await page.click('[data-act="notecat"][data-v="outro"]');
  await page.click('[data-act="notesave"]');
  const notas = await page.evaluate(() => S.days[Core.todayKey()].notes._fora);
  expect(notas[0]).toMatchObject({ type: 'extra', cat: 'outro', kcal: 62 });
});

test('alimento escolhido no banco entra ao salvar, mesmo sem tocar em Adicionar', async ({ page }) => {
  await go(page, 'hoje');
  await page.click('button[data-act="noteopen"][data-meal="_fora"]');
  await page.click('[data-act="pickopen"]');
  await page.fill('#pick-q', 'mamão');
  await page.locator('[data-act="pickfood"]').first().click();
  await page.click('[data-act="notecat"][data-v="outro"]');
  await page.click('[data-act="notesave"]');
  const n = await page.evaluate(() => S.days[Core.todayKey()].notes._fora[0]);
  expect(Number(n.kcal)).toBeGreaterThan(0);
});

test('dia sem nada marcado aparece como "Sem registro" e fica fora da média', async ({ page }) => {
  await go(page, 'progresso', "UI.prog='comida';render()");
  const st = await page.evaluate(() => Core.dayReview(S, Core.addDays(Core.todayKey(), -2)).st);
  expect(st).toBe('semreg');
  await expect(page.getByText('dia sem registro', { exact: false }).first()).toBeVisible();
});

test('pausa tira os dias das análises e aparece no Hoje', async ({ page }) => {
  await go(page, 'progresso', "UI.prog='comida';render()");
  const antes = await page.evaluate(() => reviewRange(4).filter((c) => c.r && c.r.st !== 'pausa').length);
  await page.locator('button[data-act="pznew"]:visible').click();
  await page.fill('#pz-name', 'Praia');
  await page.fill('#pz-from', await page.evaluate(() => Core.addDays(Core.todayKey(), -3)));
  await page.fill('#pz-to', await page.evaluate(() => Core.todayKey()));
  await page.click('[data-act="pzsave"]');
  const depois = await page.evaluate(() => reviewRange(4).filter((c) => c.r && c.r.st !== 'pausa').length);
  expect(depois).toBe(antes - 3);
  await go(page, 'hoje');
  await expect(page.locator('.pause-bar')).toContainText('Praia');
});

test('lista de compras: tirar um item da semana e devolver', async ({ page }) => {
  await go(page, 'plano', "UI.planTab='compras';render()");
  const row = page.locator('li.shop-li', { hasText: 'Whey' });
  await row.locator('.shop-pen').click();
  await page.click('[data-act="shoprm"]');
  await expect(page.locator('li.shop-li', { hasText: 'Whey' })).toHaveCount(0);
  expect(await page.evaluate(() => shopText())).not.toContain('Whey');
  await page.locator('summary', { hasText: 'Fora da lista' }).click();
  await page.click('[data-act="shopback"]');
  await expect(page.locator('li.shop-li', { hasText: 'Whey' })).toHaveCount(1);
});

test('refeições livres: limite das metas aparece nas regras', async ({ page }) => {
  await page.evaluate(() => { S.goals.livres = 2; save(); });
  await go(page, 'hoje');
  await expect(page.locator('.rule-free:visible').first()).toContainText('2 refeições livres por semana');
});

test('campo de horário tem a mesma altura do campo de nome no editor do plano', async ({ page }) => {
  await go(page, 'plano', "UI.planTab='refeicoes';render()");
  const h = await page.evaluate(() => [document.querySelector('input[data-in=meal][data-f=name]'), document.querySelector('input[type=time]')].map((e) => Math.round(e.getBoundingClientRect().height)));
  expect(Math.abs(h[0] - h[1])).toBeLessThanOrEqual(2);
});
