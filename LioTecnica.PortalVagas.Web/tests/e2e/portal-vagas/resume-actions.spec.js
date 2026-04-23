const { test, expect } = require('@playwright/test');

const requiredEnv = ['PORTAL_TENANT', 'PORTAL_EMAIL', 'PORTAL_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

test.describe('Portal de Vagas - Curriculo', () => {
  test('open profile and use resume actions', async ({ page }) => {
    test.skip(missingEnv.length > 0, `Missing env: ${missingEnv.join(', ')}`);

    const tenant = process.env.PORTAL_TENANT;
    const loginUrl = `/acesso?tenantId=${encodeURIComponent(tenant)}&returnUrl=%2F`;

    // Faz login no portal.
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

    // Aciona "Visualizar curriculo" (abre nova aba/janela).
    const viewBtn = page.locator('#profileModal button:has-text("Visualizar currículo")');
    if (await viewBtn.count()) {
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        viewBtn.click()
      ]);
      await expect(popup).toHaveURL(/ResumeHtml|Curriculo|Currículo|resume/i);
      await popup.close();
    }

    // Aciona "Baixar curriculo" (download).
    const downloadBtn = page.locator('#profileModal button:has-text("Baixar currículo")');
    if (await downloadBtn.count()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadBtn.click()
      ]);
      // Confirma que o download foi iniciado.
      const suggested = download.suggestedFilename();
      expect(suggested).toMatch(/\.pdf$/i);
    }
  });
});
