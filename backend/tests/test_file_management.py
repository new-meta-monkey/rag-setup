import requests
import os
import time

BASE_URL = "http://localhost:8004"
TEST_FILE_PATH = "backend/data/uploads/test_upload.txt"

def test_file_management():
    print("Starting File Management Test (Requests vs Live Server)...")
    
    # 1. Create a dummy file content
    with open("test_upload.txt", "w") as f:
        f.write("This is a test file for the file management system.")
    
    try:
        # Wait for server to be ready
        print("Waiting for server...")
        for _ in range(10):
            try:
                requests.get(f"{BASE_URL}/docs")
                break
            except:
                time.sleep(1)
        else:
            print("Server not ready.")
            return

        # 2. Upload the file
        print("\n1. Uploading file...")
        with open("test_upload.txt", "rb") as f:
            files = {"file": ("test_upload.txt", f, "text/plain")}
            response = requests.post(f"{BASE_URL}/extract", files=files)
            
        if response.status_code != 200:
            print(f"FAILED: Upload failed with status {response.status_code}")
            print(response.text)
            return
            
        data = response.json()
        file_id = data.get("file_id")
        filename = data.get("filename")
        print(f"Upload successful. ID: {file_id}, Filename: {filename}")
        
        # 3. Verify file exists on disk (Physical path might have ID now)
        saved_path = data.get("saved_path")
        if os.path.exists(saved_path):
            print(f"SUCCESS: File exists on disk at {saved_path}")
        else:
            print(f"FAILED: File not found at {saved_path}")

        # 4. Store vectors (Simulate IngestPage behavior)
        print("\n2. Storing vectors with file_id...")
        store_req = {
            "chunks": [{"text": "This is a test chunk.", "metadata": {"page": 1}}],
            "metadatas": [{"source": filename, "file_id": file_id}],
            "provider": "local",
            "config": {"model_name": "all-MiniLM-L6-v2"}
        }
        # Note: We need to make sure 'local' provider is configured or use a mock.
        # If local provider fails (e.g. missing library), we might skip this or use a mock.
        # For now, let's try calling it. If it fails, we'll know.
        try:
            store_res = requests.post(f"{BASE_URL}/store", json=store_req)
            if store_res.status_code == 200:
                print("Vectors stored successfully.")
            else:
                print(f"Warning: Store failed with {store_res.status_code}. {store_res.text}")
        except Exception as e:
            print(f"Warning: Store request failed: {e}")
            
        # 5. List files
        print("\n3. Listing files...")
        response = requests.get(f"{BASE_URL}/files")
        files_list = response.json()
        found = any(f["id"] == file_id for f in files_list)
        
        if found:
            print(f"SUCCESS: File {file_id} found in list. Total files: {len(files_list)}")
        else:
            print("FAILED: File not found in list.")
            
        # 6. Delete file (Cascade delete using ID)
        print("\n4. Deleting file...")
        response = requests.delete(f"{BASE_URL}/files/{file_id}")
        
        if response.status_code == 200:
            print("Delete request successful.")
        else:
            print(f"FAILED: Delete request failed with status {response.status_code}")
            print(response.text)
            
        # 6. Verify file gone from disk
        if not os.path.exists(saved_path):
            print("SUCCESS: File removed from disk.")
        else:
            print("FAILED: File still exists on disk.")
            
        # 7. Verify removed from list
        response = requests.get(f"{BASE_URL}/files")
        files_list = response.json()
        found = any(f["id"] == file_id for f in files_list)
        if not found:
            print("SUCCESS: File removed from list.")
        else:
            print("FAILED: File still in list.")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        if os.path.exists("test_upload.txt"):
            os.remove("test_upload.txt")

if __name__ == "__main__":
    test_file_management()
