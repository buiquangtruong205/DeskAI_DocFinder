import * as fs from 'fs';
import * as path from 'path';

export async function extractText(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) return '';

    const ext = path.extname(filePath).toLowerCase();

    try {
        // 1. Handling for Text-based files (with encoding fallback)
        const commonTextExts = ['.txt', '.md', '.json', '.ts', '.js', '.py', '.java', '.cpp', '.c', '.h', '.vue', '.css', '.html'];

        if (commonTextExts.includes(ext)) {
            try {
                // Try UTF-8 first
                return await fs.promises.readFile(filePath, 'utf-8');
            } catch (utf8Err) {
                console.warn(`[TextExtractor] UTF-8 read failed for ${filePath}, trying latin1 fallback...`);
                // Fallback to latin1 for legacy/special characters
                return await fs.promises.readFile(filePath, 'binary');
            }
        }

        // 2. Robust PDF extraction
        if (ext === '.pdf') {
            try {
                const pdf = require('pdf-parse');
                const dataBuffer = fs.readFileSync(filePath);

                // Set options for better extraction
                const options = {
                    // Could add custom pagerender if needed
                };

                const data = await pdf(dataBuffer, options);

                if (!data || !data.text) {
                    console.warn(`[TextExtractor] PDF yielded no text: ${filePath}`);
                    return '';
                }

                return data.text;
            } catch (pdfErr: any) {
                console.error(`[TextExtractor] PDF extraction CRITICAL error for ${filePath}:`, pdfErr.message);
                // Return empty but log specifically for debugging
                return '';
            }
        }

        // Unsupported type
        return '';
    } catch (error) {
        console.error(`[TextExtractor] Unexpected error from ${filePath}:`, error);
        return '';
    }
}
