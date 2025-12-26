const puppeteer = require('puppeteer');
const path = require('path');

async function captureScreenshot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1200,
    height: 800,
    deviceScaleFactor: 2 // Retina quality
  });

  const htmlPath = path.join(__dirname, 'stocks.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0'
  });

  // Wait for fonts to load
  await page.waitForFunction(() => document.fonts.ready);
  await new Promise(resolve => setTimeout(resolve, 500));

  const outputPath = path.join(__dirname, 'hot-stocks-comparison.png');
  await page.screenshot({
    path: outputPath,
    type: 'png'
  });

  await browser.close();
  console.log('Screenshot saved:', outputPath);
}

captureScreenshot().catch(console.error);
