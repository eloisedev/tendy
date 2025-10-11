import { chromium } from 'playwright';
import fs from 'fs';

const now = new Date();
const easternNow = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now).replaceAll('/', '-');

const url = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${easternNow}&&sport_ids=31`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(`scraping medstar capitals iceplex for ${easternNow}`);
  console.log(`URL: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle' });

  await page.waitForSelector('.ds-calendar-day', { timeout: 60000 });

  const easternDay = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', day: '2-digit' });
  await page.evaluate(day => {
    const dayCell = Array.from(document.querySelectorAll('.ds-calendar-day'))
      .find(el => el.innerText.trim() === day);
    dayCell?.click();
  }, easternDay);

  await page.waitForTimeout(2000);

  try {
    await page.waitForSelector('.card-body', { timeout: 60000 });
  } catch {
    console.error('no events found - timeout 60s.');
    await browser.close();
    process.exit(0);
  }

  const events = await page.evaluate((pageUrl) => {
    const cards = document.querySelectorAll('.card-body');
    return Array.from(cards)
      .map(card => {
        const title = card.querySelector('h6')?.innerText.trim() || '';
        const time = card.querySelector('.ng-star-inserted')?.innerText.trim() || '';
        const price = card.querySelector('.btn-primary')?.innerText.includes('Add to cart') 
          ? '$20.00' : '';
        return { title, time, price, link: pageUrl };
      })
      .filter(e => e.title && e.time);
  }, url);

  console.log(`found ${events.length} event(s)`);
  console.log(events);

  fs.writeFileSync(`ice_times.json`, JSON.stringify(events, null, 2));

  await browser.close();
})();
