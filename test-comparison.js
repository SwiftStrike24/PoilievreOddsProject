const { getScreenshot } = require('./src/services/screenshotService');
const { performOcr, analyzeExtractedText } = require('./src/services/openaiService');
const { sendToTelegram } = require('./src/services/telegramService');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Define emojis
const EMOJI = {
  START: '🚀',
  SCREENSHOT: '📸',
  OCR: '📄',
  VISION: '👁️',
  ANALYSIS: '🧠',
  TELEGRAM: '✉️',
  SUCCESS: '✅',
  ERROR: '❌',
};

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function analyzeWithVision(screenshot) {
  // Save the screenshot for inspection
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(__dirname, `screenshot-${timestamp}.png`);
  fs.writeFileSync(screenshotPath, screenshot);
  console.log(`\n📸 Saved screenshot to: ${screenshotPath}`);

  const base64Image = screenshot.toString('base64');
  
  console.log('\n🤖 Sending image to Vision API...');
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert data extraction AI. Your task is to parse the provided image and extract specific market data points for Pierre Poilievre. You must return a valid JSON object with the exact structure specified. Be extremely precise with the numbers and ensure they match exactly what is shown in the image.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image of the Polymarket page for the "Next Prime Minister of Canada" market. 

IMPORTANT INSTRUCTIONS:
1. Find the row for "Pierre Poilievre" - his name should be clearly visible
2. In his row, look for:
   - The odds value (should be around 27¢)
   - The volume value (should be around $10.9M)
   - The trend indicator (if visible)

Return ONLY this JSON object with the exact values from Pierre Poilievre's row:
{
  "odds": "current odds in cents with ¢ symbol (e.g. '27¢')",
  "trend": "trend with direction (▲, ▼, or ―) and change in cents (e.g. '▲ +1¢', '▼ -2¢', '― 0¢')",
  "volume": "volume in dollars with M or K if applicable (e.g. '$10.9M')"
}

If any value cannot be found, use null. Return ONLY this JSON object with no additional text.`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
              detail: 'high'
            }
          }
        ]
      }
    ],
    max_tokens: 200,
    response_format: { type: "json_object" }
  });

  // Log the raw response
  console.log('\n📝 Raw Vision API Response:');
  console.log(JSON.stringify(response, null, 2));

  // Extract the content from the response
  const content = response.choices[0].message.content;
  console.log('\n📋 Extracted Content:');
  console.log(content);
  
  try {
    // Try to parse the content directly
    const result = JSON.parse(content);
    
    // Validate the structure
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response structure');
    }
    
    // Log the parsed result before validation
    console.log('\n🔍 Parsed Result (before validation):');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate the values
    const validatedResult = {
      odds: validateOdds(result.odds),
      trend: validateTrend(result.trend),
      volume: validateVolume(result.volume)
    };
    
    console.log('\n✅ Final Validated Result:');
    console.log(JSON.stringify(validatedResult, null, 2));
    
    return validatedResult;
  } catch (error) {
    console.error('\n❌ Error during processing:');
    console.error('Vision API Response:', content);
    throw new Error(`Failed to parse Vision API response: ${error.message}`);
  }
}

// Validation helper functions
function validateOdds(odds) {
  if (!odds) return null;
  // Should be a number followed by ¢
  if (!/^\d+¢$/.test(odds)) {
    console.warn(`Invalid odds format: ${odds}`);
    return null;
  }
  return odds;
}

function validateTrend(trend) {
  if (!trend) return null;
  // Should be ▲, ▼, or ― followed by optional + or - and a number and ¢
  if (!/^[▲▼―]\s*[+-]?\d+¢$/.test(trend)) {
    console.warn(`Invalid trend format: ${trend}`);
    return null;
  }
  return trend;
}

function validateVolume(volume) {
  if (!volume) return null;
  // Should be $ followed by a number and optional M or K
  if (!/^\$\d+(\.\d+)?[MK]?$/.test(volume)) {
    console.warn(`Invalid volume format: ${volume}`);
    return null;
  }
  return volume;
}

async function runTest() {
  console.log(`\n${EMOJI.START} Starting Comparison Test Run...`);
  console.log('------------------------------------\n');

  try {
    // Get screenshot once for both tests
    console.log(`${EMOJI.SCREENSHOT} Fetching screenshot...`);
    const screenshot = await getScreenshot();
    console.log(`${EMOJI.SCREENSHOT} Screenshot captured successfully.\n`);

    // Test OCR Approach
    console.log(`${EMOJI.OCR} Testing OCR Approach...`);
    const ocrStart = Date.now();
    const extractedText = await performOcr(screenshot);
    const analyzedDataOcr = await analyzeExtractedText(extractedText);
    const ocrEnd = Date.now();
    console.log(`${EMOJI.OCR} OCR Analysis completed in ${ocrEnd - ocrStart}ms`);
    console.log('OCR Results:', analyzedDataOcr);

    // Test Vision Approach
    console.log(`\n${EMOJI.VISION} Testing Vision Approach...`);
    const visionStart = Date.now();
    const analyzedDataVision = await analyzeWithVision(screenshot);
    const visionEnd = Date.now();
    console.log(`${EMOJI.VISION} Vision Analysis completed in ${visionEnd - visionStart}ms`);
    console.log('Vision Results:', analyzedDataVision);

    // Compare results
    console.log('\nComparison Summary:');
    console.log('------------------------------------');
    console.log(`OCR Time: ${ocrEnd - ocrStart}ms`);
    console.log(`Vision Time: ${visionEnd - visionStart}ms`);
    console.log('------------------------------------');

    // Add timestamp and send to Telegram
    const now = new Date();
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      timeZone: 'America/Denver',
      timeZoneName: 'short'
    };
    analyzedDataVision.timestamp = now.toLocaleString('en-US', options);
    
    console.log(`\n${EMOJI.TELEGRAM} Sending Vision results to Telegram...`);
    await sendToTelegram(analyzedDataVision);
    console.log(`${EMOJI.TELEGRAM} Message sent successfully.`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Comparison test completed successfully',
        ocr: analyzedDataOcr,
        vision: analyzedDataVision,
        timing: {
          ocr: ocrEnd - ocrStart,
          vision: visionEnd - visionStart
        }
      })
    };
  } catch (error) {
    console.error(`${EMOJI.ERROR} Error during execution:`, error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Process failed', error: error.message })
    };
  }
}

// Run the test
runTest().then(result => {
  console.log('\n------------------------------------');
  if (result.statusCode === 200) {
    console.log(`${EMOJI.SUCCESS} Comparison Test Completed Successfully!`);
  } else {
    console.log(`${EMOJI.ERROR} Comparison Test Failed!`);
  }
  console.log('Handler Result:', result);
}); 