const { test, expect } = require('@playwright/test');

const requiredEnv = ['PORTAL_TENANT', 'PORTAL_EMAIL', 'PORTAL_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

test.describe('Portal de Vagas - Registro', () => {
  test('open register modal and validate required fields', async ({ page }) => {
    // Este teste não precisa de login real, mas precisa do tenant no link.
    test.skip(missingEnv.length > 0, `Missing env: ${missingEnv.join(', ')}`);

    const tenant = process.env.PORTAL_TENANT;
    const loginUrl = `/acesso?tenantId=${encodeURIComponent(tenant)}&returnUrl=%2F`;

    // Abre a tela de acesso.
    await page.goto(loginUrl);

    // Abre o modal de cadastro.
    await page.click('#openRegister');

    // Garante que o modal está visível.
    await expect(page.locator('#registerModal')).toBeVisible();

    // Tenta submeter sem preencher nada.
    // O form usa validação HTML nativa e mensagens de feedback.
    await page.click('#registerSubmit');

    // Verifica se apareceu pelo menos um feedback de campo inválido.
    await expect(page.locator('.invalid-feedback:visible')).toHaveCount(1);
  });
});
