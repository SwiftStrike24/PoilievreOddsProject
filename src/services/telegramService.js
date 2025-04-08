const axios = require('axios');
const { telegramBotToken, telegramChatId } = require('../config/settings');

/**
 * Sends the formatted market data to the configured Telegram channel.
 * @param {object} data - The structured data containing odds, trend, volume, and timestamp.
 * @returns {Promise<void>} A promise that resolves when the message is sent.
 */
async function sendToTelegram(data) {
  if (!telegramBotToken || !telegramChatId) {
    throw new Error('Telegram Bot Token or Chat ID is not configured.');
  }

  const { odds, volume, timestamp } = data;

  // Basic validation of input data
  if (!odds || !volume || !timestamp) {
    console.warn('Incomplete data received for Telegram message:', data);
    throw new Error('Incomplete data for Telegram notification.');
  }

  const message = `
📊 Pierre Poilievre Odds Update (Polymarket)
Current: ${odds}
Volume: ${volume}
Updated: ${timestamp}
  `.trim();

  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: telegramChatId,
      text: message,
      // Optional: Disable link previews if desired
      // disable_web_page_preview: true,
    });
    console.log('Message sent to Telegram successfully.');
  } catch (error) {
    console.error(
      'Error sending message to Telegram:',
      error.response?.data || error.message
    );
    throw error; // Re-throw for the handler
  }
}

module.exports = { sendToTelegram }; 