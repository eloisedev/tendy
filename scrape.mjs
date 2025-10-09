const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  
  await page.goto('https://www.ministickandshoot.com/programs-events', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await page.waitForFunction(
    () => document.querySelectorAll('.card-body h6').length > 0,
    { timeout: 60000 }
  );

  const events = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card-body'));
    return cards.map(card => {
      const title = card.querySelector('h6')?.innerText.trim() || '';
      const date = card.querySelector('.event-date')?.innerText.trim() || '';
      const time = card.querySelector('.event-time')?.innerText.trim() || '';
      const link = card.querySelector('a')?.href || '';
      return { title, date, time, link };
    });
  });

  console.log('Found events:', events);

  fs.writeFileSync('events.json', JSON.stringify(events, null, 2));

  const html = await page.content();
  fs.writeFileSync('debug.html', html);

  await browser.close();
})();

