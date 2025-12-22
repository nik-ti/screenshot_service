
import Fastify from 'fastify';
import { takeScreenshot } from './screenshot';
import { CacheManager } from './cache';
import { BrowserManager } from './browser';

const fastify = Fastify({ logger: true });
const cache = new CacheManager();
const MAX_CONCURRENT_REQUESTS = 5;
let currentRequests = 0;
const queue: (() => void)[] = [];

// Simple queue processor
const processQueue = () => {
    if (currentRequests < MAX_CONCURRENT_REQUESTS && queue.length > 0) {
        const next = queue.shift();
        if (next) next();
    }
};

const runWithConcurrencyLimit = <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        const execute = async () => {
            currentRequests++;
            try {
                const result = await fn();
                resolve(result);
            } catch (err) {
                reject(err);
            } finally {
                currentRequests--;
                processQueue();
            }
        };

        if (currentRequests < MAX_CONCURRENT_REQUESTS) {
            execute();
        } else {
            queue.push(execute);
        }
    });
};

fastify.get('/screenshot', async (request, reply) => {
    const { url, fullPage } = request.query as { url: string, fullPage?: string };

    if (!url) {
        return reply.code(400).send({ error: 'Missing url query parameter' });
    }

    // Check cache
    const cacheKey = `${url}-${fullPage}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
        request.log.info({ url, status: 'HIT' }, 'Cache hit');
        reply.header('Content-Type', 'image/png');
        return reply.send(cached);
    }

    try {
        const buffer = await runWithConcurrencyLimit(() =>
            takeScreenshot({
                url,
                fullPage: fullPage === 'true'
            })
        );

        // Cache result
        await cache.set(cacheKey, buffer);

        reply.header('Content-Type', 'image/png');
        return reply.send(buffer);
    } catch (err: any) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Failed to take screenshot', details: err.message });
    }
});

const start = async () => {
    try {
        console.log('Initiating BrowserManager...');
        await BrowserManager.getInstance().init();
        console.log('BrowserManager initiated.');

        const port = 3001;
        console.log(`Starting Fastify on port ${port}...`);
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server running on http://localhost:${port}`);
    } catch (err: any) {
        console.error('Failed to start server:', err);
        fastify.log.error(err);
        process.exit(1);
    }
};

start().catch(err => {
    console.error('Unhandled startup error:', err);
    process.exit(1);
});

process.on('SIGINT', async () => {
    await BrowserManager.getInstance().close();
    process.exit(0);
});
