# Poilievre Odds Tracker (Polymarket)

This Node.js application monitors the prediction market odds for Pierre Poilievre on Polymarket. It automatically captures a screenshot of the market page, uses Optical Character Recognition (OCR) combined with the OpenAI API to extract the current odds and trading volume, formats the data, and sends an update notification to a specified Telegram chat.

## Features

*   **Automated Screenshot:** Uses Puppeteer to take a screenshot of the relevant Polymarket page.
*   **OCR Extraction:** Employs Tesseract.js for initial text extraction from the screenshot.
*   **AI-Powered Analysis:** Leverages the OpenAI API (GPT-4 model) to accurately parse the OCR output and extract structured data (odds, volume).
*   **Data Formatting:** Cleans and formats the extracted volume for better readability (e.g., `$11,500,657` becomes `$11.5M`).
*   **Telegram Notifications:** Sends formatted updates directly to a configured Telegram chat using the Telegram Bot API.

## Project Structure

```
PoilievreOddsProject/
├── config/                 # Configuration files
│   └── settings.js.example # Example configuration (create settings.js from this)
├── src/
│   ├── services/           # Core service modules
│   │   ├── openaiService.js  # Handles OCR analysis via OpenAI
│   │   ├── screenshotService.js # Handles Puppeteer screenshots
│   │   └── telegramService.js # Handles sending Telegram messages
│   └── index.js            # (Potentially for deployment/handler logic - currently unused)
├── test-local.js         # Script for local testing of the OCR flow
├── test-comparison.js    # Original script used for comparing OCR/Vision (kept for reference)
├── package.json          # Project dependencies and scripts
└── README.md             # This file
```

## Setup

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repo-url>
    cd PoilievreOddsProject
    ```
2.  **Install Dependencies:**
    Use pnpm to install the required packages.
    ```bash
    pnpm install
    ```

## Configuration

Before running the application, you need to configure your API keys and settings:

1.  **Create `settings.js`:**
    Copy the `config/settings.js.example` file to `config/settings.js`.
    ```bash
    cp config/settings.js.example config/settings.js
    ```
    *(Note: If `settings.js.example` doesn't exist, create `config/settings.js` manually)*

2.  **Edit `config/settings.js`:**
    Fill in the required values:
    ```javascript
    // config/settings.js
    module.exports = {
      openaiApiKey: 'YOUR_OPENAI_API_KEY', // Replace with your actual OpenAI API key
      telegramBotToken: 'YOUR_TELEGRAM_BOT_TOKEN', // Replace with your Telegram Bot Token
      telegramChatId: 'YOUR_TELEGRAM_CHAT_ID', // Replace with the target Telegram Chat ID
      polymarketUrl: 'https://polymarket.com/event/pierre-poilievre-prime-minister-of-canada-after-next-federal-election' // The specific market URL
    };
    ```

    *   **`openaiApiKey`:** Your secret API key from OpenAI.
    *   **`telegramBotToken`:** The token for your Telegram bot (obtain from BotFather).
    *   **`telegramChatId`:** The ID of the chat (user, group, or channel) where the bot should send messages.
    *   **`polymarketUrl`:** The direct URL to the Polymarket event page being monitored.

## Usage

To run the tracker and test its functionality, use the following commands:

*   **Run the primary test script (`test-local.js`):**
    This script executes the full workflow: screenshot -> OCR -> AI Analysis -> Format Volume -> Send to Telegram.
    ```bash
    pnpm test:local
    # Or directly using node:
    # node test-local.js
    ```

*   **Run the comparison test script (`test-comparison.js`) (Legacy):**
    This script was used during development. It currently performs the same core OCR flow as `test-local.js`.
    ```bash
    pnpm test:comparison
    # Or directly using node:
    # node test-comparison.js
    ```

Check your console for logs and the configured Telegram chat for the notification message.

## Key Dependencies

*   [Puppeteer](https://pptr.dev/): Headless Chrome browser automation.
*   [Tesseract.js](https://tesseract.projectnaptha.com/): OCR library.
*   [OpenAI Node.js Library](https://github.com/openai/openai-node): For interacting with the OpenAI API.
*   [Axios](https://axios-http.com/): Promise-based HTTP client (used for Telegram API).
