# Screenshot Service

A robust, production-ready web service for capturing high-quality screenshots of webpages, optimized for social media previews (like Telegram).

## Features

-   **High Quality (HiDPI)**: Captures at 2x device scale factor for crisp text and images.
-   **Social Optimized**: Default viewport is 1280x720, focusing on the "hero" section of pages.
-   **Anti-Bot Protection**: Built with Playwright-Extra and the Stealth plugin to bypass common protections.
-   **Ad & Trash Aware**: 
    -   Automatically blocks common ad networks, tracking scripts (Google Analytics, etc.), and unnecessary media (web sockets, manifests).
    -   Injects custom CSS/JS to remove cookie banners and modal overlays before capture.
-   **Robust Loading**: Uses a "soft wait" strategy—attempts `domcontentloaded` and `networkidle`, but proceeds if the network is busy rather than timing out.
-   **Concurrency Management**: Internal queue logic to handle multiple requests without overloading the CPU.
-   **File-based Caching**: Uses a local `./cache` directory to serve repeat requests instantly.

## API Usage

The service is available at `https://capture.simple-flow.co`.

### POST /
The recommended way to use the service. Simply POST to the root domain.

**Request Body:**
```json
{
  "url": "https://example.com",
  "fullPage": false
}
```

- `url` (Required): The full URL of the page to capture.
- `fullPage` (Optional, Default: `false`): If `true`, attempts to capture the entire scrollable height.

### Examples

**cURL:**
```bash
curl -X POST https://capture.simple-flow.co/ \
     -H "Content-Type: application/json" \
     -d '{"url": "https://surgeflow.ai"}' \
     --output screenshot.png
```

**JavaScript (Axios):**
```javascript
const axios = require('axios');
const fs = require('fs');

async function getScreenshot(url) {
  const response = await axios.post('https://capture.simple-flow.co/', {
    url: url
  }, { responseType: 'arraybuffer' });
  
  fs.writeFileSync('output.png', response.data);
}
```

## Internal Logic

1.  **Network Interception**: Before navigation, the service blocks high-bandwidth and tracking resources.
2.  **Navigation**: Navigates to the URL with a 25s timeout for the initial DOM load.
3.  **Soft Wait**: Waits up to 4s for the network to become idle. If it doesn't, it proceeds with what's loaded.
4.  **Lazy Load Trigger**: Performs a quick partial scroll to trigger lazy-loaded images in the viewport.
5.  **Page Cleaning**: Removes IDs/Classes associated with consent banners and popups.
6.  **Capture**: Takes a PNG screenshot at 1280x720 (retina resolution).

## Local Development

**Via Docker (Recommended):**
```bash
docker-compose up -d --build
```

**Manual:**
```bash
npm install
npx playwright install-deps
npx playwright install chromium
npm run build
npm start
```
