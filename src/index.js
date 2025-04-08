require('dotenv').config(); // Ensure environment variables are loaded

const { getScreenshot } = require('./services/screenshotService');
const { performOcr, analyzeExtractedText } = require('./services/openaiService');
const { sendToTelegram } = require('./services/telegramService');

// Define emojis (or import from a shared constants file)
const EMOJI = {
  START: '🚀',
  SCREENSHOT: '📸',
  OCR: '📄', // New emoji for OCR
  ANALYSIS: '🧠',
  TELEGRAM: '✉️',
  SUCCESS: '✅',
  ERROR: '❌',
};

/**
 * AWS Lambda handler function.
 * Orchestrates the process of getting a screenshot, performing OCR, analyzing text, and sending results to Telegram.
 */
exports.handler = async (event, context) => {
  console.log(`\n${EMOJI.START} Lambda Handler Invoked`);

  try {
    // Step 1: Get Screenshot
    console.log(`${EMOJI.SCREENSHOT} Fetching screenshot...`);
    const screenshot = await getScreenshot();
    console.log(`${EMOJI.SCREENSHOT} Screenshot captured successfully.`);

    // Step 2: Perform OCR
    console.log(`${EMOJI.OCR} Performing OCR...`);
    const extractedText = await performOcr(screenshot);
    console.log(`${EMOJI.OCR} OCR completed.`);

    // Step 3: Analyze Extracted Text
    console.log(`${EMOJI.ANALYSIS} Analyzing extracted text with OpenAI...`);
    const analyzedData = await analyzeExtractedText(extractedText);
    console.log(`${EMOJI.ANALYSIS} Text analysis completed successfully.`);

    // Step 3.5: Generate Current Timestamp
    const now = new Date();
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Denver',
      timeZoneName: 'short'
    };
    analyzedData.timestamp = now.toLocaleString('en-US', options);
    console.log(`${EMOJI.ANALYSIS} Generated timestamp: ${analyzedData.timestamp}`);

    // Step 4: Send to Telegram
    console.log(`${EMOJI.TELEGRAM} Sending data to Telegram...`);
    await sendToTelegram(analyzedData);
    // Note: telegramService already logs success/failure

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Process completed successfully', data: analyzedData }),
    };
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error during execution:`, error.message);
    // Add more context to the error if possible
    const errorBody = { message: 'Process failed', error: error.message };
    if (error.stack) {
      // Log stack trace for debugging in CloudWatch
      console.error(error.stack);
    }
    return {
      statusCode: 500,
      body: JSON.stringify(errorBody),
    };
  }
};
