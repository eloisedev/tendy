import { chromium } from 'playwright';
import fs from 'fs/promises';

const easternDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})
  .format(new Date())
  .replace(/\//g, '-');

const url = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${easternDate}&&sport_ids=31`;

console.log(`scraping medstar capitals iceplex from ${easternDate}`);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  await page.waitForSelector('.card-body', { timeout: 60000 }).catch(() => null);

  const events = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card-body');
    return Array.from(cards).map(card => ({
      title:
        card.querySelector('h6.flex-grow-1.text-truncate.mb-0.mr-2')?.innerText.trim() ||
        card.querySelector('h6')?.innerText.trim() ||
        '',
      time:
        card.querySelector('.d-flex.w-100.justify-content-between div')?.innerText.trim() ||
        '',
      price:
        card.querySelector('dash-product-price')?.innerText.trim() ||
        ''
    }));
  });

  const results = events
    .filter(e => e.title || e.time || e.price)
    .map(e => ({ ...e, link: url }));

  console.log(`found ${results.length} event(s)`);
  console.log(results);

  await fs.writeFile(`events-${easternDate}.json`, JSON.stringify(results, null, 2));
  await browser.close();
})();
