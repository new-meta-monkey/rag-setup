import requests
import json

BASE_URL = "http://localhost:8000"

def test_chat_flow():
    # 1. Ingest a dummy resume
    resume_text = """
    Name: Karthik Developer
    Role: Senior Web Designer
    Experience: 5 years in React, TypeScript, and UI/UX design.
    """
    
    print("1. Ingesting dummy resume...")
    # We'll use the /chunk endpoint to simulate ingestion or just use /store directly if possible.
    # Actually /store is better.
    
    store_req = {
        "chunks": [{"text": resume_text, "metadata": {"source": "resume.txt"}}],
        "provider": "vertex", 
        "config": {}
    }
    
    print("Ingesting chunk...")
    requests.post(f"{BASE_URL}/store", json=store_req)
    
    # 2. Query 1: "Experience Web designer"
    print("\n2. Query 1: 'Experience Web designer'")
    q1 = {
        "query": "Experience Web designer",
        "n_results": 1,
        "min_score": 0.0, # Ensure we get results
        "history": []
    }
    
    try:
        res1 = requests.post(f"{BASE_URL}/query", json=q1)
        data1 = res1.json()
        print(f"Response 1: {data1.get('answer')}")
        
        if not data1.get('sources'):
            print("WARNING: No sources found for Query 1. Test might be invalid if resume isn't in DB.")
        
        # 3. Query 2: "developer name" with history
        print("\n3. Query 2: 'developer name' (with history)")
        
        history = [
            {"role": "user", "content": "Experience Web designer"},
            {"role": "assistant", "content": data1.get('answer', 'some answer')}
        ]
        
        q2 = {
            "query": "developer name",
            "n_results": 5,
            "min_score": 0.6, # Set a high score to simulate retrieval failure for vague query
            "history": history
        }
        
        res2 = requests.post(f"{BASE_URL}/query", json=q2)
        data2 = res2.json()
        
        print(f"Response 2: {data2.get('answer')}")
        print(f"Sources 2: {len(data2.get('sources', []))}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat_flow()
