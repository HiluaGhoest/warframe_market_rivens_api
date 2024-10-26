from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx

app = FastAPI()

# Create a single instance of AsyncClient for connection pooling with a timeout
client = httpx.AsyncClient(
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    timeout=httpx.Timeout(50.0)  # Set timeout to 50 seconds
)

@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.on_event("startup")
async def startup_event():
    print("FastAPI server started")

@app.on_event("shutdown")
async def shutdown_event():
    await client.aclose()  # Close the client on shutdown

@app.get("/notify")
async def notify():
    return {"status": "server is running"}

TARGET_URL = "https://api.warframe.market/v1"

class ItemDetails(BaseModel):
    item_id: str
    price: float
    # Add other fields as needed for the listing

@app.get("/api/rivens")
async def get_rivens(weapon: str = None):
    try:
        if weapon:
            response = await client.get(f"{TARGET_URL}/auctions/search?type=riven&buyout_policy=direct&weapon_url_name={weapon}&sort_by=price_asc")
        else:
            response = await client.get(f"{TARGET_URL}/riven/items")

        response.raise_for_status()  # Raise an error for non-200 responses
        return response.json()
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to Warframe Market timed out")
    except HTTPException as e:
        raise e  # Re-raise if it's an HTTP error
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.post("/api/login")
async def login(username: str, password: str):
    try:
        response = await client.post(
            "https://api.warframe.market/v1/login",
            json={"username": username, "password": password}
        )
        
        response.raise_for_status()
        return {"message": "Login successful", "data": response.json()}
    
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Login request timed out")
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.post("/api/auto-list")
async def auto_list(item_details: ItemDetails, session_token: str):
    try:
        response = await client.post(
            f"{TARGET_URL}/listings",
            json=item_details.dict(),
            headers={"Authorization": f"Bearer {session_token}"}
        )

        response.raise_for_status()
        return {"message": "Item listed successfully", "data": response.json()}
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Auto-list request timed out")
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
