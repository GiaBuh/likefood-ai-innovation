import urllib.request
import json
import traceback

key = "sk-3pRpsO1724qY7vYLfCYCoa3dY2d3v1XDSvDxTckKiim2SJo3"
urls = {
    "OpenAI_Custom": "https://newapi.ccfilm.online/v1/models",
}

for name, url in urls.items():
    print(f"Testing {name}...")
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'Bearer {key}',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    )
    try:
        response = urllib.request.urlopen(req, timeout=10)
        data = json.loads(response.read().decode())
        models = data.get('data', [])
        print(f"[{name}] Success! Found {len(models)} models.")
        print(f"[{name}] Models include: " + ", ".join([m.get('id', 'unknown') for m in models[:30]]) + "...\n")
    except urllib.error.HTTPError as e:
        print(f"[{name}] HTTP Error: {e.code} - {e.reason}")
        try:
            print(f"[{name}] Details: {e.read().decode()}")
        except:
            pass
        print("")
    except Exception as e:
        print(f"[{name}] Error: {e}\n")
