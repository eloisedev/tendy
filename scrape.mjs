import fs from "fs";
import puppeteer from "puppeteer";

const rinks = [
//medstar
  {
    name: "MedStar Capitals Iceplex",
    url: (date) =>
      `https://apps.daysmartrecreation.com/dash/x/#/online/capitals/event-registration?date=${date}&sport_ids=31`,
    scrape: async (page) => {
      await page.waitForSelector(".ds-calendar-day", { timeout: 60000 });

      return await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll(".ds-calendar-day"));
        return items
          .map((el) => {
            const timeText = el.querySelector(".d-flex.w-100.justify-content-between")?.innerText;
            if (!timeText) return null;
            return {
              title: "Stick and Puck",
              time: timeText.trim(),
              location: "MedStar Capitals Iceplex",
              link: window.location.href,
            };
          })
          .filter(Boolean);
      });
    },
  },
//prince william
  {
    name: "Prince William Ice Center",
    url: (date) => {
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `https://pwice.frontline-connect.com/monthlysched.cfm?fac=pwice&facid=1&month=${month}&year=${year}&session=3`;
    },
    scrape: async (page, date) => {
      await page.waitForSelector("table.table", { timeout: 60000 });

      return await page.evaluate((targetDate) => {
        const dateString = new Date(targetDate)
          .toDateString()
          .replace(/^... /, "");

        const allDays = Array.from(document.querySelectorAll("td[id^='4']"));
        const dayCell = allDays.find((td) => {
          const span = td.querySelector(`span[id^='spandt']`);
          return span && span.textContent.trim() === dateString;
        });

        if (!dayCell) return [];

        const rink = dayCell.querySelector(".surfdiv strong")?.innerText.trim() || "N/A";
        const sessions = Array.from(dayCell.querySelectorAll(".popoverdata .sessdiv"));
        const printLink = dayCell.querySelector(".printdiv a")?.href || window.location.href;

        const stickSessions = sessions.filter((s) => /stick/i.test(s.innerText));

        return stickSessions.map((s) => ({
          title: "Stick-n-Shoot",
          time: s.innerText.replace(/\s+/g, " ").trim(),
          location: `Prince William Ice Center - ${rink}`,
          link: printLink,
        }));
      }, date);
    },
  },
];

async function runScraper(date) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const results = [];

  for (const rink of rinks) {
    console.log(`Scraping ${rink.name} for ${date}...`);
    const url = rink.url(date);

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      const rinkResults = await rink.scrape(page, date);
      results.push(...rinkResults);
      console.log(`found ${rinkResults.length} events at ${rink.name}`);
    } catch (err) {
      console.error(`error scraping ${rink.name}:`, err.message);
    }
  }

  await browser.close();

  // Write results (overwrite)
  fs.writeFileSync("ice_times.json", JSON.stringify(results, null, 2));
  console.log("ice_times.json updated successfully");
}

const dateArg = process.argv[2] || new Date().toISOString().split("T")[0];
runScraper(dateArg);
