import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const baseUrl = process.env.APP_URL ?? 'http://127.0.0.1:4200';
const executablePath =
  process.env.BRAVE_PATH ?? '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
const screenshotDir = fileURLToPath(new URL('../screenshots/', import.meta.url));

await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
});

const errors = [];

async function createPage(viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() => localStorage.clear());
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return { context, page };
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  if (dimensions.content > dimensions.viewport + 1) {
    throw new Error(
      `${label} overflows horizontally (${dimensions.content}px content in ${dimensions.viewport}px viewport).`,
    );
  }
}

try {
  const desktop = await createPage({ width: 1440, height: 1050 });
  const { page } = desktop;

  await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
  await page.getByText('Showing 1–8 of 24 members').waitFor();
  await page.locator('.members-table tbody tr:not(.skeleton-row)').first().waitFor();
  await assertNoHorizontalOverflow(page, 'Desktop member page');
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.screenshot({
    path: join(screenshotDir, 'user-management-desktop.png'),
    fullPage: false,
  });

  const search = page.getByRole('searchbox', { name: 'Search members' });
  await search.fill('Maya Chen');
  await page.getByText('Showing 1–1 of 1 members').waitFor();
  if ((await page.locator('.members-table tbody tr').count()) !== 1) {
    throw new Error('Member search did not return the expected row.');
  }
  await page.getByRole('button', { name: 'Reset' }).click();

  await page.getByRole('button', { name: 'View details' }).first().click();
  await page.getByRole('heading', { name: 'Contact information' }).waitFor();
  await page.getByRole('button', { name: 'Close details' }).click();

  await page.getByRole('button', { name: 'Invite member' }).click();
  await page.getByRole('heading', { name: 'Invite a new member' }).waitFor();
  await page.screenshot({
    path: join(screenshotDir, 'invite-member-form.png'),
    fullPage: false,
  });
  await page.getByRole('button', { name: 'Close dialog' }).click();

  await page.getByRole('link', { name: 'Roles & permissions' }).click();
  await page.getByRole('heading', { name: 'Permissions' }).waitFor();
  await page.locator('.permission-row').first().waitFor();
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.waitForTimeout(250);
  await page.screenshot({
    path: join(screenshotDir, 'roles-permissions-desktop.png'),
    fullPage: false,
    animations: 'disabled',
  });

  const permission = page.locator('.permission-row input[type="checkbox"]').first();
  await permission.click();
  await page.getByText('Unsaved', { exact: true }).waitFor();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('link', { name: 'Members' }).click();
  if (!page.url().endsWith('/roles')) {
    throw new Error('Unsaved role changes did not block route navigation.');
  }

  await desktop.context.close();

  const mobile = await createPage({ width: 390, height: 844 });
  await mobile.page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
  await mobile.page.getByText('Showing 1–8 of 24 members').waitFor();
  await mobile.page.locator('.mobile-member-card').first().waitFor();
  await assertNoHorizontalOverflow(mobile.page, 'Mobile member page');
  await mobile.page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await mobile.page.screenshot({
    path: join(screenshotDir, 'user-management-mobile.png'),
    fullPage: true,
  });
  await mobile.page.getByRole('button', { name: 'Open navigation' }).click();
  await mobile.page.getByRole('link', { name: 'Roles & permissions' }).click();
  await mobile.page.getByRole('heading', { name: 'Permissions' }).waitFor();
  await mobile.page.locator('.permission-row').first().waitFor();
  await assertNoHorizontalOverflow(mobile.page, 'Mobile roles page');
  await mobile.page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await mobile.page.waitForTimeout(250);
  await mobile.page.screenshot({
    path: join(screenshotDir, 'roles-permissions-mobile.png'),
    fullPage: false,
    animations: 'disabled',
  });
  await mobile.context.close();

  if (errors.length > 0) {
    throw new Error(`Browser console errors:\n${errors.join('\n')}`);
  }

  console.log('Screenshots captured and core user/role workflows verified.');
} finally {
  await browser.close();
}
