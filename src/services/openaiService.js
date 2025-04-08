const { OpenAI } = require('openai');
const { createWorker } = require('tesseract.js');
const { openaiApiKey } = require('../config/settings');

/**
 * Performs OCR on the screenshot to extract text.
 * @param {Buffer} screenshot - The screenshot image buffer.
 * @returns {Promise<string>} A promise that resolves with the extracted text.
 */
async function performOcr(screenshot) {
  console.log('Performing OCR on screenshot...');
  const worker = await createWorker('eng'); // Use English language
  try {
    const { data: { text } } = await worker.recognize(screenshot);
    console.log('OCR completed.');
    // console.log('Extracted Text:', text); // Uncomment for debugging
    return text;
  } catch (error) {
    console.error('OCR process failed:', error);
    throw new Error('Failed to perform OCR on the screenshot.');
  } finally {
    await worker.terminate();
    console.log('OCR worker terminated.');
  }
}

/**
 * Analyzes the extracted text using GPT-4o to find market data.
 * @param {string} extractedText - The text extracted from the screenshot via OCR.
 * @returns {Promise<object>} A promise that resolves with the structured data extracted by the model.
 */
async function analyzeExtractedText(extractedText) {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured.');
  }
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error('No text extracted from screenshot to analyze.');
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use the more capable model for text analysis
      messages: [
        {
          role: 'system',
          content: 'You are an expert data extraction AI. Your task is to parse the provided text and extract specific market data points for Pierre Poilievre.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `From the text below, extracted from a Polymarket screenshot, find the data ONLY for the row containing "Pierre Poilievre":
1.  **Odds:** Find the numerical value associated with Poilievre's odds. If the text shows a percentage (%), RETURN IT AS CENTS (¢). The final format MUST be "XX¢".
2.  **Volume:** Find the total volume traded, located in the same row. **Extract the EXACT string as it appears**, including the '$' sign, any commas (,), decimals (.), and any 'M' or 'K' suffix (e.g., "$11,456,789", "$11.4M"). Do not reformat or summarize it. Return null if not found.

Carefully parse the line associated with Pierre Poilievre to extract these values accurately.

Respond ONLY with a valid JSON object using the keys "odds" and "volume". Use null if a value cannot be definitively found.

Extracted Text:
\`\`\`
${extractedText}
\`\`\`

JSON Output:
{
  "odds": "<corrected_odds_in_cents_or_null>",
  "volume": "<extracted_volume_or_null>"
}`
            },
            // NO IMAGE URL NEEDED HERE
          ],
        },
      ],
      max_tokens: 200, // Allow slightly more tokens for text analysis
    });

    const content = response.choices[0]?.message?.content;
    console.log("Raw OpenAI Response Content (from text analysis):", content);
    if (!content) {
      throw new Error('No content received from OpenAI text analysis.');
    }

    try {
      const cleanedContent = content.trim().replace(/^```json\n?|\n?```$/g, '');
      return JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI text analysis.');
    }
  } catch (error) {
    console.error('Error analyzing extracted text with OpenAI:', error);
    throw error;
  }
}

module.exports = { performOcr, analyzeExtractedText }; 