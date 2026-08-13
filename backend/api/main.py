"""FastAPI app — spec §29 API surface.

Run from the backend/ directory:
    uvicorn api.main:app --reload
"""

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

from resolver import resolve_drug

load_dotenv()

app = FastAPI(title="DrugThread API")


@app.get("/api/drugs/search")
def search_drug(q: str):
    identity = resolve_drug(q)
    if identity is None:
        raise HTTPException(status_code=404, detail="Not found in available public evidence.")
    return identity
