import { chromium } from 'playwright';
import fs from 'fs';
import { DateTime } from 'luxon';

async function scrapeIceTimes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const inputDateArg = process.argv[2];
  const easternNow = DateTime.now().setZone('America/New_York');
  const targetDate = inputDateArg
    ? DateTime.fromISO(inputDateArg, { zone: 'America/New_York' })
    : easternNow;

  const date = targetDate.toFormat('yyyy-MM-dd');
  const url = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${date}&&sport_ids=31`;

  console.log(`scraping ice times for ${date}`);
  await page.goto(url, { waitUntil: 'load' });
const results = await page.evaluate(() => {
  const cards = document.querySelectorAll('.card-body');
  const data = [];

  cards.forEach((card) => {
    const name = card.querySelector('h6')?.innerText?.trim();
    const time = card.querySelector('.d-flex.w-100.justify-content-between.mb-1 div')?.innerText?.trim();
    const price = [...card.querySelectorAll('.d-flex.w-100.justify-content-between.mb-1 div')]
      .map(el => el.innerText.trim())
      .find(text => text.includes('$')) || null;

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

  await browser.close();
  fs.writeFileSync('ice_times.json', JSON.stringify(results, null, 2));
}

scrapeIceTimes();
