require('dotenv').config(); // Ensure environment variables are loaded

const { getScreenshot } = require('./services/screenshotService');
const { analyzeScreenshot } = require('./services/openaiService');
const { sendToTelegram } = require('./services/telegramService');

// Define emojis (or import from a shared constants file)
const EMOJI = {
  START: '🚀',
  SCREENSHOT: '📸',
  ANALYSIS: '🧠',
  TELEGRAM: '✉️',
  SUCCESS: '✅',
  ERROR: '❌',
};

/**
 * AWS Lambda handler function.
 * Orchestrates the process of getting a screenshot, analyzing it, and sending the results to Telegram.
 */
exports.handler = async (event, context) => {
  console.log(`\n${EMOJI.START} Lambda Handler Invoked`);

  try {
    // Step 1: Get Screenshot
    console.log(`${EMOJI.SCREENSHOT} Fetching screenshot...`);
    const screenshot = await getScreenshot();
    console.log(`${EMOJI.SCREENSHOT} Screenshot captured successfully.`);

    // Step 2: Analyze Screenshot
    console.log(`${EMOJI.ANALYSIS} Analyzing screenshot with OpenAI...`);
    const analyzedData = await analyzeScreenshot(screenshot);
    // Log the raw data for debugging if needed, but avoid in production for brevity/cost
    // console.log("Raw OpenAI Data:", analyzedData); 
    console.log(`${EMOJI.ANALYSIS} Screenshot analyzed successfully.`); 

    // Step 3: Send to Telegram (Data parsing is handled within analyzeScreenshot)
    console.log(`${EMOJI.TELEGRAM} Sending data to Telegram...`);
    await sendToTelegram(analyzedData);
    // Note: telegramService already logs success/failure

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Process completed successfully', data: analyzedData }),
    };
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error during execution:`, error.message);
    // Consider sending an error notification to Telegram or another monitoring service
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Process failed', error: error.message }),
    };
  }
};
