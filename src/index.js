require('dotenv').config(); // Ensure environment variables are loaded

const { getScreenshot } = require('./services/screenshotService');
const { sendToTelegram } = require('./services/telegramService');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    console.log('🚀 Starting Lambda execution...');
    
    // Get screenshot
    console.log('📸 Fetching screenshot...');
    const screenshot = await getScreenshot();
    console.log('📸 Screenshot captured successfully');
    
    // Analyze with Vision API
    console.log('👁️ Analyzing with Vision API...');
    const base64Image = screenshot.toString('base64');
    
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

    // Parse the response
    const content = response.choices[0].message.content;
    const analyzedData = JSON.parse(content);

    // Add timestamp
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

    // Send to Telegram
    console.log('✉️ Sending to Telegram...');
    await sendToTelegram(analyzedData);
    console.log('✉️ Message sent successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Process completed successfully',
        data: analyzedData
      })
    };
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Process failed',
        error: error.message
      })
    };
  }
};
