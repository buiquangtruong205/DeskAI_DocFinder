import { defineStore } from 'pinia';
import { ref } from 'vue';
import { askAI, type AskResponse, type Citation } from '../services/ask.service';

export interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
    // AI specific
    citations?: Citation[];
    followUps?: string[];
    confidence?: number;
    loading?: boolean;
}

export const useAskStore = defineStore('ask', () => {
    // State
    const messages = ref<Message[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const mode = ref('answer');
    const context = ref<any>({ sources: 'all' });

    // Actions
    const sendMessage = async (question: string) => {
        if (!question.trim()) return;

        // 1. Add User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            timestamp: Date.now()
        };
        messages.value.push(userMsg);

        // 2. Add AI Placeholder
        loading.value = true;
        error.value = null;
        const aiMsgId = (Date.now() + 1).toString();
        const aiMsg: Message = {
            id: aiMsgId,
            role: 'ai',
            content: '',
            timestamp: Date.now(),
            loading: true
        };
        messages.value.push(aiMsg);

        try {
            // 3. Call API - serialize to plain object to avoid IPC cloning issues with Vue reactive proxies
            const request = JSON.parse(JSON.stringify({
                question,
                mode: mode.value,
                context: context.value
            }));
            const response = await askAI(request);

            // 4. Update AI Message
            const targetMsg = messages.value.find(m => m.id === aiMsgId);
            if (targetMsg) {
                targetMsg.content = response.answer;
                targetMsg.citations = response.citations;
                targetMsg.followUps = response.followUps;
                targetMsg.confidence = response.confidence;
                targetMsg.loading = false;
            }

        } catch (err: any) {
            console.error('Ask failed:', err);
            const errorMessage = err.message || 'Failed to get answer';
            error.value = errorMessage;
            const targetMsg = messages.value.find(m => m.id === aiMsgId);
            if (targetMsg) {
                targetMsg.content = `❌ **Error**: ${errorMessage}\n\nPlease check:\n1. Python backend is running (python -m uvicorn app.main:app --reload --port 8000)\n2. Check Python terminal for detailed errors`;
                targetMsg.loading = false;
            }
        } finally {
            loading.value = false;
        }
    };

    const clearChat = () => {
        messages.value = [];
        error.value = null;
    };

    return {
        messages,
        loading,
        error,
        mode,
        context,
        sendMessage,
        clearChat
    };
});
