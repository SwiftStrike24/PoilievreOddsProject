const { OpenAI } = require('openai');
const { openaiApiKey } = require('../config/settings');

/**
 * Analyzes the provided screenshot using GPT-4o to extract market data.
 * @param {Buffer} screenshot - The screenshot image buffer.
 * @returns {Promise<object>} A promise that resolves with the structured data extracted by the model.
 */
async function analyzeScreenshot(screenshot) {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured.');
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an expert data extraction AI. Analyze the attached Polymarket screenshot for the market "Next Prime Minister of Canada".
Your task is to extract the following specific values for Pierre Poilievre, based on the visual information in the image:
1. Current odds (e.g., "30¢")
2. Trend (e.g., "▲ +1¢", "▼ -2¢", "― 0¢")
3. Volume (e.g., "$10.9M")
4. Timestamp visible on the market data (Format: "MMM d, HH:mm z", e.g., "Apr 7, 16:00 MDT")

Respond ONLY with a valid JSON object containing these extracted values. Do not include explanations, apologies, or any text outside the JSON structure.
{
  "odds": "<extracted_odds>",
  "trend": "<extracted_trend>",
  "volume": "<extracted_volume>",
  "timestamp": "<extracted_timestamp>"
}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshot.toString('base64')}`,
                detail: "high"
              },
            },
          ],
        },
      ],
      max_tokens: 150,
    });

    // Basic validation and parsing
    const content = response.choices[0]?.message?.content;
    console.log("Raw OpenAI Response Content:", content);
    if (!content) {
      throw new Error('No content received from OpenAI.');
    }

    try {
      // Attempt to trim potential markdown code blocks before parsing
      const cleanedContent = content.trim().replace(/^```json\n?|\n?```$/g, '');
      return JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI.');
    }
  } catch (error) {
    console.error('Error analyzing screenshot with OpenAI:', error);
    throw error;
  }
}

module.exports = { analyzeScreenshot }; 