const { getScreenshot } = require('./src/services/screenshotService');
const { performOcr, analyzeExtractedText } = require('./src/services/openaiService');
const { sendToTelegram } = require('./src/services/telegramService');
const path = require('path');
const fs = require('fs');

const EMOJI = {
  START: '🚀',
  SCREENSHOT: '📸',
  OCR: '📄',
  TELEGRAM: '✉️',
  SUCCESS: '✅',
  ERROR: '❌',
};

// --- Copied from test-comparison.js ---
// Helper function to format volume for display (e.g., $11,501,006 -> $11.5M)
function formatVolumeForDisplay(rawVolume) {
  if (!rawVolume || typeof rawVolume !== 'string') return rawVolume; // Return original if invalid

  // Remove '$', ' Vol', commas, and any other non-numeric chars except '.'
  const numericString = rawVolume.replace(/[^\d.]/g, '');
  const number = parseFloat(numericString);

  if (isNaN(number)) return rawVolume; // Return original if parsing failed

  if (number >= 1000000) {
    return `$${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `$${(number / 1000).toFixed(1)}K`;
  } else {
    return `$${number}`; // Return number as is if less than 1000
  }
}

async function analyzeWithOcr(screenshot) {
  // Save the screenshot for inspection
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(__dirname, `screenshot-${timestamp}.png`);
  fs.writeFileSync(screenshotPath, screenshot);
  console.log(`\n Saved screenshot to: ${screenshotPath}`);

  const extractedText = await performOcr(screenshot);
  const analyzedDataOcr = await analyzeExtractedText(extractedText);

  return analyzedDataOcr;
}
// --- End Copied Section ---

async function runTest() {
  try {
    console.log(`${EMOJI.START} Starting Local OCR Test Run...`);
    console.log('------------------------------------\n');

    // Get screenshot
    console.log(`${EMOJI.SCREENSHOT} Fetching screenshot...`);
    const screenshot = await getScreenshot();
    console.log(`${EMOJI.SCREENSHOT} Screenshot captured successfully.\n`);

    // Test OCR Approach (using copied analyzeWithOcr)
    console.log(`${EMOJI.OCR} Testing OCR Approach...`);
    const ocrStart = Date.now();
    const analyzedDataOcr = await analyzeWithOcr(screenshot);
    const ocrEnd = Date.now();
    console.log(`${EMOJI.OCR} OCR Analysis completed in ${ocrEnd - ocrStart}ms`);
    console.log('OCR Results:', analyzedDataOcr);

    console.log('\nSummary:');
    console.log('------------------------------------');
    console.log(`OCR Time: ${ocrEnd - ocrStart}ms`);
    console.log('------------------------------------');

    // Add timestamp and send FORMATTED results to Telegram
    const now = new Date();
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Denver',
      timeZoneName: 'short'
    };

    // Ensure OCR data is complete
    if (!analyzedDataOcr || typeof analyzedDataOcr !== 'object' || analyzedDataOcr.odds === undefined || analyzedDataOcr.volume === undefined) { 
        throw new Error('Incomplete data from OCR analysis.');
    }
    analyzedDataOcr.timestamp = now.toLocaleString('en-US', options);

    // Format data specifically for Telegram
    const telegramData = { 
        ...analyzedDataOcr,
        volume: formatVolumeForDisplay(analyzedDataOcr.volume)
    };
    
    console.log(`\n${EMOJI.TELEGRAM} Sending formatted OCR results to Telegram...`);
    await sendToTelegram(telegramData); // Send FORMATTED data
    console.log(`${EMOJI.TELEGRAM} Message sent successfully.`);

    console.log(`\n------------------------------------\n${EMOJI.SUCCESS} Local OCR Test Completed Successfully!`);

    // Mimic handler result structure for consistency in logging
    const result = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Local OCR test completed successfully',
        ocr: analyzedDataOcr, // Return ORIGINAL OCR data
        timing: { ocr: ocrEnd - ocrStart }
      })
    };
    console.log('\nFinal Result (Mimicking Handler Output):', result);

  } catch (error) {
    console.error(`\n${EMOJI.ERROR} Error during local test execution:`, error.message);
    console.log(`\n------------------------------------\n${EMOJI.ERROR} Local OCR Test Failed!`);
    // Log an error result object similar to the success case
    const errorResult = {
      statusCode: 500,
      body: JSON.stringify({
        message: "Local OCR test failed",
        error: error.message
      })
    };
    console.log('\nFinal Result (Mimicking Handler Output):', errorResult);
  }
}

// Run the test
runTest();