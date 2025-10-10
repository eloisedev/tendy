import { chromium } from 'playwright';
import fs from 'fs';

const now = new Date();
const easternNow = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now).replaceAll('/', '-');

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
    console.error('no events found timeout 60s.');
    await browser.close();
    process.exit(0);
  }

  const events = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card');
    return Array.from(cards).map(card => {
      const title = card.querySelector('h6')?.innerText.trim() || '';
      const dateTime = card.querySelector('.text-muted')?.innerText.trim() || '';
      const button = card.querySelector('button, a');
      const link =
        button?.getAttribute('onclick') ||
        button?.getAttribute('href') ||
        '';

      return { title, dateTime, link };
    });
  });

  console.log(`found ${events.length} event(s)`);
  console.log(events);

  fs.writeFileSync(`events-${easternNow}.json`, JSON.stringify(events, null, 2));

  const html = await page.content();
  fs.writeFileSync('debug.html', html);

  await browser.close();
})();
