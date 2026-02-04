export interface Chunk {
    text: string;
    start: number;
    end: number;
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 100): Chunk[] {
    const chunks: Chunk[] = [];
    let start = 0;

    if (!text || text.length === 0) {
        return [];
    }

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push({
            text: text.slice(start, end),
            start,
            end
        });

        if (end === text.length) break;

        start += (chunkSize - overlap);
    }

    return chunks;
}
