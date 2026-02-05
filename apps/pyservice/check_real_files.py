"""
Check what files are actually in the desktop database
"""
import sqlite3
import os

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

def analyze_files(db_path):
    """Analyze all files in database"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("📊 File Analysis")
        print("="*50)
        
        # Get all files with details
        cursor.execute("""
            SELECT id, name, path, type, extension, size, status, errorMessage
            FROM files 
            ORDER BY status, name
        """)
        files = cursor.fetchall()
        
        status_counts = {}
        
        for file_record in files:
            file_id, name, path, file_type, extension, size, status, error_msg = file_record
            
            if status not in status_counts:
                status_counts[status] = 0
            status_counts[status] += 1
            
            print(f"\n📄 {name}")
            print(f"   Path: {path}")
            print(f"   Type: {file_type} ({extension})")
            print(f"   Size: {size} bytes")
            print(f"   Status: {status}")
            if error_msg:
                print(f"   Error: {error_msg}")
            
            # Check chunks for this file
            cursor.execute("SELECT COUNT(*) FROM chunks WHERE fileId = ?", (file_id,))
            chunk_count = cursor.fetchone()[0]
            print(f"   Chunks: {chunk_count}")
            
            if chunk_count > 0:
                cursor.execute("""
                    SELECT id, chunkIndex, LENGTH(text) as text_length 
                    FROM chunks 
                    WHERE fileId = ? 
                    ORDER BY chunkIndex 
                    LIMIT 3
                """, (file_id,))
                sample_chunks = cursor.fetchall()
                
                print(f"   Sample chunks:")
                for chunk_id, chunk_index, text_length in sample_chunks:
                    print(f"     - Chunk {chunk_index}: {text_length} chars")
        
        print(f"\n📊 Summary:")
        for status, count in status_counts.items():
            print(f"   {status}: {count} files")
        
        # Check sources
        print(f"\n📂 Sources:")
        cursor.execute("SELECT name, path, status, totalFiles, indexedFiles, failedFiles FROM sources")
        sources = cursor.fetchall()
        
        for source in sources:
            name, path, status, total, indexed, failed = source
            print(f"   📁 {name}")
            print(f"      Path: {path}")
            print(f"      Status: {status}")
            print(f"      Files: {total} total, {indexed} indexed, {failed} failed")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

def suggest_actions(db_path):
    """Suggest actions to get real data"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Count files by status
        cursor.execute("SELECT status, COUNT(*) FROM files GROUP BY status")
        status_counts = dict(cursor.fetchall())
        
        # Count total chunks
        cursor.execute("SELECT COUNT(*) FROM chunks")
        total_chunks = cursor.fetchone()[0]
        
        print(f"\n💡 Suggestions:")
        
        if status_counts.get('error', 0) > 0:
            print(f"1. 🔧 Fix {status_counts['error']} failed files:")
            print(f"   - Backend is now running and fixed")
            print(f"   - Try 'Re-index All' in desktop app")
        
        if status_counts.get('pending', 0) > 0:
            print(f"2. ⏳ {status_counts['pending']} files are pending:")
            print(f"   - Wait for indexing to complete")
            print(f"   - Or restart indexing process")
        
        if total_chunks == 0:
            print(f"3. 📄 No text chunks found:")
            print(f"   - Add documents with text content (.txt, .md, .py, etc.)")
            print(f"   - Avoid binary files (.exe, .dll, .jpg)")
        
        if status_counts.get('indexed', 0) == 0:
            print(f"4. 🚀 To get real data:")
            print(f"   - Open DeskAI desktop app")
            print(f"   - Click 'Add Source'")
            print(f"   - Select folder with documents")
            print(f"   - Wait for indexing")
            print(f"   - Run sync script again")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    db_path = find_desktop_database()
    
    if not db_path:
        print("❌ Desktop database not found")
    else:
        analyze_files(db_path)
        suggest_actions(db_path)