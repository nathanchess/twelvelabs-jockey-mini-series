import requests
import time
import os

from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

TL_API_KEY = os.getenv("TL_API_KEY")
KNOWLEDGE_STORE_ID = os.getenv("KNOWLEDGE_STORE_ID")

BASE_URL = "https://api.twelvelabs.io/v1.3"
HEADERS = {"x-api-key": TL_API_KEY, "Content-Type": "application/json"}
LIBRARY_FILE_PATH = Path(__file__).parent / "library"

def upload_assets(library_path: Path):
    """
    Upload assets into TwelveLabs platform from local device. Optional if you already have assets uploaded.
    """
    files = []
    for file in library_path.glob("*.mp4"):
        file_path = file.as_posix()
        response = requests.post(
            f"{BASE_URL}/assets",
            headers=HEADERS,
            files = [
                ("method", (None, "direct")),
                ("files", open(file_path, "rb"))
            ]
        )
        asset = response.json()
        print(f"Asset ID: {asset['_id']}, Status: {asset['status']}")
        files.append(asset['_id'])
    return files

def create_knowledge_store(name: str, ingestion_config: dict):
    """
    Create a knowledge store in TwelveLabs platform.
    """
    normalized_ingestion_config = ingestion_config.get("ingestion_config", ingestion_config)
    request_body = {
        "name": name,
    }

    if ingestion_config:
        request_body["ingestion_config"] = normalized_ingestion_config
        
    response = requests.post(f"{BASE_URL}/knowledge-stores", headers=HEADERS, json=request_body)

    print(response.json())

    store_id = response.json().get('_id')
    print(f"Knowledge Store ID: {store_id}, Status: {response.json().get('status')}")
    return store_id

def ingest_assets(store_id: str, asset_id: str):
    response = requests.post(
        f"{BASE_URL}/knowledge-stores/{store_id}/items",
        headers=HEADERS,
        json={
            "asset_id": asset_id
        }
    )
    item_id = response.json()["_id"]
    print(f"Item added: {item_id}")

    while True:

        status = requests.get(
            f"{BASE_URL}/knowledge-stores/{store_id}/items/{item_id}",
            headers=HEADERS
        ).json()["status"]

        if status == "ready":
            break
        elif status == "failed":

            raise Exception("Indexing failed")
        print(f"Status: {status}, waiting...")
        time.sleep(10)

    print("Indexing complete")

def prompt(user_prompt: str, store_id: str):
    response = requests.post(
        f"{BASE_URL}/responses",
        headers=HEADERS,
        json={
            "model": "jockey1.0",
            "input": [
                {"type": "message", "role": "user", "content": user_prompt}
            ],
            "knowledge_store_id": store_id
        }
    )

    result = response.json()
    print(f"ID: {result['id']}")
    print(f"Session: {result['session_id']}")
    for output in result["output"]:
        if output["type"] == "message":
            for content in output["content"]:
                print(content["text"])
    print(f"Tokens: {result['usage']}")

    return result

def main():

    sports_knowledge_store_id = create_knowledge_store("Sports Compliance", ingestion_config={
        "enrichment_config": {
            "type": "json_schema",
            "json_schema": {
                "type": "object",
                "properties": {
                    "people_count": {"type": "integer", "description": "Number of people visible in the frame"},
                    "people_names": {"type": "array", "description": "Names of the soccer players visible in the frame"},
                    "people_actions": {"type": "array", "description": "Actions of the soccer players visible in the frame linked to the people names"},
                }
            }
        }
    })

    print(f"Sports Knowledge Store ID: {sports_knowledge_store_id}")

    ingest_assets(sports_knowledge_store_id, "6a074cc69bcc9263a999d3a8")
    ingest_assets(sports_knowledge_store_id, "6a074cc64c96226146a580e6")
    ingest_assets(sports_knowledge_store_id, "6a074cc79bcc9263a999d3a9")
    ingest_assets(sports_knowledge_store_id, "6a074cc76661edbede2ebe3e")
    ingest_assets(sports_knowledge_store_id, "6a074cc89bcc9263a999d3ac")
    ingest_assets(sports_knowledge_store_id, "6a074cc8b8a3c67c5bbfefaa")

    prompt("Give a detailed report of Cristiano Ronaldo's actions in the videos?", sports_knowledge_store_id)

if __name__ == "__main__":
    main()