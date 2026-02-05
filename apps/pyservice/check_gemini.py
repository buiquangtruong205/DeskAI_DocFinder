import os
import sys
from dotenv import load_dotenv

# Try to load .env from 3 levels up (project root)
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))
load_dotenv(env_path)

print(f"Python executable: {sys.executable}")
print(f"Loading env from: {env_path}")

try:
    import google.generativeai as genai
    print(f"google-generativeai version: {genai.__version__}")
except ImportError:
    print("❌ google-generativeai NOT installed")
    exit(1)
except AttributeError:
    print("⚠️ google-generativeai installed but __version__ not found (likely very old)")

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    # Try looking in current dir .env as fallback
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ GEMINI_API_KEY not found in environment")
    exit(1)
else:
    print(f"API Key found: {api_key[:5]}...{api_key[-5:]}")

genai.configure(api_key=api_key)

print("\n--- Listing Models ---")
try:
    found_any = False
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            found_any = True
    if not found_any:
        print("⚠️ No models found with 'generateContent' capability.")
except Exception as e:
    print(f"❌ Error listing models: {e}")

print("\n--- Testing Generation (gemini-2.5-flash) ---")
try:
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content("Hello, can you hear me?")
    print(f"✅ Success! Response: {response.text}")
except Exception as e:
    print(f"❌ Failed gemini-2.5-flash: {e}")

print("\n--- Testing Generation (gemini-2.0-flash) ---")
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content("Hello, can you hear me?")
    print(f"✅ Success! Response: {response.text}")
except Exception as e:
    print(f"❌ Failed gemini-2.0-flash: {e}")
