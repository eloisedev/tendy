import { chromium } from 'playwright';
import fs from 'fs';

const date = process.argv[2] || '2025-10-11';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://example.com'); // Replace with your target URL
  await page.waitForLoadState('domcontentloaded');

  // Adjust selector to whatever you need
  const cards = await page.$$eval('.card-body', nodes =>
    nodes.map(node => ({
      title: node.querySelector('h2')?.innerText || '',
      description: node.querySelector('p')?.innerText || ''
    }))
  );

  fs.writeFileSync(`data-${date}.json`, JSON.stringify(cards, null, 2));

  console.log(`Scraped ${cards.length} items.`);
  await browser.close();
})();
