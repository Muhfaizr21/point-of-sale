const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  
  const content = await page.content();
  if (content.includes("tahap pengembangan")) {
    console.log("BUG FOUND: Dashboard shows construction page");
  } else {
    console.log("Dashboard works fine!");
  }
  
  await browser.close();
  process.exit(0);
})();
