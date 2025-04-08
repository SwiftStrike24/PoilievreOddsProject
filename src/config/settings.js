const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  polymarketUrl: 'https://polymarket.com/event/next-prime-minster-of-canada?tid=1744073509392',
  openaiApiKey: process.env.OPENAI_API_KEY,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  lambdaMemory: 1024, // MB
  lambdaTimeout: 60, // seconds
}; 