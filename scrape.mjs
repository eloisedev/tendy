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

  const msEvents = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card-body'));
    const parsed = [];

    for (const card of cards) {
 
      const title =
        card.querySelector('.event-title, h5, h6, .card-title, .flex-grow-1 text-truncate mb-0 mr-2')?.innerText?.trim() || '';
      const time =
        card.querySelector(".d-flex.w-100.justify-content-between > div")?.innerText?.trim() || '';
      const price =
        card.querySelector('.text-muted, .ng-tns-c8-2')?.innerText?.trim() || '';
      const location = 
        "Medstar Capitals Iceplex";

      if (title && !/Oct|Nov|Dec|Jan/i.test(title)) {
        parsed.push({
          title,
          time,
          price,
          location,
          link: window.location.href,
        });
      }
    }

    return parsed;
  });

  console.log(`found ${msEvents.length} event(s) for medstar`);
  console.log(msEvents);

  url = "https://www.frontline-connect.com/monthlysched.cfm?fac=pwice&facid=1&session=3&month=11"
  await page.goto(url, { waitUntil: 'networkidle' });
  /*
  var tableData = await page.getByTitle('Nov 07 2025').all();
  for(var session of tableData) {
      var sessionData = await session.locator(".sessdiv");
      var sessionTimes = await sessionData.innerText();
      
  } */
  const pwEvents = await page.evaluate(() => {
    const parsed = [];
    
    var tableData = await page.getByTitle('Nov 10 2025').all();
    for (var session of tableData) {
 
      const title = 
        "Stick and shoot";
      var sessionData = 
        await session.locator(".sessdiv");
      const time = 
        await sessionData.innerText();
      const price = 
        "$17.00"
      const location = 
        "Medstar Capitals Iceplex";
      
      parsed.push({
        title,
        time,
        price,
        location,
        link: window.location.href,
        });
    }
    return parsed;
  });
  
  console.log(`found ${pwEvents.length} event(s) for medstar`);
  console.log(pwEvents);
  
  fs.writeFileSync('ice_times.json', JSON.stringify(msEvents, pwEvents, null, 2));
  console.log('saved to ice_times.json');

  const html = await page.content();
  fs.writeFileSync('debug.html', html);

  await browser.close();
})();
