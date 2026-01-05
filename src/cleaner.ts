
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
    'div[class*="newsletter"]', // End of array is handled by formatter usually, but let's be safe

    // Additional CMP / Trust Arc
    'div[id*="trustarc"]',
    'div[class*="trustarc"]',
    'div[id*="cmp"]',
    'div[class*="cmp-container"]'
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
            // 1. Remove obvious modals
            const selectors = [
                '[aria-modal="true"]',
                '.modal',
                '[role="dialog"]',
                '[id*="onetrust"]',
                '.fc-consent-root'
            ];

            selectors.forEach(sel => {
                const els = document.querySelectorAll(sel);
                els.forEach(el => el.remove());
            });

            // 2. Heuristic: Remove fixed/sticky elements at the BOTTOM of the viewport
            // This catches customized cookie banners, chat widgets, promo bars etc.
            const allElements = document.querySelectorAll('*');
            for (const el of Array.from(allElements)) {
                // @ts-ignore
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' || style.position === 'sticky') {
                    const rect = el.getBoundingClientRect();
                    // If element is in the bottom 25% of the screen
                    if (rect.top > window.innerHeight * 0.75) {
                        el.remove();
                    }
                    // Also if it's a full-screen overlay (high z-index, covers most of screen)
                    if (rect.width >= window.innerWidth && rect.height >= window.innerHeight && style.zIndex && parseInt(style.zIndex) > 100) {
                        // Double check it's not the body/html wrapper
                        if (el.tagName !== 'BODY' && el.tagName !== 'HTML') {
                            el.remove();
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Error cleaning page:', err);
    }
}
