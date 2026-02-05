import asyncio
import os
import sys

# Add app directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

try:
    from app.services.rag_answerer import call_gemini
except ImportError as e:
    print(f"Error importing rag_answerer: {e}")
    sys.exit(1)

async def test_gemini():
    print("Testing call_gemini...")
    prompt = "Hello, reply with 'OK'"
    system_prompt = "You are a test bot."
    
    try:
        answer, tokens = await call_gemini(prompt, system_prompt)
        print(f"Answer: {answer}")
        print(f"Tokens: {tokens}")
    except Exception as e:
        print(f"Call failed: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_gemini())
