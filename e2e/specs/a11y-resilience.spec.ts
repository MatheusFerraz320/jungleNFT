import AxeBuilder from '@axe-core/playwright';
import { addToCartFromDetail, reachReview } from '../fixtures/flows';
import { ANA, expect, test, type Page } from '../fixtures/test';

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id}: ${violation.help} -> ${violation.nodes
          .map((node) => node.target.join(' '))
          .slice(0, 3)
          .join(' | ')}`,
    ),
    `Violações em ${page.url()}`,
  ).toEqual([]);
}

test.describe('acessibilidade', () => {
  test('o foco por teclado é visível nos primeiros controles', async ({ app }) => {
    for (let step = 0; step < 4; step += 1) {
      await app.keyboard.press('Tab');
      const visible = await app.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return false;
        const style = getComputedStyle(element);
        return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
      });
      expect(visible, `foco visível no passo ${step + 1}`).toBe(true);
    }
  });

  test('diálogo de busca prende o foco, fecha com Esc e devolve o foco ao gatilho', async ({
    app,
  }) => {
    const trigger = app.getByRole('button', { name: 'Explorar coleções' });
    await trigger.focus();
    await app.keyboard.press('Enter');

    const dialog = app.getByRole('dialog', { name: 'Buscar NFTs' });
    await expect(dialog).toBeVisible();

    for (let step = 0; step < 8; step += 1) {
      await app.keyboard.press('Tab');
      const inside = await app.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      );
      expect(inside, `foco dentro do diálogo no passo ${step + 1}`).toBe(true);
    }

    await app.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('revisão do pedido controla o foco e fecha com Esc', async ({ app, loginAs }) => {
    await loginAs(ANA);
    const dialog = await reachReview(app);

    for (let step = 0; step < 6; step += 1) {
      await app.keyboard.press('Tab');
      const inside = await app.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      );
      expect(inside).toBe(true);
    }
    await app.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('mensagens de erro ficam associadas aos campos', async ({ app }) => {
    await app.goto('/login');
    await app.getByRole('button', { name: 'Entrar', exact: true }).last().click();

    const field = app.locator('#login-email');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await field.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(app.locator(`#${describedBy}`)).toBeVisible();
    await expect(app.locator(`#${describedBy}`)).toHaveAttribute('role', 'alert');
  });

  test('respeita a preferência por movimento reduzido nos skeletons', async ({ app, mock }) => {
    await app.emulateMedia({ reducedMotion: 'reduce' });
    await mock.scenario('slow');
    await app.reload();

    const skeleton = app.getByRole('status', { name: 'Carregando catálogo' });
    await expect(skeleton).toBeVisible();
    const duration = await skeleton
      .locator('.skeleton-shimmer')
      .first()
      .evaluate((element) => getComputedStyle(element, '::after').animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.01);
  });

  test('páginas principais não têm violações automáticas (axe)', async ({ app, loginAs }) => {
    await expectNoViolations(app);

    await app.goto('/nft/nft-001');
    await expect(app.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible();
    await expectNoViolations(app);

    await app.goto('/login');
    await expect(app.locator('#login-email')).toBeVisible();
    await expectNoViolations(app);

    await loginAs(ANA);
    await addToCartFromDetail(app);
    await expect(app.getByRole('complementary', { name: 'Resumo da carteira' })).toBeVisible();
    await expectNoViolations(app);

    await app.goto('/perfil');
    await expect(app.locator('#displayName')).toBeVisible();
    await expectNoViolations(app);
  });
});

test.describe('carregamento, falhas e recuperação', () => {
  test('skeletons durante o carregamento lento do catálogo e do detalhe', async ({ app, mock }) => {
    await mock.scenario('slow');
    await app.goto('/');
    await expect(app.getByRole('status', { name: 'Carregando catálogo' })).toBeVisible();

    await app.goto('/nft/nft-001');
    await expect(app.getByRole('status', { name: 'Carregando NFT' })).toBeVisible();
    await expect(app.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('falha de conexão mostra feedback e recupera com nova tentativa', async ({ app, mock }) => {
    await mock.scenario('offline');
    await app.goto('/');
    await expect(app.getByText('Não foi possível carregar o catálogo')).toBeVisible({
      timeout: 20_000,
    });

    await mock.scenario('default');
    await app.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(app.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible();
  });

  test('erro HTTP 5xx mostra feedback e recupera na nova tentativa', async ({ app, mock }) => {
    // Falhas injetadas ficam na memória da página: registre-as após a carga e provoque uma nova
    // consulta pela interface (página 2). Três falhas esgotam as retentativas automáticas.
    await expect(app.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible();
    await mock.fault('GET', '/nfts', 503, 3);
    await app.getByRole('button', { name: 'Página 2' }).click();

    await expect(app.getByText('Não foi possível carregar o catálogo')).toBeVisible({
      timeout: 20_000,
    });

    await app.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(app.getByText('Não foi possível carregar o catálogo')).toHaveCount(0);
    await expect(app.getByRole('article').first()).toBeVisible();
  });

  test('respostas fora de ordem não sobrescrevem a consulta mais recente', async ({
    app,
    mock,
  }) => {
    await mock.scenario('out-of-order');
    await app.goto('/?sort=price-asc');
    const combo = app.getByRole('combobox', { name: 'Ordenar por:' }).locator('visible=true');
    test.skip(!(await combo.count()), 'Seletor de ordenação fica no painel de filtros no mobile.');

    await combo.selectOption('price-desc');
    await combo.selectOption('name-asc');
    await combo.selectOption('price-desc');
    await expect(app).toHaveURL(/sort=price-desc/);

    const prices = async () =>
      (await app.getByRole('article').locator('p.text-primary').allTextContents()).map((text) =>
        parseFloat(text),
      );
    await expect
      .poll(
        async () => {
          const values = await prices();
          return (
            values.length > 2 &&
            values.every((value, index) => index === 0 || values[index - 1]! >= value)
          );
        },
        { timeout: 15_000 },
      )
      .toBe(true);
  });

  test('erro 404 do detalhe e recuperação pela navegação', async ({ app }) => {
    await app.goto('/nft/inexistente');
    await expect(app.getByText('NFT não encontrado')).toBeVisible();
    await app.getByRole('link', { name: 'Voltar ao mercado' }).click();
    await expect(app.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible();
  });
});
