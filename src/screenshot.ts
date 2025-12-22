
import { BrowserManager } from './browser';
import { cleanPage } from './cleaner';

export interface ScreenshotOptions {
    url: string;
    fullPage?: boolean;
}

export async function takeScreenshot(options: ScreenshotOptions): Promise<Buffer> {
    const browserManager = BrowserManager.getInstance();
    const context = await browserManager.getContext();
    const page = await context.newPage();

    try {
        // Navigate with timeout/retry logic could be added, but Playwright has some built-in.
        await page.goto(options.url, {
            waitUntil: 'networkidle', // Wait for network to be idle (useful for SPAs)
            timeout: 30000
        });

        // Handle lazy loading by scrolling to bottom
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 15000) { // Limit scroll to avoid infinite loops
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));

        // Give a little time for animations/final loads after scroll
        await page.waitForTimeout(1000);

        // Clean artifacts
        await cleanPage(page);

        const buffer = await page.screenshot({
            fullPage: options.fullPage !== false, // default true
            type: 'png'
        });

        return buffer;

    } finally {
        await context.close();
    }
}
