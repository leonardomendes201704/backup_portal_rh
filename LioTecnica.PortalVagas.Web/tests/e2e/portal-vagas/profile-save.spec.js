const { test, expect } = require('@playwright/test');

const requiredEnv = ['PORTAL_TENANT', 'PORTAL_EMAIL', 'PORTAL_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

test.describe('Portal de Vagas - Perfil', () => {
  test('open profile, edit a field and save', async ({ page }) => {
    test.skip(missingEnv.length > 0, `Missing env: ${missingEnv.join(', ')}`);

    const tenant = process.env.PORTAL_TENANT;
    const loginUrl = `/acesso?tenantId=${encodeURIComponent(tenant)}&returnUrl=%2F`;

    // Acessa o portal e faz login.
    await page.goto(loginUrl);
    await page.fill('#loginEmail', process.env.PORTAL_EMAIL);
    await page.fill('#loginPassword', process.env.PORTAL_PASSWORD);

    const navigationPromise = page.waitForURL('**/', { timeout: 15000 });
    const errorPromise = page.waitForSelector('.swal2-popup', { timeout: 15000 }).then(async () => {
      const title = await page.locator('.swal2-title').textContent();
      const text = await page.locator('.swal2-html-container').textContent();
      throw new Error(`Login failed: ${title || ''} ${text || ''}`.trim());
    });

    await page.click('#loginSubmit');
    await Promise.race([navigationPromise, errorPromise]);

    // Abre o modal "Meu perfil".
    await page.click('#portalUserMenu');
    await page.click('#btnProfile');
    await expect(page.locator('#profileModal')).toBeVisible();

    // Edita o campo de telefone (dados básicos do candidato).
    // Usamos o label "Telefone" para localizar o input, já que o HTML não tem id/name fixo.
    const modal = page.locator('#profileModal');
    // Usa o id exibido no snapshot para evitar conflito com outros labels.
    const phoneInput = modal.locator('#profilePhone');
    await expect(phoneInput).toBeVisible();

    // Guarda o valor atual para reverter no final do teste.
    const oldValue = await phoneInput.inputValue();

    // Altera o telefone (apenas números para não quebrar máscara).
    await phoneInput.fill('11999998888');

    // Clica em salvar (botão no footer do modal).
    await page.click('#profileModal button.btn-primary:has-text("Salvar")');

    // Verifica feedback de sucesso.
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await expect(page.locator('.swal2-title')).toContainText(/salvo|sucesso|success/i);

    // (Opcional) Reverte o valor para o original para não sujar dados.
    if (oldValue && oldValue !== '11999998888') {
      await page.click('.swal2-confirm');
      await phoneInput.fill(oldValue);
      await page.click('#profileModal button.btn-primary:has-text("Salvar")');
    }
  });
});
