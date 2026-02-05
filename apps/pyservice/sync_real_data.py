"""
Sync real data from desktop SQLite database to Qdrant
"""
import sqlite3
import os
import requests
import json
import uuid
from pathlib import Path

def find_desktop_database():
    """Find the desktop app database"""
    appdata = os.environ.get('APPDATA', '')
    possible_paths = [
        os.path.join(appdata, 'deskai-desktop', 'deskai.db'),
        os.path.join(appdata, 'Electron', 'deskai.db'),
        os.path.join(appdata, 'Diffusers', 'deskai.db')
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    return None

def get_indexed_chunks_from_db(db_path):
    """Get successfully indexed chunks from desktop database"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get files that have been successfully indexed
        cursor.execute("""
            SELECT f.id, f.name, f.path, f.type, f.extension, f.size, f.mtime
            FROM files f 
            WHERE f.status = 'indexed'
        """)
        indexed_files = cursor.fetchall()
        
        print(f"📄 Found {len(indexed_files)} successfully indexed files")
        
        if not indexed_files:
            print("⚠️ No indexed files found. Try re-indexing in desktop app first.")
            return []
        
        all_chunks = []
        
        for file_record in indexed_files:
            file_id, name, path, file_type, extension, size, mtime = file_record
            
            # Get chunks for this file
            cursor.execute("""
                SELECT id, chunkIndex, text, startOffset, endOffset
                FROM chunks 
                WHERE fileId = ?
                ORDER BY chunkIndex
            """, (file_id,))
            
            chunks = cursor.fetchall()
            
            print(f"  📄 {name}: {len(chunks)} chunks")
            
            for chunk_record in chunks:
                chunk_id, chunk_index, text, start_offset, end_offset = chunk_record
                
                if text and len(text.strip()) > 10:  # Only non-empty chunks
                    chunk_data = {
                        "chunkId": chunk_id,  # Use existing chunk ID
                        "text": text,
                        "fileId": file_id,
                        "metadata": {
                            "file_name": name,
                            "file_path": path,
                            "file_type": file_type or "unknown",
                            "file_extension": extension or "",
                            "file_size": size or 0,
                            "mtime_ms": int(mtime) if mtime else 0,
                            "chunk_index": chunk_index,
                            "start_offset": start_offset,
                            "end_offset": end_offset,
                            "source": "desktop_app"
                        }
                    }
                    all_chunks.append(chunk_data)
        
        conn.close()
        return all_chunks
        
    except Exception as e:
        print(f"❌ Error reading database: {e}")
        return []

def send_chunks_to_backend(chunks, batch_size=10):
    """Send chunks to backend API in batches"""
    if not chunks:
        print("⚠️ No chunks to send")
        return False
    
    url = "http://127.0.0.1:8000/index/"
    total_chunks = len(chunks)
    successful_batches = 0
    
    print(f"📤 Sending {total_chunks} chunks in batches of {batch_size}...")
    
    for i in range(0, total_chunks, batch_size):
        batch = chunks[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total_chunks + batch_size - 1) // batch_size
        
        payload = {"chunks": batch}
        
        try:
            print(f"📦 Batch {batch_num}/{total_batches} ({len(batch)} chunks)...")
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                indexed_count = data.get('indexed_count', 0)
                print(f"  ✅ Success: {indexed_count} chunks indexed")
                successful_batches += 1
            else:
                print(f"  ❌ Failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("  ❌ Connection failed - is backend running?")
            return False
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print(f"\n📊 Results: {successful_batches}/{total_batches} batches successful")
    return successful_batches > 0

def test_search_with_real_data():
    """Test search with real data"""
    url = "http://127.0.0.1:8000/search/"
    
    test_queries = [
        "json",
        "document", 
        "layout",
        "backup",
        "config"
    ]
    
    print(f"\n🔍 Testing search with real data...")
    
    for query in test_queries:
        payload = {"query": query, "top_k": 3}
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                hits = data.get('hits', [])
                
                print(f"\n🔍 Query: '{query}' - {len(hits)} results")
                for hit in hits[:2]:
                    file_name = hit.get('payload', {}).get('file_name', 'Unknown')
                    score = hit.get('score', 0)
                    snippet = hit.get('snippet', '')[:100]
                    print(f"  📄 {file_name} (Score: {score:.3f})")
                    print(f"     {snippet}...")
            else:
                print(f"❌ Search failed for '{query}': {response.status_code}")
                
        except Exception as e:
            print(f"❌ Search error for '{query}': {e}")

def test_rag_with_real_data():
    """Test RAG Q&A with real data"""
    url = "http://127.0.0.1:8000/ask/"
    
    questions = [
        "Có những file nào trong hệ thống?",
        "File json có gì đặc biệt?",
        "DocumentLayout là gì?",
        "Có file backup nào không?"
    ]
    
    print(f"\n🤖 Testing RAG Q&A with real data...")
    
    for question in questions:
        payload = {
            "question": question,
            "mode": "answer",
            "top_k": 3
        }
        
        try:
            print(f"\n❓ {question}")
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                answer = data.get('answer', 'Không có câu trả lời')
                citations = data.get('citations', [])
                
                print(f"🤖 {answer}")
                
                if citations:
                    print(f"📚 Nguồn ({len(citations)} files):")
                    for citation in citations[:2]:
                        name = citation.get('name', 'Unknown')
                        score = citation.get('score', 0)
                        print(f"  - {name} (Score: {score:.3f})")
            else:
                print(f"❌ RAG failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ RAG error: {e}")

if __name__ == "__main__":
    print("🔄 Syncing real data from desktop database to RAG system...")
    
    # Find desktop database
    db_path = find_desktop_database()
    if not db_path:
        print("❌ Desktop database not found")
        exit(1)
    
    print(f"📁 Using database: {db_path}")
    
    # Get indexed chunks
    chunks = get_indexed_chunks_from_db(db_path)
    
    if not chunks:
        print("\n💡 No indexed chunks found. To get real data:")
        print("1. Open desktop app")
        print("2. Add document sources") 
        print("3. Wait for indexing to complete")
        print("4. Run this script again")
        exit(1)
    
    # Send to backend
    if send_chunks_to_backend(chunks):
        print("\n✅ Real data sync completed!")
        
        # Test search and RAG
        test_search_with_real_data()
        test_rag_with_real_data()
        
        print(f"\n🎉 Your RAG system now has real data!")
        print(f"📊 Total chunks: {len(chunks)}")
        print(f"💡 You can now ask questions about your actual documents!")
    else:
        print("\n❌ Sync failed. Check if backend is running.")