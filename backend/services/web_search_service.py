from serpapi import GoogleSearch
import os

def perform_web_search(query: str, serp_api_key: str) -> str:
    if not serp_api_key:
        return ""

    params = {
        "engine": "google",
        "q": query,
        "api_key": serp_api_key,
    }

    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        
        snippets = []
        if "organic_results" in results:
            for result in results["organic_results"][:3]:
                if "snippet" in result:
                    snippets.append(result["snippet"])
        
        if not snippets:
            return ""
            
        return "\n\n".join(snippets)

    except Exception as e:
        return ""
