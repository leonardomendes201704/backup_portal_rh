const { test, expect } = require('@playwright/test');

// Os testes abaixo rodam contra o Portal de Vagas.
// É obrigatório definir as variáveis de ambiente:
// PORTAL_TENANT, PORTAL_EMAIL, PORTAL_PASSWORD
const requiredEnv = ['PORTAL_TENANT', 'PORTAL_EMAIL', 'PORTAL_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

test.describe('Portal de Vagas', () => {
  test('login and open profile modal', async ({ page }) => {
    // Se as variáveis não estiverem definidas, o teste é ignorado.
    test.skip(missingEnv.length > 0, `Missing env: ${missingEnv.join(', ')}`);

    // Monta a URL de acesso do portal já com o tenant no querystring.
    const tenant = process.env.PORTAL_TENANT;
    const loginUrl = `/acesso?tenantId=${encodeURIComponent(tenant)}&returnUrl=%2F`;

    // Abre a tela de acesso do portal de vagas.
    await page.goto(loginUrl);

    // Preenche o e-mail e a senha do candidato.
    await page.fill('#loginEmail', process.env.PORTAL_EMAIL);
    await page.fill('#loginPassword', process.env.PORTAL_PASSWORD);

    // Após clicar, o JS faz POST para /auth/login e redireciona.
    // Esperamos ou o redirecionamento, ou um SweetAlert de erro.
    const navigationPromise = page.waitForURL('**/', { timeout: 15000 });
    const errorPromise = page.waitForSelector('.swal2-popup', { timeout: 15000 }).then(async () => {
      const title = await page.locator('.swal2-title').textContent();
      const text = await page.locator('.swal2-html-container').textContent();
      throw new Error(`Login failed: ${title || ''} ${text || ''}`.trim());
    });

    await page.click('#loginSubmit');
    await Promise.race([navigationPromise, errorPromise]);

    // Confirma que a home do portal carregou.
    await expect(page.locator('h1')).toContainText('Transforme');

    // Abre o menu do usuário e clica em "Ver perfil".
    await page.click('#portalUserMenu');
    await page.click('#btnProfile');

    // Verifica que o modal do perfil está visível.
    await expect(page.locator('#profileModal')).toBeVisible();
  });
});
