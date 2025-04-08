// Detect if running in AWS Lambda environment
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Use playwright-aws-lambda in Lambda, otherwise use standard playwright
const playwright = isLambda
  ? require('playwright-aws-lambda')
  : require('playwright');

const { chromium } = playwright; // Destructure chromium after selecting the correct package

const { polymarketUrl } = require('../config/settings');

/**
 * Launches a headless browser, navigates to the Polymarket page, and takes a full-page screenshot.
 * @returns {Promise<Buffer>} A promise that resolves with the screenshot image buffer.
 */
async function getScreenshot() {
  let browser = null;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(polymarketUrl, {
      waitUntil: 'load', 
      timeout: 60000 // 60 seconds
    });
    // Optional: Add a small delay or wait for a specific element if 'load' isn't sufficient
    console.log('Waiting for 3 seconds after page load for rendering...');
    await page.waitForTimeout(3000); // Wait 3 seconds
    const screenshot = await page.screenshot({ fullPage: true });
    return screenshot;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    throw error; // Re-throw the error for the handler to catch
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { getScreenshot }; 