import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeIceTimes() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Set the target date (can make dynamic later)
  const date = '2025-07-07';
  const url = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${date}&&sport_ids=31`;

  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait and scroll to trigger loading
  await new Promise(resolve => setTimeout(resolve, 10000));
  await page.evaluate(() => window.scrollBy(0, 1000));

  // Extract events
  const events = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card.w-100.mx-0.mb-3.px-0.shadow-sm'));

    return cards.map(card => {
      const nameEl = card.querySelector('h6.text-truncate');
      const timeEl = card.querySelector('.d-flex.w-100.justify-content-between > div');
      const locationEl = card.querySelector('.fa-map-marker-alt')?.parentElement;
      const signupButton = card.querySelector('button');

      return {
        name: nameEl?.innerText.trim() || null,
        time: timeEl?.innerText.trim() || null,
        location: locationEl?.innerText.trim() || null,
        signupLink: signupButton?.closest('a')?.href || null
      };
    });
  });

  // Add the date to each event
  const datedEvents = events.map(event => ({
    ...event,
    date: '2025-07-07'
  }));

  // Save to file
  fs.writeFileSync('ice_times.json', JSON.stringify(datedEvents, null, 2));
  console.log('✅ Events scraped:', datedEvents.length);

  await browser.close();
}

scrapeIceTimes();
