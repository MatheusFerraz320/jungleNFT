import { expect, type Page } from './test';

/** Abre o painel de filtros no mobile (no desktop ele já está visível). */
export async function openFilters(page: Page) {
  const toggle = page.getByRole('button', { name: 'Abrir filtros' });
  if (await toggle.isVisible()) await toggle.click();
}

export async function addToCartFromDetail(page: Page, nftId = 'nft-001', quantity = 1) {
  await page.goto(`/nft/${nftId}`);
  const plus = page.getByRole('button', { name: 'Aumentar quantidade' });
  for (let step = 1; step < quantity; step += 1) await plus.click();
  await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click();
  await expect(page).toHaveURL(/\/carrinho$/);
}

/** Do carrinho ao pagamento (visitantes caem no login; o teste decide como prosseguir). */
export async function startCheckout(page: Page) {
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click();
}

/** Preenche o formulário do colecionador (no mobile ele fica numa seção recolhível). */
export async function fillCollector(page: Page) {
  // Aguarda o checkout carregar (carteiras + carrinho) antes de decidir pelo layout.
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible();
  if ((page.viewportSize()?.width ?? 1440) < 640) await openCollectorSection(page);
  await expect(page.locator('#username')).toBeVisible();
  await page.locator('#username').fill('ana_s');
  await page.locator('#profileName').fill('Ana Souza');
  await page.locator('#referralCode').fill('KURIO');
  await page.locator('#ensName').fill('ana');
}

/** Expande "Dados do colecionador" no mobile (idempotente). */
export async function openCollectorSection(page: Page) {
  const toggle = page.getByRole('button', { name: 'Dados do colecionador' });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
}

export async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  const dialog = page.getByRole('dialog', { name: 'Revisar pedido' });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: /Enviar pedido|Confirmar novos valores/ }),
  ).toBeEnabled();
  return dialog;
}

export async function ordersOf(page: Page) {
  return page.evaluate(async () => {
    const token = localStorage.getItem('junglenft:token');
    const response = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
    return ((await response.json()) as { orders: { id: string; status: string }[] }).orders;
  });
}

/** Carrinho → pagamento → revisão (usuário já autenticado). */
export async function reachReview(page: Page, nftId = 'nft-001', quantity = 1) {
  await addToCartFromDetail(page, nftId, quantity);
  await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeVisible();
  await startCheckout(page);
  await expect(page).toHaveURL(/\/pagamento$/);
  await fillCollector(page);
  return openReview(page);
}
