"""FastAPI app — spec §29 API surface.

Run from the backend/ directory:
    uvicorn api.main:app --reload
"""

import asyncio
import json
import threading

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pipeline import new_run_id, run_dossier_pipeline
from resolver import resolve_drug

load_dotenv()

app = FastAPI(title="DrugThread API")

# In-memory run store — a hackathon-scale single-process demo doesn't need
# more than this (spec §29: "use the simplest architecture that reliably demos").
RUNS: dict[str, dict] = {}


@app.get("/api/drugs/search")
def search_drug(q: str):
    identity = resolve_drug(q)
    if identity is None:
        raise HTTPException(status_code=404, detail="Not found in available public evidence.")
    return identity


class DossierRequest(BaseModel):
    drugName: str


@app.post("/api/dossier")
def build_dossier(req: DossierRequest):
    """Synchronous path: runs the full pipeline and returns the finished dossier."""
    steps = []
    for kind, payload in run_dossier_pipeline(req.drugName):
        if kind == "step":
            steps.append(payload)
        elif kind == "error":
            raise HTTPException(status_code=404, detail=payload["detail"])
        elif kind == "result":
            return {
                **payload,
                "agentRun": {
                    "runId": new_run_id(),
                    "status": "complete",
                    "steps": steps,
                    "sourcesChecked": len(payload["evidence"]),
                },
            }


def _run_pipeline_in_background(run_id: str, drug_name: str) -> None:
    run = RUNS[run_id]
    for kind, payload in run_dossier_pipeline(drug_name):
        if kind == "step":
            run["steps"].append(payload)
        elif kind == "error":
            run["status"] = "failed"
            run["error"] = payload["detail"]
        elif kind == "result":
            run["result"] = {
                **payload,
                "agentRun": {
                    "runId": run_id,
                    "status": "complete",
                    "steps": run["steps"],
                    "sourcesChecked": len(payload["evidence"]),
                },
            }
            run["status"] = "complete"


@app.post("/api/dossier/stream")
def start_dossier_stream(req: DossierRequest):
    """Async path: kicks off the pipeline in the background and returns a runId
    immediately. Consume progress via GET /api/dossier/:runId/events (SSE)."""
    run_id = new_run_id()
    RUNS[run_id] = {"status": "running", "steps": [], "result": None, "error": None}
    thread = threading.Thread(target=_run_pipeline_in_background, args=(run_id, req.drugName), daemon=True)
    thread.start()
    return {"runId": run_id}


@app.get("/api/dossier/{run_id}/events")
async def stream_dossier_events(run_id: str):
    if run_id not in RUNS:
        raise HTTPException(status_code=404, detail="Unknown run id.")

    async def event_stream():
        sent = 0
        while True:
            run = RUNS[run_id]
            steps = run["steps"]
            while sent < len(steps):
                yield f"data: {json.dumps(steps[sent])}\n\n"
                sent += 1

            if run["status"] == "complete":
                yield f"event: complete\ndata: {json.dumps(run['result'])}\n\n"
                return
            if run["status"] == "failed":
                yield f"event: error\ndata: {json.dumps({'detail': run['error']})}\n\n"
                return

            await asyncio.sleep(0.3)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/dossier/{run_id}")
def get_dossier_result(run_id: str):
    if run_id not in RUNS:
        raise HTTPException(status_code=404, detail="Unknown run id.")
    run = RUNS[run_id]
    if run["status"] == "failed":
        raise HTTPException(status_code=404, detail=run["error"])
    return {"status": run["status"], "steps": run["steps"], "result": run["result"]}
