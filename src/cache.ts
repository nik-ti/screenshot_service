
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const TTL_MS = 60 * 60 * 1000; // 1 hour

export class CacheManager {
    constructor() {
        fs.ensureDirSync(CACHE_DIR);
    }

    private getHash(key: string): string {
        return crypto.createHash('md5').update(key).digest('hex');
    }

    public async get(url: string): Promise<Buffer | null> {
        const hash = this.getHash(url);
        const filePath = path.join(CACHE_DIR, hash);

        if (await fs.pathExists(filePath)) {
            const stats = await fs.stat(filePath);
            if (Date.now() - stats.mtimeMs < TTL_MS) {
                return fs.readFile(filePath);
            } else {
                await fs.remove(filePath); // Expired
            }
        }
        return null;
    }

    public async set(url: string, data: Buffer): Promise<void> {
        const hash = this.getHash(url);
        const filePath = path.join(CACHE_DIR, hash);
        await fs.writeFile(filePath, data);
    }
}
