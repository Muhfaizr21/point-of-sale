import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login first
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="text"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  const dashboardText = await page.content();
  if (dashboardText.includes("Halaman sedang dalam tahap pengembangan")) {
    console.log("Dashboard shows construction page!");
  } else {
    console.log("Dashboard is OK.");
  }

  await page.goto('http://localhost:5174/pengaturan');
  await page.waitForTimeout(2000);
  const pengaturanText = await page.content();
  if (pengaturanText.includes("Halaman sedang dalam tahap pengembangan")) {
    console.log("Pengaturan shows construction page!");
  } else {
    console.log("Pengaturan is OK.");
  }
  
  await browser.close();
})();
