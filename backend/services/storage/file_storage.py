import os
import shutil
from typing import Optional
from abc import ABC, abstractmethod
from fastapi import UploadFile

class FileStorageProvider(ABC):
    @abstractmethod
    async def save(self, file: UploadFile, filename: str) -> str:
        """Save uploaded file and return the stored path"""
        pass

    @abstractmethod
    def delete(self, path: str) -> bool:
        """Delete a file by its path"""
        pass

    @abstractmethod
    def get_path(self, filename: str) -> Optional[str]:
        """Get absolute path to the file"""
        pass

class LocalFileStorageProvider(FileStorageProvider):
    def __init__(self, base_dir: str = "backend/data/uploads"):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    async def save(self, file: UploadFile, filename: str) -> str:
        # We assume filename is already sanitized or UUID-based if needed
        file_path = os.path.join(self.base_dir, filename)
        
        # Reset cursor just in case
        await file.seek(0)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

    def delete(self, path: str) -> bool:
        # Security check: ensure path is within base_dir
        # For now, we trust the path comes from our DB which stores relative or full paths
        # But let's be safe and resolve it
        
        # If path is just filename, join with base_dir
        if not os.path.isabs(path):
            path = os.path.join(self.base_dir, path)
            
        if os.path.exists(path):
            os.remove(path)
            return True
        return False

    def get_path(self, filename: str) -> Optional[str]:
        file_path = os.path.join(self.base_dir, filename)
        if os.path.exists(file_path):
            return os.path.abspath(file_path)
        return None
