import { chromium } from 'playwright';
import fs from 'fs';

console.log('starting scrape...');

function daysmartDate(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).replace(/\//g, '-');
}

async function scrapeDaysmartLocation(url, locationName, dateStr) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  try {
    await page.waitForSelector('.card-body', { timeout: 30000 });
  } catch {
    await browser.close();
    return [];
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const events = await page.evaluate(({ locationName, dateStr }) => {
    const parsed = [];
    const cards = Array.from(document.querySelectorAll('.card-body'));

    for (const card of cards) {
      const title = card.querySelector('h6.flex-grow-1.text-truncate')?.innerText?.trim();
      const time = card.querySelector('.d-flex.w-100.justify-content-between > div:first-child')?.innerText?.trim();
      const price = card.querySelector('dash-product-price')?.innerText?.trim() || "$20.00";

      if (title && time) {
        parsed.push({
          title,
          time,
          price,
          location: locationName,
          link: window.location.href,
          date: dateStr
        });
      }
    }

    return parsed;
  }, { locationName, dateStr });

  await browser.close();
  return events;
}

async function scrapePrinceWilliam(page, dateObj) {
  const url = 'https://www.frontline-connect.com/monthlysched.cfm?fac=pwice&facid=1&session=3';
  const dateStr = daysmartDate(dateObj);
  await page.goto(url, { waitUntil: 'networkidle' });

  return await page.evaluate((dateStr) => {
    const parsed = [];
    const dayCells = Array.from(document.querySelectorAll('td'));

    for (const cell of dayCells) {
      const span = cell.querySelector('span[style*="display:none"]');
      if (!span) continue;

      const cellDate = new Date(span.innerText.trim());
      const cellDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(cellDate).replace(/\//g, '-');

      if (cellDateStr !== dateStr) continue;

      const sessions = Array.from(cell.querySelectorAll('.sessdiv'));
      for (const s of sessions) {
        const time = s.innerText.trim().split('\n')[0];
        parsed.push({
          title: 'Stick and shoot',
          time,
          price: '$20.00',
          location: 'Prince William Ice Center',
          link: window.location.href,
          date: dateStr
        });
      }
    }
    return parsed;
  }, dateStr);
}
(async () => {
  let results = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (let i = 0; i < 8; i++) {
    const day = new Date();
    day.setDate(day.getDate() + i);
    const dateStr = daysmartDate(day);
    
    //medstar
    const msUrl = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${dateStr}&&sport_ids=31`;
    const msEvents = await scrapeDaysmartLocation(msUrl, "MedStar Capitals Iceplex", dateStr);
    results.push(...msEvents);

    //ashburn
    const abUrl = `https://apps.daysmartrecreation.com/dash/x/#/online/ashburn/event-registration?date=${dateStr}&&sport_ids=30`;
    const abEvents = await scrapeDaysmartLocation(abUrl, "Ashburn Ice House", dateStr);
    results.push(...abEvents);

    //prince william
    const pwEvents = await scrapePrinceWilliam(page, day);
    results.push(...pwEvents);

    //skatequest
    // const sqUrl = `https://apps.daysmartrecreation.com/dash/x/#/online/skatequest/calendar?start=${dateStr}&event_type=17&end=${dateStr}`;
    // const sqEvents = await scrapeDaysmartLocation(sqUrl, "Skatequest", dateStr);
    // results.push(...sqEvents);

    console.log(`scraped events for ${dateStr}`);
  }

  console.log('scrape complete, saving to ice_times.json');
  fs.writeFileSync('ice_times.json', JSON.stringify(results, null, 2));
  await browser.close();
})();
