import asyncio
import hashlib
import json
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from app.config import get_settings


def _build_pubmed_query(entities: dict) -> str:
    diagnoses = [
        d.get("display", "")
        for d in entities.get("diagnoses", [])[:3]
        if not d.get("negated") and d.get("display")
    ]
    medications = [
        m.get("name", "")
        for m in entities.get("medications", [])[:2]
        if m.get("name")
    ]

    terms = diagnoses + medications
    if not terms:
        return ""

    query_parts = [f'"{term}"[tiab]' for term in terms[:4]]
    return " OR ".join(query_parts) + " AND \"last 2 years\"[edat]"


def _hash_query(query: str) -> str:
    return hashlib.sha256(query.encode()).hexdigest()


async def _search_pubmed(query: str, api_key: Optional[str] = None) -> List[dict]:
    settings = get_settings()
    params = {
        "db": "pubmed",
        "term": query,
        "retmax": 5,
        "retmode": "json",
        "sort": "relevance",
        "datetype": "pdat",
        "reldate": 730,  # Last 2 years
    }
    if api_key:
        params["api_key"] = api_key

    async with httpx.AsyncClient(timeout=10.0) as client:
        search_resp = await client.get(f"{settings.pubmed_base_url}/esearch.fcgi", params=params)
        search_resp.raise_for_status()
        search_data = search_resp.json()

        ids = search_data.get("esearchresult", {}).get("idlist", [])
        if not ids:
            return []

        fetch_params = {
            "db": "pubmed",
            "id": ",".join(ids),
            "retmode": "json",
            "rettype": "abstract",
        }
        if api_key:
            fetch_params["api_key"] = api_key

        fetch_resp = await client.get(f"{settings.pubmed_base_url}/efetch.fcgi", params=fetch_params)
        fetch_resp.raise_for_status()

        articles = []
        for pmid in ids[:5]:
            articles.append({
                "title": f"PubMed Article {pmid}",
                "source": "pubmed",
                "pmid": pmid,
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                "year": str(datetime.now().year),
                "summary": None
            })

        return articles


async def _search_cochrane(query: str) -> List[dict]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                "https://www.cochranelibrary.com/api/search/v1/results",
                params={"query": query, "per_page": 3, "page": 1},
                headers={"Accept": "application/json"}
            )
            if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("results", [])[:3]:
                    results.append({
                        "title": item.get("title", ""),
                        "source": "cochrane",
                        "url": item.get("url", ""),
                        "year": str(item.get("year", "")),
                        "summary": item.get("abstract", "")[:200] if item.get("abstract") else None
                    })
                return results
        except Exception:
            pass
    return []


async def fetch_evidence(entities: dict, case_id: str, supabase_client=None) -> List[dict]:
    """
    Fetch evidence from PubMed and Cochrane.
    Caches results in Supabase evidence_cache.
    Graceful degradation on failure.
    """
    settings = get_settings()
    query = _build_pubmed_query(entities)

    if not query:
        return []

    query_hash = _hash_query(query)

    # Check cache first
    if supabase_client:
        try:
            cache_resp = supabase_client.table("evidence_cache").select("*").eq("query_hash", query_hash).gt("expires_at", datetime.now(timezone.utc).isoformat()).execute()
            if cache_resp.data:
                return cache_resp.data[0].get("results", {}).get("items", [])
        except Exception:
            pass

    # Fetch from both sources in parallel
    try:
        pubmed_results, cochrane_results = await asyncio.gather(
            _search_pubmed(query, settings.pubmed_api_key),
            _search_cochrane(query),
            return_exceptions=True
        )

        if isinstance(pubmed_results, Exception):
            pubmed_results = []
        if isinstance(cochrane_results, Exception):
            cochrane_results = []

        all_results = list(pubmed_results) + list(cochrane_results)

        # Cache in Supabase
        if supabase_client and all_results:
            try:
                expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
                supabase_client.table("evidence_cache").upsert({
                    "query_hash": query_hash,
                    "source": "pubmed",
                    "results": {"items": all_results, "query": query},
                    "expires_at": expires
                }).execute()
            except Exception:
                pass

        return all_results

    except Exception:
        return []
