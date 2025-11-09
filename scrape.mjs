import { chromium } from 'playwright';
import fs from 'fs';

const now = new Date();
const msDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
  .format(now)
  .replace(/\//g, '-');

// format pw date to srape right thing 
function pwDateFormat(date) {
  const options = { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'America/New_York' };
  return new Intl.DateTimeFormat('en-US', options)
    .format(date)
    .replace(',', '')
    .replace(/(\d)( )(\d)/, '$1 0$3'); 
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // medstar scrape
  const msUrl = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${msDateFormat}&&sport_ids=31`;
  console.log(`scraping events for ${msDateFormat}`);
  console.log(`url: ${msUrl}`);

  await page.goto(msUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  try {
    await page.waitForFunction(() => document.querySelectorAll('h6').length > 0, { timeout: 60000 });
  } catch {
    console.error('no events found - timeout (60s).');
  }

  const msEvents = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card-body'));
    const parsed = [];

    for (const card of cards) {
      const title = card.querySelector('h5, h6, .card-title')?.innerText?.trim() || '';
      const time = card.querySelector('.d-flex.w-100.justify-content-between > div')?.innerText?.trim() || '';
      const price = card.querySelector('.text-muted')?.innerText?.trim() || '';
      const location = 'MedStar Capitals Iceplex';

      if (title) {
        parsed.push({ title, time, price, location, link: window.location.href });
      }
    }
    return parsed;
  });

  console.log(`found ${msEvents.length} event(s) for medstar`);

  // prince william scrape
  const pwUrl = 'https://www.frontline-connect.com/monthlysched.cfm?fac=pwice&facid=1&session=3';
  console.log(`scraping Prince William Ice Center: ${pwUrl}`);
  await page.goto(pwUrl, { waitUntil: 'networkidle' });

  const today = pwDateFormat(now); 
  console.log(`Looking for day cell: ${today}`);

  const pwEvents = await page.evaluate((today) => {
    const parsed = [];
    const dayCell = document.querySelector(`td[title="${today}"]`);
    if (!dayCell) return parsed;

    const sessions = Array.from(dayCell.querySelectorAll('.sessdiv'));
    for (const s of sessions) {
      const text = s.innerText.trim();
      if (/stick/i.test(text)) {
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

  console.log(`found ${pwEvents.length} event(s) for Prince William`);

  // save results
  let existing = [];
  if (fs.existsSync('ice_times.json')) {
    try {
      existing = JSON.parse(fs.readFileSync('ice_times.json', 'utf8'));
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
  }

  const allEvents = [...existing, ...msEvents, ...pwEvents];
  fs.writeFileSync('ice_times.json', JSON.stringify(allEvents, null, 2));
  console.log('saved to ice_times.json');

  const html = await page.content();
  fs.writeFileSync('debug.html', html);

  await browser.close();
})();
