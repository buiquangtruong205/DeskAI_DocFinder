import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

print("Starting checks...", flush=True)
env_path = r"E:\DeskAI_DocFinder\.env"
if os.path.exists(env_path):
    print(f"Loading env from {env_path}", flush=True)
    load_dotenv(env_path)
else:
    print("Env file not found!", flush=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("API Key missing!", flush=True)
else:
    print(f"API Key present (len={len(api_key)})", flush=True)
    genai.configure(api_key=api_key)
    print("Listing models...", flush=True)
    try:
        for m in genai.list_models():
            print(f"Found: {m.name}", flush=True)
    except Exception as e:
        print(f"Error: {e}", flush=True)
print("Done.", flush=True)
