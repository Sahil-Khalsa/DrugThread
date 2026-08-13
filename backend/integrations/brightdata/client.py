"""Bright Data SERP API client — deterministic web search wrapper.

Spec §15: Bright Data is the investigation/gap-filling layer, used when
structured sources (FDA, ClinicalTrials.gov) are incomplete — never the
primary source for a claim structured data could already answer.

Requires BRIGHT_DATA_API_KEY and BRIGHT_DATA_SERP_ZONE (a SERP zone
configured in the Bright Data control panel) in the environment.
"""

import os
import urllib.parse

import httpx
from pydantic import BaseModel

BRIGHTDATA_ENDPOINT = "https://api.brightdata.com/request"


class SearchResult(BaseModel):
    title: str
    link: str
    description: str | None = None
    rank: int | None = None


def search_web(query: str, num_results: int = 5) -> list[SearchResult]:
    api_key = os.environ["BRIGHT_DATA_API_KEY"]
    zone = os.environ["BRIGHT_DATA_SERP_ZONE"]

    encoded_query = urllib.parse.quote(query)
    google_url = f"https://www.google.com/search?q={encoded_query}&brd_json=1"

    response = httpx.post(
        BRIGHTDATA_ENDPOINT,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"zone": zone, "url": google_url, "format": "raw"},
        timeout=30.0,
    )
    response.raise_for_status()
    data = response.json()
    organic = data.get("organic", [])[:num_results]
    return [
        SearchResult(
            title=r.get("title", ""),
            link=r.get("link", ""),
            description=r.get("description"),
            rank=r.get("rank"),
        )
        for r in organic
    ]
