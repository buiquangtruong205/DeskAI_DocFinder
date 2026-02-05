import { ipcMain } from 'electron';
import { chunksRepo } from '../../services/storage/repositories/chunks.repo';
import { filesRepo } from '../../services/storage/repositories/files.repo';

const PYTHON_API_URL = 'http://127.0.0.1:8000';

interface AskRequest {
    question: string;
    mode?: string;
    context?: {
        sources?: string;
        source_ids?: string[];
    };
    top_k?: number;
}

interface Citation {
    id: string;
    name: string;
    path: string;
    type: string;
    snippet: string;
    score: number;
}

interface AskResponse {
    id: string;
    answer: string;
    citations: Citation[];
    followUps: string[];
    confidence: number;
    usedTokens: number;
}

/**
 * Fallback local search when Python API is unavailable
 * Uses SQLite FTS5 for keyword search
 */
async function fallbackLocalSearch(question: string, topK: number = 3, errorReason?: string): Promise<AskResponse> {
    console.log('[Ask] Using fallback local search');

    try {
        // Search using local FTS5
        const results = chunksRepo.searchKeyword(question, {}, topK);

        const citations: Citation[] = results.map((r: any) => ({
            id: r.chunkId || r.id,
            name: r.name || 'Unknown',
            path: r.path || '',
            type: r.type || 'doc',
            snippet: r.snippet || r.text?.substring(0, 200) + '...',
            score: r.score || 0
        }));

        // Build a simple answer from search results
        let answer = '⚠️ **Python API không khả dụng**';
        if (errorReason) {
            answer += `\n**Lỗi**: ${errorReason}\n`;
        }
        answer += ' - Hiển thị kết quả tìm kiếm cục bộ:\n\n';

        if (citations.length === 0) {
            answer += 'Không tìm thấy tài liệu liên quan đến câu hỏi của bạn.';
        } else {
            answer += `Tìm thấy **${citations.length}** tài liệu liên quan:\n\n`;
            citations.forEach((c, i) => {
                answer += `${i + 1}. **${c.name}**\n   - Path: \`${c.path}\`\n   - ${c.snippet}\n\n`;
            });
            answer += '\n*Để có câu trả lời AI chi tiết, vui lòng khởi động Python backend.*';
        }

        return {
            id: Date.now().toString(),
            answer,
            citations,
            followUps: [
                'Hướng dẫn khởi động Python backend?',
                'Tìm kiếm với từ khóa khác',
            ],
            confidence: citations.length > 0 ? 0.5 : 0.1,
            usedTokens: 0
        };
    } catch (err) {
        console.error('[Ask] Fallback search error:', err);
        return {
            id: Date.now().toString(),
            answer: '❌ Không thể thực hiện tìm kiếm. Vui lòng thử lại sau.',
            citations: [],
            followUps: [],
            confidence: 0,
            usedTokens: 0
        };
    }
}

/**
 * Call Python FastAPI /ask endpoint
 */
async function callPythonAskAPI(request: AskRequest): Promise<AskResponse> {
    const response = await fetch(`${PYTHON_API_URL}/ask/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question: request.question,
            mode: request.mode || 'answer',
            context: request.context,
            top_k: request.top_k || 3
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

export const registerAskHandlers = () => {
    // Common greetings to detect
    const GREETINGS = [
        'hello', 'hi', 'hey', 'xin chào', 'chào', 'chào bạn',
        'xin chao', 'chao', 'chao ban', 'good morning', 'good afternoon',
        'good evening', 'chào buổi sáng', 'chào buổi chiều', 'chào buổi tối',
        'alo', 'helo', 'hallo'
    ];

    const isGreeting = (text: string): boolean => {
        const normalized = text.toLowerCase().trim();
        return GREETINGS.some(g => normalized === g || normalized.startsWith(g + ' ') || normalized.endsWith(' ' + g));
    };

    ipcMain.handle('ask:query', async (event, args) => {
        console.log('[Ask] Raw args received:', JSON.stringify(args));

        const { question, context, mode, options } = args || {};
        console.log('[Ask] Query received:', { question, mode });

        // Check for greetings first
        if (isGreeting(question)) {
            return {
                id: Date.now().toString(),
                answer: '👋 Xin chào! Tôi có thể giúp gì cho bạn?\n\nBạn có thể hỏi tôi về nội dung trong các tài liệu của bạn, ví dụ:\n- "Tóm tắt nội dung file báo cáo"\n- "Tìm thông tin về dự án X"\n- "Giải thích khái niệm Y trong tài liệu"',
                citations: [],
                followUps: [
                    'Tôi có những tài liệu nào?',
                    'Hướng dẫn sử dụng',
                    'Tìm kiếm tài liệu'
                ],
                confidence: 1.0,
                usedTokens: 0
            };
        }

        try {
            // Try calling Python API first
            const result = await callPythonAskAPI({
                question,
                mode: mode || 'answer',
                context: context ? {
                    sources: context.sources,
                    source_ids: context.sourceIds
                } : undefined,
                top_k: options?.topK || 3
            });

            console.log('[Ask] Python API response received, citations:', result.citations?.length);
            // Ensure result is serializable for IPC
            return JSON.parse(JSON.stringify(result));

        } catch (err: any) {
            console.error('[Ask] Python API error:', err.message);
            console.error('[Ask] Full error:', err);

            // Fallback to local search
            try {
                // Pass error message to fallback
                const fallbackResult = await fallbackLocalSearch(
                    question,
                    options?.topK || 3,
                    err.message || 'Unknown error'
                );
                // Ensure result is serializable for IPC
                return JSON.parse(JSON.stringify(fallbackResult));
            } catch (fallbackErr: any) {
                console.error('[Ask] Fallback also failed:', fallbackErr);
                return {
                    id: Date.now().toString(),
                    answer: `❌ Error: ${err.message}. Fallback error: ${fallbackErr.message}`,
                    citations: [],
                    followUps: [],
                    confidence: 0,
                    usedTokens: 0
                };
            }
        }
    });

    // Handler to check if Python API is available
    ipcMain.handle('ask:check-backend', async () => {
        try {
            const response = await fetch(`${PYTHON_API_URL}/health/`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            return { available: response.ok };
        } catch {
            return { available: false };
        }
    });
};
