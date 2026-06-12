"""
Web Search module for AI Chat.
Provides a pluggable search interface: DuckDuckGo (free, default) or premium APIs (Perplexity/Tavily/Brave).
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def get_search_config(db) -> dict:
    """Get search provider config from admin settings."""
    config = await db.admin_settings.find_one({"category": "search_api"}, {"_id": 0})
    if not config:
        return {"provider": "duckduckgo", "api_key": ""}
    return {
        "provider": config.get("provider", "duckduckgo"),
        "api_key": config.get("api_key", ""),
    }


def search_duckduckgo(query: str, max_results: int = 5) -> list[dict]:
    """Search using DuckDuckGo (free, no API key)."""
    try:
        from ddgs import DDGS
        results = []
        for r in DDGS().text(query, max_results=max_results):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", ""),
            })
        return results
    except Exception as e:
        logger.error(f"DuckDuckGo search failed: {e}")
        return []


def search_tavily(query: str, api_key: str, max_results: int = 5) -> list[dict]:
    """Search using Tavily API (paid)."""
    try:
        import requests
        resp = requests.post(
            "https://api.tavily.com/search",
            json={"query": query, "max_results": max_results, "api_key": api_key},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return [
            {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("content", "")}
            for r in data.get("results", [])
        ]
    except Exception as e:
        logger.error(f"Tavily search failed: {e}")
        return []


def search_brave(query: str, api_key: str, max_results: int = 5) -> list[dict]:
    """Search using Brave Search API (paid)."""
    try:
        import requests
        resp = requests.get(
            "https://api.search.brave.com/res/v1/web/search",
            headers={"X-Subscription-Token": api_key, "Accept": "application/json"},
            params={"q": query, "count": max_results},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        return [
            {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("description", "")}
            for r in data.get("web", {}).get("results", [])
        ]
    except Exception as e:
        logger.error(f"Brave search failed: {e}")
        return []


def search_perplexity(query: str, api_key: str) -> list[dict]:
    """Search using Perplexity API (paid)."""
    try:
        import requests
        resp = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "sonar",
                "messages": [{"role": "user", "content": query}],
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        citations = data.get("citations", [])
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return [{"title": url, "url": url, "snippet": content[:200] if i == 0 else ""} for i, url in enumerate(citations)]
    except Exception as e:
        logger.error(f"Perplexity search failed: {e}")
        return []


async def web_search(query: str, db, max_results: int = 5) -> list[dict]:
    """Run a web search using the configured provider. Returns list of {title, url, snippet}."""
    import asyncio
    config = await get_search_config(db)
    provider = config["provider"]
    api_key = config.get("api_key", "")

    if provider == "tavily" and api_key:
        results = await asyncio.to_thread(search_tavily, query, api_key, max_results)
    elif provider == "brave" and api_key:
        results = await asyncio.to_thread(search_brave, query, api_key, max_results)
    elif provider == "perplexity" and api_key:
        results = await asyncio.to_thread(search_perplexity, query, api_key)
    else:
        results = await asyncio.to_thread(search_duckduckgo, query, max_results)

    return results


def format_search_results(results: list[dict]) -> str:
    """Format search results into a text block for LLM context."""
    if not results:
        return "[No search results found]"
    lines = ["Here are the web search results:\n"]
    for i, r in enumerate(results, 1):
        lines.append(f"[{i}] {r['title']}")
        lines.append(f"    URL: {r['url']}")
        if r.get("snippet"):
            lines.append(f"    {r['snippet']}")
        lines.append("")
    return "\n".join(lines)
