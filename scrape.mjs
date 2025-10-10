import { chromium } from 'playwright';
import fs from 'fs';

const date = process.argv[2] || '2025-10-11';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://example.com', { waitUntil: 'networkidle' });
  console.log('Page loaded');

  try {
    await page.waitForSelector('.card-body', { timeout: 10000 });
  } catch {
    console.error('No .card-body found on the page!');
    await browser.close();
    return;
  }

  const cards = await page.$$eval('.card-body', nodes =>
    nodes.map(node => ({
      title: node.querySelector('h2')?.innerText || 'NO TITLE',
      description: node.querySelector('p')?.innerText || 'NO DESCRIPTION'
    }))
  );

  fs.writeFileSync(`data-${date}.json`, JSON.stringify(cards, null, 2));
  console.log(`Scraped ${cards.length} items:`, cards);

  await browser.close();
})();
