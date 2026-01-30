import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const utilsPath = path.resolve(
  __dirname,
  '../../../wwwroot/js/views/portal-vagas/features/utils.js'
);

let utilsPromise;
async function loadUtils() {
  if (!global.window) {
    global.window = globalThis;
  }
  if (!utilsPromise) {
    utilsPromise = import(pathToFileURL(utilsPath).href).then(() => global.window.PortalVagasUtils);
  }
  return utilsPromise;
}

describe('PortalVagasUtils', () => {
  beforeAll(async () => {
    await loadUtils();
  });

  it('digitsOnly removes non-digits', async () => {
    const utils = await loadUtils();
    expect(utils.digitsOnly('11.222-333')).toBe('11222333');
  });

  it('formatPhone formats Brazilian numbers', async () => {
    const utils = await loadUtils();
    expect(utils.formatPhone('11987654321')).toBe('(11) 98765-4321');
    expect(utils.formatPhone('1132654321')).toBe('(11) 32654-321');
  });

  it('formatMoneyBR formats values', async () => {
    const utils = await loadUtils();
    expect(utils.formatMoneyBR('123456')).toBe('1.234,56');
  });

  it('parseMoneyBR parses values', async () => {
    const utils = await loadUtils();
    expect(utils.parseMoneyBR('1.234,56')).toBe(1234.56);
  });

  it('toNumber handles empty and invalid values', async () => {
    const utils = await loadUtils();
    expect(utils.toNumber('')).toBeNull();
    expect(utils.toNumber('abc')).toBeNull();
    expect(utils.toNumber('42')).toBe(42);
  });
});
