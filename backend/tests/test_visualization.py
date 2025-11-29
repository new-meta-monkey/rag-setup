import requests
import json

def test_visualize_endpoint():
    print("Testing /visualize_stored endpoint...")
    try:
        response = requests.get("http://localhost:8000/visualize_stored?method=pca&n_components=2")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Status: {response.status_code}")
            print(f"Total points: {data.get('total', 0)}")
            
            points = data.get('points', [])
            if points:
                print("Sample point:")
                print(json.dumps(points[0], indent=2))
            else:
                print("No points returned (knowledge base might be empty)")
        else:
            print(f"❌ Failed! Status: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_visualize_endpoint()
