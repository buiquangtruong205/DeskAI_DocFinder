"""
RAG Answerer Service

Implements Retrieval-Augmented Generation (RAG) pipeline:
1. Retrieve relevant chunks from Qdrant
2. Build prompt with context
3. Generate answer using LLM (Gemini or Ollama)
4. Return structured response with citations
"""

import os
import httpx
from typing import List, Dict, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from dotenv import load_dotenv

try:
    import google.generativeai as genai_module
    print(f"google-generativeai version: {genai_module.__version__}")
except ImportError:
    pass

# Load environment variables
load_dotenv()

# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")  # "gemini" or "ollama"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")  # or "gemma2", "mistral", etc.

# Configure Gemini if available
genai = None
if LLM_PROVIDER == "gemini" and GEMINI_API_KEY:
    try:
        import google.generativeai as genai_module
        genai_module.configure(api_key=GEMINI_API_KEY)
        genai = genai_module
        print("Gemini API configured successfully")
    except Exception as e:
        print(f"Failed to configure Gemini: {e}")
        genai = None

if LLM_PROVIDER == "ollama":
    print(f"Using Ollama at {OLLAMA_URL} with model {OLLAMA_MODEL}")


def build_context_string(chunks: List[Dict], max_chunk_chars: int = 500, max_total_chars: int = 3000) -> str:
    """Build optimized context string from retrieved chunks"""
    if not chunks:
        return "No relevant documents found."
    
    context_parts = []
    total_chars = 0
    
    for i, chunk in enumerate(chunks, 1):
        if total_chars >= max_total_chars:
            break
            
        file_name = chunk.get('file_name', 'Unknown')
        text = chunk.get('text', chunk.get('snippet', ''))
        
        # Truncate individual chunk
        if len(text) > max_chunk_chars:
            text = text[:max_chunk_chars] + "..."
        
        part = f"[Doc {i}: {file_name}]\n{text}\n"
        
        if total_chars + len(part) > max_total_chars:
            remaining = max_total_chars - total_chars
            if remaining > 100:
                part = part[:remaining] + "..."
            else:
                break
        
        context_parts.append(part)
        total_chars += len(part)
    
    return "\n".join(context_parts)


def get_system_prompt(mode: str) -> str:
    """Get system prompt based on mode"""
    prompts = {
        "answer": """You are a helpful AI assistant that answers questions based on the provided documents.

IMPORTANT RULES:
1. Only use information from the provided documents
2. If the documents don't contain relevant information, say so clearly
3. Always cite which document(s) you used for your answer
4. Be concise but comprehensive
5. Use markdown formatting for better readability
6. Respond in Vietnamese if the question is in Vietnamese""",

        "summarize": """You are a helpful AI assistant that summarizes documents.

IMPORTANT RULES:
1. Provide a clear, structured summary of the documents
2. Highlight key points and main ideas
3. Use bullet points for clarity
4. Keep the summary concise but complete
5. Respond in Vietnamese if the documents are in Vietnamese""",

        "explain": """You are a helpful AI assistant that explains concepts from documents.

IMPORTANT RULES:
1. Explain the concept in simple, clear terms
2. Use examples from the documents when possible
3. Break down complex ideas into digestible parts
4. Respond in Vietnamese if the question is in Vietnamese"""
    }
    
    return prompts.get(mode, prompts["answer"])


def generate_follow_ups(question: str, answer: str) -> List[str]:
    """Generate follow-up questions based on the Q&A"""
    follow_ups = []
    
    if "how" not in question.lower():
        follow_ups.append("How does this work in practice?")
    if "example" not in answer.lower():
        follow_ups.append("Can you show me an example?")
    if len(answer) > 500:
        follow_ups.append("Can you summarize the key points?")
    
    return follow_ups[:3]


def calculate_confidence(chunks: List[Dict]) -> float:
    """Calculate confidence score based on retrieved chunks"""
    if not chunks:
        return 0.0
    
    scores = [chunk.get('score', 0) for chunk in chunks]
    if not scores:
        return 0.5
    
    avg_score = sum(scores) / len(scores)
    return min(max(avg_score, 0.0), 1.0)


