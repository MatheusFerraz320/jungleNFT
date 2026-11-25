import { ANA, BRUNO, expect, test } from '../fixtures/test';

async function fillLogin(page: import('@playwright/test').Page, email: string, password: string) {
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).last().click();
}

test.describe('conta e sessão', () => {
  test('rota privada redireciona ao login e retorna ao fluxo anterior após autenticar', async ({
    page,
  }) => {
    await page.goto('/perfil');
    await expect(page).toHaveURL(/\/login\?redirect=/);

    await fillLogin(page, ANA.email, ANA.password);
    await expect(page).toHaveURL(/\/perfil$/);
    await expect(page.locator('#displayName')).toHaveValue(ANA.name);
  });

  test('login valida campos e mostra erro de credenciais', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar', exact: true }).last().click();
    await expect(page.locator('#login-email-error')).toBeVisible();
    await expect(page.locator('#login-email')).toHaveAttribute('aria-invalid', 'true');

    await fillLogin(page, ANA.email, 'senha-errada');
    await expect(
      page.getByRole('alert').filter({ hasText: 'E-mail ou senha inválidos' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('cadastro cria a conta, autentica e trata conflito de e-mail', async ({ page }) => {
    await page.goto('/cadastro');
    await page.locator('#register-name').fill('Carla Dias');
    await page.locator('#register-email').fill(ANA.email);
    await page.locator('#register-password').fill('Senha@1234');
    await page.locator('#register-confirmPassword').fill('Senha@1234');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).last().click();
    await expect(page.locator('#register-email-error')).toContainText('já cadastrado');

    await page.locator('#register-email').fill('carla@jungle.test');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).last().click();
    await expect(page).toHaveURL('/');

    // A conta foi criada e a sessão está ativa (perfil privado abre com os dados dela).
    await page.goto('/perfil');
    await expect(page.locator('#displayName')).toHaveValue('Carla Dias');
  });

  test('cadastro valida senha e confirmação', async ({ page }) => {
    await page.goto('/cadastro');
    await page.locator('#register-name').fill('Carla');
    await page.locator('#register-email').fill('carla@jungle.test');
    await page.locator('#register-password').fill('Senha@1234');
    await page.locator('#register-confirmPassword').fill('outra');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).last().click();
    await expect(page.locator('#register-confirmPassword-error')).toContainText('não conferem');
  });

  test('conflito de cadastro por cenário', async ({ app, mock }) => {
    await mock.scenario('registration-conflict');
    await app.goto('/cadastro');
    const page = app;
    await page.locator('#register-name').fill('Nova Pessoa');
    await page.locator('#register-email').fill('nova@jungle.test');
    await page.locator('#register-password').fill('Senha@1234');
    await page.locator('#register-confirmPassword').fill('Senha@1234');
    await page.getByRole('button', { name: 'Criar conta', exact: true }).last().click();
    await expect(page.locator('#register-email-error')).toBeVisible();
  });

  test('sessão sobrevive a refresh e logout encerra o acesso', async ({ app, loginAs }) => {
    await loginAs(ANA);
    await app.goto('/perfil');
    await expect(app.locator('#displayName')).toHaveValue(ANA.name);

    await app.reload();
    await expect(app).toHaveURL(/\/perfil$/);
    await expect(app.locator('#displayName')).toHaveValue(ANA.name);

    await app.getByRole('button', { name: 'Sair' }).click();
    await expect(app).toHaveURL('/');
    await expect(app.getByRole('link', { name: /Ana/ })).toHaveCount(0);

    await app.goto('/perfil');
    await expect(app).toHaveURL(/\/login/);
  });

  test('sessão expirada durante a navegação leva ao login e retoma o destino', async ({
    app,
    loginAs,
    mock,
  }) => {
    await loginAs(ANA);
    await app.goto('/carteiras');
    await expect(app.getByRole('heading', { name: 'Carteira principal' })).toBeVisible();

    await mock.expireSessions();
    await app.getByRole('link', { name: 'Dados do perfil' }).click();

    await expect(app).toHaveURL(/\/login\?redirect=.*perfil/);
    await expect(app.getByText('Sua sessão expirou').first()).toBeVisible();

    await fillLogin(app, ANA.email, ANA.password);
    await expect(app).toHaveURL(/\/perfil$/);
  });

  test('troca de usuário não vaza favoritos nem carrinho', async ({ app, loginAs }) => {
    await loginAs(ANA);
    await app
      .getByRole('button', { name: /Favoritar Emerald Ape #042/ })
      .first()
      .click();
    await expect(
      app.getByRole('button', { name: /Remover Emerald Ape #042/ }).first(),
    ).toBeVisible();

    await app.goto('/perfil');
    await app.getByRole('button', { name: 'Sair' }).click();
    await app.goto('/login');
    await fillLogin(app, BRUNO.email, BRUNO.password);
    await expect(app).toHaveURL('/');

    await expect(
      app.getByRole('button', { name: /Favoritar Emerald Ape #042/ }).first(),
    ).toBeVisible();
    await expect(app.getByRole('button', { name: /Remover Emerald Ape #042/ })).toHaveCount(0);
  });
});
