import requests
import sys

def check_qdrant():
    try:
        r = requests.get("http://localhost:6333/collections")
        if r.status_code == 200:
            print("✅ Qdrant is UP")
            return True
        else:
            print(f"❌ Qdrant returned {r.status_code}")
            return False
    except Exception as e:
        print(f"❌ Qdrant check failed: {e}")
        return False

def check_python_service():
    try:
        # Search endpoint check (empty query)
        payload = {"query": "test", "top_k": 1}
        r = requests.post("http://localhost:8000/search", json=payload)
        if r.status_code == 200:
            print("✅ Python Search API is UP")
            return True
        else:
            print(f"❌ Python Search API returned {r.status_code}: {r.text}")
            return False
    except Exception as e:
        print(f"❌ Python API check failed: {e}")
        return False

if __name__ == "__main__":
    q = check_qdrant()
    p = check_python_service()
    if q and p:
        sys.exit(0)
    else:
        sys.exit(1)
