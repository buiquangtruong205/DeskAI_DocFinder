"""
Recover chunks from files that failed to index due to "fetch failed" error
"""
import sqlite3
import os
import requests
import json
import uuid

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

def get_failed_chunks(db_path):
    """Get chunks from files that failed with 'fetch failed' error"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get files that failed with "fetch failed" but have chunks
        cursor.execute("""
            SELECT f.id, f.name, f.path, f.type, f.extension, f.size, f.mtime
            FROM files f 
            WHERE f.status = 'error' 
            AND f.errorMessage = 'fetch failed'
            AND EXISTS (SELECT 1 FROM chunks c WHERE c.fileId = f.id)
        """)
        failed_files = cursor.fetchall()
        
        print(f"📄 Found {len(failed_files)} files with recoverable chunks")
        
        all_chunks = []
        
        for file_record in failed_files:
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
                
                if text and len(text.strip()) > 5:  # Only non-empty chunks
                    # Generate new UUID for chunk since original might not be valid
                    new_chunk_id = str(uuid.uuid4())
                    
                    chunk_data = {
                        "chunkId": new_chunk_id,
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
                            "source": "recovered_from_desktop",
                            "original_chunk_id": chunk_id
                        }
                    }
                    all_chunks.append(chunk_data)
        
        conn.close()
        return all_chunks
        
    except Exception as e:
        print(f"❌ Error reading database: {e}")
        return []

def send_chunks_to_backend(chunks, batch_size=5):
    """Send chunks to backend API in batches"""
    if not chunks:
        print("⚠️ No chunks to send")
        return False
    
    url = "http://127.0.0.1:8000/index/"
    total_chunks = len(chunks)
    successful_chunks = 0
    
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
                successful_chunks += indexed_count
                print(f"  ✅ Success: {indexed_count} chunks indexed")
            else:
                print(f"  ❌ Failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("  ❌ Connection failed - is backend running?")
            return False
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print(f"\n📊 Results: {successful_chunks}/{total_chunks} chunks successfully indexed")
    return successful_chunks > 0

def test_search_with_recovered_data():
    """Test search with recovered data"""
    url = "http://127.0.0.1:8000/search/"
    
    # Test queries based on the files we saw
    test_queries = [
        "DocumentLayout",
        "json configuration", 
        "python code",
        "vscode settings",
        "launch configuration",
        "SQL",
        "Report"
    ]
    
    print(f"\n🔍 Testing search with recovered data...")
    
    for query in test_queries:
        payload = {"query": query, "top_k": 3}
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                hits = data.get('hits', [])
                
                if hits:
                    print(f"\n🔍 Query: '{query}' - {len(hits)} results")
                    for hit in hits[:2]:
                        file_name = hit.get('payload', {}).get('file_name', 'Unknown')
                        score = hit.get('score', 0)
                        snippet = hit.get('snippet', '')[:80]
                        print(f"  📄 {file_name} (Score: {score:.3f})")
                        print(f"     {snippet}...")
            else:
                print(f"❌ Search failed for '{query}': {response.status_code}")
                
        except Exception as e:
            print(f"❌ Search error for '{query}': {e}")

def test_rag_with_recovered_data():
    """Test RAG Q&A with recovered data"""
    url = "http://127.0.0.1:8000/ask/"
    
    questions = [
        "Có những file nào trong hệ thống?",
        "File DocumentLayout.json chứa gì?",
        "Có file Python nào không?",
        "VSCode configuration như thế nào?",
        "File launch.json có tác dụng gì?"
    ]
    
    print(f"\n🤖 Testing RAG Q&A with recovered data...")
    
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
    print("🔄 Recovering chunks from failed files...")
    
    # Find desktop database
    db_path = find_desktop_database()
    if not db_path:
        print("❌ Desktop database not found")
        exit(1)
    
    print(f"📁 Using database: {db_path}")
    
    # Get failed chunks
    chunks = get_failed_chunks(db_path)
    
    if not chunks:
        print("\n⚠️ No recoverable chunks found.")
        print("💡 This means either:")
        print("   - No files failed with 'fetch failed' error")
        print("   - Failed files don't have text chunks")
        print("   - All chunks are empty or too short")
        exit(1)
    
    print(f"\n📊 Found {len(chunks)} recoverable chunks from real files")
    
    # Show sample of what we're recovering
    print(f"\n📄 Sample chunks:")
    for i, chunk in enumerate(chunks[:3]):
        file_name = chunk['metadata']['file_name']
        text_preview = chunk['text'][:100].replace('\n', ' ')
        print(f"  {i+1}. {file_name}: {text_preview}...")
    
    # Send to backend
    if send_chunks_to_backend(chunks):
        print(f"\n✅ Recovery completed!")
        print(f"📊 Successfully indexed {len(chunks)} chunks from your real files")
        
        # Test search and RAG
        test_search_with_recovered_data()
        test_rag_with_recovered_data()
        
        print(f"\n🎉 Your RAG system now has REAL data from your documents!")
        print(f"💡 You can now ask questions about:")
        
        # Show unique files
        unique_files = set(chunk['metadata']['file_name'] for chunk in chunks)
        for file_name in sorted(unique_files):
            print(f"   - {file_name}")
            
    else:
        print("\n❌ Recovery failed. Check if backend is running.")