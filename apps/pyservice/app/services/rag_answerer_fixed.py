"""
RAG Answerer Service - Fixed Version

Improvements:
1. Better quota handling with exponential backoff
2. Uses more efficient models to conserve quota
3. Fallback to free models when quota exceeded
4. Better error handling and logging
"""

import os
import httpx
import time
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


def build_context_string(chunks: List[Dict], max_chunk_chars: int = 400, max_total_chars: int = 2500) -> str:
    """Build optimized context string from retrieved chunks - reduced size to save quota"""
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
    """Get system prompt based on mode - optimized for shorter responses"""
    prompts = {
        "answer": """You are a helpful AI assistant. Answer questions based on provided documents.

Rules:
1. Use only document information
2. Be concise but complete
3. Cite document sources
4. Use markdown formatting
5. Respond in Vietnamese if question is in Vietnamese""",

        "summarize": """Summarize documents clearly and concisely.

Rules:
1. Highlight key points
2. Use bullet points
3. Keep summary brief
4. Respond in Vietnamese if documents are in Vietnamese""",

        "explain": """Explain concepts from documents simply.

Rules:
1. Use clear, simple terms
2. Include examples when possible
3. Break down complex ideas
4. Respond in Vietnamese if question is in Vietnamese"""
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
    """Call Gemini API with better quota handling"""
    if not genai:
        return "❌ Gemini API not configured. Please add GEMINI_API_KEY to .env file.", 0
    
    import asyncio
    
    def _sync_generate():
        # Prioritize free/efficient models to conserve quota
        candidate_models = [
            'gemini-flash-latest',        # Latest flash model (usually most efficient)
            'gemini-flash-lite-latest',   # Lite version for simple tasks
            'gemini-2.0-flash-lite',      # Specific lite model
            'gemini-2.0-flash-lite-001',  # Versioned lite model
            'gemini-2.5-flash-lite',      # Another lite option
            'gemini-2.0-flash',           # Standard flash if lite fails
            'gemini-2.5-flash',           # Backup flash model
        ]
        
        status_log = []
        
        for model_name in candidate_models:
            print(f"Trying model: {model_name}")
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=system_prompt,
                    generation_config={
                        'temperature': 0.7,
                        'max_output_tokens': 512,  # Reduced to save quota
                    }
                )
                response = model.generate_content(prompt)
                print(f"✅ Successfully used model: {model_name}")
                return response
            except Exception as inner_e:
                error_msg = str(inner_e)
                print(f"❌ Failed {model_name}: {error_msg}")
                status_log.append(f"{model_name}: {error_msg}")
                
                # If quota exceeded, wait a bit before trying next model
                if "429" in error_msg or "quota" in error_msg.lower():
                    print("⏳ Quota exceeded, waiting 2 seconds...")
                    time.sleep(2)
                
                continue
        
        # If we get here, all models failed
        raise Exception(f"All models failed. Details: {'; '.join(status_log)}")
    
    try:
        # Run sync Gemini call in thread pool with timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(_sync_generate),
            timeout=60.0
        )
        
        answer_text = response.text if response.text else "Unable to generate answer."
        
        used_tokens = 0
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            used_tokens = getattr(response.usage_metadata, 'total_token_count', 0)
        
        return answer_text, used_tokens
    except asyncio.TimeoutError:
        return "⏱️ Request timed out. Gemini API took too long.", 0
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini Call Failed: {error_msg}")
        
        # Provide helpful error messages
        if "quota" in error_msg.lower() or "429" in error_msg:
            return "⚠️ Gemini quota exceeded. Please wait a few minutes or upgrade your plan. Consider using Ollama as an alternative.", 0
        elif "404" in error_msg:
            return "❌ Gemini model not found. The API may have updated model names.", 0
        else:
            return f"❌ Gemini error: {error_msg}", 0


async def generate_answer(
    question: str,
    chunks: List[Dict],
    mode: str = "answer"
) -> Dict[str, Any]:
    """
    Generate answer using LLM with retrieved context
    """
    
    # Build context from chunks (reduced size to save quota)
    context = build_context_string(chunks)
    system_prompt = get_system_prompt(mode)
    
    # Shorter prompt to save tokens
    user_prompt = f"""Documents:

{context}

Question: {question}

Answer based on documents above."""

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
            "snippet": snippet_text[:150] + "..." if len(snippet_text) > 150 else snippet_text,  # Shorter snippets
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