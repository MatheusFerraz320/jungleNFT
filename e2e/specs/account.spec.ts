import { ANA, BRUNO, expect, test, type Page } from '../fixtures/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const save = (page: Page) => page.getByRole('button', { name: 'Salvar', exact: true });

test.describe('perfil', () => {
  test('valida os campos e mostra erros retornados pela API', async ({ app, loginAs }) => {
    await loginAs(BRUNO);
    await app.goto('/perfil');
    await expect(app.locator('#displayName')).toHaveValue(BRUNO.name);

    await app.locator('#username').fill('');
    await save(app).click();
    await expect(app.locator('#username-error')).toBeVisible();
    await expect(app.locator('#username')).toHaveAttribute('aria-invalid', 'true');

    // Erro retornado pela API: e-mail de outro colecionador.
    await app.locator('#username').fill('bruno_l');
    await app.locator('#walletNickname').fill('Bru');
    await app.locator('#email').fill(ANA.email);
    await save(app).click();
    await expect(app.locator('#email-error')).toContainText('já cadastrado');
  });

  test('altera dados e avatar e mantém após refresh', async ({ app, loginAs }) => {
    await loginAs(BRUNO);
    await app.goto('/perfil');

    await app.locator('#displayName').fill('Bruno Lima Jr');
    await app.locator('#username').fill('bruno_l');
    await app.locator('#walletNickname').fill('Bru');
    await app
      .locator('input[type=file]')
      .setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });
    await expect(app.getByText(/Alteração pendente/)).toBeVisible();
    await save(app).click();
    await expect(app.getByText('Perfil salvo.').first()).toBeVisible();

    await app.reload();
    await expect(app.locator('#displayName')).toHaveValue('Bruno Lima Jr');
    await expect(app.locator('#username')).toHaveValue('bruno_l');
    await expect(app.getByRole('img', { name: 'Avatar atual' })).toBeVisible();

    await app.getByRole('button', { name: 'Remover' }).click();
    await save(app).click();
    await expect(app.getByText('Perfil salvo.').first()).toBeVisible();
    await app.reload();
    await expect(app.getByRole('img', { name: 'Avatar atual' })).toHaveCount(0);
  });

  test('rejeita arquivo que não é imagem', async ({ app, loginAs }) => {
    await loginAs(BRUNO);
    await app.goto('/perfil');
    await app
      .locator('input[type=file]')
      .setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') });
    await expect(app.getByText(/Envie um arquivo de imagem/).first()).toBeVisible();
  });

  test('altera a senha: erros de validação, senha atual incorreta e sucesso', async ({
    app,
    loginAs,
  }) => {
    await loginAs(BRUNO);
    await app.goto('/perfil');
    await app.locator('#username').fill('bruno_l');
    await app.locator('#walletNickname').fill('Bru');

    await app.locator('#currentPassword').fill('Senha@123');
    await app.locator('#newPassword').fill('curta');
    await app.locator('#confirmPassword').fill('outra');
    await save(app).click();
    await expect(app.locator('#newPassword-error')).toBeVisible();
    await expect(app.locator('#confirmPassword-error')).toBeVisible();

    await app.locator('#currentPassword').fill('errada-demais');
    await app.locator('#newPassword').fill('NovaSenha@1');
    await app.locator('#confirmPassword').fill('NovaSenha@1');
    await save(app).click();
    await expect(app.locator('#currentPassword-error')).toContainText('incorreta');

    await app.locator('#currentPassword').fill('Senha@123');
    await save(app).click();
    await expect(app.getByText('Perfil salvo.').first()).toBeVisible();

    // A nova senha vale no próximo login (a antiga deixa de valer).
    await app.getByRole('button', { name: 'Sair' }).click();
    await app.goto('/login');
    await app.locator('#login-email').fill(BRUNO.email);
    await app.locator('#login-password').fill('Senha@123');
    await app.getByRole('button', { name: 'Entrar', exact: true }).last().click();
    await expect(app.getByRole('alert').filter({ hasText: 'inválidos' })).toBeVisible();
    await app.locator('#login-password').fill('NovaSenha@1');
    await app.getByRole('button', { name: 'Entrar', exact: true }).last().click();
    await expect(app).toHaveURL('/');
  });
});

test.describe('carteiras', () => {
  const fill = async (page: Page, prefix: string, address: string, network: string) => {
    await page.locator(`#${prefix}-displayName`).fill('Bruno');
    await page.locator(`#${prefix}-nickname`).fill(prefix === 'primary' ? 'Principal' : 'Reserva');
    await page.locator(`#${prefix}-network`).selectOption(network);
    await page.locator(`#${prefix}-profileName`).fill('Bruno');
    await page.locator(`#${prefix}-address`).fill(address);
    await page.locator(`#${prefix}-walletType`).selectOption('metamask');
    await page.locator(`#${prefix}-referralCode`).fill('KURIO');
    await page.locator(`#${prefix}-ensName`).fill('bruno');
  };

  test('cadastra principal e secundária, valida e trata duplicidade', async ({ app, loginAs }) => {
    await loginAs(BRUNO);
    await app.goto('/carteiras');

    // Validação do formulário (cliente) e do endereço.
    await app.getByRole('button', { name: 'Cadastrar carteira', exact: true }).click();
    await expect(app.locator('#primary-address-error')).toBeVisible();
    await app.locator('#primary-address').fill('0x123');
    await app.getByRole('button', { name: 'Cadastrar carteira', exact: true }).click();
    await expect(app.locator('#primary-address-error')).toContainText('42 caracteres');

    const primary = '0x5555555555555555555555555555555555555555';
    await fill(app, 'primary', primary, 'ethereum');
    await app.getByRole('button', { name: 'Cadastrar carteira', exact: true }).click();
    await expect(app.getByText('Carteira cadastrada.').first()).toBeVisible();

    // Secundária com o mesmo endereço: erro da API; com endereço novo: sucesso.
    await app.getByRole('button', { name: 'Adicionar' }).click();
    await fill(app, 'secondary', primary, 'polygon');
    await app.getByRole('button', { name: 'Cadastrar carteira secundária' }).click();
    await expect(app.locator('#secondary-address-error')).toContainText('já cadastrado');

    await app.locator('#secondary-address').fill('0x6666666666666666666666666666666666666666');
    await app.getByRole('button', { name: 'Cadastrar carteira secundária' }).click();
    await expect(app.getByRole('button', { name: 'Salvar carteira secundária' })).toBeVisible();

    await app.reload();
    await expect(app.locator('#primary-address')).toHaveValue(primary);
    await expect(app.locator('#secondary-address')).toHaveValue(
      '0x6666666666666666666666666666666666666666',
    );
  });

  test('edita a carteira principal sem perder o status de principal', async ({ app, loginAs }) => {
    await loginAs(ANA);
    await app.goto('/carteiras');
    await expect(app.locator('#primary-nickname')).toHaveValue('Carteira principal');

    await app.locator('#primary-displayName').fill('Ana');
    await app.locator('#primary-nickname').fill('Minha principal');
    await app.locator('#primary-profileName').fill('Ana');
    await app.locator('#primary-walletType').selectOption('metamask');
    await app.locator('#primary-referralCode').fill('KURIO');
    await app.locator('#primary-ensName').fill('ana');
    await app.getByRole('button', { name: 'Salvar carteira', exact: true }).click();
    await expect(app.getByText('Carteira atualizada.').first()).toBeVisible();

    await app.reload();
    await expect(app.locator('#primary-nickname')).toHaveValue('Minha principal');
    await expect(app.getByRole('heading', { name: 'Carteira principal' })).toBeVisible();
  });
});
