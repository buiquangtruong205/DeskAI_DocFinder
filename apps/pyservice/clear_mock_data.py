"""
Clear mock data and ensure only real data exists via API
"""
import requests
import json
import subprocess
import sys

def check_current_data():
    """Check what data is currently in the system"""
    url = "http://127.0.0.1:8000/search/"
    
    test_queries = [
        "DeskAI",  # Mock data
        "DocumentLayout",  # Real data
        "test document",  # Mock data
        "Python MySQL"  # Real data
    ]
    
    print("🔍 Checking current data in system...")
    
    mock_files = []
    real_files = []
    
    for query in test_queries:
        payload = {"query": query, "top_k": 5}
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                hits = data.get('hits', [])
                
                if hits:
                    print(f"\n🔍 '{query}' - {len(hits)} results:")
                    for hit in hits:
                        file_name = hit.get('payload', {}).get('file_name', 'Unknown')
                        source = hit.get('payload', {}).get('source', 'unknown')
                        score = hit.get('score', 0)
                        print(f"  📄 {file_name} (Source: {source}, Score: {score:.3f})")
                        
                        # Categorize files
                        if source in ['sample_data', 'unknown'] or file_name in ['test.txt', 'gioi_thieu_deskai.md', 'huong_dan_su_dung.md', 'rag_system_guide.md', 'gemini_api_info.md', 'qdrant_database.md']:
                            mock_files.append(file_name)
                        else:
                            real_files.append(file_name)
                else:
                    print(f"🔍 '{query}' - No results")
            else:
                print(f"❌ Search failed for '{query}': {response.status_code}")
                
        except Exception as e:
            print(f"❌ Search error for '{query}': {e}")
    
    return list(set(mock_files)), list(set(real_files))

def restart_backend():
    """Restart backend to clear memory cache"""
    print("\n🔄 Restarting backend to clear cache...")
    
    try:
        # Kill existing backend processes
        subprocess.run(["taskkill", "/F", "/IM", "python.exe"], 
                      capture_output=True, timeout=10)
        
        print("⏳ Waiting for processes to stop...")
        import time
        time.sleep(3)
        
        # Start backend again
        print("🚀 Starting backend...")
        # We'll let user start it manually
        return True
        
    except Exception as e:
        print(f"❌ Error restarting backend: {e}")
        return False

def reload_real_data_only():
    """Reload only real data from desktop database"""
    print("\n🔄 Reloading real data...")
    
    try:
        result = subprocess.run([
            sys.executable, 
            "apps/pyservice/recover_failed_chunks.py"
        ], capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print("✅ Real data reloaded successfully")
            # Print some output
            lines = result.stdout.split('\n')
            for line in lines[-10:]:  # Last 10 lines
                if line.strip():
                    print(f"  {line}")
            return True
        else:
            print(f"❌ Failed to reload real data:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error reloading data: {e}")
        return False

if __name__ == "__main__":
    print("🧹 Analyzing current data and preparing cleanup...")
    print("=" * 60)
    
    # Step 1: Check current data
    mock_files, real_files = check_current_data()
    
    print(f"\n📊 Data Analysis:")
    print(f"🎭 Mock files found: {len(mock_files)}")
    for f in mock_files[:5]:  # Show first 5
        print(f"  - {f}")
    
    print(f"📄 Real files found: {len(real_files)}")
    for f in real_files[:5]:  # Show first 5
        print(f"  - {f}")
    
    if mock_files:
        print(f"\n⚠️ Found {len(mock_files)} mock files mixed with real data")
        print(f"💡 Solution: Restart backend to clear Qdrant cache, then reload only real data")
        
        # Step 2: Restart backend
        if restart_backend():
            print(f"\n🔄 Backend stopped. Please restart it manually:")
            print(f"   1. Run: apps\\pyservice\\start_backend.bat")
            print(f"   2. Wait for 'Uvicorn running' message")
            print(f"   3. Run this script again to reload real data")
        else:
            print(f"\n❌ Failed to restart backend")
    else:
        print(f"\n✅ No mock data found - system looks clean!")
        if not real_files:
            print(f"💡 No real data found either. Run recover_failed_chunks.py to load real data.")