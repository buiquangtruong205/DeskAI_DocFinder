import { invoke } from './desktopApi';

export interface AskRequest {
    question: string;
    context?: {
        collections?: string[];
        files?: string[];
    };
    mode?: 'answer' | 'summarize' | 'explain' | 'compare';
    options?: {
        topK?: number;
        temperature?: number;
    };
}

export interface Citation {
    id: string;
    name: string;
    path: string;
    type: string;
    snippet: string;
    score: number;
}

export interface AskResponse {
    id: string;
    answer: string;
    citations: Citation[];
    followUps: string[];
    confidence: number;
    usedTokens: number;
}

export async function askAI(request: AskRequest): Promise<AskResponse> {
    return await invoke('ask:query', request);
}
