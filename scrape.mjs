import { chromium } from 'playwright';
import fs from 'fs';

const now = new Date();
const easternNow = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
  .format(now)
  .replace(/\//g, '-');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${easternNow}&&sport_ids=31`;
  console.log(`scraping events for ${easternNow}`);
  console.log(`url: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle' });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  try {
    await page.waitForFunction(
      () => document.querySelectorAll('h6').length > 0,
      { timeout: 60000 }
    );
  } catch {
    console.error('no events found - timeout (60s).');
    await browser.close();
    process.exit(0);
  }

  const events = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card-body'));
    const parsed = [];

    for (const card of cards) {
      const title =
        card.querySelector('.event-title, h5, h6, .card-title')?.innerText?.trim() || '';
      const time =
        card.querySelector('.event-time, .time, .text-muted')?.innerText?.trim() || '';
      const price =
        card.querySelector('.event-price, .price, strong')?.innerText?.trim() || '';

        parsed.push({
          title,
          time,
          price,
          link: window.location.href,
        });
    }

    return parsed;
  });

  console.log(`found ${events.length} event(s)`);
  console.log(events);

  fs.writeFileSync('ice_times.json', JSON.stringify(events, null, 2));
  console.log('saved to ice_times.json');

  const html = await page.content();
  fs.writeFileSync('debug.html', html);

  await browser.close();
})();
