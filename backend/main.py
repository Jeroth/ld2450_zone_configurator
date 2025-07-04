from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import aiohttp
import os
import json

app = FastAPI()

# Mount the React build as static files
app.mount("/static", StaticFiles(directory="/app/frontend/build/static"), name="static")
app.mount("/", StaticFiles(directory="/app/frontend/build", html=True), name="frontend")

# Configuration from Home Assistant add-on
with open("/data/options.json", "r") as f:
    config = json.load(f)
HA_API_URL = config.get("ha_api_url", "http://homeassistant.local:8123")
HA_API_TOKEN = config.get("ha_api_token", "")

class ZoneConfig(BaseModel):
    zone: int
    x1: int
    y1: int
    x2: int
    y2: int

async def update_ha_entity(entity_id: str, value: float):
    headers = {
        "Authorization": f"Bearer {HA_API_TOKEN}",
        "Content-Type": "application/json",
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{HA_API_URL}/api/services/number/set_value",
            json={"entity_id": entity_id, "value": value},
            headers=headers
        ) as response:
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail="Failed to update entity")

@app.get("/api/zones")
async def get_zones():
    headers = {
        "Authorization": f"Bearer {HA_API_TOKEN}",
        "Content-Type": "application/json",
    }
    zones = []
    async with aiohttp.ClientSession() as session:
        for zone in range(1, 4):
            zone_data = {}
            for coord in ["x1", "y1", "x2", "y2"]:
                entity_id = f"number.mmmotion_006_zone_{zone}_{coord}"
                async with session.get(
                    f"{HA_API_URL}/api/states/{entity_id}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        zone_data[coord] = float(data["state"])
                    else:
                        zone_data[coord] = 0
            zones.append({"zone": zone, **zone_data})
    return zones

@app.post("/api/zones")
async def set_zone(config: ZoneConfig):
    for coord, value in [("x1", config.x1), ("y1", config.y1), ("x2", config.x2), ("y2", config.y2)]:
        entity_id = f"number.mmmotion_006_zone_{config.zone}_{coord}"
        await update_ha_entity(entity_id, value)
    return {"status": "success"}