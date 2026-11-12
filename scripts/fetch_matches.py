import json
import os
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError

API_KEY = os.environ.get("CITO_API_KEY")

if not API_KEY:
    raise RuntimeError("CITO_API_KEY is not configured")

BASE_URL = "https://api.citoapi.com/api/v1/cs2"

def fetch(endpoint):
    request = Request(
        BASE_URL + endpoint,
        headers={"x-api-key": API_KEY}
    )

    try:
        with urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        print(error.read().decode("utf-8"))
        raise

    if not result.get("success"):
        raise RuntimeError("Cito API returned an unsuccessful response")

    return result.get("data", [])

live = fetch("/live")
upcoming = fetch("/matches/upcoming?limit=50")

result = {
    "updatedAt": datetime.now(timezone.utc).isoformat(),
    "live": live,
    "upcoming": upcoming
}

os.makedirs("public", exist_ok=True)

with open("public/matches.json", "w", encoding="utf-8") as file:
    json.dump(result, file, ensure_ascii=False, indent=2)

print(f"Live matches: {len(live)}")
print(f"Upcoming matches: {len(upcoming)}")
