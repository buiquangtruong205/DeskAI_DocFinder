import * as fs from 'fs';
import * as path from 'path';

export async function extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    try {
        if (ext === '.txt' || ext === '.md' || ext === '.json' || ext === '.ts' || ext === '.js' || ext === '.py') {
            return fs.promises.readFile(filePath, 'utf-8');
        }
        // TODO: Add support for PDF, DOCX using pdf-parse, mammoth etc.
        return '';
    } catch (error) {
        console.error(`Error extracting text from ${filePath}:`, error);
        return '';
    }
}
