const { getScreenshot } = require('./src/services/screenshotService');
const { performOcr, analyzeExtractedText } = require('./src/services/openaiService');
const { sendToTelegram } = require('./src/services/telegramService');
const fs = require('fs');
const path = require('path');

// Define emojis
const EMOJI = {
  START: '🚀',
  SCREENSHOT: '📸',
  OCR: '📄',
  TELEGRAM: '✉️',
  SUCCESS: '✅',
  ERROR: '❌',
};

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
  console.log(`\n📸 Saved screenshot to: ${screenshotPath}`);

  const extractedText = await performOcr(screenshot);
  const analyzedDataOcr = await analyzeExtractedText(extractedText);

  return analyzedDataOcr;
}

async function runTest() {
  console.log(`\n${EMOJI.START} Starting OCR Test Run...`);
  console.log('------------------------------------\n');

  try {
    // Get screenshot
    console.log(`${EMOJI.SCREENSHOT} Fetching screenshot...`);
    const screenshot = await getScreenshot();
    console.log(`${EMOJI.SCREENSHOT} Screenshot captured successfully.\n`);

    // Test OCR Approach
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

    // Add timestamp and send OCR results to Telegram
    const now = new Date();
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Denver',
      timeZoneName: 'short'
    };
    // Ensure OCR data is complete before adding timestamp and sending
    if (!analyzedDataOcr || typeof analyzedDataOcr !== 'object' || analyzedDataOcr.odds === undefined || analyzedDataOcr.volume === undefined) { 
        throw new Error('Incomplete data from OCR analysis.');
    }
    analyzedDataOcr.timestamp = now.toLocaleString('en-US', options);

    // --- Format data specifically for Telegram --- 
    const telegramData = { 
        ...analyzedDataOcr, // Copy original data
        volume: formatVolumeForDisplay(analyzedDataOcr.volume) // Apply formatting
    };
    
    console.log(`\n${EMOJI.TELEGRAM} Sending formatted OCR results to Telegram...`);
    // console.log('Data being sent to Telegram:', telegramData); // Uncomment for debugging
    await sendToTelegram(telegramData); // Send FORMATTED data
    console.log(`${EMOJI.TELEGRAM} Message sent successfully.`);

    console.log(`\n------------------------------------\n${EMOJI.SUCCESS} OCR Test Completed Successfully!`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'OCR test completed successfully', // Updated message
        ocr: analyzedDataOcr, // Return ORIGINAL OCR data
        timing: { // Updated timing
            ocr: ocrEnd - ocrStart,
        }
      })
    };
  } catch (error) {
    console.error(`\n${EMOJI.ERROR} Error during execution:`, error.message);
    console.log(`\n------------------------------------\n${EMOJI.ERROR} OCR Test Failed!`); // Updated log
    return {
      statusCode: 500,
      body: JSON.stringify({ 
          message: 'Process failed', 
          error: error.message 
      })
    };
  }
}

// Run the test
runTest().then(result => {
  console.log('\n------------------------------------');
  if (result.statusCode === 200) {
    console.log(`${EMOJI.SUCCESS} OCR Test Completed Successfully!`);
  } else {
    console.log(`${EMOJI.ERROR} OCR Test Failed!`);
  }
  console.log('Handler Result:', result);
}); 