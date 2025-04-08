const { handler } = require('./src/index');
const { getScreenshot } = require('./src/services/screenshotService');
const path = require('path');
const fs = require('fs');

const EMOJI = {
  START: '🚀',
  SCREENSHOT: '📸',
  ANALYSIS: '🧠',
  TELEGRAM: '✉️',
  SUCCESS: '✅',
  ERROR: '❌',
};

async function runTest() {
  try {
    console.log('🚀 Starting Local Test Run...');
    console.log('------------------------------------\n');

    // Save the screenshot for verification
    const screenshot = await getScreenshot();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(__dirname, `screenshot-${timestamp}.png`);
    fs.writeFileSync(screenshotPath, screenshot);
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    console.log('🔍 You can open this screenshot to verify the numbers match\n');

    const result = await handler({}, {});
    if (result.statusCode === 200) {
      console.log(`\n------------------------------------\n${EMOJI.SUCCESS} Local Test Completed Successfully!`);
      // Optionally log the final data from the result body
      // const data = JSON.parse(result.body);
      // console.log("Final Data:", data.data);
    } else {
      console.error(`\n------------------------------------\n${EMOJI.ERROR} Local Test Failed (Handler returned status ${result.statusCode})`);
    }
    console.log("Handler Result:", result);

  } catch (error) {
    console.error(`\n------------------------------------\n${EMOJI.ERROR} Local Test Failed (Unhandled Exception):`, error);
  }
}

// Enhance console logging within the handler itself (modify src/index.js)
// This part is conceptual, actual changes need to be made in src/index.js
/*
// Example modifications in src/index.js:
exports.handler = async (event, context) => {
  console.log(`${EMOJI.START} Lambda Handler Invoked`);
  try {
    console.log(`${EMOJI.SCREENSHOT} Fetching screenshot...`);
    const screenshot = await getScreenshot();
    console.log(`${EMOJI.SCREENSHOT} Screenshot captured successfully.`);

    console.log(`${EMOJI.ANALYSIS} Analyzing screenshot with OpenAI...`);
    const analyzedData = await analyzeScreenshot(screenshot);
    console.log(`${EMOJI.ANALYSIS} Screenshot analyzed successfully.`); // Remove data log here, handler result shows it

    console.log(`${EMOJI.TELEGRAM} Sending data to Telegram...`);
    await sendToTelegram(analyzedData);
    console.log(`${EMOJI.TELEGRAM} Data sent to Telegram successfully.`);

    return { statusCode: 200, ... };
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error during execution:`, error.message);
    return { statusCode: 500, ... };
  }
};
*/

// Run the test
runTest(); 