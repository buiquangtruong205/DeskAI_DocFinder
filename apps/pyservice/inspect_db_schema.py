"""
Inspect actual database schema
"""
import sqlite3
import os

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

def inspect_schema(db_path):
    """Inspect database schema"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Database Schema Inspection")
        print("="*50)
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        for table_name in [t[0] for t in tables]:
            print(f"\n📋 Table: {table_name}")
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            print("  Columns:")
            for col in columns:
                cid, name, type_, notnull, default, pk = col
                pk_str = " (PRIMARY KEY)" if pk else ""
                null_str = " NOT NULL" if notnull else ""
                default_str = f" DEFAULT {default}" if default else ""
                print(f"    - {name}: {type_}{null_str}{default_str}{pk_str}")
            
            # Get foreign keys
            cursor.execute(f"PRAGMA foreign_key_list({table_name})")
            fks = cursor.fetchall()
            if fks:
                print("  Foreign Keys:")
                for fk in fks:
                    id_, seq, table, from_, to, on_update, on_delete, match = fk
                    print(f"    - {from_} -> {table}.{to}")
        
        # Check current data in key tables
        print(f"\n📊 Data Summary")
        print("="*30)
        
        # Files table
        cursor.execute("SELECT COUNT(*) FROM files")
        file_count = cursor.fetchone()[0]
        print(f"Files: {file_count}")
        
        if file_count > 0:
            cursor.execute("SELECT * FROM files LIMIT 1")
            sample_file = cursor.fetchone()
            cursor.execute("PRAGMA table_info(files)")
            file_columns = [col[1] for col in cursor.fetchall()]
            print("Sample file record:")
            for i, col in enumerate(file_columns):
                value = sample_file[i] if i < len(sample_file) else None
                print(f"  {col}: {value}")
        
        # Sources table  
        cursor.execute("SELECT COUNT(*) FROM sources")
        source_count = cursor.fetchone()[0]
        print(f"\nSources: {source_count}")
        
        if source_count > 0:
            cursor.execute("SELECT * FROM sources LIMIT 1")
            sample_source = cursor.fetchone()
            cursor.execute("PRAGMA table_info(sources)")
            source_columns = [col[1] for col in cursor.fetchall()]
            print("Sample source record:")
            for i, col in enumerate(source_columns):
                value = sample_source[i] if i < len(sample_source) else None
                print(f"  {col}: {value}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    db_path = find_database()
    
    if not db_path:
        print("❌ Desktop database not found")
    else:
        inspect_schema(db_path)