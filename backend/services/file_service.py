import uuid
import os
from typing import List, Dict, Optional
from fastapi import UploadFile, HTTPException

from backend.database import db
from backend.services.storage.file_storage import FileStorageProvider, LocalFileStorageProvider
from backend.services.storage.vector_store import VectorStore

class FileService:
    def __init__(self, storage_provider: FileStorageProvider = None):
        self.storage = storage_provider or LocalFileStorageProvider()

    async def upload_file(self, file: UploadFile) -> Dict:
        """
        Upload a file:
        1. Generate UUID
        2. Save to physical storage
        3. Record in DB
        """
        file_id = str(uuid.uuid4())
        original_filename = file.filename
        
        # Determine mime type (basic)
        mime_type = file.content_type or "application/octet-stream"
        
        # Get file size by reading content
        # UploadFile.seek might not support whence in all versions
        content = await file.read()
        size = len(content)
        await file.seek(0)
        
        # Save to storage
        # We use ID + extension for physical filename to avoid collisions
        _, ext = os.path.splitext(original_filename)
        physical_filename = f"{file_id}{ext}"
        
        try:
            saved_path = await self.storage.save(file, physical_filename)
            
            # Record in DB
            db.add_file(
                id=file_id,
                filename=original_filename,
                physical_path=saved_path,
                size=size,
                mime_type=mime_type
            )
            
            return {
                "id": file_id,
                "filename": original_filename,
                "physical_path": saved_path,
                "size": size,
                "created_at": None # DB handles this, or we can fetch it back
            }
        except Exception as e:
            # Cleanup if storage succeeded but DB failed (simplified)
            # In a real app, we'd handle this more robustly
            raise e

    def list_files(self, status: Optional[str] = None) -> List[Dict]:
        return db.list_files(status)

    def update_status(self, file_id: str, status: str):
        db.update_file_status(file_id, status)

    def get_file(self, file_id: str) -> Optional[Dict]:
        return db.get_file(file_id)

    def delete_file(self, file_id: str, vector_store: VectorStore):
        """
        Delete a file:
        1. Get info from DB
        2. Delete from Storage
        3. Delete from Vector Store
        4. Delete from DB
        """
        file_record = db.get_file(file_id)
        if not file_record:
            return False
            
        # 1. Delete from Storage
        self.storage.delete(file_record["physical_path"])
        
        # 2. Delete from Vector Store
        # We delete by file_id (robust) AND source (legacy/fallback)
        # This ensures we clean up chunks whether they were ingested with the new ID or just filename
        try:
            vector_store.delete_by_metadata(file_id=file_id)
            vector_store.delete_by_metadata(source=file_record["filename"])
        except Exception as e:
            print(f"Warning: Error deleting vectors: {e}")
        
        # 3. Delete from DB
        db.delete_file(file_id)
        
        return True