async def call_ollama(prompt: str, system_prompt: str) -> str:
    """Call Ollama API for text generation"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "system": system_prompt,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "")
            else:
                return f"❌ Ollama error: {response.text}"
    except httpx.ConnectError:
        return "❌ Cannot connect to Ollama. Please make sure Ollama is running (ollama serve)."
    except Exception as e:
        return f"❌ Error calling Ollama: {str(e)}"


async def call_gemini(prompt: str, system_prompt: str) -> tuple[str, int]:
    """Call Gemini API for text generation with timeout"""
    if not genai:
        return "❌ Gemini API not configured. Please add GEMINI_API_KEY to .env file.", 0
    
    import asyncio
    
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def _sync_generate():
        # List of models to try in order of preference
        status_log = []
        # Updated based on available models (Gemini 2.0+, 2.5+, 3.0+)
        candidate_models = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-flash-latest',
            'gemini-2.5-pro',
            'gemini-2.0-flash-001',
            'gemini-pro-latest',
            'gemini-exp-1206',
        ]
        
        for model_name in candidate_models:
            print(f"Trying model: {model_name}")
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_prompt,
                    generation_config={
                        'temperature': 0.7,
                        'max_output_tokens': 1024,
                    }
                )
                response = model.generate_content(prompt)
                print(f"Successfully used model: {model_name}")
                return response
            except Exception as inner_e:
                print(f"Failed to use {model_name}: {inner_e}")
                status_log.append(f"{model_name}: {str(inner_e)}")
                # If 404, valid model name but not found/supported. Try next.
                # If 403, permission denied.
                continue
        
        # If we get here, all models failed
        raise Exception(f"All models failed. Details: {'; '.join(status_log)}")
    
    try:
        # Run sync Gemini call in thread pool with timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(_sync_generate),
            timeout=40.0 # Increased timeout for multiple retries
        )
        
        answer_text = response.text if response.text else "Unable to generate answer."
        
        used_tokens = 0
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            used_tokens = getattr(response.usage_metadata, 'total_token_count', 0)
        
        return answer_text, used_tokens
    except asyncio.TimeoutError:
        return "⏱️ Request timed out. Gemini API took too long.", 0
    except Exception as e:
        print(f"Gemini Call Failed: {e}")
        return f"❌ Gemini error: {str(e)}", 0


async def generate_answer(
    question: str,
    chunks: List[Dict],
    mode: str = "answer"
) -> Dict[str, Any]:
    """
    Generate answer using LLM with retrieved context
    """
    
    # Build context from chunks
    context = build_context_string(chunks)
    system_prompt = get_system_prompt(mode)
    
    user_prompt = f"""Based on the following documents:

{context}

Question/Task: {question}

Please provide a helpful response based on the documents above."""

    # Call appropriate LLM
    used_tokens = 0
    
    if LLM_PROVIDER == "ollama":
        answer_text = await call_ollama(user_prompt, system_prompt)
    else:
        answer_text, used_tokens = await call_gemini(user_prompt, system_prompt)
    
    # Build citations from chunks
    citations = []
    for i, chunk in enumerate(chunks):
        snippet_text = chunk.get('text', chunk.get('snippet', ''))
        citations.append({
            "id": chunk.get('chunk_id', f'chunk-{i}'),
            "name": chunk.get('file_name', 'Unknown'),
            "path": chunk.get('file_path', ''),
            "type": chunk.get('file_type', 'doc'),
            "snippet": snippet_text[:200] + "..." if len(snippet_text) > 200 else snippet_text,
            "score": chunk.get('score', 0.0)
        })
    
    # Generate follow-up questions
    follow_ups = generate_follow_ups(question, answer_text)
    
    # Calculate confidence
    confidence = calculate_confidence(chunks)
    
    return {
        "answer": answer_text,
        "citations": citations,
        "follow_ups": follow_ups,
        "confidence": round(confidence, 2),
        "used_tokens": used_tokens
    }
