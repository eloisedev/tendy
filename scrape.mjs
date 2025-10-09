import { chromium } from 'playwright';
import fs from 'fs';
import { DateTime } from 'luxon';

async function scrapeIceTimes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Allow passing a date argument, defaults to today in Eastern Time
  const inputDateArg = process.argv[2];
  const easternNow = DateTime.now().setZone('America/New_York');
  const targetDate = inputDateArg
    ? DateTime.fromISO(inputDateArg, { zone: 'America/New_York' })
    : easternNow;

  const date = targetDate.toFormat('yyyy-MM-dd');
  const url = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${date}&&sport_ids=31`;

  console.log(`🧊 Scraping ice times for ${date}`);
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });

  // Wait for event cards to load (DaySmart loads dynamically)
  await page.waitForFunction(
    () => document.querySelectorAll('.card-body h6').length > 0,
    { timeout: 20000 }
  );

  const results = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card-body');
    const data = [];

    cards.forEach((card) => {
      const name = card.querySelector('h6')?.innerText?.trim() || null;

      // Grab the first time range (like “6:40 PM – 7:50 PM”)
      const timeBlock = card.querySelector('.d-flex.w-100.justify-content-between.mb-1 div');
      const time = timeBlock ? timeBlock.innerText.trim() : null;

      // Find the first text that includes a dollar sign
      const price =
        Array.from(card.querySelectorAll('.d-flex.w-100.justify-content-between.mb-1 div'))
          .map((el) => el.innerText.trim())
          .find((text) => text.includes('$')) || null;

      // Extract the signup link
      const signupButton = card.querySelector('a[href*="registration"], button');
      const signupLink = signupButton
        ? signupButton.getAttribute('href') ||
          signupButton.getAttribute('onclick')?.match(/'(.*?)'/)?.[1] ||
          null
        : null;

      if (name && time && signupLink) {
        data.push({ name, time, price, signupLink });
      }
    });

    return data;
  });

  console.log(`found ${results.length} ice time(s)`);
  console.log(results);

  fs.writeFileSync('ice_times.json', JSON.stringify(results, null, 2));
  await browser.close();

  console.log('saved to ice_times.json');
}

scrapeIceTimes().catch((err) => {
  console.error('error during scrape:', err);
  process.exit(1);
});

