import sqlite3
import os
from typing import List, Dict, Optional
from datetime import datetime

DB_PATH = "backend/data/rag_app.db"

class Database:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        conn = self._get_conn()
        cursor = conn.cursor()
        
        # Create files table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                physical_path TEXT NOT NULL,
                size INTEGER,
                mime_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create settings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add status column if not exists (migration)
        try:
            cursor.execute("ALTER TABLE files ADD COLUMN status TEXT DEFAULT 'uploaded'")
        except sqlite3.OperationalError:
            # Column likely already exists
            pass
            
        conn.commit()
        conn.close()

    def add_file(self, id: str, filename: str, physical_path: str, size: int, mime_type: str):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO files (id, filename, physical_path, size, mime_type, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (id, filename, physical_path, size, mime_type, datetime.utcnow().isoformat(), 'uploaded')
        )
        conn.commit()
        conn.close()
        
    def update_file_status(self, file_id: str, status: str):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("UPDATE files SET status = ? WHERE id = ?", (status, file_id))
        conn.commit()
        conn.close()

    def list_files(self, status: Optional[str] = None) -> List[Dict]:
        conn = self._get_conn()
        cursor = conn.cursor()
        
        if status:
            cursor.execute("SELECT * FROM files WHERE status = ? ORDER BY created_at DESC", (status,))
        else:
            cursor.execute("SELECT * FROM files ORDER BY created_at DESC")
            
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_file(self, file_id: str) -> Optional[Dict]:
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM files WHERE id = ?", (file_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    def delete_file(self, file_id: str):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM files WHERE id = ?", (file_id,))
        conn.commit()
        conn.close()

    def get_setting(self, key: str) -> Optional[str]:
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        return row['value'] if row else None

    def save_setting(self, key: str, value: str):
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
            (key, value, datetime.utcnow().isoformat())
        )
        conn.commit()
        conn.close()

# Global DB instance
db = Database()
