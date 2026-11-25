import { openFilters } from '../fixtures/flows';
import { expect, test } from '../fixtures/test';

test.describe('catálogo', () => {
  test('busca por texto reflete na URL e filtra os resultados', async ({ app }) => {
    await app.getByRole('button', { name: 'Explorar coleções' }).click();
    await app.getByLabel('Nome ou coleção').fill('golden');
    await app.getByRole('button', { name: 'Buscar' }).click();

    await expect(app).toHaveURL(/q=golden/);
    await expect(app.getByRole('link', { name: /golden beat #207/i })).toBeVisible();
    await expect(app.getByRole('link', { name: /emerald ape/i })).toHaveCount(0);
  });

  test('filtros combinados, ordenação e reinício da paginação', async ({ app }) => {
    await expect(app.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible();

    // Paginação: ir para a página 2.
    await app.getByRole('button', { name: 'Página 2' }).click();
    await expect(app).toHaveURL(/page=2/);

    // Mudar um filtro volta à página 1.
    await openFilters(app);
    await app.getByRole('button', { name: /^Fotografia/ }).click();
    await expect(app).toHaveURL(/categories=.*photography/);
    await expect(app).not.toHaveURL(/page=2/);

    // Filtro combinado (categoria + rede).
    await app.getByRole('button', { name: /^Polygon/ }).click();
    await expect(app).toHaveURL(/network=polygon/);
    await expect(app).toHaveURL(/categories=.*photography/);
    await expect(app.getByRole('link', { name: /sage nomad #009/i })).toBeVisible();
    await expect(app.getByRole('link', { name: /emerald ape/i })).toHaveCount(0);

    // Ordenação.
    await app.getByRole('combobox', { name: 'Ordenar por:' }).selectOption('price-desc');
    await expect(app).toHaveURL(/sort=price-desc/);
  });

  test('estado sobrevive a refresh e ao histórico do navegador', async ({ app }) => {
    await app.getByRole('button', { name: 'Página 2' }).click();
    await expect(app).toHaveURL(/page=2/);
    const second = app
      .getByRole('link')
      .filter({ has: app.locator('img') })
      .first();
    await expect(second).toBeVisible();

    await app.reload();
    await expect(app).toHaveURL(/page=2/);
    await expect(app.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await openFilters(app);
    await app.getByRole('button', { name: /^Música/ }).click();
    await expect(app).toHaveURL(/categories=.*music/);

    await app.goBack();
    await expect(app).toHaveURL(/page=2/);
    await expect(app).not.toHaveURL(/categories=/);
    await app.goForward();
    await expect(app).toHaveURL(/categories=.*music/);
  });

  test('resultado vazio (cenário e busca sem correspondência) e limpeza dos filtros', async ({
    app,
    mock,
  }) => {
    await mock.scenario('empty');
    await app.reload();
    await expect(app.getByText('Nenhum NFT encontrado')).toBeVisible();

    await mock.scenario('default');
    await app.goto('/?q=zzzz');
    await expect(app.getByText('Nenhum NFT encontrado')).toBeVisible();

    await app.getByRole('button', { name: 'Limpar filtros' }).last().click();
    await expect(app).not.toHaveURL(/q=zzzz/);
    await expect(app.getByRole('link', { name: /emerald ape #042/i }).first()).toBeVisible();
  });
});
