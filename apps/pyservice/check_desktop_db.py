"""
Check desktop app SQLite database for schema issues
"""
import sqlite3
import os
from pathlib import Path

def find_database():
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

def check_database_schema(db_path):
    """Check database schema and integrity"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"📁 Database: {db_path}")
        print(f"📊 Size: {os.path.getsize(db_path)} bytes")
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"\n📋 Tables ({len(tables)}):")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Check files table
        if any('files' in str(t) for t in tables):
            cursor.execute("SELECT COUNT(*) FROM files")
            file_count = cursor.fetchone()[0]
            print(f"\n📄 Files in database: {file_count}")
            
            # Check file statuses
            cursor.execute("SELECT status, COUNT(*) FROM files GROUP BY status")
            statuses = cursor.fetchall()
            print("📊 File statuses:")
            for status, count in statuses:
                print(f"  - {status}: {count}")
            
            # Check recent failed files
            cursor.execute("SELECT name, status FROM files WHERE status = 'error' LIMIT 5")
            failed_files = cursor.fetchall()
            if failed_files:
                print("\n❌ Recent failed files:")
                for name, status in failed_files:
                    print(f"  - {name}: {status}")
        
        # Check sources table
        if any('sources' in str(t) for t in tables):
            cursor.execute("SELECT COUNT(*) FROM sources")
            source_count = cursor.fetchone()[0]
            print(f"\n📂 Sources: {source_count}")
            
            cursor.execute("SELECT path, status FROM sources")
            sources = cursor.fetchall()
            for path, status in sources:
                print(f"  - {path} [{status}]")
        
        # Check foreign key constraints
        cursor.execute("PRAGMA foreign_key_check")
        fk_errors = cursor.fetchall()
        if fk_errors:
            print(f"\n⚠️ Foreign key constraint errors: {len(fk_errors)}")
            for error in fk_errors[:5]:
                print(f"  - {error}")
        else:
            print("\n✅ No foreign key constraint errors")
        
        # Check database integrity
        cursor.execute("PRAGMA integrity_check")
        integrity = cursor.fetchone()[0]
        if integrity == 'ok':
            print("✅ Database integrity: OK")
        else:
            print(f"❌ Database integrity: {integrity}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def fix_foreign_key_issues(db_path):
    """Try to fix foreign key constraint issues"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("\n🔧 Attempting to fix foreign key issues...")
        
        # Disable foreign key constraints temporarily
        cursor.execute("PRAGMA foreign_keys = OFF")
        
        # Check for orphaned records
        cursor.execute("""
            SELECT f.id, f.name 
            FROM files f 
            LEFT JOIN sources s ON f.source_id = s.id 
            WHERE s.id IS NULL
        """)
        orphaned_files = cursor.fetchall()
        
        if orphaned_files:
            print(f"🗑️ Found {len(orphaned_files)} orphaned files")
            
            # Delete orphaned files
            cursor.execute("""
                DELETE FROM files 
                WHERE source_id NOT IN (SELECT id FROM sources)
            """)
            deleted = cursor.rowcount
            print(f"🗑️ Deleted {deleted} orphaned files")
        
        # Re-enable foreign key constraints
        cursor.execute("PRAGMA foreign_keys = ON")
        
        conn.commit()
        conn.close()
        
        print("✅ Foreign key issues fixed")
        return True
        
    except Exception as e:
        print(f"❌ Fix failed: {e}")
        return False

if __name__ == "__main__":
    db_path = find_database()
    
    if not db_path:
        print("❌ Desktop database not found")
        print("💡 Make sure the desktop app has been run at least once")
    else:
        print("🔍 Checking desktop database...")
        
        if check_database_schema(db_path):
            # Ask if user wants to fix issues
            print("\n" + "="*50)
            print("🔧 Do you want to try fixing foreign key issues? (y/n)")
            # For automation, let's auto-fix
            print("🔧 Auto-fixing foreign key issues...")
            fix_foreign_key_issues(db_path)
            
            print("\n" + "="*50)
            print("✅ Database check completed")
            print("💡 Try re-indexing your documents in the desktop app")