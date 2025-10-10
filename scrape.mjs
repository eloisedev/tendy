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
    console.error('no events found - timeout 60s.');
    await browser.close();
    process.exit(0);
  }

  const events = await page.evaluate(() => {
    const iceTimes = document.querySelectorAll('.card-body');
    return Array.from(iceTimes).map(iceTime => {
      const title = iceTime.querySelector('.flex-grow-1 text-truncate mb-0 mr-2')?.innerText.trim() || '';
      const time = iceTime.querySelector('.ng-tns-c8-2')?.innerText.trim() || '';
      const date = easternNow;
      const button = iceTime.querySelector('.btn btn-sm btn-block rounded-pill mt-2 mb-2 btn-primary');
      const link =
        button?.getAttribute('onclick') ||
        button?.getAttribute('href') ||
        '';

      return { title, time, date, link };
    });
  });

  console.log(`found ${events.length} event(s)`);
  console.log(events);

  fs.writeFileSync(`events-${easternNow}.json`, JSON.stringify(events, null, 2));

  const html = await page.content();
  fs.writeFileSync('debug.html', html);

  await browser.close();
})();
