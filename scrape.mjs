import { chromium } from 'playwright';
import fs from 'fs';

const now = new Date();
const daysmartDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
  .format(now)
  .replace(/\//g, '-');

// format pw date correctly
function pwDateFormat(date) {
  const options = { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'America/New_York' };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value.padStart(2, '0');
  const year = parts.find(p => p.type === 'year')?.value;
  return `${month} ${day} ${year}`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  //medstar
  const msUrl = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${daysmartDateFormat}&&sport_ids=31`;
  console.log(`scraping MedStar for ${daysmartDateFormat}`);
  console.log(`url: ${msUrl}`);

  await page.goto(msUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  try {
    await page.waitForFunction(() => document.querySelectorAll('h6').length > 0, { timeout: 60000 });
  } catch {
    console.error('no MedStar events found - timeout (60s).');
  }

  const msEvents = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card-body'));
    const parsed = [];

    for (const card of cards) {
      let title = card.querySelector('h5, h6, .card-title')?.innerText?.trim() || '';
      if (title.includes('-')) title = title.split('-')[0].trim();
      let time = card.querySelector('.d-flex.w-100.justify-content-between > div')?.innerText?.trim() || '';
      if (time.includes('-')) time = time.split('-')[0].trim();

      const price = "$20.00";
      const location = 'MedStar Capitals Iceplex';

      if (title && !/Oct|Nov|Dec|Jan/i.test(title)) {
        parsed.push({ title, time, price, location, link: window.location.href });
      }
    }
    return parsed;
  });

  console.log(`found ${msEvents.length} MedStar event(s)`);

  //prince william
  const pwUrl = 'https://www.frontline-connect.com/monthlysched.cfm?fac=pwice&facid=1&session=3';
  console.log(`scraping Prince William for ${daysmartDateFormat}`);
  console.log(`url: ${pwUrl}`);
  await page.goto(pwUrl, { waitUntil: 'networkidle' });

  const today = pwDateFormat(now);

  const pwEvents = await page.evaluate((today) => {
    const parsed = [];
    const dayCell = document.querySelector(`td[title="${today}"]`);
    if (!dayCell) return parsed;

    const sessions = Array.from(dayCell.querySelectorAll('.sessdiv'));
    for (const s of sessions) {
      let text = s.innerText.trim();

      if (/stick/i.test(text)) {
        if (text.includes('-')) text = text.split('-')[0].trim();

        parsed.push({
          title: 'Stick and Shoot',
          time: text,
          price: '$17.00',
          location: 'Prince William Ice Center',
          link: window.location.href,
        });
      }
    }
    return parsed;
  }, today);

  console.log(`found ${pwEvents.length} Prince William event(s)`);

  //ashburn
  const abUrl = `https://apps.daysmartrecreation.com/dash/x/#/online/ashburn/event-registration?date=${daysmartDateFormat}&&sport_ids=30`;
  console.log(`scraping Ashburn for ${daysmartDateFormat}`);
  console.log(`url: ${abUrl}`);

  await page.goto(abUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  try {
    await page.waitForFunction(() => document.querySelectorAll('h6').length > 0, { timeout: 60000 });
  } catch {
    console.error('no Ashburn events found - timeout (60s).');
  }

  const abEvents = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card-body'));
    const parsed = [];

    for (const card of cards) {
      let title = card.querySelector('h5, h6, .card-title')?.innerText?.trim() || '';
      if (title.includes('-')) title = title.split('-')[0].trim();
      let time = card.querySelector('.d-flex.w-100.justify-content-between > div')?.innerText?.trim() || '';
      if (time.includes('-')) time = time.split('-')[0].trim();

      const price = "$20.00";
      const location = 'Ashburn Ice House';

      if (title && !/Oct|Nov|Dec|Jan/i.test(title)) {
        parsed.push({ title, time, price, location, link: window.location.href });
      }
    }
    return parsed;
  });

  console.log(`found ${abEvents.length} Ashburn event(s)`);

  //save results
  let existing = [];
  if (fs.existsSync('ice_times.json')) {
    try {
      existing = JSON.parse(fs.readFileSync('ice_times.json', 'utf8'));
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
  }

  const allEvents = [...existing, ...msEvents, ...pwEvents, ...abEvents];
  fs.writeFileSync('ice_times.json', JSON.stringify(allEvents, null, 2));
  console.log('saved to ice_times.json');

  const html = await page.content();
  fs.writeFileSync('debug.html', html);

  await browser.close();
})();
