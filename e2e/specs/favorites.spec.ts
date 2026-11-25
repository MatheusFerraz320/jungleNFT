import { ANA, expect, test } from '../fixtures/test';

test.describe('favoritos', () => {
  test('exigem autenticação e retomam o fluxo após o login', async ({ app }) => {
    await app
      .getByRole('button', { name: /Favoritar Emerald Ape #042/ })
      .first()
      .click();
    await expect(app).toHaveURL(/\/login\?redirect=/);
  });

  test('persistem após refresh e podem ser removidos', async ({ app, loginAs }) => {
    await loginAs(ANA);
    const add = app.getByRole('button', { name: /Favoritar Emerald Ape #042/ }).first();
    await add.click();
    await expect(
      app.getByRole('button', { name: /Remover Emerald Ape #042/ }).first(),
    ).toBeVisible();

    await app.reload();
    const remove = app.getByRole('button', { name: /Remover Emerald Ape #042/ }).first();
    await expect(remove).toBeVisible();

    await remove.click();
    await expect(
      app.getByRole('button', { name: /Favoritar Emerald Ape #042/ }).first(),
    ).toBeVisible();
    await app.reload();
    await expect(app.getByRole('button', { name: /Remover Emerald Ape #042/ })).toHaveCount(0);
  });

  test('falha da mutation reverte a atualização otimista e permite tentar de novo', async ({
    app,
    loginAs,
    mock,
  }) => {
    await loginAs(ANA);
    await mock.fault('PUT', '/favorites', 500, 1);

    await app
      .getByRole('button', { name: /Favoritar Sage Nomad #009/ })
      .first()
      .click();

    // Rollback: o estado volta ao anterior e o usuário é avisado.
    await expect(app.getByText(/Não foi possível atualizar os favoritos/).first()).toBeVisible();
    await expect(
      app.getByRole('button', { name: /Favoritar Sage Nomad #009/ }).first(),
    ).toBeVisible();
    await expect(app.getByRole('button', { name: /Remover Sage Nomad #009/ })).toHaveCount(0);

    // Recuperação: a nova tentativa funciona.
    await app
      .getByRole('button', { name: /Favoritar Sage Nomad #009/ })
      .first()
      .click();
    await expect(
      app.getByRole('button', { name: /Remover Sage Nomad #009/ }).first(),
    ).toBeVisible();
  });

  test('no detalhe, o botão Favoritar alterna e persiste', async ({ app, loginAs, mobile }) => {
    test.skip(mobile, 'No mobile o coração do detalhe fica na barra superior.');
    await loginAs(ANA);
    await app.goto('/nft/nft-001');

    const toggle = app.getByRole('button', { name: /Favoritar|Favoritado/ }).first();
    await toggle.click();
    await expect(app.getByRole('button', { name: 'Favoritado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await app.reload();
    await expect(app.getByRole('button', { name: 'Favoritado' })).toBeVisible();
  });
});
