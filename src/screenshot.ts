
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

    // Resource blocking to speed up loading and reduce tracking noise
    await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        const url = route.request().url();

        // Bloatware / ads / unnecessary types
        if (
            ['media', 'websocket', 'manifest', 'other'].includes(type) ||
            /google-analytics|doubleclick|googletagmanager|facebook|twitter|linkedin/.test(url)
        ) {
            return route.abort();
        }

        // Risky: blocking 'image' can break screenshots, but blocking 'font' is usually safeish if local fonts exist.
        // For accurate screenshots, we keep fonts and images.

        route.continue();
    });

    try {
        // 1. Initial navigation - fast fail if site is down, but don't wait for network idle yet
        await page.goto(options.url, {
            waitUntil: 'domcontentloaded',
            timeout: 25000 // Slightly less than 30s to have buffering time
        });

        // 2. Soft wait for network idle - try to get a "perfect" load, but don't crash if it's busy
        try {
            await page.waitForLoadState('networkidle', { timeout: 4000 });
        } catch (e) {
            // It's fine if this times out, we proceed anyway
            console.log(`Network idle timed out for ${options.url}, proceeding...`);
        }

        // 3. Handle lazy loading by scrolling - Just a little bit for hero images/top section
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 200;
                // Only scroll down a bit (e.g. 2 screens worth) to trigger top-of-page lazy loads
                const maxScroll = window.innerHeight * 2;

                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= maxScroll || totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 50);
            });
        });

        // Scroll back to top to ensure sticky headers/layout reset
        await page.evaluate(() => window.scrollTo(0, 0));

        // 4. Final stabilization wait
        // Give the page a moment to settle animations or final render updates
        await page.waitForTimeout(1000);

        // 5. Clean artifacts
        await cleanPage(page);

        const buffer = await page.screenshot({
            fullPage: options.fullPage === true, // default false now
            type: 'png',
            animations: 'disabled'
        });

        return buffer;

    } catch (err: any) {
        console.error(`Error taking screenshot for ${options.url}:`, err.message);
        throw err;
    } finally {
        await context.close();
    }
}
