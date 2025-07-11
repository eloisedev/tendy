import { chromium } from 'playwright';
import fs from 'fs';
import { DateTime } from 'luxon';

async function scrapeIceTimes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const easternNow = DateTime.now().setZone('America/New_York');
  const date = easternNow.toFormat('yyyy-MM-dd'); // e.g. "2025-07-08"
  const url = `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${date}&&sport_ids=31`;

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(6000); // Let Angular finish loading

  const results = await page.evaluate(() => {
    const cards = document.querySelectorAll('.card-body');
    const data = [];

    cards.forEach((card) => {
      const name = card.querySelector('h6')?.innerText.trim();
      const time = card.querySelector('.d-flex.w-100.justify-content-between div')?.innerText.trim();
      const location = card.querySelector('.fa-map-marker-alt')?.parentElement?.innerText.trim();
      const signupButton = card.querySelector('button');
      const signupLink = signupButton ? signupButton.getAttribute('onclick') || signupButton.getAttribute('href') || null : null;

      if (name && time && location) {
        data.push({ name, time, location, signupLink });
      }
    });

    return data;
  });

  await browser.close();
  fs.writeFileSync('ice_times.json', JSON.stringify(results, null, 2));
}

scrapeIceTimes();

