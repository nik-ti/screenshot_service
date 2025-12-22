# Screenshot Service Handover

## Project Overview
A robust, production-ready web service for capturing screenshots of webpages. 
Built with:
- **Fastify** (Node.js framework)
- **Playwright** (Headless browser management)
- **Playwright-extra + Stealth Plugin** (To bypass anti-bot protections)
- **File-based Caching** (Located in `./cache`)

## Current Status
- **Implementation**: Core logic is complete (`src/`).
- **Configuration**: The server is configured to run on **port 3001** (as 3000 was occupied on the previous VPS).
- **Environment Issues**: 
    - Attempted to run locally but encountered missing shared library errors (e.g., `libatk-1.0.so.0`).
    - Attempted to run via Docker (`docker-compose up`), but the build was heavy on CPU (200%+ spike) during the Playwright dependency installation phase.
- **Verification**: A test script `test-urls.ts` exists to hit the local endpoint and save results to `test-output/`.

## Steps for the Next Agent
1. **Restore Code**: Clone from `https://github.com/nik-ti/screenshot_service.git`.
2. **Environment Setup**:
   - Running via Docker is recommended to avoid shared library issues:
     ```bash
     docker compose up -d --build
     ```
   - If running locally:
     ```bash
     npm install
     npx playwright install-deps
     npx playwright install chromium
     npm run build
     npm start
     ```
3. **Verify**:
   - Run the test suite:
     ```bash
     npx ts-node test-urls.ts
     ```
   - Check `test-output/` for the generated PNG files.

## Files of Interest
- `src/server.ts`: Entry point and Fastify setup.
- `src/screenshot.ts`: Core navigation and capture logic.
- `src/cleaner.ts`: Custom CSS/JS injections to strip ads/cookie banners.
- `test-urls.ts`: Automated test script for the requested URLs.
