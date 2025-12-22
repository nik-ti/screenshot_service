
import { Page } from 'playwright';

const COMMON_BLOCKED_SELECTORS = [
    // Cookie banners / GDP
    '#onetrust-consent-sdk',
    '.onetrust-pc-dark-filter',
    '#onetrust-banner-sdk',
    '.cookie-banner',
    '#cookie-banner',
    '.cc-banner',
    '.cc-window',
    'div[class*="cookie"]',
    'div[class*="consent"]',
    'div[id*="cookie"]',
    'div[id*="consent"]',

    // Ads
    'iframe[id*="google_ads"]',
    'div[id*="google_ads"]',
    '.adsbygoogle',
    'div[class*="ad-container"]',
    'div[class*="advertising"]',

    // Chat widgets
    '#intercom-container',
    '.intercom-lightweight-app',
    '#hubspot-messages-iframe-container',
    '.crisp-client',
    '#drift-widget-container',
    'iframe[title*="chat"]',

    // Social sticky bars
    '.sharethis-inline-share-buttons',
    '.addthis_inline_share_toolbox',

    // Popups / Newsletters
    'div[class*="popup"]',
    'div[class*="modal"]',
    'div[id*="newsletter"]',
    'div[class*="newsletter"]'
];

export async function cleanPage(page: Page) {
    try {
        // 1. Evaluate script to remove common annoyances
        await page.addStyleTag({
            content: `
        ${COMMON_BLOCKED_SELECTORS.join(', ')} { display: none !important; opacity: 0 !important; pointer-events: none !important; }
        /* Hide scrollbars for cleaner screenshot */
        body::-webkit-scrollbar { display: none; }
      `
        });

        // 2. JS Execution for more complex removals
        await page.evaluate(() => {
            // Remove verified fixed/sticky elements that might obscure content? 
            // Be careful not to remove headers if they are desired.
            // For now, let's just target obvious overlays.

            const selectors = [
                '[aria-modal="true"]',
                '.modal',
                '[role="dialog"]'
            ];

            selectors.forEach(sel => {
                const els = document.querySelectorAll(sel);
                els.forEach(el => el.remove());
            });
        });

    } catch (err) {
        console.error('Error cleaning page:', err);
    }
}
