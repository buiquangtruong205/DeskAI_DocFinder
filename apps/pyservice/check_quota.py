"""
Check Gemini API quota status and provide solutions
"""

import os
import sys
from dotenv import load_dotenv

# Try to load .env from 3 levels up (project root)
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
load_dotenv(env_path)

try:
    import google.generativeai as genai
    print(f"google-generativeai version: {genai.__version__}")
except ImportError:
    print("❌ google-generativeai NOT installed")
    exit(1)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ GEMINI_API_KEY not found in environment")
    exit(1)

genai.configure(api_key=api_key)

print("🔍 Checking available models and quota status...\n")

# Test with lite models first (more quota-friendly)
lite_models = [
    'gemini-flash-lite-latest',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
    'gemini-2.5-flash-lite'
]

working_models = []
quota_exceeded_models = []

for model_name in lite_models:
    print(f"Testing {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hi")
        print(f"✅ {model_name} - Working!")
        working_models.append(model_name)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            print(f"⚠️ {model_name} - Quota exceeded")
            quota_exceeded_models.append(model_name)
        else:
            print(f"❌ {model_name} - Error: {error_msg}")

print(f"\n📊 Results:")
print(f"✅ Working models: {len(working_models)}")
print(f"⚠️ Quota exceeded: {len(quota_exceeded_models)}")

if working_models:
    print(f"\n🎉 You can use these models:")
    for model in working_models:
        print(f"  - {model}")
else:
    print(f"\n💡 Solutions:")
    print(f"1. Wait for quota reset (usually daily)")
    print(f"2. Upgrade to paid plan: https://ai.google.dev/pricing")
    print(f"3. Use Ollama as alternative (free, runs locally)")
    print(f"4. Try again in a few hours")

print(f"\n📖 Quota info: https://ai.google.dev/gemini-api/docs/rate-limits")