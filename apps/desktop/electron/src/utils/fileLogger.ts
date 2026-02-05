import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', 'backend-debug.log');

// Ensure log dir exists
try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
} catch (e) {
    console.error("Failed to create log dir", e);
}

export function logToFile(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    let line = `[${timestamp}] ${message}`;
    if (data) {
        try {
            line += ` ${JSON.stringify(data)}`;
        } catch (e) {
            line += ` [Circular/Unserializable]`;
        }
    }
    line += '\n';

    try {
        fs.appendFileSync(LOG_FILE, line);
    } catch (e) {
        console.error("Failed to write to log file", e);
    }
}
