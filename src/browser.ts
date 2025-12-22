
import { chromium } from 'playwright-extra';
import { Browser, BrowserContext } from 'playwright';
// @ts-ignore
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin
chromium.use(stealthPlugin());

export class BrowserManager {
    private static instance: BrowserManager;
    private browser: Browser | null = null;
    private MAX_CONCURRENT_CONTEXTS = 10;
    private activeContexts = 0;

    private constructor() { }

    public static getInstance(): BrowserManager {
        if (!BrowserManager.instance) {
            BrowserManager.instance = new BrowserManager();
        }
        return BrowserManager.instance;
    }

    public async init() {
        if (!this.browser) {
            console.log('Launching browser...');
            this.browser = await chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--mute-audio'
                ]
            });
            console.log('Browser launched.');
        }
    }

    public async getContext(): Promise<BrowserContext> {
        if (!this.browser) {
            await this.init();
        }

        // specific viewport for consistency, but can be overridden
        const context = await this.browser!.newContext({
            viewport: { width: 1920, height: 1080 },
            deviceScaleFactor: 1,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        // Add extra headers to look legitimate
        await context.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        });

        return context;
    }

    public async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
